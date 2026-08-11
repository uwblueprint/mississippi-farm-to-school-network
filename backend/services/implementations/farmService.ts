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
  EmailChangeEntry,
} from '@/types';
import {
  GROWING_PRACTICES,
  SEASONAL_PRODUCTS,
  MEAT_PRODUCTS,
  OTHER_PRODUCTS,
  FOOD_SAFETY_CERTIFICATIONS,
  FARM_EXPERIENCES,
  FARM_CHARACTERISTICS,
  FARM_TO_SCHOOL_SALES,
  assertAllowedValues,
} from '@/constants/farmOptions';
import UserService from '@/services/implementations/userService';
import EmailService from '@/services/implementations/emailService';
import IUserService from '@/services/interfaces/userService';
import IEmailService from '@/services/interfaces/emailService';
import nodemailerConfig from '@/nodemailer.config';
import { getErrorMessage } from '@/utilities/errorUtils';
import logger from '@/utilities/logger';
import {
  Collections,
  FirestoreLocation,
  arraysOverlap,
  getFirestore,
  haversineKm,
  newId,
  toIso,
} from '@/utilities/firestore';

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
  'cover_photo',
  'carousel_photos',
]);

type FarmFieldDiff = {
  field: string;
  previous: unknown;
  current: unknown;
};

type FarmDoc = {
  owner_user_id: string;
  usda_farm_id: string;
  farm_name: string;
  primary_phone: string;
  primary_email: string;
  website: string | null;
  social_media: Record<string, unknown> | null;
  farm_address: string;
  county: string;
  cities_served: string[];
  location: FirestoreLocation;
  seasonal_products: string[];
  meat_products: string[];
  other_products: string[];
  seasonal_products_detail: string | null;
  meat_products_detail: string | null;
  other_products_detail: string | null;
  market_sales_data: { market: string; times: string }[] | null;
  growing_practices: string[];
  food_safety_certifications: string[];
  farm_experiences: string[];
  farm_characteristics: string[];
  farm_to_school_sales: string[];
  f2s_experience: string | null;
  minimum_order: number | null;
  delivery_details: string | null;
  cover_photo: string | null;
  carousel_photos: string[];
  status: FarmStatus;
  is_archived: boolean;
  rejection_reason?: string | null;
  rejection_snapshot?: Partial<FarmDTO> | null;
  createdAt: string;
  updatedAt: string;
};

type FarmRejectionDoc = {
  farm_id: string;
  rejected_by_user_id: string;
  rejection_reason: string;
  farm_snapshot: FarmSnapshotDTO;
  farm_snapshot_updated_at: string;
  created_at: string;
  resolved_at: string | null;
  resolution_type: FarmRejectionResolutionType | null;
};

const MAX_FARMS_PAGE_SIZE = 100;

class FarmService implements IFarmService {
  private farms() {
    return getFirestore().collection(Collections.farms);
  }

  private rejections() {
    return getFirestore().collection(Collections.farmRejections);
  }

  private validateFarmOptionArrays(input: CreateFarmInput | UpdateFarmInput): void {
    if (input.seasonal_products !== undefined) {
      assertAllowedValues(input.seasonal_products, SEASONAL_PRODUCTS, 'seasonal_products');
    }
    if (input.meat_products !== undefined) {
      assertAllowedValues(input.meat_products, MEAT_PRODUCTS, 'meat_products');
    }
    if (input.other_products !== undefined) {
      assertAllowedValues(input.other_products, OTHER_PRODUCTS, 'other_products');
    }
    if (input.growing_practices !== undefined) {
      assertAllowedValues(input.growing_practices, GROWING_PRACTICES, 'growing_practices');
    }
    if (input.food_safety_certifications !== undefined) {
      assertAllowedValues(
        input.food_safety_certifications,
        FOOD_SAFETY_CERTIFICATIONS,
        'food_safety_certifications'
      );
    }
    if (input.farm_experiences !== undefined) {
      assertAllowedValues(input.farm_experiences, FARM_EXPERIENCES, 'farm_experiences');
    }
    if (input.farm_characteristics !== undefined) {
      assertAllowedValues(input.farm_characteristics, FARM_CHARACTERISTICS, 'farm_characteristics');
    }
    if (input.farm_to_school_sales !== undefined) {
      assertAllowedValues(input.farm_to_school_sales, FARM_TO_SCHOOL_SALES, 'farm_to_school_sales');
    }
  }

