import * as firebaseAdmin from 'firebase-admin';
import { AuthenticationError } from 'apollo-server';
import FarmService from '@/services/implementations/farmService';
import UserService from '@/services/implementations/userService';
import IFarmService from '@/services/interfaces/farmService';
import IUserService from '@/services/interfaces/userService';
import { FarmFilter, UpdateFarmInput } from '@/types';
import { getAccessToken, type GraphQLContext } from '@/middlewares/auth';

const farmService: IFarmService = new FarmService();
const userService: IUserService = new UserService();

export const farmResolvers = {
  Query: {
    farms: async (_parent: undefined, { filter }: { filter?: FarmFilter }) => {
      return farmService.getFarms(filter);
    },
  },

  Mutation: {
    updateFarm: async (
      _parent: undefined,
      { id, input }: { id: string; input: UpdateFarmInput },
      context: GraphQLContext
    ) => {
      // Get access token from request headers
      const accessToken = getAccessToken(context.req);

      if (!accessToken) {
        throw new AuthenticationError('Access token is required');
      }

      try {
        // Verify the token and get the user
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(accessToken, true);
        const currentUserId = await userService.getUserIdByAuthId(decodedToken.uid);

        // Get the farm to check ownership
        const farms = await farmService.getFarms();
        const farm = farms.find((f) => f.id === id);

        if (!farm) {
          throw new Error(`Farm with id ${id} not found`);
        }

        // Check if the authenticated user owns the farm
        if (farm.ownerUserId !== currentUserId) {
          throw new AuthenticationError('You are not authorized to update this farm');
        }

        // Update the farm
        return farmService.updateFarm(id, input);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          throw error;
        }
        throw new AuthenticationError('Invalid authentication token');
      }
    },
  },
};
