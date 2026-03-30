import { AuthenticationError, ForbiddenError } from 'apollo-server';
import FarmService from '@/services/implementations/farmService';
import UserService from '@/services/implementations/userService';
import IFarmService from '@/services/interfaces/farmService';
import IUserService from '@/services/interfaces/userService';
import Farm from '@/models/farm.model';
import { CreateFarmInput, FarmDTO, FarmFilter, FarmStatus, UpdateFarmInput, Role } from '@/types';
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
    farms: async (_parent: undefined, { filter }: { filter?: FarmFilter }) => {
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
      const adminEmail = 'mfsn@uwblueprint.org';
      await emailService.sendEmail(adminEmail, subject, emailBody);

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
