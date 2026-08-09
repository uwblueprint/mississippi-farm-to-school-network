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

const MAX_FARMS_PAGE_SIZE = 100;

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
      {
        filter,
        pageNumber: rawPageNumber,
        pageSize: rawPageSize,
      }: { filter?: FarmFilter; pageNumber?: number | null; pageSize?: number | null },
      context: AuthContext
    ) => {
      const pageNumber = rawPageNumber ?? 1;
      const pageSize = rawPageSize ?? 50;

      if (!Number.isInteger(pageNumber) || pageNumber < 1) {
        throw new Error('pageNumber must be an integer >= 1');
      }
      if (!Number.isInteger(pageSize) || pageSize < 1) {
        throw new Error('pageSize must be an integer >= 1');
      }
      if (pageSize > MAX_FARMS_PAGE_SIZE) {
        throw new Error(`pageSize must not exceed ${MAX_FARMS_PAGE_SIZE}`);
      }

      const isAdmin = await authHelper
        .requireRole(context, [Role.ADMIN])
        .then(() => true)
        .catch(() => false);

      if (!isAdmin) {
        return farmService.getFarms(pageNumber, pageSize, {
          ...filter,
          status: FarmStatus.APPROVED,
          is_archived: false,
        });
      }

      return farmService.getFarms(pageNumber, pageSize, filter);
    },
    // The authenticated user's own farms across ALL statuses (the public `farms`
    // query clamps non-admins to APPROVED, so it can't back a farmer dashboard).
    myFarms: async (
      _parent: undefined,
      _args: undefined,
      context: AuthContext
    ): Promise<FarmDTO[]> => {
      const user = await authHelper.requireAuth(context);
      return farmService.getFarmsByOwner(user.id);
    },
    farmById: async (
      _parent: undefined,
      { id }: { id: string },
      context: AuthContext
    ): Promise<FarmDTO> => {
      const farm = await Farm.findByPk(id);
      if (!farm) {
        throw new Error(`Farm with id ${id} not found.`);
      }
      // Owner may read their own farm (any status) to populate the edit form;
      // admins may read any farm. Mirrors latestActiveFarmRejection's auth.
      await authHelper.requireOwnerOrAdmin(context, farm.owner_user_id);
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
      const currentUser = await authHelper.requireRole(context, [Role.FARMER]);
      const createdFarm = await farmService.createFarm(currentUser.id, input);

      const subject = 'New Farm Application Submitted';
      const emailBody = {
        title: 'New Farm Application Submitted',
        previewText: 'A new farm application is ready for review.',
        body: `A new farm application has been submitted for ${input.farm_name}. Please review the application and approve or reject it.`,
        ctaText: 'Review application',
        ctaUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/admin/farms`,
        isFarmerEmail: false,
      };
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

      if (farm.is_archived) {
        const isAdmin = await authHelper
          .requireRole(context, [Role.ADMIN])
          .then(() => true)
          .catch(() => false);
        if (!isAdmin) {
          throw new ForbiddenError(
            'This farm is archived and cannot be edited. Please contact an administrator.'
          );
        }
      }

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

      if (farm.is_archived) {
        const isAdmin = await authHelper
          .requireRole(context, [Role.ADMIN])
          .then(() => true)
          .catch(() => false);
        if (!isAdmin) {
          throw new ForbiddenError(
            'This farm is archived and cannot be edited. Please contact an administrator.'
          );
        }
      }

      return farmService.resubmitFarm(id, currentUser.id, input);
    },

    archiveFarm: async (
      _parent: undefined,
      { id }: { id: string },
      context: AuthContext
    ): Promise<FarmDTO> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      return farmService.archiveFarm(id);
    },

    unarchiveFarm: async (
      _parent: undefined,
      { id }: { id: string },
      context: AuthContext
    ): Promise<FarmDTO> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      return farmService.unarchiveFarm(id);
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
    ): Promise<string | null> => {
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
