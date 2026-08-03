import { AuthenticationError, ForbiddenError } from 'apollo-server';
import { FarmStatus, Role } from '@/types';
import type { AuthContext } from '@/middlewares/auth';
import type { CreateFarmInput } from '@/types';

const mockGetFarmsByProximity = jest.fn();
const mockGetLatestActiveRejection = jest.fn();
const mockCreateFarm = jest.fn();
const mockRequireEmailVerified = jest.fn();
const mockRequireRole = jest.fn();
const mockRequireOwnerOrAdmin = jest.fn();
const mockFindByPk = jest.fn();
const mockSendEmail = jest.fn();

jest.mock('@/services/implementations/farmService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getFarmsByProximity: mockGetFarmsByProximity,
    getLatestActiveRejection: mockGetLatestActiveRejection,
    createFarm: mockCreateFarm,
  })),
}));

jest.mock('@/services/implementations/userService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@/services/implementations/emailService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    sendEmail: mockSendEmail,
  })),
}));

jest.mock('@/utilities/authHelpers', () => ({
  __esModule: true,
  default: {
    requireEmailVerified: mockRequireEmailVerified,
    requireRole: mockRequireRole,
    requireOwnerOrAdmin: mockRequireOwnerOrAdmin,
  },
}));

jest.mock('@/models/farm.model', () => ({
  __esModule: true,
  default: {
    findByPk: mockFindByPk,
  },
}));

import farmResolvers from '@/graphql/resolvers/farmResolvers';

const farmsByProximity = farmResolvers.Query.farmsByProximity as (
  parent: unknown,
  args: { lat: number; lng: number; radiusKm: number }
) => Promise<unknown>;

const latestActiveFarmRejection = farmResolvers.Query.latestActiveFarmRejection as (
  parent: unknown,
  args: { farmId: string },
  context: AuthContext
) => Promise<unknown>;

const createFarm = farmResolvers.Mutation.createFarm as (
  parent: unknown,
  args: { input: CreateFarmInput },
  context: AuthContext
) => Promise<unknown>;

const authContext = {} as AuthContext;

const minimalCreateFarmInput = {
  usda_farm_id: 'usda-1',
  farm_name: 'Test Farm',
  primary_phone: '6015550100',
  primary_email: 'farmer@example.com',
  farm_address: '123 Farm Rd, Jackson, MS',
  county: 'Hinds',
  location: { lat: 32.3, lng: -90.18 },
  seasonal_products: ['Fruits and Vegetables'],
  meat_products: [],
  other_products: [],
  growing_practices: ['Conventional'],
  food_safety_certifications: ['None of the above'],
} as CreateFarmInput;

describe('farmResolvers.Query.farmsByProximity', () => {
  beforeEach(() => {
    mockGetFarmsByProximity.mockReset();
    mockGetFarmsByProximity.mockResolvedValue([]);
  });

  test('rejects latitude below -90', async () => {
    await expect(farmsByProximity(null, { lat: -91, lng: 0, radiusKm: 10 })).rejects.toThrow(
      'lat must be between -90 and 90'
    );
    expect(mockGetFarmsByProximity).not.toHaveBeenCalled();
  });

  test('rejects latitude above 90', async () => {
    await expect(farmsByProximity(null, { lat: 91, lng: 0, radiusKm: 10 })).rejects.toThrow(
      'lat must be between -90 and 90'
    );
    expect(mockGetFarmsByProximity).not.toHaveBeenCalled();
  });

  test('rejects longitude below -180', async () => {
    await expect(farmsByProximity(null, { lat: 0, lng: -181, radiusKm: 10 })).rejects.toThrow(
      'lng must be between -180 and 180'
    );
    expect(mockGetFarmsByProximity).not.toHaveBeenCalled();
  });

  test('rejects longitude above 180', async () => {
    await expect(farmsByProximity(null, { lat: 0, lng: 181, radiusKm: 10 })).rejects.toThrow(
      'lng must be between -180 and 180'
    );
    expect(mockGetFarmsByProximity).not.toHaveBeenCalled();
  });

  test('rejects non-positive radiusKm', async () => {
    await expect(farmsByProximity(null, { lat: 32.3, lng: -90.18, radiusKm: 0 })).rejects.toThrow(
      'radiusKm must be positive'
    );
    await expect(farmsByProximity(null, { lat: 32.3, lng: -90.18, radiusKm: -5 })).rejects.toThrow(
      'radiusKm must be positive'
    );
    expect(mockGetFarmsByProximity).not.toHaveBeenCalled();
  });

  test('calls farmService.getFarmsByProximity with valid input', async () => {
    const farms = [
      {
        id: 'uuid-1',
        farm_name: 'Nearby Farm',
        status: FarmStatus.APPROVED,
      },
    ];
    mockGetFarmsByProximity.mockResolvedValue(farms);

    const result = await farmsByProximity(null, { lat: 32.3, lng: -90.18, radiusKm: 25 });

    expect(mockGetFarmsByProximity).toHaveBeenCalledWith(32.3, -90.18, 25);
    expect(result).toEqual(farms);
  });

  test('returns an empty array when no farms match', async () => {
    mockGetFarmsByProximity.mockResolvedValue([]);

    const result = await farmsByProximity(null, { lat: 32.3, lng: -90.18, radiusKm: 10 });

    expect(result).toEqual([]);
  });
});

