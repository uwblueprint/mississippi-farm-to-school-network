import { UniqueConstraintError } from 'sequelize';

import Farm from '@/models/farm.model';
import IFarmService from '@/services/interfaces/farmService';
import { CreateFarmInput, FarmDTO, FarmStatus } from '@/types';
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

      const data = farm.toJSON();
      return {
        ...data,
        location: input.location,
        createdAt: data.createdAt.toISOString(),
        updatedAt: data.updatedAt.toISOString(),
      } as FarmDTO;
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

  async getFarmById(farmId: string): Promise<FarmDTO> {
    try {
      const farm = await Farm.findByPk(farmId);
      if (!farm) {
        throw new Error(`farmId ${farmId} not found.`);
      }
      const data = farm.toJSON();
      return {
        ...data,
        createdAt: data.createdAt.toISOString(),
        updatedAt: data.updatedAt.toISOString(),
      } as FarmDTO;
    } catch (error: unknown) {
      Logger.error(`Failed to get farm. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }
}

export default FarmService;
