import { Op, literal, UniqueConstraintError } from 'sequelize';
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

  async getFarmsByProximity(lat: number, lng: number, radiusKm: number): Promise<FarmDTO[]> {
    try {
      const radiusMeters = radiusKm * 1000;

      const farms = await Farm.findAll({
        where: {
          status: FarmStatus.APPROVED,
          [Op.and]: [
            literal(
              `ST_DWithin(location, ST_SetSRID(ST_MakePoint(${Number(lng)}, ${Number(lat)}), 4326)::geography, ${Number(radiusMeters)})`
            ),
          ],
        },
        order: [[literal(`ST_Distance(location, ST_SetSRID(ST_MakePoint(${Number(lng)}, ${Number(lat)}), 4326)::geography)`), 'ASC']],
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

      if (updateValues.location) {
        Object.assign(updateValues, { location: convertToPostGISPoint(updateValues.location) });
      }

      Object.assign(farm, updateValues);

      await farm.save();
      await farm.reload();

      return this.convertToFarmDTO(farm);
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
}

export default FarmService;
