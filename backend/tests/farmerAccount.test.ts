import { Role } from '@/types';
import { FakeFirestore } from './helpers/fakeFirestore';

let mockFirestoreInstance: FakeFirestore;

jest.mock('@/utilities/firestore', () => ({
  ...jest.requireActual('@/utilities/firestore'),
  getFirestore: () => mockFirestoreInstance,
}));

const mockFirebaseGetUser = jest.fn();
const mockFirebaseGetUserByEmail = jest.fn();
const mockFirebaseCreateUser = jest.fn();

jest.mock('firebase-admin', () => ({
  auth: () => ({
    getUser: mockFirebaseGetUser,
    getUserByEmail: mockFirebaseGetUserByEmail,
    createUser: mockFirebaseCreateUser,
    deleteUser: jest.fn(),
  }),
}));

import UserService from '@/services/implementations/userService';

const SIGNED_IN_AT = 'Mon, 05 Oct 2026 12:00:00 GMT';

describe('UserService.getOrCreateFarmerByEmail', () => {
  let service: UserService;

  /** Puts a user in Firestore (the way createUser does for an existing Firebase uid). */
  async function seedUser(uid: string, email: string, role: Role) {
    mockFirebaseGetUser.mockResolvedValue({ uid, metadata: {} });
    await service.createUser({ email, role, emailVerified: true }, uid);
  }

  beforeEach(() => {
    mockFirestoreInstance = new FakeFirestore();
    service = new UserService();
    mockFirebaseGetUser.mockReset();
    mockFirebaseGetUserByEmail.mockReset();
    mockFirebaseCreateUser.mockReset();
  });

  describe('new accounts', () => {
    beforeEach(() => {
      mockFirebaseGetUserByEmail.mockRejectedValue({ code: 'auth/user-not-found' });
      mockFirebaseCreateUser.mockResolvedValue({ uid: 'new-uid' });
    });

    test('rejects an invalid email before touching Firebase', async () => {
      await expect(service.getOrCreateFarmerByEmail('abc')).rejects.toThrow(
        'Invalid email format.'
      );
      expect(mockFirebaseGetUserByEmail).not.toHaveBeenCalled();
      expect(mockFirebaseCreateUser).not.toHaveBeenCalled();
    });

    test('creates a verified FARMER account and asks for password setup', async () => {
      const result = await service.getOrCreateFarmerByEmail('  New.Farmer@Example.com ');

      expect(mockFirebaseCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new.farmer@example.com', emailVerified: true })
      );
      expect(result.needsPasswordSetup).toBe(true);
      expect(result.user).toMatchObject({
        id: 'new-uid',
        email: 'new.farmer@example.com',
        role: Role.FARMER,
        is_verified: true,
      });
      await expect(service.getUserById('new-uid')).resolves.toMatchObject({ role: Role.FARMER });
    });

    test('gives every new account a different long random password', async () => {
      await service.getOrCreateFarmerByEmail('one@example.com');
      mockFirebaseCreateUser.mockResolvedValue({ uid: 'new-uid-2' });
      await service.getOrCreateFarmerByEmail('two@example.com');

      const [first, second] = mockFirebaseCreateUser.mock.calls.map(([args]) => args.password);
      expect(first.length).toBeGreaterThanOrEqual(32);
      expect(second.length).toBeGreaterThanOrEqual(32);
      expect(first).not.toBe(second);
    });
  });

  describe('existing farmer accounts', () => {
    test('a farmer who has signed in is reused untouched and needs no password link', async () => {
      await seedUser('farmer-uid', 'farmer@example.com', Role.FARMER);
      mockFirebaseGetUser.mockResolvedValue({
        uid: 'farmer-uid',
        metadata: { lastSignInTime: SIGNED_IN_AT },
      });

      const result = await service.getOrCreateFarmerByEmail('Farmer@Example.com');

      expect(result).toMatchObject({
        needsPasswordSetup: false,
        user: { id: 'farmer-uid', email: 'farmer@example.com', role: Role.FARMER },
      });
      expect(mockFirebaseCreateUser).not.toHaveBeenCalled();
    });

    test('a refreshed session also counts as having signed in', async () => {
      await seedUser('farmer-uid', 'farmer@example.com', Role.FARMER);
      mockFirebaseGetUser.mockResolvedValue({
        uid: 'farmer-uid',
        metadata: { lastRefreshTime: SIGNED_IN_AT },
      });

      const result = await service.getOrCreateFarmerByEmail('farmer@example.com');

      expect(result.needsPasswordSetup).toBe(false);
    });

    test('an account nobody has signed in to still needs a password link', async () => {
      await seedUser('pending-uid', 'pending@example.com', Role.FARMER);
      mockFirebaseGetUser.mockResolvedValue({ uid: 'pending-uid', metadata: {} });

      const result = await service.getOrCreateFarmerByEmail('pending@example.com');

      expect(result.needsPasswordSetup).toBe(true);
      expect(result.user.id).toBe('pending-uid');
      expect(mockFirebaseCreateUser).not.toHaveBeenCalled();
    });

    test('never changes the existing account', async () => {
      await seedUser('farmer-uid', 'farmer@example.com', Role.FARMER);
      mockFirebaseGetUser.mockResolvedValue({
        uid: 'farmer-uid',
        metadata: { lastSignInTime: SIGNED_IN_AT },
      });
      const before = await service.getUserById('farmer-uid');

      await service.getOrCreateFarmerByEmail('farmer@example.com');

      await expect(service.getUserById('farmer-uid')).resolves.toEqual(before);
    });

    test('rejects an admin account', async () => {
      await seedUser('admin-uid', 'admin@example.com', Role.ADMIN);

      await expect(service.getOrCreateFarmerByEmail('admin@example.com')).rejects.toThrow(
        'not a farmer account'
      );
      expect(mockFirebaseCreateUser).not.toHaveBeenCalled();
    });
  });

  describe('accounts that only exist in Firebase Auth', () => {
    test('creates the missing profile and treats a farmer as existing', async () => {
      mockFirebaseGetUserByEmail.mockResolvedValue({
        uid: 'legacy-uid',
        emailVerified: true,
        customClaims: {},
      });
      mockFirebaseGetUser.mockResolvedValue({
        uid: 'legacy-uid',
        metadata: { lastSignInTime: SIGNED_IN_AT },
      });

      const result = await service.getOrCreateFarmerByEmail('legacy@example.com');

      expect(result).toMatchObject({
        needsPasswordSetup: false,
        user: { id: 'legacy-uid', role: Role.FARMER, is_verified: true },
      });
      expect(mockFirebaseCreateUser).not.toHaveBeenCalled();
      await expect(service.getUserById('legacy-uid')).resolves.toMatchObject({
        email: 'legacy@example.com',
      });
    });

    test('rejects an account whose role claim is ADMIN, and writes no profile', async () => {
      mockFirebaseGetUserByEmail.mockResolvedValue({
        uid: 'claim-admin',
        emailVerified: true,
        customClaims: { role: 'ADMIN' },
      });
      mockFirebaseGetUser.mockResolvedValue({ uid: 'claim-admin', metadata: {} });

      await expect(service.getOrCreateFarmerByEmail('someone@example.com')).rejects.toThrow(
        'not a farmer account'
      );
    });

    test('rejects a staff email address instead of demoting it to FARMER', async () => {
      mockFirebaseGetUserByEmail.mockResolvedValue({
        uid: 'staff-uid',
        emailVerified: true,
        customClaims: {},
      });
      mockFirebaseGetUser.mockResolvedValue({ uid: 'staff-uid', metadata: {} });

      await expect(
        service.getOrCreateFarmerByEmail('staff@mississippifarmtoschool.org')
      ).rejects.toThrow('not a farmer account');
    });
  });
});
