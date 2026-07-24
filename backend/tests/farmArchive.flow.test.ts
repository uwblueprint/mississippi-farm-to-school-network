/**
 * End-to-end-style unit flow for farm archive behavior.
 * Mirrors the manual GraphQL checklist without needing Apollo sandbox auth.
 *
 * Run: npx jest tests/farmArchive.flow.test.ts
 */
import FarmService from '@/services/implementations/farmService';
import Farm from '@/models/farm.model';
import { FarmStatus, Role } from '@/types';
import type { AuthContext } from '@/middlewares/auth';

jest.mock('@/services/implementations/emailService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn(),
  })),
}));

jest.mock('@/services/implementations/userService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})),
}));

const mockRequireEmailVerified = jest.fn();
const mockRequireOwnerOrAdmin = jest.fn();
const mockRequireRole = jest.fn();

jest.mock('@/utilities/authHelpers', () => ({
  __esModule: true,
  default: {
    requireEmailVerified: mockRequireEmailVerified,
    requireOwnerOrAdmin: mockRequireOwnerOrAdmin,
    requireRole: mockRequireRole,
  },
}));

jest.mock('@/models/farm.model');

const MockFarm = Farm as jest.Mocked<typeof Farm>;

const OWNER_ID = 'owner-uuid-1';
const FARM_ID = 'farm-uuid-1';
const OTHER_FARM_ID = 'farm-uuid-2';

type FarmRow = {
  id: string;
  owner_user_id: string;
  usda_farm_id: number;
  farm_name: string;
  description: string;
  primary_phone: string;
  primary_email: string;
  website: string | null;
  social_media: null;
  farm_address: string;
  counties_served: string[];
  cities_served: string[];
  home_county: string;
  location: { type: string; coordinates: [number, number] };
  food_categories: string[];
  market_sales_data: null;
  bipoc_owned: boolean;
  gap_certified: boolean;
  food_safety_plan: boolean;
  agritourism: boolean;
  sells_at_markets: boolean;
  csa_boxes: boolean;
  online_sales: boolean;
  delivery: boolean;
  f2s_experience: boolean;
  interested_in_f2s: boolean;
  status: FarmStatus;
  is_archived: boolean;
  createdAt: Date;
  updatedAt: Date;
  save: jest.Mock;
  reload: jest.Mock;
  toJSON: () => Record<string, unknown>;
};

const makeFarmInstance = (overrides: Partial<FarmRow> = {}): FarmRow => {
  const row: FarmRow = {
    id: FARM_ID,
    owner_user_id: OWNER_ID,
    usda_farm_id: 1001,
    farm_name: 'Archive Test Farm',
    description: 'A farm used in the archive flow test',
    primary_phone: '555-0100',
    primary_email: 'farm@test.com',
    website: null,
    social_media: null,
    farm_address: '123 Farm Rd',
    counties_served: ['Hinds'],
    cities_served: ['Jackson'],
    home_county: 'Hinds',
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
    status: FarmStatus.APPROVED,
    is_archived: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-01'),
    save: jest.fn().mockResolvedValue(undefined),
    reload: jest.fn().mockResolvedValue(undefined),
    toJSON() {
      const data = { ...this } as Record<string, unknown>;
      delete data.save;
      delete data.reload;
      delete data.toJSON;
      return data;
    },
    ...overrides,
  };
  return row;
};

