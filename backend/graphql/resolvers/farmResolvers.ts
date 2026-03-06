import * as firebaseAdmin from 'firebase-admin';
import { AuthenticationError } from 'apollo-server';
import FarmService from '@/services/implementations/farmService';
import UserService from '@/services/implementations/userService';
import IFarmService from '@/services/interfaces/farmService';
import IUserService from '@/services/interfaces/userService';
import { CreateFarmInput, FarmDTO } from '@/types';
import { getAccessToken, GraphQLContext } from '@/middlewares/auth';

const farmService: IFarmService = new FarmService();
const userService: IUserService = new UserService();

const farmResolvers = {
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
      }
      catch {
        throw new AuthenticationError('Invalid or expired token');
      }
      
      const ownerUserId = await userService.getUserIdByAuthId(decodedIdToken.uid);
      return await farmService.createFarm(ownerUserId, input);
    },
  },
};

export default farmResolvers;
