import { Op, literal, UniqueConstraintError } from 'sequelize';
import Farm from '@/models/farm.model';
import FarmRejection from '@/models/farm_rejection.model';
import IFarmService from '@/services/interfaces/farmService';
import {
  CreateFarmInput,
  FarmDTO,
  FarmFilter,
  FarmStatus,
  UpdateFarmInput,
  LocationDTO,
  FarmRejectionDTO,
  ActiveFarmRejectionDTO,
  FarmRejectionResolutionType,
  FarmSnapshotDTO,
} from '@/types';
import UserService from '@/services/implementations/userService';
import EmailService from '@/services/implementations/emailService';
import IUserService from '@/services/interfaces/userService';
import IEmailService from '@/services/interfaces/emailService';
import nodemailerConfig from '@/nodemailer.config';
import { getErrorMessage } from '@/utilities/errorUtils';
import logger from '@/utilities/logger';

const Logger = logger(__filename);
const userService: IUserService = new UserService();
const emailService: IEmailService = new EmailService(nodemailerConfig);
const ADMIN_RESUBMISSION_EMAIL = 'mfsn@uwblueprint.org';
const EXCLUDED_RESUBMISSION_DIFF_FIELDS = new Set([
  'id',
  'owner_user_id',
  'createdAt',
  'updatedAt',
  'status',
]);

type FarmFieldDiff = {
  field: string;
  previous: unknown;
  current: unknown;
};

const convertToPostGISPoint = (location: LocationDTO) => {
  return {
    type: 'Point',
    coordinates: [location.lng, location.lat],
  };
};

const convertFromPostGISPoint = (location: {
  type: string;
  coordinates: [number, number];
}): LocationDTO => {
  return {
    lat: location.coordinates[1],
    lng: location.coordinates[0],
  };
};

class FarmService implements IFarmService {
  async createFarm(ownerUserId: string, input: CreateFarmInput): Promise<FarmDTO> {
    let createdFarm: FarmDTO;

    try {
      const farm = await Farm.create({
        owner_user_id: ownerUserId,
        ...input,
        location: convertToPostGISPoint(input.location),
        status: FarmStatus.PENDING_APPROVAL,
      });

      createdFarm = this.convertToFarmDTO(farm);
    } catch (error: unknown) {
      if (error instanceof UniqueConstraintError) {
        Logger.warn(
          `Farm creation failed due to a unique constraint. Reason = ${getErrorMessage(error)}`
        );
        throw new Error('Farm with that USDA farm ID already exists.');
      }
      Logger.error(`Failed to create farm. Reason = ${getErrorMessage(error)}`);
      throw error;
    }

    const subject = 'New Farm Application Submitted';
    const emailBody = `<h2>New Farm Application Submitted</h2>
                      <p>A new farm application has been submitted for ${createdFarm.farm_name}.</p>
                      <p>Please review the application and approve or reject it.</p>`;

    try {
      await emailService.sendEmail(process.env.MAILER_USER!, subject, emailBody);
    } catch (error: unknown) {
      Logger.warn(
        `Farm created but failed to send admin notification email. Reason = ${getErrorMessage(error)}`
      );
    }

    return createdFarm;
  }