describe('Farm archive flow (manual checklist)', () => {
  let service: FarmService;
  let targetFarm: FarmRow;
  let otherFarm: FarmRow;
  let farmsStore: FarmRow[];

  beforeEach(() => {
    service = new FarmService();
    targetFarm = makeFarmInstance({ id: FARM_ID, farm_name: 'Archive Test Farm' });
    otherFarm = makeFarmInstance({
      id: OTHER_FARM_ID,
      farm_name: 'Always Active Farm',
      usda_farm_id: 1002,
      is_archived: false,
    });
    farmsStore = [targetFarm, otherFarm];

    MockFarm.findByPk.mockImplementation(async (id: unknown) => {
      return (farmsStore.find((farm) => farm.id === id) ?? null) as any;
    });

    MockFarm.findAll.mockImplementation(async (options?: any) => {
      const where = (options?.where ?? {}) as Record<string, unknown>;
      return farmsStore.filter((farm) => {
        if (where.status !== undefined && farm.status !== where.status) return false;
        if (where.is_archived !== undefined && farm.is_archived !== where.is_archived) {
          return false;
        }
        return true;
      }) as any;
    });

    mockRequireEmailVerified.mockReset();
    mockRequireOwnerOrAdmin.mockReset();
    mockRequireRole.mockReset();
  });

  // ── Step 1: baseline ───────────────────────────────────────────────────────

  test('1. baseline: approved farm starts with is_archived false', async () => {
    const farms = await service.getFarms({ is_archived: false });

    expect(farms.every((farm) => farm.is_archived === false)).toBe(true);
    const target = farms.find((farm) => farm.id === FARM_ID);
    expect(target).toMatchObject({
      id: FARM_ID,
      status: FarmStatus.APPROVED,
      is_archived: false,
    });
  });

  // ── Step 2: archive ────────────────────────────────────────────────────────

  test('2. archiveFarm sets is_archived true and leaves status unchanged', async () => {
    const result = await service.archiveFarm(FARM_ID);

    expect(result).toMatchObject({
      id: FARM_ID,
      status: FarmStatus.APPROVED,
      is_archived: true,
    });
    expect(targetFarm.is_archived).toBe(true);
    expect(targetFarm.status).toBe(FarmStatus.APPROVED);
  });

  // ── Step 3: hidden from listings ───────────────────────────────────────────

  test('3a. public/active list (is_archived=false) hides archived farm', async () => {
    await service.archiveFarm(FARM_ID);

    const active = await service.getFarms({ is_archived: false });

    expect(active.map((farm) => farm.id)).toEqual([OTHER_FARM_ID]);
    expect(active.find((farm) => farm.id === FARM_ID)).toBeUndefined();
  });

  test('3b. proximity search excludes archived farm', async () => {
    await service.archiveFarm(FARM_ID);

    await service.getFarmsByProximity(32.3, -90.18, 100);

    const calls = MockFarm.findAll.mock.calls;
    const call = calls[calls.length - 1][0] as { where: Record<string, unknown> };
    expect(call.where).toMatchObject({
      status: FarmStatus.APPROVED,
      is_archived: false,
    });
  });

  test('3c. admin archived-only filter returns only archived farms', async () => {
    await service.archiveFarm(FARM_ID);

    const archived = await service.getFarms({ is_archived: true });

    expect(archived).toHaveLength(1);
    expect(archived[0]).toMatchObject({ id: FARM_ID, is_archived: true });
  });

  test('3d. admin with no is_archived filter returns archived and active', async () => {
    await service.archiveFarm(FARM_ID);

    const all = await service.getFarms();

    expect(all.map((farm) => farm.id).sort()).toEqual([FARM_ID, OTHER_FARM_ID].sort());
    expect(all.find((farm) => farm.id === FARM_ID)?.is_archived).toBe(true);
    expect(all.find((farm) => farm.id === OTHER_FARM_ID)?.is_archived).toBe(false);
  });

  // ── Step 4: owner edit blocked; admin may edit ─────────────────────────────

  test('4. owner cannot update archived farm; admin can', async () => {
    // Import resolvers after mocks are set up
    const farmResolvers = (await import('@/graphql/resolvers/farmResolvers')).default;
    const updateFarm = farmResolvers.Mutation.updateFarm as (
      parent: undefined,
      args: { id: string; input: Record<string, unknown> },
      context: AuthContext
    ) => Promise<unknown>;

    await service.archiveFarm(FARM_ID);

    mockRequireEmailVerified.mockResolvedValue({ id: OWNER_ID, role: Role.FARMER });
    mockRequireOwnerOrAdmin.mockResolvedValue({ id: OWNER_ID, role: Role.FARMER });
    // owner is not admin
    mockRequireRole.mockRejectedValue(new Error('Forbidden'));

    await expect(
      updateFarm(undefined, { id: FARM_ID, input: { farm_name: 'Nope' } }, {} as AuthContext)
    ).rejects.toThrow(/archived/);

    // admin path
    mockRequireEmailVerified.mockResolvedValue({ id: 'admin-1', role: Role.ADMIN });
    mockRequireOwnerOrAdmin.mockResolvedValue({ id: 'admin-1', role: Role.ADMIN });
    mockRequireRole.mockResolvedValue({ id: 'admin-1', role: Role.ADMIN });

    const adminResult = await updateFarm(
      undefined,
      { id: FARM_ID, input: { farm_name: 'Admin Rename' } },
      {} as AuthContext
    );

    expect(adminResult).toMatchObject({
      id: FARM_ID,
      farm_name: 'Admin Rename',
      is_archived: true,
    });
  });

  // ── Step 5: unarchive ──────────────────────────────────────────────────────

  test('5. unarchiveFarm restores is_archived false and prior status', async () => {
    await service.archiveFarm(FARM_ID);
    expect(targetFarm.is_archived).toBe(true);

    const result = await service.unarchiveFarm(FARM_ID);

    expect(result).toMatchObject({
      id: FARM_ID,
      status: FarmStatus.APPROVED,
      is_archived: false,
    });

    const active = await service.getFarms({ is_archived: false });
    expect(active.map((farm) => farm.id).sort()).toEqual([FARM_ID, OTHER_FARM_ID].sort());
  });
});
