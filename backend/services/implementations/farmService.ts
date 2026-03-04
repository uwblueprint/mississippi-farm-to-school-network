import IFarmService from '@/services/interfaces/farmService';
import { FarmDTO, GeoPoint } from '@/types';
import Farm from '@/models/farm.model';
import logger from '@/utilities/logger';
import { getErrorMessage } from '@/utilities/errorUtils';
import { QueryTypes } from 'sequelize';

const Logger = logger(__filename);

class FarmService implements IFarmService {
  async getFarmsByProximity(lat: number, lng: number, radiusKm: number): Promise<FarmDTO[]> {
    
    try {
      const farms = await Farm.sequelize!.query(
        `SELECT * FROM farms
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
        },
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
}

export default FarmService;
