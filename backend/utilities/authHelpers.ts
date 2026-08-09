import * as firebaseAdmin from 'firebase-admin';
import { Role, UserDTO } from '@/types';
import { AuthenticationError, ForbiddenError } from 'apollo-server';
import { AuthContext } from '@/middlewares/auth';
import { getErrorMessage } from '@/utilities/errorUtils';

const AUTHENTICATION_REQUIRED_MESSAGE = 'You must be logged in to access this resource.';
const USER_NOT_FOUND_MESSAGE = 'Authenticated user was not found.';
const EMAIL_VERIFICATION_REQUIRED_MESSAGE = 'You must verify your email to access this resource.';
const PERMISSION_DENIED_MESSAGE = 'You do not have permission to access this resource.';
const OWNERSHIP_REQUIRED_MESSAGE = 'You do not have permission to access or modify this resource.';

const ADMIN_EMAIL_DOMAIN = '@mississippifarmtoschool.org';

function resolveRole(email: string | undefined, customClaims?: Record<string, unknown> | null): Role {
  const claimRole = customClaims?.role;
  if (claimRole === Role.ADMIN || claimRole === Role.FARMER) {
    return claimRole;
  }
  if (email?.toLowerCase().endsWith(ADMIN_EMAIL_DOMAIN)) {
    return Role.ADMIN;
  }
  return Role.FARMER;
}

function splitDisplayName(displayName?: string): { firstName: string | null; lastName: string | null } {
  if (!displayName?.trim()) {
    return { firstName: null, lastName: null };
  }
  const parts = displayName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : null,
  };
}

/** Build a UserDTO from Firebase Auth (no Firestore profile lookup). */
async function userFromFirebaseAuth(firebaseUid: string): Promise<UserDTO> {
  try {
    const authUser = await firebaseAdmin.auth().getUser(firebaseUid);
    const email = authUser.email;
    if (!email) {
      throw new AuthenticationError(USER_NOT_FOUND_MESSAGE);
    }

    const { firstName, lastName } = splitDisplayName(authUser.displayName);
    const claims = (authUser.customClaims ?? {}) as Record<string, unknown>;

    return {
      // Use Firebase uid as the app user id so ownership checks don't need Firestore.
      id: authUser.uid,
      firebase_uid: authUser.uid,
      email,
      role: resolveRole(email, claims),
      is_verified: Boolean(authUser.emailVerified),
      firstName: typeof claims.firstName === 'string' ? claims.firstName : firstName,
      lastName: typeof claims.lastName === 'string' ? claims.lastName : lastName,
      phone: authUser.phoneNumber ?? (typeof claims.phone === 'string' ? claims.phone : null),
    };
  } catch (error: unknown) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    const code = (error as { code?: string }).code;
    if (code === 'auth/user-not-found') {
      throw new AuthenticationError(USER_NOT_FOUND_MESSAGE);
    }
    throw new Error(`Failed to load authenticated user from Firebase Auth: ${getErrorMessage(error)}`);
  }
}

const AuthHelper = {
  /**
   * Ensures the request is authenticated and returns the current user from Firebase Auth.
   */
  requireAuth: async (context: AuthContext): Promise<UserDTO> => {
    if (!context.firebaseUid) {
      throw new AuthenticationError(AUTHENTICATION_REQUIRED_MESSAGE);
    }

    return userFromFirebaseAuth(context.firebaseUid);
  },

  /**
   * Ensures the request is authenticated and the user's email is verified (Firebase Auth).
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
   * Role comes from Auth custom claims, or admin email domain, otherwise FARMER.
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
   * - the owner of `targetUserId` (Firebase uid), or
   * - an admin.
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
