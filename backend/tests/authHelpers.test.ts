import { AuthenticationError, ForbiddenError } from 'apollo-server';
import { Role } from '@/types';
import { FakeFirestore } from './helpers/fakeFirestore';

const mockGetUser = jest.fn();

jest.mock('firebase-admin', () => ({
  auth: jest.fn(() => ({
    getUser: mockGetUser,
  })),
}));

let mockFirestoreInstance: FakeFirestore;

jest.mock('@/utilities/firestore', () => ({
  ...jest.requireActual('@/utilities/firestore'),
  getFirestore: () => mockFirestoreInstance,
}));

import authHelper from '@/utilities/authHelpers';

describe('authHelper (Firebase Auth)', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFirestoreInstance = new FakeFirestore();
  });

  test('requireAuth throws AuthenticationError when firebaseUid is missing', async () => {
    await expect(authHelper.requireAuth({})).rejects.toBeInstanceOf(AuthenticationError);
    await expect(authHelper.requireAuth({})).rejects.toThrow(
      'You must be logged in to access this resource.'
    );
  });

  test('requireAuth throws AuthenticationError when Firebase Auth has no user', async () => {
    mockGetUser.mockRejectedValue({ code: 'auth/user-not-found' });

    await expect(authHelper.requireAuth({ firebaseUid: 'firebase-1' })).rejects.toBeInstanceOf(
      AuthenticationError
    );
    await expect(authHelper.requireAuth({ firebaseUid: 'firebase-1' })).rejects.toThrow(
      'Authenticated user was not found.'
    );
  });

  test('requireAuth returns a UserDTO built from Firebase Auth', async () => {
    mockGetUser.mockResolvedValue({
      uid: 'firebase-1',
      email: 'farmer@example.com',
      emailVerified: true,
      displayName: 'Rohan Saha',
      phoneNumber: null,
      customClaims: {},
    });

    await expect(authHelper.requireAuth({ firebaseUid: 'firebase-1' })).resolves.toEqual({
      id: 'firebase-1',
      firebase_uid: 'firebase-1',
      email: 'farmer@example.com',
      role: Role.FARMER,
      is_verified: true,
      firstName: 'Rohan',
      lastName: 'Saha',
      phone: null,
    });
  });

  test('requireEmailVerified throws AuthenticationError when the email is not verified', async () => {
    mockGetUser.mockResolvedValue({
      uid: 'firebase-1',
      email: 'farmer@example.com',
      emailVerified: false,
      customClaims: {},
    });

    await expect(
      authHelper.requireEmailVerified({ firebaseUid: 'firebase-1' })
    ).rejects.toBeInstanceOf(AuthenticationError);
    await expect(authHelper.requireEmailVerified({ firebaseUid: 'firebase-1' })).rejects.toThrow(
      'You must verify your email to access this resource.'
    );
  });

  test('requireRole throws ForbiddenError when the user lacks the required role', async () => {
    mockGetUser.mockResolvedValue({
      uid: 'firebase-1',
      email: 'farmer@example.com',
      emailVerified: true,
      customClaims: {},
    });

    await expect(
      authHelper.requireRole({ firebaseUid: 'firebase-1' }, [Role.ADMIN])
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      authHelper.requireRole({ firebaseUid: 'firebase-1' }, [Role.ADMIN])
    ).rejects.toThrow('You do not have permission to access this resource.');
  });

  test('requireRole treats mississippifarmtoschool.org emails as ADMIN', async () => {
    mockGetUser.mockResolvedValue({
      uid: 'firebase-admin',
      email: 'staff@mississippifarmtoschool.org',
      emailVerified: true,
      customClaims: {},
    });

    await expect(
      authHelper.requireRole({ firebaseUid: 'firebase-admin' }, [Role.ADMIN])
    ).resolves.toMatchObject({
      id: 'firebase-admin',
      role: Role.ADMIN,
      is_verified: true,
    });
  });

  test('requireOwnerOrAdmin throws ForbiddenError when the user is neither the owner nor an admin', async () => {
    mockGetUser.mockResolvedValue({
      uid: 'firebase-1',
      email: 'farmer@example.com',
      emailVerified: true,
      customClaims: {},
    });

    await expect(
      authHelper.requireOwnerOrAdmin({ firebaseUid: 'firebase-1' }, 'someone-else')
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('requireRole returns the user when all checks pass', async () => {
    mockGetUser.mockResolvedValue({
      uid: 'firebase-1',
      email: 'admin@mississippifarmtoschool.org',
      emailVerified: true,
      customClaims: { role: Role.ADMIN },
    });

    await expect(
      authHelper.requireRole({ firebaseUid: 'firebase-1' }, [Role.ADMIN])
    ).resolves.toMatchObject({
      id: 'firebase-1',
      role: Role.ADMIN,
      is_verified: true,
    });
  });

  test('role comes from the Firestore user profile, not just claims/email domain', async () => {
    // A regular gmail.com admin promoted via updateUser: no custom claim, no
    // qualifying email domain, but a Firestore profile with role ADMIN.
    mockGetUser.mockResolvedValue({
      uid: 'firebase-promoted',
      email: 'promoted-admin@gmail.com',
      emailVerified: true,
      customClaims: {},
    });
    await mockFirestoreInstance.collection('users').doc('firebase-promoted').set({
      firebase_uid: 'firebase-promoted',
      email: 'promoted-admin@gmail.com',
      role: Role.ADMIN,
      is_verified: true,
      firstName: null,
      lastName: null,
      phone: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await expect(
      authHelper.requireRole({ firebaseUid: 'firebase-promoted' }, [Role.ADMIN])
    ).resolves.toMatchObject({ role: Role.ADMIN });
  });
});
