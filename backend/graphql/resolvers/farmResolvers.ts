import { AuthenticationError, ForbiddenError } from 'apollo-server';
import FarmService from '@/services/implementations/farmService';
import UserService from '@/services/implementations/userService';
import IFarmService from '@/services/interfaces/farmService';
import IUserService from '@/services/interfaces/userService';
import Farm from '@/models/farm.model';
import {
  CreateFarmInput,
  FarmDTO,
  FarmFilter,
  FarmStatus,
  UpdateFarmInput,
  Role,
  ActiveFarmRejectionDTO,
} from '@/types';
import { AuthContext } from '@/middlewares/auth';
import authHelper from '@/utilities/authHelpers';
import EmailService from '@/services/implementations/emailService';
import IEmailService from '@/services/interfaces/emailService';
import nodemailerConfig from '@/nodemailer.config';

const farmService: IFarmService = new FarmService();
const userService: IUserService = new UserService();
const emailService: IEmailService = new EmailService(nodemailerConfig);

const farmResolvers = {
  Query: {
    farmsByProximity: async (
      _: unknown,
      { lat, lng, radiusKm }: { lat: number; lng: number; radiusKm: number }
    ) => {
      if (!isFinite(lat) || !isFinite(lng) || !isFinite(radiusKm))
        throw new Error('lat, lng, and radiusKm must be finite numbers');
      if (lat < -90 || lat > 90) throw new Error('lat must be between -90 and 90');
      if (lng < -180 || lng > 180) throw new Error('lng must be between -180 and 180');
      if (radiusKm <= 0) throw new Error('radiusKm must be positive');
      if (radiusKm > 40075) throw new Error('radiusKm exceeds maximum allowed value');
      return farmService.getFarmsByProximity(lat, lng, radiusKm);
    },
    farms: async (
      _parent: undefined,
      { filter }: { filter?: FarmFilter },
      context: AuthContext
    ) => {
      const isAdmin = await authHelper
        .requireRole(context, [Role.ADMIN])
        .then(() => true)
        .catch(() => false);

      if (!isAdmin) {
        return farmService.getFarms({ ...filter, status: FarmStatus.APPROVED, is_archived: false });
      }

      return farmService.getFarms(filter);
    },
    farmById: async (
      _parent: undefined,
      { id }: { id: string },
      context: AuthContext
    ): Promise<FarmDTO> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      return farmService.getFarmById(id);
    },
    farmsByStatus: async (
      _parent: undefined,
      { status }: { status: FarmStatus },
      context: AuthContext
    ): Promise<FarmDTO[]> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      return farmService.getFarmsByStatus(status);
    },
    latestActiveFarmRejection: async (
      _parent: undefined,
      { farmId }: { farmId: string },
      context: AuthContext
    ): Promise<ActiveFarmRejectionDTO | null> => {
      await authHelper.requireEmailVerified(context);
      const farm = await Farm.findByPk(farmId);
      if (!farm) {
        throw new Error(`Farm with id ${farmId} not found.`);
      }
      await authHelper.requireOwnerOrAdmin(context, farm.owner_user_id);
      return farmService.getLatestActiveRejection(farmId);
    },
  },

  Mutation: {
    createFarm: async (
      _parent: undefined,
      { input }: { input: CreateFarmInput },
      context: AuthContext
    ): Promise<FarmDTO> => {
      const currentUser = await authHelper.requireEmailVerified(context);
      const createdFarm = await farmService.createFarm(currentUser.id, input);

      const subject = 'New Farm Application Submitted';
      const emailBody = `<h2>New Farm Application Submitted</h2>
                      <p>A new farm application has been submitted for ${input.farm_name}.</p>
                      <p>Please review the application and approve or reject it.</p>`;
      try {
        await emailService.sendEmail(process.env.MAILER_USER!, subject, emailBody);
      } catch {
        // email failure should not fail the mutation
      }

      return createdFarm;
    },

    updateFarm: async (
      _parent: undefined,
      { id, input }: { id: string; input: UpdateFarmInput },
      context: AuthContext
    ): Promise<FarmDTO> => {
      await authHelper.requireEmailVerified(context);
      const farm = await Farm.findByPk(id);

      if (!farm) {
        throw new Error(`Farm with id ${id} not found.`);
      }

      await authHelper.requireOwnerOrAdmin(context, farm.owner_user_id);

      return farmService.updateFarm(id, input, farm);
    },

    approveFarm: async (
      _parent: undefined,
      { id }: { id: string },
      context: AuthContext
    ): Promise<FarmDTO> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      return farmService.approveFarm(id);
    },

    resubmitFarm: async (
      _parent: undefined,
      { id, input }: { id: string; input: UpdateFarmInput },
      context: AuthContext
    ): Promise<FarmDTO> => {
      const currentUser = await authHelper.requireEmailVerified(context);
      const farm = await Farm.findByPk(id);
      if (!farm) {
        throw new Error(`Farm with id ${id} not found.`);
      }
      await authHelper.requireOwnerOrAdmin(context, farm.owner_user_id);

      return farmService.resubmitFarm(id, currentUser.id, input);
    },
  },

  FarmDTO: {
    owner: async (farm: FarmDTO, _args: unknown, context: AuthContext) => {
      try {
        await authHelper.requireRole(context, [Role.ADMIN]);
        return userService.getUserById(farm.owner_user_id);
      } catch (error: unknown) {
        if (error instanceof AuthenticationError || error instanceof ForbiddenError) {
          return null;
        }

        throw error;
      }
    },
    usda_farm_id: async (
      farm: FarmDTO,
      _args: unknown,
      context: AuthContext
    ): Promise<number | null> => {
      try {
        await authHelper.requireOwnerOrAdmin(context, farm.owner_user_id);
        return farm.usda_farm_id;
      } catch (error: unknown) {
        if (error instanceof AuthenticationError || error instanceof ForbiddenError) {
          return null;
        }

        throw error;
      }
    },
  },
};

export default farmResolvers;
