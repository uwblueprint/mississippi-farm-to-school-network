import { AuthenticationError, ForbiddenError } from 'apollo-server';
import { FarmStatus, Role } from '@/types';
import type { AuthContext } from '@/middlewares/auth';
import type { CreateFarmInput } from '@/types';

const mockGetFarmsByProximity = jest.fn();
const mockGetLatestActiveRejection = jest.fn();
const mockGetLatestFarmRejectionByFarmId = jest.fn();
const mockCreateFarm = jest.fn();
const mockGetFarms = jest.fn();
const mockArchiveFarm = jest.fn();
const mockUnarchiveFarm = jest.fn();
const mockUpdateFarm = jest.fn();
const mockResubmitFarm = jest.fn();
const mockGetFarmById = jest.fn();
const mockGetFarmsByOwner = jest.fn();
const mockRequestFarmDeletion = jest.fn();
const mockApproveFarmDeletion = jest.fn();
const mockDenyFarmDeletion = jest.fn();
const mockRequireAuth = jest.fn();
const mockRequireEmailVerified = jest.fn();
const mockRequireRole = jest.fn();
const mockRequireOwnerOrAdmin = jest.fn();
const mockSendEmail = jest.fn();
const mockGetUserByFirebaseUid = jest.fn();

jest.mock('@/services/implementations/farmService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getFarmsByProximity: mockGetFarmsByProximity,
    getLatestActiveRejection: mockGetLatestActiveRejection,
    getLatestFarmRejectionByFarmId: mockGetLatestFarmRejectionByFarmId,
    createFarm: mockCreateFarm,
    getFarms: mockGetFarms,
    archiveFarm: mockArchiveFarm,
    unarchiveFarm: mockUnarchiveFarm,
    updateFarm: mockUpdateFarm,
    resubmitFarm: mockResubmitFarm,
    getFarmById: mockGetFarmById,
    getFarmsByOwner: mockGetFarmsByOwner,
    requestFarmDeletion: mockRequestFarmDeletion,
    approveFarmDeletion: mockApproveFarmDeletion,
    denyFarmDeletion: mockDenyFarmDeletion,
  })),
}));

jest.mock('@/services/implementations/userService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getUserByFirebaseUid: mockGetUserByFirebaseUid,
  })),
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
    requireAuth: mockRequireAuth,
    requireEmailVerified: mockRequireEmailVerified,
    requireRole: mockRequireRole,
    requireOwnerOrAdmin: mockRequireOwnerOrAdmin,
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

const latestFarmRejection = farmResolvers.Query.latestFarmRejection as (
  parent: unknown,
  args: { farmId: string },
  context: AuthContext
) => Promise<unknown>;

