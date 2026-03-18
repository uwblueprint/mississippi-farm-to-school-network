import fetch, { Response } from 'node-fetch';
import { Token, Role, UserDTO } from '@/types';
import logger from '@/utilities/logger';
import { AuthenticationError, ForbiddenError } from 'apollo-server';
import UserService from '@/services/implementations/userService';
import IUserService from '@/services/interfaces/userService';

const Logger = logger(__filename);

const FIREBASE_SIGN_IN_URL =
  'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword';
const FIREBASE_REFRESH_TOKEN_URL = 'https://securetoken.googleapis.com/v1/token';
const FIREBASE_OAUTH_SIGN_IN_URL =
  'https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp';


type RefreshTokenResponse = {
  expires_in: string;
  token_type: string;
  refresh_token: string;
  id_token: string;
  user_id: string;
  project_id: string;
};


const AuthHelper = {
  requireAuth: async (context: { firebaseUid?: string }): Promise<UserDTO> => {
    
    if (!context.firebaseUid) {
        throw new AuthenticationError('You must be logged in to view your profile.');
      }

      // Fetch the user from the database using the UID
      const userService: IUserService = new UserService();
      const user = await userService.getCurrentUser(context.firebaseUid);

      if (!user) {
        throw new AuthenticationError('User not found in database.');
      }

      return user;
  },

  requireRole: async (context: { firebaseUid?: string }, roles: Role[]): Promise<UserDTO> => {
    const user = await AuthHelper.requireAuth(context);
    if (!roles.includes(user.role)) {
      throw new ForbiddenError('You do not have permission to access this resource.');
    }
    return user;
  },

  requireEmailVerified: async (context: { firebaseUid?: string }): Promise<UserDTO> => {
    const user = await AuthHelper.requireAuth(context);
    if (!user.is_verified) {
      throw new AuthenticationError('Please verify your email.');
    }
    return user;
  },

  requireOwnerOrAdmin: async (context: { firebaseUid?: string }, targetUserId: string):  Promise<UserDTO> => {
    const user = await AuthHelper.requireAuth(context);
    if (user.role != Role.ADMIN && user.id != targetUserId) {
      throw new ForbiddenError('You do not have permission to access this resource.');
    }
    return user;
  }
  
  
};

export default AuthHelper;
