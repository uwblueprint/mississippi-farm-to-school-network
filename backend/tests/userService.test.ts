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

  test('findByFirebaseUid-backed lookups (getUserIdByAuthId, getCurrentUser) resolve after createUser', async () => {
    mockFirebaseCreateUser.mockResolvedValue({ uid: 'firebase-uid-789' });
    await service.createUser(
      { email: 'me@example.com', password: 'hunter2', role: Role.ADMIN },
      undefined,
      SignUpMethod.PASSWORD
    );

    await expect(service.getUserIdByAuthId('firebase-uid-789')).resolves.toBe('firebase-uid-789');
    await expect(service.getCurrentUser('firebase-uid-789')).resolves.toMatchObject({
      id: 'firebase-uid-789',
      email: 'me@example.com',
    });
    await expect(service.getAuthIdById('firebase-uid-789')).resolves.toBe('firebase-uid-789');
  });

  test('getUserById throws for an id with no matching Firestore doc', async () => {
    await expect(service.getUserById('does-not-exist')).rejects.toThrow('not found');
  });
});