  private async getFarmDoc(id: string): Promise<{ id: string; data: FarmDoc }> {
    const doc = await this.farms().doc(id).get();
    if (!doc.exists) {
      throw new Error(`Farm with id ${id} not found.`);
    }
    return { id: doc.id, data: doc.data() as FarmDoc };
  }

  async createFarm(ownerUserId: string, input: CreateFarmInput): Promise<FarmDTO> {
    this.validateFarmOptionArrays(input);

    let createdFarm: FarmDTO;

    try {
      const existing = await this.farms()
        .where('usda_farm_id', '==', input.usda_farm_id)
        .limit(1)
        .get();
      if (!existing.empty) {
        throw new Error('Farm with that USDA farm ID already exists.');
      }

      const id = newId();
      const now = new Date().toISOString();
      const data: FarmDoc = {
        owner_user_id: ownerUserId,
        usda_farm_id: input.usda_farm_id,
        farm_name: input.farm_name,
        primary_phone: input.primary_phone,
        primary_email: input.primary_email,
        website: input.website ?? null,
        social_media: input.social_media ?? null,
        farm_address: input.farm_address,
        county: input.county,
        cities_served: input.cities_served ?? [],
        location: { lat: input.location.lat, lng: input.location.lng },
        seasonal_products: input.seasonal_products ?? [],
        meat_products: input.meat_products ?? [],
        other_products: input.other_products ?? [],
        seasonal_products_detail: input.seasonal_products_detail ?? null,
        meat_products_detail: input.meat_products_detail ?? null,
        other_products_detail: input.other_products_detail ?? null,
        market_sales_data: input.market_sales_data ?? null,
        growing_practices: input.growing_practices ?? [],
        food_safety_certifications: input.food_safety_certifications ?? [],
        farm_experiences: input.farm_experiences ?? [],
        farm_characteristics: input.farm_characteristics ?? [],
        farm_to_school_sales: input.farm_to_school_sales ?? [],
        f2s_experience: input.f2s_experience ?? null,
        minimum_order: input.minimum_order ?? null,
        delivery_details: input.delivery_details ?? null,
        cover_photo: input.cover_photo ?? null,
        carousel_photos: input.carousel_photos ?? [],
        status: FarmStatus.PENDING_APPROVAL,
        is_archived: false,
        createdAt: now,
        updatedAt: now,
      };

      await this.farms().doc(id).set(data);
      createdFarm = this.convertToFarmDTO(id, data);
    } catch (error: unknown) {
      Logger.error(`Failed to create farm. Reason = ${getErrorMessage(error)}`);
      throw error;
    }

    const subject = 'New Farm Application Submitted';
    const emailBody = {
      title: 'New Farm Application Submitted',
      previewText: 'A new farm application is ready for review.',
      body: `A new farm application has been submitted for ${createdFarm.farm_name}. Please review the application and approve or reject it.`,
      ctaText: 'Review application',
      ctaUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/admin/farms`,
      isFarmerEmail: false,
    };

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
      const snap = await this.farms()
        .where('status', '==', FarmStatus.APPROVED)
        .where('is_archived', '==', false)
        .get();

      return snap.docs
        .map((doc) => ({ id: doc.id, data: doc.data() as FarmDoc }))
        .map(({ id, data }) => ({
          dto: this.convertToFarmDTO(id, data),
          distance: haversineKm(lat, lng, data.location.lat, data.location.lng),
        }))
        .filter(({ distance }) => distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)
        .map(({ dto }) => dto);
    } catch (error: unknown) {
      Logger.error(`Failed to get farms by proximity. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getFarms(
    pageNumber?: number,
    pageSize?: number,
    filter?: FarmFilter
  ): Promise<Array<FarmDTO>> {
    try {
      if (pageNumber != null && pageSize != null) {
        if (!Number.isInteger(pageNumber) || pageNumber < 1) {
          throw new Error('pageNumber must be an integer >= 1');
        }
        if (!Number.isInteger(pageSize) || pageSize < 1) {
          throw new Error('pageSize must be an integer >= 1');
        }
        if (pageSize > MAX_FARMS_PAGE_SIZE) {
          throw new Error(`pageSize must not exceed ${MAX_FARMS_PAGE_SIZE}`);
        }
      }

      const snap = await this.farms().get();
      let farms = snap.docs.map((doc) => this.convertToFarmDTO(doc.id, doc.data() as FarmDoc));

      if (filter?.status) {
        farms = farms.filter((f) => f.status === filter.status);
      } else if (filter?.approved !== undefined) {
        farms = farms.filter((f) =>
          filter.approved ? f.status === FarmStatus.APPROVED : f.status !== FarmStatus.APPROVED
        );
      }

      if (filter?.counties?.length) {
        const counties = new Set(filter.counties);
        farms = farms.filter((f) => counties.has(f.county));
      }

      if (filter?.cities_served?.length) {
        farms = farms.filter((f) => arraysOverlap(f.cities_served, filter.cities_served));
      }

      if (filter?.seasonal_products?.length) {
        farms = farms.filter((f) => arraysOverlap(f.seasonal_products, filter.seasonal_products));
      }

      if (filter?.meat_products?.length) {
        farms = farms.filter((f) => arraysOverlap(f.meat_products, filter.meat_products));
      }

      if (filter?.other_products?.length) {
        farms = farms.filter((f) => arraysOverlap(f.other_products, filter.other_products));
      }

      if (filter?.is_archived !== undefined) {
        farms = farms.filter((f) => f.is_archived === filter.is_archived);
      }

      farms.sort((a, b) => {
        const countyCmp = a.county.localeCompare(b.county);
        if (countyCmp !== 0) return countyCmp;
        return a.farm_name.localeCompare(b.farm_name);
      });

      if (pageNumber != null && pageSize != null) {
        const offset = (pageNumber - 1) * pageSize;
        farms = farms.slice(offset, offset + pageSize);
      }

      return farms;
    } catch (error: unknown) {
      Logger.error(`Failed to get farms. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async updateFarm(id: string, input: UpdateFarmInput): Promise<FarmDTO> {
    try {
      this.validateFarmOptionArrays(input);

      const { data: farm } = await this.getFarmDoc(id);
      const farmBeforeUpdate = this.convertToFarmDTO(id, farm);
      const rejectionSnapshot = this.getRejectedSnapshot(farm, farmBeforeUpdate);
      const wasRejected = farm.status === FarmStatus.REJECTED;

      const updateValues = Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined)
      ) as Partial<UpdateFarmInput>;

      const next: FarmDoc = {
        ...farm,
        ...updateValues,
        location: updateValues.location
          ? { lat: updateValues.location.lat, lng: updateValues.location.lng }
          : farm.location,
        updatedAt: new Date().toISOString(),
      } as FarmDoc;

      await this.farms().doc(id).set(next);
      let updatedFarm = this.convertToFarmDTO(id, next);

      if (wasRejected) {
        const resubmissionDiff = this.generateFieldLevelDiffAgainstPersisted(
          rejectionSnapshot,
          updatedFarm,
          input
        );
        if (resubmissionDiff.length > 0) {
          next.status = FarmStatus.PENDING_APPROVAL;
          next.updatedAt = new Date().toISOString();
          await this.farms().doc(id).set(next);
          updatedFarm = this.convertToFarmDTO(id, next);
          const rejectionReason = this.getRejectionReason(farm);
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
      const { data } = await this.getFarmDoc(farmId);

      if (data.status == FarmStatus.APPROVED) {
        Logger.warn(`Farm with id ${farmId} is already approved.`);
        return this.convertToFarmDTO(farmId, data);
      }

      const next: FarmDoc = {
        ...data,
        status: FarmStatus.APPROVED,
        updatedAt: new Date().toISOString(),
      };
      await this.farms().doc(farmId).set(next);
      updatedFarm = this.convertToFarmDTO(farmId, next);
    } catch (error: unknown) {
      Logger.error(`Failed to approve farm. Reason = ${getErrorMessage(error)}`);
      throw error;
    }

    const subject = 'Your Farm Has Been Approved!';

    try {
      const owner = await userService.getUserByFirebaseUid(updatedFarm.owner_user_id);
      const greeting = owner.firstName
        ? `Congratulations, ${owner.firstName}!`
        : 'Congratulations!';
      const emailBody = {
        title: 'Your Farm Has Been Approved!',
        previewText: 'Your farm is now live on the Mississippi Farm to School Network.',
        recipientName: owner.firstName || undefined,
        body: `${greeting} Your farm ${updatedFarm.farm_name} has been approved. Your farm is now live on the Mississippi Farm to School Network's Farm Fresh Map.`,
        ctaText: 'View your farm',
        ctaUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/farms/${updatedFarm.id}`,
        isFarmerEmail: true,
      };
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
    let rejection: FarmRejectionDTO;
    let farmDto: FarmDTO;

    try {
      const { data: farm } = await this.getFarmDoc(farmId);
      const farmSnapshot = this.convertToFarmSnapshot(farmId, farm);
      const id = newId();
      const now = new Date().toISOString();

      const rejectionRecord: FarmRejectionDoc = {
        farm_id: farmId,
        rejected_by_user_id: rejectedByUserId,
        rejection_reason: rejectionReason,
        farm_snapshot: farmSnapshot,
        farm_snapshot_updated_at: farm.updatedAt,
        created_at: now,
        resolved_at: null,
        resolution_type: null,
      };

      await this.rejections().doc(id).set(rejectionRecord);

      await this.farms()
        .doc(farmId)
        .set({
          ...farm,
          status: FarmStatus.REJECTED,
          rejection_reason: rejectionReason,
          rejection_snapshot: this.convertToFarmDTO(farmId, farm),
          updatedAt: now,
        } satisfies FarmDoc);

      rejection = this.convertToFarmRejectionDTO(id, rejectionRecord);
      farmDto = this.convertToFarmDTO(farmId, {
        ...farm,
        status: FarmStatus.REJECTED,
        rejection_reason: rejectionReason,
        updatedAt: now,
      });
    } catch (error: unknown) {
      Logger.error(`Failed to create farm rejection. Reason = ${getErrorMessage(error)}`);
      throw error;
    }

    try {
      const owner = await userService.getUserByFirebaseUid(farmDto.owner_user_id);
      const greeting = owner.firstName ? `Hi ${owner.firstName},` : 'Hi,';
      await emailService.sendEmail(owner.email, 'Changes requested for your farm application', {
        title: 'Changes requested for your farm application',
        previewText: 'Your farm application needs updates before it can be approved.',
        recipientName: owner.firstName || undefined,
        body: `${greeting} Your farm ${farmDto.farm_name} was not approved yet. Please update your application and resubmit.\n\nReason:\n${rejectionReason}`,
        ctaText: 'Update your farm',
        ctaUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/farmer/farms`,
        isFarmerEmail: true,
      });
    } catch (error: unknown) {
      Logger.warn(
        `Farm rejected but failed to send rejection email. Reason = ${getErrorMessage(error)}`
      );
    }

    return rejection;
  }

  async getLatestFarmRejectionByFarmId(farmId: string): Promise<FarmRejectionDTO | null> {
    try {
      const snap = await this.rejections().where('farm_id', '==', farmId).get();
      if (snap.empty) return null;

      const sorted = snap.docs
        .map((doc) => ({ id: doc.id, data: doc.data() as FarmRejectionDoc }))
        .sort((a, b) => b.data.created_at.localeCompare(a.data.created_at));

      return this.convertToFarmRejectionDTO(sorted[0].id, sorted[0].data);
    } catch (error: unknown) {
      Logger.error(`Failed to get latest farm rejection. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  private convertToFarmSnapshot(id: string, data: FarmDoc): FarmSnapshotDTO {
    if (!data.location) {
      Logger.error(`Farm ${id} has invalid or missing location`);
      throw new Error(`Farm ${id} is missing a valid location`);
    }

    return {
      id,
      owner_user_id: data.owner_user_id,
      usda_farm_id: data.usda_farm_id,
      farm_name: data.farm_name,
      primary_phone: data.primary_phone,
      primary_email: data.primary_email,
      website: data.website ?? null,
      social_media: data.social_media ?? null,
      farm_address: data.farm_address,
      county: data.county,
      cities_served: data.cities_served ?? [],
      location: {
        type: 'Point',
        coordinates: [data.location.lng, data.location.lat],
      },
      seasonal_products: data.seasonal_products as FarmSnapshotDTO['seasonal_products'],
      meat_products: data.meat_products as FarmSnapshotDTO['meat_products'],
      other_products: data.other_products as FarmSnapshotDTO['other_products'],
      seasonal_products_detail: data.seasonal_products_detail ?? null,
      meat_products_detail: data.meat_products_detail ?? null,
      other_products_detail: data.other_products_detail ?? null,
      market_sales_data: data.market_sales_data ?? null,
      growing_practices: data.growing_practices as FarmSnapshotDTO['growing_practices'],
      food_safety_certifications:
        data.food_safety_certifications as FarmSnapshotDTO['food_safety_certifications'],
      farm_experiences: data.farm_experiences as FarmSnapshotDTO['farm_experiences'],
      farm_characteristics: data.farm_characteristics as FarmSnapshotDTO['farm_characteristics'],
      farm_to_school_sales: data.farm_to_school_sales as FarmSnapshotDTO['farm_to_school_sales'],
      f2s_experience: data.f2s_experience ?? null,
      minimum_order: data.minimum_order ?? null,
      delivery_details: data.delivery_details ?? null,
      cover_photo: data.cover_photo ?? null,
      carousel_photos: data.carousel_photos ?? [],
      status: data.status,
      is_archived: data.is_archived,
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    };
  }

  private convertToFarmRejectionDTO(id: string, data: FarmRejectionDoc): FarmRejectionDTO {
    return {
      id,
      farm_id: data.farm_id,
      rejected_by_user_id: data.rejected_by_user_id,
      rejection_reason: data.rejection_reason,
      farm_snapshot: data.farm_snapshot,
      farm_snapshot_updated_at: toIso(data.farm_snapshot_updated_at),
      created_at: toIso(data.created_at),
      resolved_at: data.resolved_at == null ? null : toIso(data.resolved_at),
      resolution_type: data.resolution_type,
    };
  }

  private convertToFarmDTO(id: string, data: FarmDoc): FarmDTO {
    if (!data.location) {
      Logger.error(`Farm ${id} has invalid or missing location`);
      throw new Error(`Farm with id ${id} is missing a valid location.`);
    }

    const location: LocationDTO = { lat: data.location.lat, lng: data.location.lng };

    return {
      id,
      owner_user_id: data.owner_user_id,
      usda_farm_id: data.usda_farm_id,
      farm_name: data.farm_name,
      primary_phone: data.primary_phone,
      primary_email: data.primary_email,
      website: data.website ?? null,
      social_media: data.social_media ?? null,
      farm_address: data.farm_address,
      county: data.county,
      cities_served: data.cities_served ?? [],
      location,
      seasonal_products: data.seasonal_products as FarmDTO['seasonal_products'],
      meat_products: data.meat_products as FarmDTO['meat_products'],
      other_products: data.other_products as FarmDTO['other_products'],
      seasonal_products_detail: data.seasonal_products_detail ?? null,
      meat_products_detail: data.meat_products_detail ?? null,
      other_products_detail: data.other_products_detail ?? null,
      market_sales_data: data.market_sales_data ?? null,
      growing_practices: data.growing_practices as FarmDTO['growing_practices'],
      food_safety_certifications:
        data.food_safety_certifications as FarmDTO['food_safety_certifications'],
      farm_experiences: data.farm_experiences as FarmDTO['farm_experiences'],
      farm_characteristics: data.farm_characteristics as FarmDTO['farm_characteristics'],
      farm_to_school_sales: data.farm_to_school_sales as FarmDTO['farm_to_school_sales'],
      f2s_experience: data.f2s_experience ?? null,
      minimum_order: data.minimum_order ?? null,
      delivery_details: data.delivery_details ?? null,
      cover_photo: data.cover_photo ?? null,
      carousel_photos: data.carousel_photos ?? [],
      status: data.status,
      is_archived: data.is_archived,
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    };
  }

  async getFarmsByStatus(status: FarmStatus): Promise<FarmDTO[]> {
    try {
      const snap = await this.farms()
        .where('status', '==', status)
        .where('is_archived', '==', false)
        .get();
      return snap.docs.map((doc) => this.convertToFarmDTO(doc.id, doc.data() as FarmDoc));
    } catch (error: unknown) {
      Logger.error(`Failed to get farms by status. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getFarmsByOwner(ownerUserId: string): Promise<FarmDTO[]> {
    try {
      const snap = await this.farms().where('owner_user_id', '==', ownerUserId).get();
      return snap.docs.map((doc) => this.convertToFarmDTO(doc.id, doc.data() as FarmDoc));
    } catch (error: unknown) {
      Logger.error(`Failed to get farms by owner. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getFarmById(farmId: string): Promise<FarmDTO> {
    try {
      const { id, data } = await this.getFarmDoc(farmId);
      return this.convertToFarmDTO(id, data);
    } catch (error: unknown) {
      Logger.error(`Failed to get farm. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async archiveFarm(farmId: string): Promise<FarmDTO> {
    try {
      const { data } = await this.getFarmDoc(farmId);
      if (data.is_archived) {
        Logger.warn(`Farm with id ${farmId} is already archived.`);
        return this.convertToFarmDTO(farmId, data);
      }
      const next: FarmDoc = { ...data, is_archived: true, updatedAt: new Date().toISOString() };
      await this.farms().doc(farmId).set(next);
      return this.convertToFarmDTO(farmId, next);
    } catch (error: unknown) {
      Logger.error(`Failed to archive farm. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async unarchiveFarm(farmId: string): Promise<FarmDTO> {
    try {
      const { data } = await this.getFarmDoc(farmId);
      if (!data.is_archived) {
        Logger.warn(`Farm with id ${farmId} is not archived.`);
        return this.convertToFarmDTO(farmId, data);
      }
      const next: FarmDoc = { ...data, is_archived: false, updatedAt: new Date().toISOString() };
      await this.farms().doc(farmId).set(next);
      return this.convertToFarmDTO(farmId, next);
    } catch (error: unknown) {
      Logger.error(`Failed to unarchive farm. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  private getRejectedSnapshot(farm: FarmDoc, farmBeforeUpdate: FarmDTO): Partial<FarmDTO> {
    if (
      farm.rejection_snapshot &&
      typeof farm.rejection_snapshot === 'object' &&
      !Array.isArray(farm.rejection_snapshot)
    ) {
      return farm.rejection_snapshot;
    }
    return farmBeforeUpdate;
  }

  private getRejectionReason(farm: FarmDoc): string {
    if (typeof farm.rejection_reason === 'string' && farm.rejection_reason.trim().length > 0) {
      return farm.rejection_reason.trim();
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

  private buildDiffEntries(diff: FarmFieldDiff[]): EmailChangeEntry[] {
    if (diff.length === 0) {
      return [{ field: 'Changes', previous: '', current: 'No field-level changes detected.' }];
    }

    return diff.map((change) => ({
      field: this.formatFieldLabel(change.field),
      previous: this.formatDiffValue(change.previous),
      current: this.formatDiffValue(change.current),
    }));
  }

  private formatFieldLabel(field: string): string {
    return field
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  private formatDiffValue(value: unknown): string {
    if (value === null || value === undefined) {
      return 'null';
    }

    if (typeof value === 'string') {
      return value.length > 0 ? value : '(empty string)';
    }

    return this.stableSerialize(value);
  }

  private async notifyAdminsAboutResubmission(
    farm: FarmDTO,
    rejectionReason: string,
    diff: FarmFieldDiff[]
  ): Promise<void> {
    const subject = `Farm Resubmitted: ${farm.farm_name}`;
    const emailBody = {
      title: 'Farm Resubmitted for Review',
      previewText: 'A farm has been resubmitted with updates for admin review.',
      body: `Farm: ${farm.farm_name}\nFarm ID: ${farm.id}\nPrevious rejection reason: ${rejectionReason}\n\nFarmer changes:`,
      changes: this.buildDiffEntries(diff),
      reasonText: `A farmer has updated the farm application after a rejection. Review the changes below.`,
      ctaText: 'Review application',
      ctaUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/admin/farms`,
      isFarmerEmail: false,
    };

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
      const snap = await this.rejections().where('farm_id', '==', farmId).get();
      const active = snap.docs
        .map((doc) => ({ id: doc.id, data: doc.data() as FarmRejectionDoc }))
        .filter(({ data }) => data.resolved_at == null)
        .sort((a, b) => b.data.created_at.localeCompare(a.data.created_at));

      if (!active.length) {
        return null;
      }

      const rejection = active[0];
      return {
        id: rejection.id,
        farm_id: rejection.data.farm_id,
        rejection_reason: rejection.data.rejection_reason,
        created_at: toIso(rejection.data.created_at),
      };
    } catch (error: unknown) {
      Logger.error(`Failed to get latest active rejection. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async resubmitFarm(
    farmId: string,
    _resubmittedByUserId: string,
    input: UpdateFarmInput
  ): Promise<FarmDTO> {
    try {
      const { data: farm } = await this.getFarmDoc(farmId);

      if (farm.status !== FarmStatus.REJECTED) {
        throw new Error(
          `Farm with id ${farmId} cannot be resubmitted because its status is ${farm.status}, not REJECTED.`
        );
      }

      const updateValues = Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined)
      ) as Partial<UpdateFarmInput>;

      const next: FarmDoc = {
        ...farm,
        ...updateValues,
        location: updateValues.location
          ? { lat: updateValues.location.lat, lng: updateValues.location.lng }
          : farm.location,
        status: FarmStatus.PENDING_APPROVAL,
        updatedAt: new Date().toISOString(),
      } as FarmDoc;

      const db = getFirestore();
      const batch = db.batch();
      batch.set(this.farms().doc(farmId), next);

      const activeSnap = await this.rejections().where('farm_id', '==', farmId).get();
      const now = new Date().toISOString();
      for (const doc of activeSnap.docs) {
        const data = doc.data() as FarmRejectionDoc;
        if (data.resolved_at == null) {
          batch.update(doc.ref, {
            resolved_at: now,
            resolution_type: FarmRejectionResolutionType.RESUBMITTED,
          });
        }
      }

      await batch.commit();
      return this.convertToFarmDTO(farmId, next);
    } catch (error: unknown) {
      Logger.error(`Failed to resubmit farm. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }
}

export default FarmService;
