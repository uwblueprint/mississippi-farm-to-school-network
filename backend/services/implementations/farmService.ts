import { Op, UniqueConstraintError } from 'sequelize';
import Farm from '@/models/farm.model';
import IFarmService from '@/services/interfaces/farmService';
import {
  CreateFarmInput,
  FarmDTO,
  FarmFilter,
  FarmStatus,
  UpdateFarmInput,
  LocationDTO,
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
    try {
      const farm = await Farm.create({
        owner_user_id: ownerUserId,
        ...input,
        location: convertToPostGISPoint(input.location),
        status: FarmStatus.PENDING_APPROVAL,
      });

      return this.convertToFarmDTO(farm);
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
      const resubmissionDiff = this.generateFieldLevelDiff(rejectionSnapshot, input);
      const isRejectedFarmResubmission =
        farm.status === FarmStatus.REJECTED && resubmissionDiff.length > 0;

      const updateValues = Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined)
      ) as Partial<UpdateFarmInput>;

      if (updateValues.location) {
        Object.assign(updateValues, { location: convertToPostGISPoint(updateValues.location) });
      }

      Object.assign(farm, updateValues);
      if (isRejectedFarmResubmission) {
        // Treat edits to a rejected farm as a resubmission back to admin review.
        farm.status = FarmStatus.PENDING_APPROVAL;
      }

      await farm.save();
      await farm.reload();

      const updatedFarm = this.convertToFarmDTO(farm);
      if (isRejectedFarmResubmission) {
        const rejectionReason = this.getRejectionReason(farmJson);
        void this.notifyAdminsAboutResubmission(updatedFarm, rejectionReason, resubmissionDiff);
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

    const subject = 'Your Farm Has Been Approved!';
    const emailBody = `<h2>Your Farm Has Been Approved!</h2>
                      <p>Congratulations! Your farm <strong>${updatedFarm.farm_name}</strong> has been approved.</p>
                      <p>Your farm is now live on the Mississippi Farm to School Network's Farm Fresh Map.</p>`;

    let ownerEmail: string;
    try {
      ownerEmail = (await userService.getUserById(updatedFarm.owner_user_id)).email;
      await emailService.sendEmail(ownerEmail, subject, emailBody);
    } catch (error: unknown) {
      Logger.warn(
        `Farm approved but failed to send approval email. Reason = ${getErrorMessage(error)}`
      );
    }

    return updatedFarm;
  }

  private convertToFarmDTOs(farms: Farm[]): FarmDTO[] {
    return farms.map((farm) => this.convertToFarmDTO(farm));
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
    if (rejectionSnapshot && typeof rejectionSnapshot === 'object' && !Array.isArray(rejectionSnapshot)) {
      return rejectionSnapshot as Partial<FarmDTO>;
    }

    return farmBeforeUpdate;
  }

  private getRejectionReason(farmJson: Record<string, unknown>): string {
    const reasonFields = ['rejection_reason', 'rejectionReason', 'rejection_notes', 'rejectionNotes'];
    for (const field of reasonFields) {
      const value = farmJson[field];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return 'Not provided';
  }

  private generateFieldLevelDiff(
    previousSnapshot: Partial<FarmDTO>,
    updatedPayload: UpdateFarmInput
  ): FarmFieldDiff[] {
    const diff: FarmFieldDiff[] = [];
    const keys = Object.keys(updatedPayload).sort();

    for (const key of keys) {
      if (EXCLUDED_RESUBMISSION_DIFF_FIELDS.has(key)) {
        continue;
      }

      const currentValue = updatedPayload[key as keyof UpdateFarmInput];
      if (currentValue === undefined) {
        continue;
      }

      const previousValue = previousSnapshot[key as keyof FarmDTO];
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
}

export default FarmService;
