import { UniqueConstraintError } from 'sequelize';

import Farm from '@/models/farm.model';
import IFarmService from '@/services/interfaces/farmService';
import { CreateFarmInput, FarmDTO, FarmStatus } from '@/types';
import { getErrorMessage } from '@/utilities/errorUtils';
import logger from '@/utilities/logger';

const Logger = logger(__filename);

/** Shape of a raw SQL row from the farms table with ST_AsGeoJSON */
interface FarmRow {
  id: string;
  owner_user_id: string;
  usda_farm_id: number;
  farm_name: string;
  description: string;
  primary_phone: string;
  primary_email: string;
  website: string | null;
  social_media: Record<string, unknown> | null;
  farm_address: string;
  counties_served: string[];
  cities_served: string[];
  location: { type: 'Point'; coordinates: [number, number] };
  food_categories: string[];
  market_sales_data: { market: string; times: string }[] | null;
  bipoc_owned: boolean;
  gap_certified: boolean;
  food_safety_plan: boolean;
  agritourism: boolean;
  sells_at_markets: boolean;
  csa_boxes: boolean;
  online_sales: boolean;
  delivery: boolean;
  f2s_experience: boolean;
  interested_in_f2s: boolean;
  status: FarmStatus;
  created_at: string;
  updated_at: string;
}

class FarmService implements IFarmService {
  async createFarm(ownerUserId: string, input: CreateFarmInput): Promise<FarmDTO> {
    try {
      const farm = await Farm.create({
        owner_user_id: ownerUserId,
        ...input,
        location: {
          type: 'Point',
          coordinates: input.location.coordinates,
        },
        status: FarmStatus.PENDING_APPROVAL,
      });

      // Reload to get the geography column as GeoJSON
      const [results] = await Farm.sequelize!.query(
        `SELECT *, ST_AsGeoJSON(location)::json as location FROM farms WHERE id = :id`,
        { replacements: { id: farm.id } }
      );
      const reloaded = results[0] as FarmRow;
      if (!reloaded) throw new Error('Farm was created but could not be retrieved');

      return {
        id: reloaded.id,
        owner_user_id: reloaded.owner_user_id,
        usda_farm_id: reloaded.usda_farm_id,
        farm_name: reloaded.farm_name,
        description: reloaded.description,
        primary_phone: reloaded.primary_phone,
        primary_email: reloaded.primary_email,
        website: reloaded.website,
        social_media: reloaded.social_media,
        farm_address: reloaded.farm_address,
        counties_served: reloaded.counties_served,
        cities_served: reloaded.cities_served,
        location: reloaded.location,
        food_categories: reloaded.food_categories,
        market_sales_data: reloaded.market_sales_data,
        bipoc_owned: reloaded.bipoc_owned,
        gap_certified: reloaded.gap_certified,
        food_safety_plan: reloaded.food_safety_plan,
        agritourism: reloaded.agritourism,
        sells_at_markets: reloaded.sells_at_markets,
        csa_boxes: reloaded.csa_boxes,
        online_sales: reloaded.online_sales,
        delivery: reloaded.delivery,
        f2s_experience: reloaded.f2s_experience,
        interested_in_f2s: reloaded.interested_in_f2s,
        status: reloaded.status,
        createdAt: new Date(reloaded.created_at).toISOString(),
        updatedAt: new Date(reloaded.updated_at).toISOString(),
      };
    } catch (error: unknown) {
      if (error instanceof UniqueConstraintError) {
        Logger.warn(`Farm creation failed due to a unique constraint. Reason = ${getErrorMessage(error)}`);
        throw new Error('A farm with that USDA farm ID already exists.');
      }
      Logger.error(`Failed to create farm. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }
}

export default FarmService;
