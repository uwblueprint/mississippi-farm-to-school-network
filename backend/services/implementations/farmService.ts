import { Op, QueryTypes, UniqueConstraintError } from 'sequelize';

import Farm from '@/models/farm.model';
import IFarmService from '@/services/interfaces/farmService';
import {
  CreateFarmInput,
  FarmDTO,
  FarmFilter,
  FarmStatus,
  GeoPoint,
  UpdateFarmInput,
} from '@/types';
import { getErrorMessage } from '@/utilities/errorUtils';
import logger from '@/utilities/logger';

const Logger = logger(__filename);

class FarmService implements IFarmService {
  async createFarm(ownerUserId: string, input: CreateFarmInput): Promise<FarmDTO> {
    try {
      const farm = await Farm.create({
        owner_user_id: ownerUserId,
        ...input,
        status: FarmStatus.PENDING_APPROVAL,
      });

      return this.convertToFarmDTO(farm);
    } catch (error: unknown) {
      if (error instanceof UniqueConstraintError) {
        Logger.warn(
          `Farm creation failed due to a unique constraint. Reason = ${getErrorMessage(error)}`
        );
        throw new Error('A farm with that USDA farm ID already exists.');
      }
      Logger.error(`Failed to create farm. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getFarmsByProximity(lat: number, lng: number, radiusKm: number): Promise<FarmDTO[]> {
    try {
      const { sequelize } = Farm;
      if (!sequelize) throw new Error('Database connection not initialized');

      const farms = await sequelize.query(
        `SELECT *, ST_AsGeoJSON(location)::json AS location FROM farms
         WHERE ST_DWithin(
           location,
           ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
           :radiusMeters
         )
         ORDER BY ST_Distance(
           location,
           ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
         )`,
        {
          replacements: { lat, lng, radiusMeters: radiusKm * 1000 },
          type: QueryTypes.SELECT,
        }
      );

      return (farms as Record<string, unknown>[]).map((farm) => ({
        id: farm.id as string,
        owner_user_id: farm.owner_user_id as string,
        usda_farm_id: farm.usda_farm_id as number,
        farm_name: farm.farm_name as string,
        description: farm.description as string,
        primary_phone: farm.primary_phone as string,
        primary_email: farm.primary_email as string,
        website: farm.website as string | null,
        social_media: farm.social_media as Record<string, unknown> | null,
        farm_address: farm.farm_address as string,
        counties_served: farm.counties_served as string[],
        cities_served: farm.cities_served as string[],
        location: farm.location as GeoPoint,
        food_categories: farm.food_categories as string[],
        market_sales_data: farm.market_sales_data as { market: string; times: string }[] | null,
        bipoc_owned: farm.bipoc_owned as boolean,
        gap_certified: farm.gap_certified as boolean,
        food_safety_plan: farm.food_safety_plan as boolean,
        agritourism: farm.agritourism as boolean,
        sells_at_markets: farm.sells_at_markets as boolean,
        csa_boxes: farm.csa_boxes as boolean,
        online_sales: farm.online_sales as boolean,
        delivery: farm.delivery as boolean,
        f2s_experience: farm.f2s_experience as boolean,
        interested_in_f2s: farm.interested_in_f2s as boolean,
        status: farm.status as FarmDTO['status'],
        createdAt: farm.created_at as string,
        updatedAt: farm.updated_at as string,
      }));
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

      const updateValues = Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined)
      ) as Partial<UpdateFarmInput>;

      Object.assign(farm, updateValues);

      await farm.save();
      await farm.reload();

      return this.convertToFarmDTO(farm);
    } catch (error: unknown) {
      Logger.error(`Failed to update farm. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
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

    // Handle if location data is null. Throws error if invalid, returns DTO if valid.
    const location = data.location as { type?: unknown; coordinates?: unknown } | null | undefined;

    if (
      !location ||
      location.type !== 'Point' ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2 ||
      typeof location.coordinates[0] !== 'number' ||
      typeof location.coordinates[1] !== 'number'
    ) {
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
      location: location as { type: 'Point'; coordinates: [number, number] },
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
}

export default FarmService;
