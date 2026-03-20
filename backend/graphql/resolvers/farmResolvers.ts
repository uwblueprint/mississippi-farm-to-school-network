import * as firebaseAdmin from 'firebase-admin';
import { AuthenticationError, ForbiddenError } from 'apollo-server';
import FarmService from '@/services/implementations/farmService';
import UserService from '@/services/implementations/userService';
import IFarmService from '@/services/interfaces/farmService';
import IUserService from '@/services/interfaces/userService';
import Farm from '@/models/farm.model';
import { CreateFarmInput, FarmDTO, FarmFilter, FarmStatus, UpdateFarmInput } from '@/types';
import { getAccessToken, type GraphQLContext } from '@/middlewares/auth';

const farmService: IFarmService = new FarmService();
const userService: IUserService = new UserService();

const farmResolvers = {
  Query: {
    farms: async (_parent: undefined, { filter }: { filter?: FarmFilter }) => {
      return farmService.getFarms(filter);
    },
    farmsByStatus: async (
      _parent: undefined,
      { status }: { status: FarmStatus },
      context: GraphQLContext
    ): Promise<FarmDTO[]> => {
      const accessToken = getAccessToken(context.req);
      if (!accessToken) {
        throw new AuthenticationError('You must be logged in to view farms by status');
      }

      let decodedIdToken: firebaseAdmin.auth.DecodedIdToken;
      try {
        decodedIdToken = await firebaseAdmin.auth().verifyIdToken(accessToken, true);
      } catch {
        throw new AuthenticationError('Invalid or expired token');
      }
      
      let userRole;
      try {
        userRole = await userService.getUserRoleByAuthId(decodedIdToken.uid);
      } catch {
        throw new AuthenticationError('User not found or error retrieving role');
      }
      if (userRole !== 'ADMIN') {
        throw new ForbiddenError('You are not authorized to view farms by status');
      }
      
      try {
        return await farmService.getFarmsByStatus(status);
      } catch (error) {
        throw new Error('Failed to fetch farms by status: ' + (error instanceof Error ? error.message : String(error)));
      }
    },
  },

  Mutation: {
    createFarm: async (
      _parent: undefined,
      { input }: { input: CreateFarmInput },
      context: GraphQLContext
    ): Promise<FarmDTO> => {
      const accessToken = getAccessToken(context.req);
      if (!accessToken) throw new AuthenticationError('You must be logged in to create a farm');

      let decodedIdToken: firebaseAdmin.auth.DecodedIdToken;
      try {
        decodedIdToken = await firebaseAdmin.auth().verifyIdToken(accessToken, true);
      } catch {
        throw new AuthenticationError('Invalid or expired token');
      }

      const ownerUserId = await userService.getUserIdByAuthId(decodedIdToken.uid);
      return await farmService.createFarm(ownerUserId, input);
    },

    updateFarm: async (
      _parent: undefined,
      { id, input }: { id: string; input: UpdateFarmInput },
      context: GraphQLContext
    ): Promise<FarmDTO> => {
      const accessToken = getAccessToken(context.req);
      if (!accessToken) {
        throw new AuthenticationError('Access token is required');
      }

      let decodedToken: firebaseAdmin.auth.DecodedIdToken;
      try {
        decodedToken = await firebaseAdmin.auth().verifyIdToken(accessToken, true);
      } catch {
        throw new AuthenticationError('Invalid authentication token');
      }

      const currentUserId = await userService.getUserIdByAuthId(decodedToken.uid);
      const farm = await Farm.findByPk(id);

      if (!farm) {
        throw new Error(`Farm with id ${id} not found`);
      }

      if (farm.owner_user_id !== currentUserId) {
        throw new ForbiddenError('You are not authorized to update this farm');
      }

      return farmService.updateFarm(id, input, farm);
    },
  },

  FarmDTO: {
    owner: async (farm: FarmDTO) => {
      return userService.getUserById(farm.owner_user_id);
    },
  },
};

export default farmResolvers;
