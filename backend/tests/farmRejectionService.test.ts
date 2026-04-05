import Farm from '@/models/farm.model';
import FarmRejection from '@/models/farm_rejection.model';
import FarmService from '@/services/implementations/farmService';

jest.mock('@/models/farm.model');
jest.mock('@/models/farm_rejection.model');

const MockFarm = Farm as jest.Mocked<typeof Farm>;
const MockFarmRejection = FarmRejection as jest.Mocked<typeof FarmRejection>;

const makeFarmRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'farm-1',
  owner_user_id: 'owner-1',
  usda_farm_id: 1001,
  farm_name: 'Test Farm',
  description: 'A test farm',
  primary_phone: '555-0100',
  primary_email: 'farm@test.com',
  website: null,
  social_media: null,
  farm_address: '123 Farm Rd',
  counties_served: ['Hinds'],
  cities_served: ['Jackson'],
  location: { type: 'Point', coordinates: [-90.18, 32.3] },
  food_categories: ['Vegetables'],
  market_sales_data: null,
  bipoc_owned: false,
  gap_certified: false,
  food_safety_plan: false,
  agritourism: false,
  sells_at_markets: false,
  csa_boxes: false,
  online_sales: false,
  delivery: false,
  f2s_experience: false,
  interested_in_f2s: false,
  status: 'REJECTED',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  toJSON() {
    return { ...this };
  },
  ...overrides,
});

const makeRejectionRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'rej-1',
  farm_id: 'farm-1',
  rejected_by_user_id: 'admin-1',
  rejection_reason: 'Missing required fields',
  farm_snapshot: {
    id: 'farm-1',
    owner_user_id: 'owner-1',
    usda_farm_id: 1001,
    farm_name: 'Test Farm',
    description: 'A test farm',
    primary_phone: '555-0100',
    primary_email: 'farm@test.com',
    website: null,
    social_media: null,
    farm_address: '123 Farm Rd',
    counties_served: ['Hinds'],
    cities_served: ['Jackson'],
    location: { type: 'Point', coordinates: [-90.18, 32.3] },
    food_categories: ['Vegetables'],
    market_sales_data: null,
    bipoc_owned: false,
    gap_certified: false,
    food_safety_plan: false,
    agritourism: false,
    sells_at_markets: false,
    csa_boxes: false,
    online_sales: false,
    delivery: false,
    f2s_experience: false,
    interested_in_f2s: false,
    status: 'REJECTED',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
  farm_snapshot_updated_at: new Date('2026-01-02T00:00:00.000Z'),
  created_at: new Date('2026-01-03T00:00:00.000Z'),
  resolved_at: null,
  resolution_type: null,
  toJSON() {
    return { ...this };
  },
  ...overrides,
});

describe('FarmService farm rejection helpers', () => {
  let service: FarmService;

  beforeEach(() => {
    service = new FarmService();
    jest.clearAllMocks();
  });

  test('inserting a rejection stores snapshot payload and reason successfully', async () => {
    MockFarm.findByPk.mockResolvedValue(makeFarmRow() as never);
    MockFarmRejection.create.mockResolvedValue(makeRejectionRow() as never);

    const result = await service.createFarmRejection(
      'farm-1',
      'admin-1',
      'Missing required fields'
    );

    expect(MockFarmRejection.create).toHaveBeenCalledWith(
      expect.objectContaining({
        farm_id: 'farm-1',
        rejected_by_user_id: 'admin-1',
        rejection_reason: 'Missing required fields',
        farm_snapshot: expect.objectContaining({
          id: 'farm-1',
          location: { type: 'Point', coordinates: [-90.18, 32.3] },
        }),
      })
    );
    expect(result.rejection_reason).toBe('Missing required fields');
    expect(result.farm_snapshot.location).toEqual({ type: 'Point', coordinates: [-90.18, 32.3] });
  });

  test('rejecting same farm multiple times creates multiple historical rows', async () => {
    MockFarm.findByPk.mockResolvedValue(makeFarmRow() as never);
    MockFarmRejection.create
      .mockResolvedValueOnce(makeRejectionRow({ id: 'rej-1' }) as never)
      .mockResolvedValueOnce(makeRejectionRow({ id: 'rej-2' }) as never);

    const first = await service.createFarmRejection('farm-1', 'admin-1', 'First reason');
    const second = await service.createFarmRejection('farm-1', 'admin-1', 'Second reason');

    expect(MockFarmRejection.create).toHaveBeenCalledTimes(2);
    expect(first.id).toBe('rej-1');
    expect(second.id).toBe('rej-2');
  });

  test('querying latest rejection by farm returns most recent event', async () => {
    MockFarmRejection.findOne.mockResolvedValue(
      makeRejectionRow({
        id: 'latest-rej',
        created_at: new Date('2026-02-01T00:00:00.000Z'),
      }) as never
    );

    const result = await service.getLatestFarmRejectionByFarmId('farm-1');

    expect(MockFarmRejection.findOne).toHaveBeenCalledWith({
      where: { farm_id: 'farm-1' },
      order: [['created_at', 'DESC']],
    });
    expect(result?.id).toBe('latest-rej');
  });

  test('empty result when farm has no rejections', async () => {
    MockFarmRejection.findOne.mockResolvedValue(null);

    const result = await service.getLatestFarmRejectionByFarmId('farm-without-rejections');

    expect(result).toBeNull();
  });
});
