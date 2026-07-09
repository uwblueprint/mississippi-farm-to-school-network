import { FarmStatus } from '@/types';

const mockGetFarmsByProximity = jest.fn();
const mockGetFarmById = jest.fn();
const mockFarmFindByPk = jest.fn();
const mockRequireOwnerOrAdmin = jest.fn();

jest.mock('@/services/implementations/farmService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getFarmsByProximity: mockGetFarmsByProximity,
    getFarmById: mockGetFarmById,
  })),
}));

jest.mock('@/models/farm.model', () => ({
  __esModule: true,
  default: {
    findByPk: (...args: unknown[]) => mockFarmFindByPk(...args),
  },
}));

jest.mock('@/utilities/authHelpers', () => ({
  __esModule: true,
  default: {
    requireOwnerOrAdmin: (...args: unknown[]) => mockRequireOwnerOrAdmin(...args),
  },
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

import farmResolvers from '@/graphql/resolvers/farmResolvers';

const farmsByProximity = farmResolvers.Query.farmsByProximity as (
  parent: unknown,
  args: { lat: number; lng: number; radiusKm: number }
) => Promise<unknown>;

const farmById = farmResolvers.Query.farmById as (
  parent: unknown,
  args: { id: string },
  context: unknown
) => Promise<unknown>;

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

describe('farmResolvers.Query.farmById', () => {
  beforeEach(() => {
    mockGetFarmById.mockReset();
    mockFarmFindByPk.mockReset();
    mockRequireOwnerOrAdmin.mockReset();
  });

  test('throws when the farm does not exist and never checks authorization', async () => {
    mockFarmFindByPk.mockResolvedValue(null);

    await expect(farmById(undefined, { id: 'missing' }, { firebaseUid: 'uid-1' })).rejects.toThrow(
      'Farm with id missing not found.'
    );
    expect(mockRequireOwnerOrAdmin).not.toHaveBeenCalled();
    expect(mockGetFarmById).not.toHaveBeenCalled();
  });

  test('authorizes against the farm owner and returns the farm', async () => {
    const context = { firebaseUid: 'uid-1' };
    const farm = { id: 'farm-1', owner_user_id: 'owner-1', status: FarmStatus.REJECTED };
    mockFarmFindByPk.mockResolvedValue({ owner_user_id: 'owner-1' });
    mockRequireOwnerOrAdmin.mockResolvedValue({ id: 'owner-1' });
    mockGetFarmById.mockResolvedValue(farm);

    const result = await farmById(undefined, { id: 'farm-1' }, context);

    expect(mockRequireOwnerOrAdmin).toHaveBeenCalledWith(context, 'owner-1');
    expect(mockGetFarmById).toHaveBeenCalledWith('farm-1');
    expect(result).toEqual(farm);
  });

  test('propagates authorization errors and does not read the farm', async () => {
    mockFarmFindByPk.mockResolvedValue({ owner_user_id: 'owner-1' });
    mockRequireOwnerOrAdmin.mockRejectedValue(new Error('forbidden'));

    await expect(
      farmById(undefined, { id: 'farm-1' }, { firebaseUid: 'other-uid' })
    ).rejects.toThrow('forbidden');
    expect(mockGetFarmById).not.toHaveBeenCalled();
  });
});
