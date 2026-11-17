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
    process.env.ADMIN_EMAIL_DOMAIN = 'uwaterloo.ca';
  });

  afterAll(() => {
    delete process.env.ADMIN_EMAIL_DOMAIN;
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

  test('requireRole treats verified ADMIN_EMAIL_DOMAIN emails as ADMIN', async () => {
    mockGetUser.mockResolvedValue({
      uid: 'firebase-admin',
      email: 'Staff@UWaterloo.ca',
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
      email: 'admin@uwaterloo.ca',
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

  test('an unverified admin-domain email is not ADMIN, even for requireOwnerOrAdmin', async () => {
    mockGetUser.mockResolvedValue({
      uid: 'firebase-unverified',
      email: 'staff@uwaterloo.ca',
      emailVerified: false,
      customClaims: {},
    });

    await expect(
      authHelper.requireAuth({ firebaseUid: 'firebase-unverified' })
    ).resolves.toMatchObject({ role: Role.FARMER });
    await expect(
      authHelper.requireOwnerOrAdmin({ firebaseUid: 'firebase-unverified' }, 'someone-else')
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test.each(['test@notuwaterloo.ca', 'test@sub.uwaterloo.ca', 'uwaterloo.ca@gmail.com'])(
    '%s is not treated as an admin-domain email',
    async (email) => {
      mockGetUser.mockResolvedValue({
        uid: 'firebase-lookalike',
        email,
        emailVerified: true,
        customClaims: {},
      });

      await expect(
        authHelper.requireAuth({ firebaseUid: 'firebase-lookalike' })
      ).resolves.toMatchObject({ role: Role.FARMER });
    }
  );

  test('a verified admin-domain email is promoted over a stored FARMER profile', async () => {
    mockGetUser.mockResolvedValue({
      uid: 'firebase-staff',
      email: 'staff@uwaterloo.ca',
      emailVerified: true,
      customClaims: {},
    });
    await mockFirestoreInstance.collection('users').doc('firebase-staff').set({
      firebase_uid: 'firebase-staff',
      email: 'staff@uwaterloo.ca',
      role: Role.FARMER,
      is_verified: false,
      firstName: null,
      lastName: null,
      phone: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await expect(
      authHelper.requireRole({ firebaseUid: 'firebase-staff' }, [Role.ADMIN])
    ).resolves.toMatchObject({ role: Role.ADMIN });
  });

  test('ADMIN_EMAIL_DOMAIN accepts a comma-separated list of domains', async () => {
    process.env.ADMIN_EMAIL_DOMAIN = 'mississippifarmtoschool.org, uwaterloo.ca';

    for (const email of ['staff@mississippifarmtoschool.org', 'tester@uwaterloo.ca']) {
      mockGetUser.mockResolvedValue({
        uid: 'firebase-multi',
        email,
        emailVerified: true,
        customClaims: {},
      });
      await expect(
        authHelper.requireAuth({ firebaseUid: 'firebase-multi' })
      ).resolves.toMatchObject({ role: Role.ADMIN });
    }

    mockGetUser.mockResolvedValue({
      uid: 'firebase-multi',
      email: 'farmer@gmail.com',
      emailVerified: true,
      customClaims: {},
    });
    await expect(authHelper.requireAuth({ firebaseUid: 'firebase-multi' })).resolves.toMatchObject({
      role: Role.FARMER,
    });
  });

  test('no email is treated as admin when ADMIN_EMAIL_DOMAIN is unset', async () => {
    delete process.env.ADMIN_EMAIL_DOMAIN;
    mockGetUser.mockResolvedValue({
      uid: 'firebase-staff',
      email: 'staff@uwaterloo.ca',
      emailVerified: true,
      customClaims: {},
    });

    await expect(authHelper.requireAuth({ firebaseUid: 'firebase-staff' })).resolves.toMatchObject({
      role: Role.FARMER,
    });
  });
});
