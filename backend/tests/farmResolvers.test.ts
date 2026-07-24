import { FarmStatus, Role } from '@/types';
import type { AuthContext } from '@/middlewares/auth';

const mockGetFarmsByProximity = jest.fn();
const mockGetLatestActiveRejection = jest.fn();
const mockGetFarms = jest.fn();
const mockArchiveFarm = jest.fn();
const mockUnarchiveFarm = jest.fn();
const mockRequireEmailVerified = jest.fn();
const mockRequireOwnerOrAdmin = jest.fn();
const mockRequireRole = jest.fn();
const mockFindByPk = jest.fn();

jest.mock('@/services/implementations/farmService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getFarmsByProximity: mockGetFarmsByProximity,
    getLatestActiveRejection: mockGetLatestActiveRejection,
    getFarms: mockGetFarms,
    archiveFarm: mockArchiveFarm,
    unarchiveFarm: mockUnarchiveFarm,
  })),
}));

jest.mock('@/services/implementations/userService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@/services/implementations/emailService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn(),
  })),
}));

jest.mock('@/utilities/authHelpers', () => ({
  __esModule: true,
  default: {
    requireEmailVerified: mockRequireEmailVerified,
    requireOwnerOrAdmin: mockRequireOwnerOrAdmin,
    requireRole: mockRequireRole,
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

const farms = farmResolvers.Query.farms as (
  parent: undefined,
  args: { filter?: Record<string, unknown> },
  context: AuthContext
) => Promise<unknown>;

const archiveFarm = farmResolvers.Mutation.archiveFarm as (
  parent: undefined,
  args: { id: string },
  context: AuthContext
) => Promise<unknown>;

const unarchiveFarm = farmResolvers.Mutation.unarchiveFarm as (
  parent: undefined,
  args: { id: string },
  context: AuthContext
) => Promise<unknown>;

const authContext = {} as AuthContext;

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

describe('farmResolvers.Query.farms', () => {
  beforeEach(() => {
    mockGetFarms.mockReset();
    mockRequireRole.mockReset();
    mockGetFarms.mockResolvedValue([]);
  });

  test('non-admin: forces status APPROVED and is_archived false', async () => {
    mockRequireRole.mockRejectedValue(new Error('Forbidden'));

    await farms(undefined, {}, authContext);

    expect(mockGetFarms).toHaveBeenCalledWith({
      status: FarmStatus.APPROVED,
      is_archived: false,
    });
  });

  test('non-admin: cannot view archived farms even if filter requests them', async () => {
    mockRequireRole.mockRejectedValue(new Error('Forbidden'));

    await farms(undefined, { filter: { is_archived: true } }, authContext);

    expect(mockGetFarms).toHaveBeenCalledWith({
      status: FarmStatus.APPROVED,
      is_archived: false,
    });
  });

  test('admin: filter is passed through so archived farms can be listed', async () => {
    mockRequireRole.mockResolvedValue({ id: 'admin-1' });

    await farms(undefined, { filter: { is_archived: true } }, authContext);

    expect(mockGetFarms).toHaveBeenCalledWith({ is_archived: true });
  });

  test('admin: no filter returns all farms (archived and active)', async () => {
    mockRequireRole.mockResolvedValue({ id: 'admin-1' });

    await farms(undefined, {}, authContext);

    expect(mockGetFarms).toHaveBeenCalledWith(undefined);
  });
});

describe('farmResolvers.Mutation.archiveFarm', () => {
  const farmId = 'farm-uuid-1';

  beforeEach(() => {
    mockArchiveFarm.mockReset();
    mockRequireRole.mockReset();
  });

  test('rejects non-admin callers and does not archive', async () => {
    mockRequireRole.mockRejectedValue(new Error('Forbidden'));

    await expect(archiveFarm(undefined, { id: farmId }, authContext)).rejects.toThrow('Forbidden');
    expect(mockArchiveFarm).not.toHaveBeenCalled();
  });

  test('admin archives the farm', async () => {
    mockRequireRole.mockResolvedValue({ id: 'admin-1' });
    mockArchiveFarm.mockResolvedValue({ id: farmId, is_archived: true });

    const result = await archiveFarm(undefined, { id: farmId }, authContext);

    expect(mockRequireRole).toHaveBeenCalledWith(authContext, [Role.ADMIN]);
    expect(mockArchiveFarm).toHaveBeenCalledWith(farmId);
    expect(result).toEqual({ id: farmId, is_archived: true });
  });
});

describe('farmResolvers.Mutation.unarchiveFarm', () => {
  const farmId = 'farm-uuid-1';

  beforeEach(() => {
    mockUnarchiveFarm.mockReset();
    mockRequireRole.mockReset();
  });

  test('rejects non-admin callers and does not unarchive', async () => {
    mockRequireRole.mockRejectedValue(new Error('Forbidden'));

    await expect(unarchiveFarm(undefined, { id: farmId }, authContext)).rejects.toThrow(
      'Forbidden'
    );
    expect(mockUnarchiveFarm).not.toHaveBeenCalled();
  });

  test('admin unarchives the farm', async () => {
    mockRequireRole.mockResolvedValue({ id: 'admin-1' });
    mockUnarchiveFarm.mockResolvedValue({ id: farmId, is_archived: false });

    const result = await unarchiveFarm(undefined, { id: farmId }, authContext);

    expect(mockRequireRole).toHaveBeenCalledWith(authContext, [Role.ADMIN]);
    expect(mockUnarchiveFarm).toHaveBeenCalledWith(farmId);
    expect(result).toEqual({ id: farmId, is_archived: false });
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
