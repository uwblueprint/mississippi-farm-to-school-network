import { UniqueConstraintError } from 'sequelize';

import Farm from '@/models/farm.model';
import IFarmService from '@/services/interfaces/farmService';
import { CreateFarmInput, FarmDTO, FarmStatus } from '@/types';
import { getErrorMessage } from '@/utilities/errorUtils';
import logger from '@/utilities/logger';

const Logger = logger(__filename);

type FarmRow = Omit<FarmDTO, 'createdAt' | 'updatedAt'> & {
  created_at: string;
  updated_at: string;
};

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
      
      const { created_at, updated_at, ...rest } = reloaded;
      return {
        ...rest,
        createdAt: new Date(created_at).toISOString(),
        updatedAt: new Date(updated_at).toISOString(),
      };
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
}

export default FarmService;
