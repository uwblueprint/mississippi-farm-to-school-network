import { Op } from 'sequelize';
import IFarmService from '@/services/interfaces/farmService';
import { FarmFilter, FarmDTO, UpdateFarmInput } from '@/types';
import { getErrorMessage } from '@/utilities/errorUtils';
import logger from '@/utilities/logger';

const Logger = logger(__filename);

// Temporary Farm model stub - will be replaced when Farm model is created by other tickets
class Farm {
  static async findAll(options?: any): Promise<any[]> {
    // Mock implementation for development - replace with actual Farm model
    Logger.warn('Using mock Farm model - replace with actual implementation');
    return [];
  }

  static async findByPk(id: string): Promise<any | null> {
    // Mock implementation for development
    Logger.warn('Using mock Farm model - replace with actual implementation');
    return null;
  }

  async save(): Promise<void> {
    // Mock implementation
  }

  async reload(): Promise<void> {
    // Mock implementation
  }
}

class FarmService implements IFarmService {
  async getFarms(filter?: FarmFilter): Promise<Array<FarmDTO>> {
    const where: any = {};

    try {
      // No filter → return all
      if (!filter) {
        const farms = await Farm.findAll();
        return this.convertToFarmDTOs(farms);
      }

      // Status filter
      if (filter.status) {
        where.status = filter.status;
      }

      // Approved convenience filter
      if (filter.approved !== undefined) {
        where.status = filter.approved ? 'APPROVED' : { [Op.ne]: 'APPROVED' };
      }

      // Counties array overlap
      if (filter.countiesServed?.length) {
        where.countiesServed = {
          [Op.overlap]: filter.countiesServed,
        };
      }

      // Food categories array overlap
      if (filter.foodCategories?.length) {
        where.foodCategories = {
          [Op.overlap]: filter.foodCategories,
        };
      }

      const farms = await Farm.findAll({ where });
      return this.convertToFarmDTOs(farms);
    } catch (error: unknown) {
      Logger.error(`Failed to get farms. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async updateFarm(id: string, input: UpdateFarmInput): Promise<FarmDTO> {
    try {
      // Find the farm by id
      const farm = await Farm.findByPk(id);
      if (!farm) {
        throw new Error(`Farm with id ${id} not found.`);
      }

      // Update only the provided fields (partial update)
      Object.keys(input).forEach((key) => {
        if (input[key as keyof UpdateFarmInput] !== undefined) {
          (farm as any)[key] = input[key as keyof UpdateFarmInput];
        }
      });

      // Save the changes
      await farm.save();

      // Reload to get fresh updated_at timestamp from database
      await farm.reload();

      return this.convertToFarmDTO(farm);
    } catch (error: unknown) {
      Logger.error(`Failed to update farm. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  private convertToFarmDTOs(farms: any[]): FarmDTO[] {
    return farms.map((farm) => this.convertToFarmDTO(farm));
  }

  private convertToFarmDTO(farm: any): FarmDTO {
    return {
      id: farm.id,
      farmName: farm.farmName,
      ownerFirstName: farm.ownerFirstName,
      ownerLastName: farm.ownerLastName,
      email: farm.email,
      phoneNumber: farm.phoneNumber,
      address: farm.address,
      city: farm.city,
      state: farm.state,
      zipCode: farm.zipCode,
      countiesServed: farm.countiesServed || [],
      foodCategories: farm.foodCategories || [],
      certifications: farm.certifications || [],
      description: farm.description,
      website: farm.website,
      status: farm.status || 'PENDING_APPROVAL',
      ownerUserId: farm.ownerUserId,
      createdAt: farm.createdAt ? farm.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: farm.updatedAt ? farm.updatedAt.toISOString() : new Date().toISOString(),
    };
  }
}

export default FarmService;