describe('farmResolvers.Query.latestActiveFarmRejection', () => {
  const farmId = 'farm-uuid-1';
  const ownerUserId = 'owner-uuid-1';

  beforeEach(() => {
    mockGetLatestActiveRejection.mockReset();
    mockRequireEmailVerified.mockReset();
    mockRequireOwnerOrAdmin.mockReset();
    mockFindByPk.mockReset();

    mockRequireEmailVerified.mockResolvedValue({ id: ownerUserId });
    mockRequireOwnerOrAdmin.mockResolvedValue({ id: ownerUserId });
    mockFindByPk.mockResolvedValue({ id: farmId, owner_user_id: ownerUserId });
    mockGetLatestActiveRejection.mockResolvedValue(null);
  });

  test('throws when the farm does not exist', async () => {
    mockFindByPk.mockResolvedValue(null);

    await expect(latestActiveFarmRejection(null, { farmId }, authContext)).rejects.toThrow(
      `Farm with id ${farmId} not found.`
    );
    expect(mockRequireOwnerOrAdmin).not.toHaveBeenCalled();
    expect(mockGetLatestActiveRejection).not.toHaveBeenCalled();
  });

  test('propagates auth error and does not look up the farm', async () => {
    mockRequireEmailVerified.mockRejectedValue(new Error('You must verify your email'));

    await expect(latestActiveFarmRejection(null, { farmId }, authContext)).rejects.toThrow(
      'You must verify your email'
    );
    expect(mockFindByPk).not.toHaveBeenCalled();
    expect(mockGetLatestActiveRejection).not.toHaveBeenCalled();
  });

  test('enforces owner-or-admin access against the farm owner', async () => {
    mockRequireOwnerOrAdmin.mockRejectedValue(new Error('You do not have permission'));

    await expect(latestActiveFarmRejection(null, { farmId }, authContext)).rejects.toThrow(
      'You do not have permission'
    );
    expect(mockRequireOwnerOrAdmin).toHaveBeenCalledWith(authContext, ownerUserId);
    expect(mockGetLatestActiveRejection).not.toHaveBeenCalled();
  });

  test('returns null when the farm has no active rejection', async () => {
    mockGetLatestActiveRejection.mockResolvedValue(null);

    const result = await latestActiveFarmRejection(null, { farmId }, authContext);

    expect(result).toBeNull();
    expect(mockGetLatestActiveRejection).toHaveBeenCalledWith(farmId);
  });

  test('returns the latest active rejection when one exists', async () => {
    const rejection = {
      id: 'rejection-uuid-1',
      farm_id: farmId,
      rejection_reason: 'Missing food safety plan',
      created_at: '2026-06-01T00:00:00.000Z',
    };
    mockGetLatestActiveRejection.mockResolvedValue(rejection);

    const result = await latestActiveFarmRejection(null, { farmId }, authContext);

    expect(result).toEqual(rejection);
    expect(mockGetLatestActiveRejection).toHaveBeenCalledWith(farmId);
  });
});

describe('farmResolvers.Mutation.createFarm', () => {
  const verifiedFarmer = {
    id: 'farmer-user-1',
    email: 'farmer@example.com',
    role: Role.FARMER,
    is_verified: true,
  };

  beforeEach(() => {
    mockCreateFarm.mockReset();
    mockRequireRole.mockReset();
    mockSendEmail.mockReset();
    mockRequireRole.mockResolvedValue(verifiedFarmer);
    mockSendEmail.mockResolvedValue(undefined);
    process.env.MAILER_USER = 'admin@example.com';
  });

  test('fails clearly when the request is unauthenticated', async () => {
    mockRequireRole.mockRejectedValue(
      new AuthenticationError('You must be logged in to access this resource.')
    );

    await expect(
      createFarm(null, { input: minimalCreateFarmInput }, authContext)
    ).rejects.toBeInstanceOf(AuthenticationError);
    await expect(createFarm(null, { input: minimalCreateFarmInput }, authContext)).rejects.toThrow(
      'You must be logged in to access this resource.'
    );

    expect(mockCreateFarm).not.toHaveBeenCalled();
  });

  test('fails clearly when the email is not verified', async () => {
    mockRequireRole.mockRejectedValue(
      new AuthenticationError('You must verify your email to access this resource.')
    );

    await expect(
      createFarm(null, { input: minimalCreateFarmInput }, authContext)
    ).rejects.toBeInstanceOf(AuthenticationError);
    await expect(createFarm(null, { input: minimalCreateFarmInput }, authContext)).rejects.toThrow(
      'You must verify your email to access this resource.'
    );

    expect(mockCreateFarm).not.toHaveBeenCalled();
  });

  test('fails clearly when the user is not a FARMER', async () => {
    mockRequireRole.mockRejectedValue(
      new ForbiddenError('You do not have permission to access this resource.')
    );

    await expect(
      createFarm(null, { input: minimalCreateFarmInput }, authContext)
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(createFarm(null, { input: minimalCreateFarmInput }, authContext)).rejects.toThrow(
      'You do not have permission to access this resource.'
    );

    expect(mockRequireRole).toHaveBeenCalledWith(authContext, [Role.FARMER]);
    expect(mockCreateFarm).not.toHaveBeenCalled();
  });

  test('creates the farm for a verified farmer', async () => {
    const created = {
      id: 'farm-1',
      farm_name: minimalCreateFarmInput.farm_name,
      status: FarmStatus.PENDING_APPROVAL,
      owner_user_id: verifiedFarmer.id,
    };
    mockCreateFarm.mockResolvedValue(created);

    const result = await createFarm(null, { input: minimalCreateFarmInput }, authContext);

    expect(mockRequireRole).toHaveBeenCalledWith(authContext, [Role.FARMER]);
    expect(mockCreateFarm).toHaveBeenCalledWith(verifiedFarmer.id, minimalCreateFarmInput);
    expect(result).toEqual(created);
  });
});
