import { ForbiddenError } from 'apollo-server';
import { Role } from '@/types';
import type { AuthContext } from '@/middlewares/auth';
import type { CreateFarmInput } from '@/types';

const calls: string[] = [];

const mockRequireRole = jest.fn();
const mockAssertCanCreateFarm = jest.fn();
const mockCreateFarm = jest.fn();
const mockGetOrCreateFarmerByEmail = jest.fn();
const mockSendFarmAddedEmail = jest.fn();
const mockSendEmail = jest.fn();

jest.mock('@/utilities/authHelpers', () => ({
  __esModule: true,
  default: {
    requireAuth: jest.fn(),
    requireEmailVerified: jest.fn(),
    requireRole: mockRequireRole,
    requireOwnerOrAdmin: jest.fn(),
  },
}));

jest.mock('@/services/implementations/farmService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    assertCanCreateFarm: mockAssertCanCreateFarm,
    createFarm: mockCreateFarm,
  })),
}));

jest.mock('@/services/implementations/userService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getOrCreateFarmerByEmail: mockGetOrCreateFarmerByEmail,
    getUserByFirebaseUid: jest.fn(),
  })),
}));

jest.mock('@/services/implementations/authService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    sendFarmAddedEmail: mockSendFarmAddedEmail,
  })),
}));

jest.mock('@/services/implementations/emailService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ sendEmail: mockSendEmail })),
}));

jest.mock('@/services/implementations/fileStorageService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ deleteFile: jest.fn() })),
}));

import farmResolvers from '@/graphql/resolvers/farmResolvers';

const createFarmForFarmer = farmResolvers.Mutation.createFarmForFarmer as (
  parent: undefined,
  args: { email: string; input: CreateFarmInput },
  context: AuthContext
) => Promise<unknown>;

const context = { firebaseUid: 'admin-uid' } as AuthContext;

const input = {
  usda_farm_id: 'usda-1',
  farm_name: 'Two Brooks Farm',
  primary_phone: '6015550100',
  primary_email: 'contact@example.com',
  farm_address: '123 Farm Rd',
  county: 'Hinds',
  location: { lat: 32.3, lng: -90.18 },
  seasonal_products: [],
  meat_products: [],
  other_products: [],
  growing_practices: [],
  food_safety_certifications: [],
} as CreateFarmInput;

const farmer = {
  user: {
    id: 'farmer-uid',
    firebase_uid: 'farmer-uid',
    email: 'farmer@example.com',
    role: Role.FARMER,
    is_verified: true,
    firstName: null,
    lastName: null,
    phone: null,
  },
  needsPasswordSetup: true,
};

const createdFarm = { id: 'farm-1', farm_name: 'Two Brooks Farm', owner_user_id: 'farmer-uid' };

describe('farmResolvers.Mutation.createFarmForFarmer', () => {
  beforeEach(() => {
    calls.length = 0;
    mockRequireRole.mockReset().mockResolvedValue({ id: 'admin-uid', role: Role.ADMIN });
    mockAssertCanCreateFarm.mockReset().mockImplementation(async () => {
      calls.push('check farm');
    });
    mockGetOrCreateFarmerByEmail.mockReset().mockImplementation(async () => {
      calls.push('get or create farmer');
      return farmer;
    });
    mockCreateFarm.mockReset().mockImplementation(async () => {
      calls.push('create farm');
      return createdFarm;
    });
    mockSendFarmAddedEmail.mockReset().mockImplementation(async () => {
      calls.push('email farmer');
    });
    mockSendEmail.mockReset().mockResolvedValue(undefined);
  });

  test('requires an admin and does nothing else for anyone else', async () => {
    mockRequireRole.mockRejectedValue(
      new ForbiddenError('You do not have permission to access this resource.')
    );

    await expect(
      createFarmForFarmer(undefined, { email: 'farmer@example.com', input }, context)
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(mockRequireRole).toHaveBeenCalledWith(context, [Role.ADMIN]);
    expect(mockAssertCanCreateFarm).not.toHaveBeenCalled();
    expect(mockGetOrCreateFarmerByEmail).not.toHaveBeenCalled();
    expect(mockCreateFarm).not.toHaveBeenCalled();
    expect(mockSendFarmAddedEmail).not.toHaveBeenCalled();
  });

  test('creates the farm for the farmer, not the admin, and checks the farm first', async () => {
    const result = await createFarmForFarmer(
      undefined,
      { email: 'farmer@example.com', input },
      context
    );

    expect(result).toBe(createdFarm);
    expect(mockAssertCanCreateFarm).toHaveBeenCalledWith(input);
    expect(mockGetOrCreateFarmerByEmail).toHaveBeenCalledWith('farmer@example.com');
    expect(mockCreateFarm).toHaveBeenCalledWith('farmer-uid', input);
    expect(calls).toEqual(['check farm', 'get or create farmer', 'create farm', 'email farmer']);
  });

  test.each([true, false])(
    'tells the email whether the farmer needs to set a password (%s)',
    async (needsPasswordSetup) => {
      mockGetOrCreateFarmerByEmail.mockResolvedValue({ ...farmer, needsPasswordSetup });

      await createFarmForFarmer(undefined, { email: 'farmer@example.com', input }, context);

      expect(mockSendFarmAddedEmail).toHaveBeenCalledWith(
        'farmer@example.com',
        'Two Brooks Farm',
        needsPasswordSetup
      );
    }
  );

  test('creates no account when the farm fails the pre-check', async () => {
    mockAssertCanCreateFarm.mockRejectedValue(
      new Error('Farm with that USDA farm ID already exists.')
    );

    await expect(
      createFarmForFarmer(undefined, { email: 'new@example.com', input }, context)
    ).rejects.toThrow('Farm with that USDA farm ID already exists.');

    expect(mockGetOrCreateFarmerByEmail).not.toHaveBeenCalled();
    expect(mockCreateFarm).not.toHaveBeenCalled();
    expect(mockSendFarmAddedEmail).not.toHaveBeenCalled();
  });

  test('creates no farm when the farmer email is not usable', async () => {
    mockGetOrCreateFarmerByEmail.mockRejectedValue(
      new Error('The account for admin@example.com is not a farmer account.')
    );

    await expect(
      createFarmForFarmer(undefined, { email: 'admin@example.com', input }, context)
    ).rejects.toThrow('not a farmer account');

    expect(mockCreateFarm).not.toHaveBeenCalled();
    expect(mockSendFarmAddedEmail).not.toHaveBeenCalled();
  });

  test('sends the farmer nothing when creating the farm fails', async () => {
    mockCreateFarm.mockRejectedValue(new Error('Firestore unavailable'));

    await expect(
      createFarmForFarmer(undefined, { email: 'farmer@example.com', input }, context)
    ).rejects.toThrow('Firestore unavailable');

    expect(mockSendFarmAddedEmail).not.toHaveBeenCalled();
  });

  test('still returns the farm when the farmer email fails to send', async () => {
    mockSendFarmAddedEmail.mockRejectedValue(new Error('SMTP down'));

    await expect(
      createFarmForFarmer(undefined, { email: 'farmer@example.com', input }, context)
    ).resolves.toBe(createdFarm);
  });
});