  async getFarmsByProximity(lat: number, lng: number, radiusKm: number): Promise<FarmDTO[]> {
    try {
      const radiusMeters = radiusKm * 1000;

      const farms = await Farm.findAll({
        where: {
          status: FarmStatus.APPROVED,
          location: literal(
            `ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusMeters})`
          ),
        },
        order: [
          [
            literal(
              `ST_Distance(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography)`
            ),
            'ASC',
          ],
        ],
      });

      return this.convertToFarmDTOs(farms);
    } catch (error: unknown) {
      Logger.error(`Failed to get farms by proximity. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getFarms(filter?: FarmFilter): Promise<Array<FarmDTO>> {
    const where: Record<string, unknown> = {};

    try {
      if (filter?.status) {
        where.status = filter.status;
      }

      if (filter?.approved !== undefined && !filter.status) {
        where.status = filter.approved ? FarmStatus.APPROVED : { [Op.ne]: FarmStatus.APPROVED };
      }

      if (filter?.home_county) {
        where.home_county = filter.home_county;
      }

      if (filter?.counties_served?.length) {
        where.counties_served = { [Op.overlap]: filter.counties_served };
      }

      if (filter?.cities_served?.length) {
        where.cities_served = { [Op.overlap]: filter.cities_served };
      }

      if (filter?.food_categories?.length) {
        where.food_categories = { [Op.overlap]: filter.food_categories };
      }

      const farms = await Farm.findAll({ where });
      return this.convertToFarmDTOs(farms);
    } catch (error: unknown) {
      Logger.error(`Failed to get farms. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async updateFarm(id: string, input: UpdateFarmInput, farmToUpdate?: Farm): Promise<FarmDTO> {
    try {
      const farm = farmToUpdate ?? (await Farm.findByPk(id));
      if (!farm) {
        throw new Error(`Farm with id ${id} not found.`);
      }

      const farmBeforeUpdate = this.convertToFarmDTO(farm);
      const farmJson = farm.toJSON() as Record<string, unknown>;
      const rejectionSnapshot = this.getRejectedSnapshot(farmJson, farmBeforeUpdate);
      const wasRejected = farm.status === FarmStatus.REJECTED;

      const updateValues = Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined)
      ) as Partial<UpdateFarmInput>;

      if (updateValues.location) {
        Object.assign(updateValues, { location: convertToPostGISPoint(updateValues.location) });
      }

      Object.assign(farm, updateValues);

      await farm.save();
      await farm.reload();

      let updatedFarm = this.convertToFarmDTO(farm);

      if (wasRejected) {
        const resubmissionDiff = this.generateFieldLevelDiffAgainstPersisted(
          rejectionSnapshot,
          updatedFarm,
          input
        );
        if (resubmissionDiff.length > 0) {
          farm.status = FarmStatus.PENDING_APPROVAL;
          await farm.save();
          await farm.reload();
          updatedFarm = this.convertToFarmDTO(farm);
          const rejectionReason = this.getRejectionReason(farmJson);
          void this.notifyAdminsAboutResubmission(updatedFarm, rejectionReason, resubmissionDiff);
        }
      }

      return updatedFarm;
    } catch (error: unknown) {
      Logger.error(`Failed to update farm. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async approveFarm(farmId: string): Promise<FarmDTO> {
    let updatedFarm: FarmDTO;

    try {
      const currentFarm = await Farm.findByPk(farmId);

      if (!currentFarm) {
        throw new Error(`Farm with id ${farmId} not found.`);
      }

      if (currentFarm.status == FarmStatus.APPROVED) {
        Logger.warn(`Farm with id ${farmId} is already approved.`);
        return this.convertToFarmDTO(currentFarm);
      }

      currentFarm.status = FarmStatus.APPROVED;
      await currentFarm.save();
      await currentFarm.reload();
      updatedFarm = this.convertToFarmDTO(currentFarm);
    } catch (error: unknown) {
      Logger.error(`Failed to approve farm. Reason = ${getErrorMessage(error)}`);
      throw error;
    }

    try {
      const owner = await userService.getUserById(updatedFarm.owner_user_id);
      const greeting = owner.firstName
        ? `Congratulations, ${owner.firstName}!`
        : 'Congratulations!';
      const subject = 'Your Farm Has Been Approved!';
      const emailBody = `<h2>Your Farm Has Been Approved!</h2>
                      <p>${greeting} Your farm <strong>${updatedFarm.farm_name}</strong> has been approved.</p>
                      <p>Your farm is now live on the Mississippi Farm to School Network's Farm Fresh Map.</p>`;
      await emailService.sendEmail(owner.email, subject, emailBody);
    } catch (error: unknown) {
      Logger.warn(
        `Farm approved but failed to send approval email. Reason = ${getErrorMessage(error)}`
      );
    }

    return updatedFarm;
  }

  async createFarmRejection(
    farmId: string,
    rejectedByUserId: string,
    rejectionReason: string
  ): Promise<FarmRejectionDTO> {
    try {
      const farm = await Farm.findByPk(farmId);

      if (!farm) {
        throw new Error(`Farm with id ${farmId} not found.`);
      }

      const farmSnapshot = this.convertToFarmSnapshot(farm);
      const farmSnapshotUpdatedAt = farm.updatedAt;

      const rejectionRecord = await FarmRejection.create({
        farm_id: farm.id,
        rejected_by_user_id: rejectedByUserId,
        rejection_reason: rejectionReason,
        farm_snapshot: farmSnapshot,
        farm_snapshot_updated_at: farmSnapshotUpdatedAt,
      });

      return this.convertToFarmRejectionDTO(rejectionRecord);
    } catch (error: unknown) {
      Logger.error(`Failed to create farm rejection. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getLatestFarmRejectionByFarmId(farmId: string): Promise<FarmRejectionDTO | null> {
    try {
      const latestRejection = await FarmRejection.findOne({
        where: { farm_id: farmId },
        order: [['created_at', 'DESC']],
      });

      if (!latestRejection) {
        return null;
      }

      return this.convertToFarmRejectionDTO(latestRejection);
    } catch (error: unknown) {
      Logger.error(`Failed to get latest farm rejection. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  private convertToFarmDTOs(farms: Farm[]): FarmDTO[] {
    return farms.map((farm) => this.convertToFarmDTO(farm));
  }

  private convertToFarmSnapshot(farm: Farm): FarmSnapshotDTO {
    const data = farm.toJSON() as Farm & {
      createdAt: Date | string;
      updatedAt: Date | string;
      market_sales_data?: { market: string; times: string }[] | null;
      social_media?: Record<string, unknown> | null;
      website?: string | null;
    };

    if (!data.location) {
      Logger.error(`Farm ${data.id} has invalid or missing location`);
      throw new Error(`Farm ${data.id} is missing a valid location`);
    }

    return {
      id: data.id,
      owner_user_id: data.owner_user_id,
      usda_farm_id: data.usda_farm_id,
      farm_name: data.farm_name,
      description: data.description,
      primary_phone: data.primary_phone,
      primary_email: data.primary_email,
      website: data.website ?? null,
      social_media: data.social_media ?? null,
      farm_address: data.farm_address,
      counties_served: data.counties_served,
      cities_served: data.cities_served,
      home_county: data.home_county,
      location: {
        type: 'Point',
        coordinates: data.location.coordinates,
      },
      food_categories: data.food_categories,
      market_sales_data: data.market_sales_data ?? null,
      bipoc_owned: data.bipoc_owned,
      gap_certified: data.gap_certified,
      food_safety_plan: data.food_safety_plan,
      agritourism: data.agritourism,
      sells_at_markets: data.sells_at_markets,
      csa_boxes: data.csa_boxes,
      online_sales: data.online_sales,
      delivery: data.delivery,
      f2s_experience: data.f2s_experience,
      interested_in_f2s: data.interested_in_f2s,
      status: data.status,
      createdAt:
        data.createdAt instanceof Date
          ? data.createdAt.toISOString()
          : new Date(data.createdAt).toISOString(),
      updatedAt:
        data.updatedAt instanceof Date
          ? data.updatedAt.toISOString()
          : new Date(data.updatedAt).toISOString(),
    };
  }

  private convertToFarmRejectionDTO(rejectionRecord: FarmRejection): FarmRejectionDTO {
    const data = rejectionRecord.toJSON() as FarmRejection & {
      farm_snapshot_updated_at: Date | string;
      created_at: Date | string;
      resolved_at: Date | string | null;
    };

    return {
      id: data.id,
      farm_id: data.farm_id,
      rejected_by_user_id: data.rejected_by_user_id,
      rejection_reason: data.rejection_reason,
      farm_snapshot: data.farm_snapshot,
      farm_snapshot_updated_at:
        data.farm_snapshot_updated_at instanceof Date
          ? data.farm_snapshot_updated_at.toISOString()
          : new Date(data.farm_snapshot_updated_at).toISOString(),
      created_at:
        data.created_at instanceof Date
          ? data.created_at.toISOString()
          : new Date(data.created_at).toISOString(),
      resolved_at:
        data.resolved_at == null
          ? null
          : data.resolved_at instanceof Date
            ? data.resolved_at.toISOString()
            : new Date(data.resolved_at).toISOString(),
      resolution_type: data.resolution_type,
    };
  }

  private convertToFarmDTO(farm: Farm): FarmDTO {
    const data = farm.toJSON() as Farm & {
      createdAt: Date | string;
      updatedAt: Date | string;
      market_sales_data?: { market: string; times: string }[] | null;
      social_media?: Record<string, unknown> | null;
      website?: string | null;
    };

    if (!data.location) {
      Logger.error(`Farm ${data.id} has invalid or missing location`);
      throw new Error(`Farm with id ${data.id} is missing a valid location.`);
    }

    return {
      id: data.id,
      owner_user_id: data.owner_user_id,
      usda_farm_id: data.usda_farm_id,
      farm_name: data.farm_name,
      description: data.description,
      primary_phone: data.primary_phone,
      primary_email: data.primary_email,
      website: data.website ?? null,
      social_media: data.social_media ?? null,
      farm_address: data.farm_address,
      counties_served: data.counties_served,
      cities_served: data.cities_served,
      home_county: data.home_county,
      location: convertFromPostGISPoint(data.location),
      food_categories: data.food_categories,
      market_sales_data: data.market_sales_data ?? null,
      bipoc_owned: data.bipoc_owned,
      gap_certified: data.gap_certified,
      food_safety_plan: data.food_safety_plan,
      agritourism: data.agritourism,
      sells_at_markets: data.sells_at_markets,
      csa_boxes: data.csa_boxes,
      online_sales: data.online_sales,
      delivery: data.delivery,
      f2s_experience: data.f2s_experience,
      interested_in_f2s: data.interested_in_f2s,
      status: data.status,
      createdAt:
        data.createdAt instanceof Date
          ? data.createdAt.toISOString()
          : new Date(data.createdAt).toISOString(),
      updatedAt:
        data.updatedAt instanceof Date
          ? data.updatedAt.toISOString()
          : new Date(data.updatedAt).toISOString(),
    };
  }

  async getFarmsByStatus(status: FarmStatus): Promise<FarmDTO[]> {
    try {
      const farms = await Farm.findAll({ where: { status } });
      return this.convertToFarmDTOs(farms);
    } catch (error: unknown) {
      Logger.error(`Failed to get farms by status. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getFarmsByOwner(ownerUserId: string): Promise<FarmDTO[]> {
    try {
      const farms = await Farm.findAll({ where: { owner_user_id: ownerUserId } });
      return this.convertToFarmDTOs(farms);
    } catch (error: unknown) {
      Logger.error(`Failed to get farms by owner. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getFarmById(farmId: string): Promise<FarmDTO> {
    try {
      const farm = await Farm.findByPk(farmId);
      if (!farm) {
        throw new Error(`Farm with id ${farmId} not found.`);
      }
      return this.convertToFarmDTO(farm);
    } catch (error: unknown) {
      Logger.error(`Failed to get farm. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  private getRejectedSnapshot(
    farmJson: Record<string, unknown>,
    farmBeforeUpdate: FarmDTO
  ): Partial<FarmDTO> {
    const rejectionSnapshot = farmJson.rejection_snapshot;
    if (
      rejectionSnapshot &&
      typeof rejectionSnapshot === 'object' &&
      !Array.isArray(rejectionSnapshot)
    ) {
      return rejectionSnapshot as Partial<FarmDTO>;
    }

    return farmBeforeUpdate;
  }

  private getRejectionReason(farmJson: Record<string, unknown>): string {
    const reasonFields = [
      'rejection_reason',
      'rejectionReason',
      'rejection_notes',
      'rejectionNotes',
    ];
    for (const field of reasonFields) {
      const value = farmJson[field];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return 'Not provided';
  }

  private generateFieldLevelDiffAgainstPersisted(
    previousSnapshot: Partial<FarmDTO>,
    currentFarm: FarmDTO,
    updatedPayload: UpdateFarmInput
  ): FarmFieldDiff[] {
    const diff: FarmFieldDiff[] = [];
    const keys = Object.keys(updatedPayload).sort();

    for (const key of keys) {
      if (EXCLUDED_RESUBMISSION_DIFF_FIELDS.has(key)) {
        continue;
      }

      if (updatedPayload[key as keyof UpdateFarmInput] === undefined) {
        continue;
      }

      const previousValue = previousSnapshot[key as keyof FarmDTO];
      const currentValue = currentFarm[key as keyof FarmDTO];
      if (!this.valuesAreEqual(previousValue, currentValue)) {
        diff.push({
          field: key,
          previous: previousValue ?? null,
          current: currentValue,
        });
      }
    }

    return diff;
  }

  private valuesAreEqual(a: unknown, b: unknown): boolean {
    return this.stableSerialize(a) === this.stableSerialize(b);
  }

  private stableSerialize(value: unknown): string {
    if (value === null || value === undefined) {
      return 'null';
    }

    if (Array.isArray(value)) {
      return `[${value.map((entry) => this.stableSerialize(entry)).join(',')}]`;
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
        a.localeCompare(b)
      );
      return `{${entries
        .map(([key, entryValue]) => `${JSON.stringify(key)}:${this.stableSerialize(entryValue)}`)
        .join(',')}}`;
    }

    return JSON.stringify(value);
  }

  private formatDiffSummary(diff: FarmFieldDiff[]): string {
    if (diff.length === 0) {
      return '<li>No field-level changes detected.</li>';
    }

    return diff
      .map((change) => {
        const fieldLabel = this.formatFieldLabel(change.field);
        return `<li><strong>${fieldLabel}</strong>: ${this.formatDiffValue(
          change.previous
        )} &rarr; ${this.formatDiffValue(change.current)}</li>`;
      })
      .join('');
  }

  private formatFieldLabel(field: string): string {
    return field
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  private formatDiffValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '<em>null</em>';
    }

    if (typeof value === 'string') {
      return value.length > 0 ? value : '<em>empty string</em>';
    }

    return `<code>${this.stableSerialize(value)}</code>`;
  }

  private async notifyAdminsAboutResubmission(
    farm: FarmDTO,
    rejectionReason: string,
    diff: FarmFieldDiff[]
  ): Promise<void> {
    const subject = `Farm Resubmitted: ${farm.farm_name}`;
    const emailBody = `<h2>Farm Resubmitted for Review</h2>
      <p><strong>Farm:</strong> ${farm.farm_name}</p>
      <p><strong>Farm ID:</strong> ${farm.id}</p>
      <p><strong>Previous rejection reason:</strong> ${rejectionReason}</p>
      <p><strong>Farmer changes:</strong></p>
      <ul>
        ${this.formatDiffSummary(diff)}
      </ul>`;

    try {
      await emailService.sendEmail(ADMIN_RESUBMISSION_EMAIL, subject, emailBody);
    } catch (error: unknown) {
      Logger.warn(
        `Farm resubmission email failed but update succeeded. Reason = ${getErrorMessage(error)}`
      );
    }
  }

  async getLatestActiveRejection(farmId: string): Promise<ActiveFarmRejectionDTO | null> {
    try {
      type ActiveRejectionRow = {
        id: string;
        farm_id: string;
        rejection_reason: string;
        created_at: Date | string;
      };

      const rows = (await Farm.sequelize!.query(
        `SELECT id, farm_id, rejection_reason, created_at 
        FROM farm_rejections 
        WHERE farm_id = :farmId AND resolved_at IS NULL 
        ORDER BY created_at DESC 
        LIMIT 1`,
        {
          replacements: { farmId },
          type: 'SELECT',
        }
      )) as ActiveRejectionRow[];

      const rejection = rows[0];

      if (!rejection) {
        return null;
      }

      return {
        id: rejection.id,
        farm_id: rejection.farm_id,
        rejection_reason: rejection.rejection_reason,
        created_at:
          rejection.created_at instanceof Date
            ? rejection.created_at.toISOString()
            : new Date(rejection.created_at).toISOString(),
      };
    } catch (error: unknown) {
      Logger.error(`Failed to get latest active rejection. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async resubmitFarm(
    farmId: string,
    resubmittedByUserId: string,
    input: UpdateFarmInput
  ): Promise<FarmDTO> {
    return await Farm.sequelize!.transaction(async (t) => {
      const farm = await Farm.findByPk(farmId, { transaction: t });
      if (!farm) {
        throw new Error(`Farm with id ${farmId} not found.`);
      }

      if (farm.status !== FarmStatus.REJECTED) {
        throw new Error(
          `Farm with id ${farmId} cannot be resubmitted because its status is ${farm.status}, not REJECTED.`
        );
      }

      const updateValues = Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined)
      ) as Partial<UpdateFarmInput>;

      if (updateValues.location) {
        Object.assign(updateValues, { location: convertToPostGISPoint(updateValues.location) });
      }

      Object.assign(farm, updateValues, { status: FarmStatus.PENDING_APPROVAL });
      await farm.save({ transaction: t });

      await Farm.sequelize!.query(
        `UPDATE farm_rejections
         SET resolved_at = NOW(),
             resolution_type = :resolutionType
         WHERE farm_id = :farmId AND resolved_at IS NULL`,
        {
          replacements: { farmId, resolutionType: FarmRejectionResolutionType.RESUBMITTED },
          transaction: t,
        }
      );

      await farm.reload({ transaction: t });
      return this.convertToFarmDTO(farm);
    });
  }
}

export default FarmService;