const createFarm = farmResolvers.Mutation.createFarm as (
  parent: unknown,
  args: { input: CreateFarmInput },
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

const updateFarm = farmResolvers.Mutation.updateFarm as (
  parent: undefined,
  args: { id: string; input: Record<string, unknown> },
  context: AuthContext
) => Promise<unknown>;

const resubmitFarm = farmResolvers.Mutation.resubmitFarm as (
  parent: undefined,
  args: { id: string; input: Record<string, unknown> },
  context: AuthContext
) => Promise<unknown>;

const owner = farmResolvers.FarmDTO.owner as (
  farm: { id: string; owner_user_id: string },
  args: unknown,
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

describe('farmResolvers.Query.farms', () => {
  beforeEach(() => {
    mockGetFarms.mockReset();
    mockRequireRole.mockReset();
    mockGetFarms.mockResolvedValue([]);
  });

  test('non-admin: forces status APPROVED and is_archived false', async () => {
    mockRequireRole.mockRejectedValue(new Error('Forbidden'));

    await farms(undefined, {}, authContext);

    expect(mockGetFarms).toHaveBeenCalledWith(1, 50, {
      status: FarmStatus.APPROVED,
      is_archived: false,
    });
  });

  test('non-admin: cannot view archived farms even if filter requests them', async () => {
    mockRequireRole.mockRejectedValue(new Error('Forbidden'));

    await farms(undefined, { filter: { is_archived: true } }, authContext);

    expect(mockGetFarms).toHaveBeenCalledWith(1, 50, {
      status: FarmStatus.APPROVED,
      is_archived: false,
    });
  });

  test('admin: filter is passed through so archived farms can be listed', async () => {
    mockRequireRole.mockResolvedValue({ id: 'admin-1' });

    await farms(undefined, { filter: { is_archived: true } }, authContext);

    expect(mockGetFarms).toHaveBeenCalledWith(1, 50, { is_archived: true });
  });

  test('admin: no filter returns all farms (archived and active)', async () => {
    mockRequireRole.mockResolvedValue({ id: 'admin-1' });

    await farms(undefined, {}, authContext);

    expect(mockGetFarms).toHaveBeenCalledWith(1, 50, undefined);
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

// The archived-farm guard itself now lives in farmService.updateFarm/resubmitFarm
// (see farmService.test.ts), reading the same doc it writes so it can't race a
// concurrent archiveFarm call. These resolver tests just verify the resolver
// derives `isAdmin` from the caller's role and passes it through, instead of
// doing its own (previously stale) is_archived check against a separate read.
describe('farmResolvers.Mutation.updateFarm', () => {
  const farmId = 'farm-uuid-1';
  const ownerUserId = 'owner-uuid-1';

  beforeEach(() => {
    mockUpdateFarm.mockReset();
    mockRequireEmailVerified.mockReset();
    mockRequireOwnerOrAdmin.mockReset();
    mockRequireRole.mockReset();
    mockGetFarmById.mockReset();

    mockRequireOwnerOrAdmin.mockResolvedValue({ id: ownerUserId });
    mockUpdateFarm.mockResolvedValue({ id: farmId });
    mockGetFarmById.mockResolvedValue({
      id: farmId,
      owner_user_id: ownerUserId,
      is_archived: false,
    });
  });

  test('passes isAdmin=false for a non-admin caller', async () => {
    mockRequireEmailVerified.mockResolvedValue({ id: ownerUserId, role: Role.FARMER });

    await updateFarm(undefined, { id: farmId, input: { farm_name: 'X' } }, authContext);

    expect(mockRequireRole).not.toHaveBeenCalled();
    expect(mockUpdateFarm).toHaveBeenCalledWith(farmId, { farm_name: 'X' }, false);
  });

  test('passes isAdmin=true for an admin caller', async () => {
    mockRequireEmailVerified.mockResolvedValue({ id: 'admin-1', role: Role.ADMIN });
    mockRequireOwnerOrAdmin.mockResolvedValue({ id: 'admin-1' });

    await updateFarm(undefined, { id: farmId, input: { farm_name: 'X' } }, authContext);

    expect(mockUpdateFarm).toHaveBeenCalledWith(farmId, { farm_name: 'X' }, true);
  });
});

describe('farmResolvers.Mutation.resubmitFarm', () => {
  const farmId = 'farm-uuid-1';
  const ownerUserId = 'owner-uuid-1';

  beforeEach(() => {
    mockResubmitFarm.mockReset();
    mockRequireEmailVerified.mockReset();
    mockRequireOwnerOrAdmin.mockReset();
    mockRequireRole.mockReset();
    mockGetFarmById.mockReset();

    mockRequireOwnerOrAdmin.mockResolvedValue({ id: ownerUserId });
    mockResubmitFarm.mockResolvedValue({ id: farmId });
    mockGetFarmById.mockResolvedValue({
      id: farmId,
      owner_user_id: ownerUserId,
      is_archived: false,
    });
  });

  test('passes isAdmin=false for a non-admin caller', async () => {
    mockRequireEmailVerified.mockResolvedValue({ id: ownerUserId, role: Role.FARMER });

    await resubmitFarm(undefined, { id: farmId, input: { farm_name: 'X' } }, authContext);

    expect(mockRequireRole).not.toHaveBeenCalled();
    expect(mockResubmitFarm).toHaveBeenCalledWith(farmId, ownerUserId, { farm_name: 'X' }, false);
  });

  test('passes isAdmin=true for an admin caller', async () => {
    mockRequireEmailVerified.mockResolvedValue({ id: 'admin-1', role: Role.ADMIN });
    mockRequireOwnerOrAdmin.mockResolvedValue({ id: 'admin-1' });

    await resubmitFarm(undefined, { id: farmId, input: { farm_name: 'X' } }, authContext);

    expect(mockResubmitFarm).toHaveBeenCalledWith(farmId, 'admin-1', { farm_name: 'X' }, true);
  });
});

describe('farmResolvers.Query.latestActiveFarmRejection', () => {
  const farmId = 'farm-uuid-1';
  const ownerUserId = 'owner-uuid-1';

  beforeEach(() => {
    mockGetLatestActiveRejection.mockReset();
    mockRequireEmailVerified.mockReset();
    mockRequireOwnerOrAdmin.mockReset();
    mockGetFarmById.mockReset();

    mockRequireEmailVerified.mockResolvedValue({ id: ownerUserId });
    mockRequireOwnerOrAdmin.mockResolvedValue({ id: ownerUserId });
    mockGetFarmById.mockResolvedValue({ id: farmId, owner_user_id: ownerUserId });
    mockGetLatestActiveRejection.mockResolvedValue(null);
  });

  test('throws when the farm does not exist', async () => {
    mockGetFarmById.mockRejectedValue(new Error(`Farm with id ${farmId} not found.`));

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
    expect(mockGetFarmById).not.toHaveBeenCalled();
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

describe('farmResolvers.Query.latestFarmRejection', () => {
  const farmId = 'farm-uuid-1';

  beforeEach(() => {
    mockGetLatestFarmRejectionByFarmId.mockReset();
    mockRequireRole.mockReset();
    mockRequireRole.mockResolvedValue({ id: 'admin-1', role: Role.ADMIN });
  });

  test('is admin only', async () => {
    mockRequireRole.mockRejectedValue(new ForbiddenError('You do not have permission'));

    await expect(latestFarmRejection(null, { farmId }, authContext)).rejects.toThrow(
      'You do not have permission'
    );
    expect(mockRequireRole).toHaveBeenCalledWith(authContext, [Role.ADMIN]);
    expect(mockGetLatestFarmRejectionByFarmId).not.toHaveBeenCalled();
  });

  test('returns null when the farm was never rejected', async () => {
    mockGetLatestFarmRejectionByFarmId.mockResolvedValue(null);

    await expect(latestFarmRejection(null, { farmId }, authContext)).resolves.toBeNull();
  });

  test('returns a resolved rejection (e.g. after resubmission) without the farm snapshot', async () => {
    mockGetLatestFarmRejectionByFarmId.mockResolvedValue({
      id: 'rejection-uuid-1',
      farm_id: farmId,
      rejected_by_user_id: 'admin-1',
      rejection_reason: 'Inaccurate information - Phone number is wrong',
      farm_snapshot: { farm_name: 'Old Name' },
      farm_snapshot_updated_at: '2026-06-01T00:00:00.000Z',
      created_at: '2026-06-01T00:00:00.000Z',
      resolved_at: '2026-06-03T00:00:00.000Z',
      resolution_type: 'RESUBMITTED',
    });

    await expect(latestFarmRejection(null, { farmId }, authContext)).resolves.toEqual({
      id: 'rejection-uuid-1',
      farm_id: farmId,
      rejection_reason: 'Inaccurate information - Phone number is wrong',
      created_at: '2026-06-01T00:00:00.000Z',
    });
    expect(mockGetLatestFarmRejectionByFarmId).toHaveBeenCalledWith(farmId);
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

describe('farmResolvers.FarmDTO.owner', () => {
  const farm = { id: 'farm-1', owner_user_id: 'owner-uuid-1' };

  beforeEach(() => {
    mockRequireRole.mockReset();
    mockGetUserByFirebaseUid.mockReset();
  });

  test('returns null for a non-admin caller without looking up the owner', async () => {
    mockRequireRole.mockRejectedValue(new ForbiddenError('nope'));

    await expect(owner(farm, {}, authContext)).resolves.toBeNull();
    expect(mockGetUserByFirebaseUid).not.toHaveBeenCalled();
  });

  test('returns the owner for an admin caller', async () => {
    mockRequireRole.mockResolvedValue({ id: 'admin-1', role: Role.ADMIN });
    const ownerUser = { id: 'owner-uuid-1', email: 'owner@example.com' };
    mockGetUserByFirebaseUid.mockResolvedValue(ownerUser);

    await expect(owner(farm, {}, authContext)).resolves.toEqual(ownerUser);
  });

  test('returns null (not a thrown error) when the owner has no Firestore profile', async () => {
    // A single farm with a missing owner profile shouldn't break the whole farms
    // list — the frontend client here treats any GraphQL error as a hard failure
    // of the entire request, not just this field.
    mockRequireRole.mockResolvedValue({ id: 'admin-1', role: Role.ADMIN });
    mockGetUserByFirebaseUid.mockRejectedValue(new Error('User not found.'));

    await expect(owner(farm, {}, authContext)).resolves.toBeNull();
  });
});

describe('farm deletion requests', () => {
  const farmId = 'farm-uuid-1';
  const ownerUserId = 'owner-1';
  const callResolver = (
    resolver: unknown,
    args: Record<string, unknown> = {}
  ): Promise<unknown> =>
    (resolver as (p: unknown, a: unknown, c: AuthContext) => Promise<unknown>)(
      undefined,
      args,
      authContext
    );

  beforeEach(() => {
    [
      mockGetFarmById,
      mockGetFarmsByOwner,
      mockRequestFarmDeletion,
      mockApproveFarmDeletion,
      mockDenyFarmDeletion,
      mockRequireAuth,
      mockRequireEmailVerified,
      mockRequireOwnerOrAdmin,
      mockRequireRole,
      mockSendEmail,
    ].forEach((mock) => mock.mockReset());
  });

  test('owner requests deletion and admins are emailed once', async () => {
    mockRequireEmailVerified.mockResolvedValue({ id: ownerUserId, role: Role.FARMER });
    mockGetFarmById.mockResolvedValue({
      id: farmId,
      owner_user_id: ownerUserId,
      farm_name: 'Two Brooks',
      deletion_requested_at: null,
    });
    mockRequireOwnerOrAdmin.mockResolvedValue({ id: ownerUserId });
    mockRequestFarmDeletion.mockResolvedValue({ id: farmId, deletion_requested_at: 'now' });

    const result = await callResolver(farmResolvers.Mutation.requestFarmDeletion, { id: farmId });

    expect(mockRequireOwnerOrAdmin).toHaveBeenCalledWith(authContext, ownerUserId);
    expect(mockRequestFarmDeletion).toHaveBeenCalledWith(farmId);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: farmId, deletion_requested_at: 'now' });
  });

  test('a non-owner cannot request deletion', async () => {
    mockRequireEmailVerified.mockResolvedValue({ id: 'someone-else', role: Role.FARMER });
    mockGetFarmById.mockResolvedValue({ id: farmId, owner_user_id: ownerUserId });
    mockRequireOwnerOrAdmin.mockRejectedValue(new ForbiddenError('Forbidden'));

    await expect(
      callResolver(farmResolvers.Mutation.requestFarmDeletion, { id: farmId })
    ).rejects.toThrow('Forbidden');
    expect(mockRequestFarmDeletion).not.toHaveBeenCalled();
  });

  test.each([
    ['approveFarmDeletion', mockApproveFarmDeletion],
    ['denyFarmDeletion', mockDenyFarmDeletion],
  ] as const)('%s is admin only', async (name, serviceMock) => {
    mockRequireRole.mockRejectedValue(new ForbiddenError('Forbidden'));
    await expect(callResolver(farmResolvers.Mutation[name], { id: farmId })).rejects.toThrow(
      'Forbidden'
    );
    expect(serviceMock).not.toHaveBeenCalled();

    mockRequireRole.mockResolvedValue({ id: 'admin-1' });
    serviceMock.mockResolvedValue({ id: farmId });
    await callResolver(farmResolvers.Mutation[name], { id: farmId });
    expect(mockRequireRole).toHaveBeenCalledWith(authContext, [Role.ADMIN]);
    expect(serviceMock).toHaveBeenCalledWith(farmId);
  });

  test('myFarms hides archived farms; myApprovedFarmDeletions returns approved deletions', async () => {
    mockRequireAuth.mockResolvedValue({ id: ownerUserId });
    mockGetFarmsByOwner.mockResolvedValue([
      { id: 'active', is_archived: false, deletion_approved_at: null },
      { id: 'deleted', is_archived: true, deletion_approved_at: '2026-10-14T00:00:00.000Z' },
      { id: 'admin-archived', is_archived: true, deletion_approved_at: null },
    ]);

    const mine = (await callResolver(farmResolvers.Query.myFarms)) as { id: string }[];
    const approved = (await callResolver(farmResolvers.Query.myApprovedFarmDeletions)) as {
      id: string;
    }[];

    expect(mine.map((farm) => farm.id)).toEqual(['active']);
    expect(approved.map((farm) => farm.id)).toEqual(['deleted']);
  });
});
