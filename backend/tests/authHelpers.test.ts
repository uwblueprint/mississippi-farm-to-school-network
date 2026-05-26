import { AuthenticationError, ForbiddenError } from 'apollo-server';
import { Role, UserDTO } from '@/types';

const mockGetCurrentUser = jest.fn();

jest.mock('@/services/implementations/userService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getCurrentUser: mockGetCurrentUser,
  })),
}));

import authHelper from '@/utilities/authHelpers';

const makeUser = (overrides: Partial<UserDTO> = {}): UserDTO => ({
  id: 'user-1',
  firebase_uid: 'firebase-1',
  email: 'user@example.com',
  role: Role.FARMER,
  is_verified: true,
  firstName: null,
  lastName: null,
  phone: null,
  ...overrides,
});

describe('authHelper', () => {
  beforeEach(() => {
    mockGetCurrentUser.mockReset();
  });

  test('requireAuth throws AuthenticationError when firebaseUid is missing', async () => {
    await expect(authHelper.requireAuth({})).rejects.toBeInstanceOf(AuthenticationError);
    await expect(authHelper.requireAuth({})).rejects.toThrow(
      'You must be logged in to access this resource.'
    );
  });

  test('requireAuth throws AuthenticationError when the user is missing from the database', async () => {
    mockGetCurrentUser.mockRejectedValue(new Error('user with firebase_uid firebase-1 not found.'));

    await expect(authHelper.requireAuth({ firebaseUid: 'firebase-1' })).rejects.toBeInstanceOf(
      AuthenticationError
    );
    await expect(authHelper.requireAuth({ firebaseUid: 'firebase-1' })).rejects.toThrow(
      'Authenticated user was not found.'
    );
  });

  test('requireEmailVerified throws AuthenticationError when the email is not verified', async () => {
    mockGetCurrentUser.mockResolvedValue(makeUser({ is_verified: false }));

    await expect(
      authHelper.requireEmailVerified({ firebaseUid: 'firebase-1' })
    ).rejects.toBeInstanceOf(AuthenticationError);
    await expect(authHelper.requireEmailVerified({ firebaseUid: 'firebase-1' })).rejects.toThrow(
      'You must verify your email to access this resource.'
    );
  });

  test('requireRole throws AuthenticationError when the email is not verified', async () => {
    mockGetCurrentUser.mockResolvedValue(makeUser({ is_verified: false, role: Role.ADMIN }));

    await expect(
      authHelper.requireRole({ firebaseUid: 'firebase-1' }, [Role.ADMIN])
    ).rejects.toBeInstanceOf(AuthenticationError);
  });

  test('requireRole throws ForbiddenError when the user lacks the required role', async () => {
    mockGetCurrentUser.mockResolvedValue(makeUser({ role: Role.FARMER }));

    await expect(
      authHelper.requireRole({ firebaseUid: 'firebase-1' }, [Role.ADMIN])
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      authHelper.requireRole({ firebaseUid: 'firebase-1' }, [Role.ADMIN])
    ).rejects.toThrow('You do not have permission to access this resource.');
  });

  test('requireOwnerOrAdmin throws ForbiddenError when the user is neither the owner nor an admin', async () => {
    mockGetCurrentUser.mockResolvedValue(makeUser({ id: 'user-1', role: Role.FARMER }));

    await expect(
      authHelper.requireOwnerOrAdmin({ firebaseUid: 'firebase-1' }, 'user-2')
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      authHelper.requireOwnerOrAdmin({ firebaseUid: 'firebase-1' }, 'user-2')
    ).rejects.toThrow('You do not have permission to access or modify this resource.');
  });

  test('requireRole returns the user when all checks pass', async () => {
    const user = makeUser({ role: Role.ADMIN, is_verified: true });
    mockGetCurrentUser.mockResolvedValue(user);

    await expect(authHelper.requireRole({ firebaseUid: 'firebase-1' }, [Role.ADMIN])).resolves.toBe(
      user
    );
  });
});
