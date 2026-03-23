import { AuthenticationError, ForbiddenError } from 'apollo-server';
import FarmService from '@/services/implementations/farmService';
import UserService from '@/services/implementations/userService';
import IFarmService from '@/services/interfaces/farmService';
import IUserService from '@/services/interfaces/userService';
import Farm from '@/models/farm.model';
import { AuthContext } from '@/middlewares/auth';
import { CreateFarmInput, FarmDTO, FarmFilter, UpdateFarmInput, Role } from '@/types';
import authHelper from '@/utilities/authHelpers';

const farmService: IFarmService = new FarmService();
const userService: IUserService = new UserService();

const farmResolvers = {
  Query: {
    farms: async (_parent: undefined, { filter }: { filter?: FarmFilter }) => {
      return farmService.getFarms(filter);
    },
  },

  Mutation: {
    createFarm: async (
      _parent: undefined,
      { input }: { input: CreateFarmInput },
      context: AuthContext
    ): Promise<FarmDTO> => {
      const currentUser = await authHelper.requireEmailVerified(context);
      return farmService.createFarm(currentUser.id, input);
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
    owner: async (farm: FarmDTO) => {
      return userService.getUserById(farm.owner_user_id);
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
