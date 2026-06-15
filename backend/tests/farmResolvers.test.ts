import { FarmStatus } from '@/types';

const mockGetFarmsByProximity = jest.fn();

jest.mock('@/services/implementations/farmService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getFarmsByProximity: mockGetFarmsByProximity,
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

import farmResolvers from '@/graphql/resolvers/farmResolvers';

const farmsByProximity = farmResolvers.Query.farmsByProximity as (
  parent: unknown,
  args: { lat: number; lng: number; radiusKm: number }
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
