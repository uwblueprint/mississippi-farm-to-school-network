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
  /**
   * Ensures the request is authenticated and returns the current user.
   *
   * @param context - GraphQL request context with `firebaseUid`.
   * @returns The current user record.
   * @throws {AuthenticationError} If `firebaseUid` is missing or the user cannot be found.
   */
  requireAuth: async (context: { firebaseUid?: string }): Promise<UserDTO> => {
    if (!context.firebaseUid) {
        throw new AuthenticationError('You must be logged in to view your profile.');
      }

      const userService: IUserService = new UserService();
      const user = await userService.getCurrentUser(context.firebaseUid);

      if (!user) {
        throw new AuthenticationError('User not found in database.');
      }

      return user;
  },

  /**
   * Ensures the request is authenticated and the user's email is verified.
   *
   * @param context - GraphQL request context with `firebaseUid`.
   * @returns The current user record (verified).
   * @throws {AuthenticationError} If not logged in, user not found, or `user.is_verified` is false.
   */
  requireEmailVerified: async (context: { firebaseUid?: string }): Promise<UserDTO> => {
    const user = await AuthHelper.requireAuth(context);
    if (!user.is_verified) {
      throw new AuthenticationError('Please verify your email.');
    }
    return user;
  },

  /**
   * Ensures the request is authenticated and the user has one of the allowed roles.
   *
   * @param context - GraphQL request context with `firebaseUid`.
   * @param roles - Allowed roles for this operation.
   * @returns The current user record (authorized).
   * @throws {AuthenticationError} If not logged in or user not found.
   * @throws {ForbiddenError} If the user does not have an allowed role.
   */
  requireRole: async (context: { firebaseUid?: string }, roles: Role[]): Promise<UserDTO> => {
    const user = await AuthHelper.requireAuth(context);
    if (!roles.includes(user.role)) {
      throw new ForbiddenError('You do not have permission to access this resource.');
    }
    return user;
  },

  /**
   * Ensures the request is authenticated and the current user is either:
   * - the owner of `targetUserId`, or
   * - an admin.
   *
   * @param context - GraphQL request context with `firebaseUid`.
   * @param targetUserId - The user id that the operation is acting on.
   * @returns The current user record (authorized).
   * @throws {AuthenticationError} If not logged in or user not found.
   * @throws {ForbiddenError} If the user is neither the owner nor an admin.
   */
  requireOwnerOrAdmin: async (context: { firebaseUid?: string }, targetUserId: string):  Promise<UserDTO> => {
    const user = await AuthHelper.requireAuth(context);
    if (user.role != Role.ADMIN && user.id != targetUserId) {
      throw new ForbiddenError('You do not have permission to access this resource.');
    }
    return user;
  }
  
  
};

export default AuthHelper;
