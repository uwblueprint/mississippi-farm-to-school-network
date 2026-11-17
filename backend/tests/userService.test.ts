import { Role, SignUpMethod } from '@/types';
import { FakeFirestore } from './helpers/fakeFirestore';

let mockFirestoreInstance: FakeFirestore;

jest.mock('@/utilities/firestore', () => ({
  ...jest.requireActual('@/utilities/firestore'),
  getFirestore: () => mockFirestoreInstance,
}));

const mockFirebaseGetUser = jest.fn();
const mockFirebaseCreateUser = jest.fn();
const mockFirebaseUpdateUser = jest.fn();
const mockFirebaseDeleteUser = jest.fn();

jest.mock('firebase-admin', () => ({
  auth: () => ({
    getUser: mockFirebaseGetUser,
    createUser: mockFirebaseCreateUser,
    updateUser: mockFirebaseUpdateUser,
    deleteUser: mockFirebaseDeleteUser,
  }),
}));

import UserService from '@/services/implementations/userService';

describe('UserService (Firestore)', () => {
  let service: UserService;

  beforeEach(() => {
    mockFirestoreInstance = new FakeFirestore();
    service = new UserService();
    mockFirebaseGetUser.mockReset();
    mockFirebaseCreateUser.mockReset();
    mockFirebaseUpdateUser.mockReset();
    mockFirebaseDeleteUser.mockReset();
  });

  test('createUser stores the Firestore doc under the Firebase Auth uid, not a random id', async () => {
    mockFirebaseCreateUser.mockResolvedValue({ uid: 'firebase-uid-123' });

    const created = await service.createUser(
      {
        email: 'farmer@example.com',
        password: 'hunter2',
        role: Role.FARMER,
      },
      undefined,
      SignUpMethod.PASSWORD
    );

    // authHelpers.ts derives UserDTO.id from the Firebase uid directly, so the
    // Firestore doc id must match it for lookups like getUserById to work.
    expect(created.id).toBe('firebase-uid-123');

    const fetched = await service.getUserById('firebase-uid-123');
    expect(fetched.email).toBe('farmer@example.com');
    expect(fetched.id).toBe('firebase-uid-123');
  });

  test('createUser with a pre-existing Firebase uid (e.g. OAuth) also keys the doc by that uid', async () => {
    mockFirebaseGetUser.mockResolvedValue({ uid: 'oauth-uid-456' });

    const created = await service.createUser(
      { email: 'oauth@example.com', role: Role.FARMER },
      'oauth-uid-456',
      SignUpMethod.GOOGLE
    );

    expect(created.id).toBe('oauth-uid-456');
    await expect(service.getUserById('oauth-uid-456')).resolves.toMatchObject({
      email: 'oauth@example.com',
    });
  });

  test('findByFirebaseUid-backed lookups (getUserIdByAuthId, getUserByFirebaseUid) resolve after createUser', async () => {
    mockFirebaseCreateUser.mockResolvedValue({ uid: 'firebase-uid-789' });
    await service.createUser(
      { email: 'me@example.com', password: 'hunter2', role: Role.ADMIN },
      undefined,
      SignUpMethod.PASSWORD
    );

    await expect(service.getUserIdByAuthId('firebase-uid-789')).resolves.toBe('firebase-uid-789');
    await expect(service.getUserByFirebaseUid('firebase-uid-789')).resolves.toMatchObject({
      id: 'firebase-uid-789',
      email: 'me@example.com',
    });
    await expect(service.getAuthIdById('firebase-uid-789')).resolves.toBe('firebase-uid-789');
  });

  test('getUserById throws for an id with no matching Firestore doc', async () => {
    await expect(service.getUserById('does-not-exist')).rejects.toThrow('not found');
  });

  test('updateUserById and deleteUserById work when passed the Firebase uid (self-service paths)', async () => {
    mockFirebaseCreateUser.mockResolvedValue({ uid: 'firebase-uid-self' });
    await service.createUser(
      { email: 'self@example.com', password: 'hunter2', role: Role.FARMER },
      undefined,
      SignUpMethod.PASSWORD
    );

    // userResolvers.ts's updateUser/deleteUserById pass the caller's own `id`
    // (a Firebase uid, from `me.id`/authHelpers) straight through to these methods.
    const updated = await service.updateUserById('firebase-uid-self', {
      email: 'self@example.com',
      role: Role.FARMER,
      firstName: 'New',
      lastName: 'Name',
    });
    expect(updated.firstName).toBe('New');

    await service.deleteUserById('firebase-uid-self');
    await expect(service.getUserById('firebase-uid-self')).rejects.toThrow('not found');
  });

  test('updateUserById resets emailVerified in Firebase Auth when the email changes', async () => {
    mockFirebaseCreateUser.mockResolvedValue({ uid: 'firebase-uid-email' });
    await service.createUser(
      { email: 'old@example.com', password: 'hunter2', role: Role.FARMER },
      undefined,
      SignUpMethod.PASSWORD
    );

    await service.updateUserById('firebase-uid-email', {
      email: 'new@uwaterloo.ca',
      role: Role.FARMER,
    });

    expect(mockFirebaseUpdateUser).toHaveBeenCalledWith('firebase-uid-email', {
      email: 'new@uwaterloo.ca',
      emailVerified: false,
    });
  });

  test('completeUserProfile stores the role resolved from Firebase Auth, not input.email', async () => {
    mockFirebaseCreateUser.mockResolvedValue({ uid: 'firebase-uid-complete' });
    await service.createUser(
      { email: 'farmer@gmail.com', password: 'hunter2', role: Role.FARMER },
      undefined,
      SignUpMethod.PASSWORD
    );
    const authUser = {
      id: 'firebase-uid-complete',
      firebase_uid: 'firebase-uid-complete',
      email: 'farmer@gmail.com',
      role: Role.FARMER,
      is_verified: true,
      firstName: null,
      lastName: null,
      phone: null,
    };

    const completed = await service.completeUserProfile(authUser, {
      firebase_uid: 'firebase-uid-complete',
      email: 'spoofed@mississippifarmtoschool.org',
      firstName: 'Farm',
      lastName: 'Er',
      phone: '601-555-0100',
    });

    expect(completed.role).toBe(Role.FARMER);
  });

  describe('updateMyProfile', () => {
    const authUser = {
      id: 'firebase-uid-profile',
      firebase_uid: 'firebase-uid-profile',
      email: 'profile@example.com',
      role: Role.FARMER,
      is_verified: true,
      firstName: null,
      lastName: null,
      phone: null,
    };

    beforeEach(async () => {
      mockFirebaseCreateUser.mockResolvedValue({ uid: 'firebase-uid-profile' });
      await service.createUser(
        {
          email: 'profile@example.com',
          password: 'hunter2',
          role: Role.FARMER,
          firstName: 'Old',
          lastName: 'Name',
          phone: '5555555555',
        },
        undefined,
        SignUpMethod.PASSWORD
      );
    });

    test('updates name and phone, normalizing phone to digits', async () => {
      const updated = await service.updateMyProfile(authUser, {
        firstName: '  Mark ',
        lastName: 'Carney',
        phone: '(601) 555-1234',
      });

      expect(updated).toMatchObject({ firstName: 'Mark', lastName: 'Carney', phone: '6015551234' });
      await expect(service.getUserByFirebaseUid('firebase-uid-profile')).resolves.toMatchObject({
        firstName: 'Mark',
        phone: '6015551234',
      });
    });

    test('leaves email and role untouched', async () => {
      const updated = await service.updateMyProfile(authUser, {
        firstName: 'Mark',
        role: Role.ADMIN,
        email: 'attacker@example.com',
      } as never);

      expect(updated.role).toBe(Role.FARMER);
      expect(updated.email).toBe('profile@example.com');
    });

    test('blank lastName and phone clear the stored values', async () => {
      const updated = await service.updateMyProfile(authUser, {
        firstName: 'Mark',
        lastName: ' ',
        phone: '',
      });

      expect(updated.lastName).toBeNull();
      expect(updated.phone).toBeNull();
    });

    test('rejects an empty name or a phone without 10 digits', async () => {
      await expect(service.updateMyProfile(authUser, { firstName: '   ' })).rejects.toThrow(
        'Name must not be empty.'
      );
      await expect(
        service.updateMyProfile(authUser, { firstName: 'Mark', phone: '12345' })
      ).rejects.toThrow('exactly 10 digits');
    });

    test('creates the profile doc from the auth identity when none exists', async () => {
      const updated = await service.updateMyProfile(
        {
          ...authUser,
          id: 'auth-only-uid',
          firebase_uid: 'auth-only-uid',
          email: 'new@example.com',
        },
        { firstName: 'Lennox', lastName: 'Pee', phone: '6475945366' }
      );

      expect(updated).toMatchObject({
        id: 'auth-only-uid',
        email: 'new@example.com',
        role: Role.FARMER,
        firstName: 'Lennox',
        phone: '6475945366',
      });
      await expect(service.getUserByFirebaseUid('auth-only-uid')).resolves.toMatchObject({
        email: 'new@example.com',
        lastName: 'Pee',
      });
    });
  });
});
