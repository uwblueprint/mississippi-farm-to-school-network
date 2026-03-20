import { Role, UserDTO } from '@/types';
import { AuthenticationError, ForbiddenError } from 'apollo-server';
import { AuthContext } from '@/middlewares/auth';
import UserService from '@/services/implementations/userService';
import IUserService from '@/services/interfaces/userService';
import { getErrorMessage } from '@/utilities/errorUtils';

const AUTHENTICATION_REQUIRED_MESSAGE = 'You must be logged in to access this resource.';
const USER_NOT_FOUND_MESSAGE = 'Authenticated user was not found.';
const EMAIL_VERIFICATION_REQUIRED_MESSAGE = 'You must verify your email to access this resource.';
const PERMISSION_DENIED_MESSAGE = 'You do not have permission to access this resource.';
const OWNERSHIP_REQUIRED_MESSAGE = 'You do not have permission to access or modify this resource.';

const userService: IUserService = new UserService();

const isUserNotFoundError = (error: unknown): boolean => {
  return getErrorMessage(error).toLowerCase().includes('not found');
};

const AuthHelper = {
  /**
   * Ensures the request is authenticated and returns the current user.
   *
   * @param context - GraphQL request context with `firebaseUid`.
   * @returns The current user record.
   * @throws {AuthenticationError} If `firebaseUid` is missing or the user cannot be found.
   */
  requireAuth: async (context: AuthContext): Promise<UserDTO> => {
    if (!context.firebaseUid) {
      throw new AuthenticationError(AUTHENTICATION_REQUIRED_MESSAGE);
    }

    try {
      return await userService.getCurrentUser(context.firebaseUid);
    } catch (error: unknown) {
      if (isUserNotFoundError(error)) {
        throw new AuthenticationError(USER_NOT_FOUND_MESSAGE);
      }

      throw error;
    }
  },

  /**
   * Ensures the request is authenticated and the user's email is verified.
   *
   * @param context - GraphQL request context with `firebaseUid`.
   * @returns The current user record (verified).
   * @throws {AuthenticationError} If not logged in, user not found, or `user.is_verified` is false.
   */
  requireEmailVerified: async (context: AuthContext): Promise<UserDTO> => {
    const user = await AuthHelper.requireAuth(context);
    if (!user.is_verified) {
      throw new AuthenticationError(EMAIL_VERIFICATION_REQUIRED_MESSAGE);
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
  requireRole: async (context: AuthContext, roles: Role[]): Promise<UserDTO> => {
    const user = await AuthHelper.requireEmailVerified(context);
    if (!roles.includes(user.role)) {
      throw new ForbiddenError(PERMISSION_DENIED_MESSAGE);
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
  requireOwnerOrAdmin: async (context: AuthContext, targetUserId: string): Promise<UserDTO> => {
    const user = await AuthHelper.requireAuth(context);
    if (user.role !== Role.ADMIN && user.id !== targetUserId) {
      throw new ForbiddenError(OWNERSHIP_REQUIRED_MESSAGE);
    }
    return user;
  },
};

export default AuthHelper;
