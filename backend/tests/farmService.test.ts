import { Op } from 'sequelize';
import FarmService from '@/services/implementations/farmService';
import EmailService from '@/services/implementations/emailService';
import Farm from '@/models/farm.model';
import { FarmStatus } from '@/types';

const mockSendEmail = jest.spyOn(EmailService.prototype, 'sendEmail').mockResolvedValue(undefined);

// Mock the entire Farm model module
jest.mock('@/models/farm.model');

const MockFarm = Farm as jest.Mocked<typeof Farm>;

// ─── helpers ────────────────────────────────────────────────────────────────

/** Minimal Farm row returned by findAll */
const makeFarmRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'uuid-1',
  owner_user_id: 'owner-1',
  usda_farm_id: 1001,
  farm_name: 'Test Farm',
  description: 'A test farm',
  primary_phone: '555-0100',
  primary_email: 'farm@test.com',
  website: null,
  social_media: null,
  farm_address: '123 Farm Rd',
  counties_served: ['Hinds', 'Madison'],
  cities_served: ['Jackson', 'Ridgeland'],
  location: { type: 'Point', coordinates: [-90.18, 32.3] },
  food_categories: ['Vegetables', 'Fruits'],
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
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-06-01'),
  toJSON() {
    return { ...this };
  },
  ...overrides,
});

// ─── tests ──────────────────────────────────────────────────────────────────

describe('FarmService.getFarms', () => {
  let service: FarmService;

  beforeEach(() => {
    service = new FarmService();
  });

  // ── no filter ──────────────────────────────────────────────────────────────

  test('no filter: returns all farms', async () => {
    const rows = [makeFarmRow(), makeFarmRow({ id: 'uuid-2', farm_name: 'Farm 2' })];
    MockFarm.findAll.mockResolvedValue(rows as any);

    const result = await service.getFarms();

    expect(MockFarm.findAll).toHaveBeenCalledWith({ where: {} });
    expect(result).toHaveLength(2);
  });

  test('filter with all fields undefined: returns all farms', async () => {
    MockFarm.findAll.mockResolvedValue([makeFarmRow()] as any);

    await service.getFarms({});

    expect(MockFarm.findAll).toHaveBeenCalledWith({ where: {} });
  });

  test('no farms in database: returns empty array', async () => {
    MockFarm.findAll.mockResolvedValue([]);

    const result = await service.getFarms();

    expect(result).toEqual([]);
  });

  // ── status filter ──────────────────────────────────────────────────────────

  test('filter by status: passes status to where clause', async () => {
    MockFarm.findAll.mockResolvedValue([makeFarmRow()] as any);

    await service.getFarms({ status: FarmStatus.APPROVED });

    expect(MockFarm.findAll).toHaveBeenCalledWith({
      where: { status: FarmStatus.APPROVED },
    });
  });

  test('filter by status PENDING_APPROVAL', async () => {
    MockFarm.findAll.mockResolvedValue([]);

    await service.getFarms({ status: FarmStatus.PENDING_APPROVAL });

    expect(MockFarm.findAll).toHaveBeenCalledWith({
      where: { status: FarmStatus.PENDING_APPROVAL },
    });
  });

  // ── approved convenience filter ───────────────────────────────────────────

  test('filter approved=true: sets status to APPROVED', async () => {
    MockFarm.findAll.mockResolvedValue([makeFarmRow()] as any);

    await service.getFarms({ approved: true });

    expect(MockFarm.findAll).toHaveBeenCalledWith({
      where: { status: FarmStatus.APPROVED },
    });
  });

  test('filter approved=false: excludes APPROVED farms', async () => {
    MockFarm.findAll.mockResolvedValue([]);

    await service.getFarms({ approved: false });

    expect(MockFarm.findAll).toHaveBeenCalledWith({
      where: { status: { [Op.ne]: FarmStatus.APPROVED } },
    });
  });

  test('status filter takes precedence over approved flag', async () => {
    // When both status and approved provided, status wins
    MockFarm.findAll.mockResolvedValue([]);

    await service.getFarms({ status: FarmStatus.REJECTED, approved: true });

    const call = MockFarm.findAll.mock.calls[0][0] as any;
    expect(call.where.status).toBe(FarmStatus.REJECTED);
  });

  // ── array filters ─────────────────────────────────────────────────────────

  test('filter by counties_served: uses Op.overlap', async () => {
    MockFarm.findAll.mockResolvedValue([makeFarmRow()] as any);

    await service.getFarms({ counties_served: ['Hinds'] });

    expect(MockFarm.findAll).toHaveBeenCalledWith({
      where: { counties_served: { [Op.overlap]: ['Hinds'] } },
    });
  });

  test('filter by cities_served: uses Op.overlap', async () => {
    MockFarm.findAll.mockResolvedValue([makeFarmRow()] as any);

    await service.getFarms({ cities_served: ['Jackson'] });

    expect(MockFarm.findAll).toHaveBeenCalledWith({
      where: { cities_served: { [Op.overlap]: ['Jackson'] } },
    });
  });

  test('filter by food_categories: uses Op.overlap', async () => {
    MockFarm.findAll.mockResolvedValue([makeFarmRow()] as any);

    await service.getFarms({ food_categories: ['Vegetables'] });

    expect(MockFarm.findAll).toHaveBeenCalledWith({
      where: { food_categories: { [Op.overlap]: ['Vegetables'] } },
    });
  });

  test('empty array filter: ignores empty array, returns all farms', async () => {
    MockFarm.findAll.mockResolvedValue([makeFarmRow()] as any);

    await service.getFarms({ counties_served: [], food_categories: [] });

    // Empty arrays should not add where conditions
    expect(MockFarm.findAll).toHaveBeenCalledWith({ where: {} });
  });

  // ── combined filters ──────────────────────────────────────────────────────

  test('combining status + counties_served + food_categories', async () => {
    MockFarm.findAll.mockResolvedValue([makeFarmRow()] as any);

    await service.getFarms({
      status: FarmStatus.APPROVED,
      counties_served: ['Hinds'],
      food_categories: ['Vegetables'],
    });

    expect(MockFarm.findAll).toHaveBeenCalledWith({
      where: {
        status: FarmStatus.APPROVED,
        counties_served: { [Op.overlap]: ['Hinds'] },
        food_categories: { [Op.overlap]: ['Vegetables'] },
      },
    });
  });

  // ── filters matching no farms ─────────────────────────────────────────────

  test('filters matching no farms: returns empty array', async () => {
    MockFarm.findAll.mockResolvedValue([]);

    const result = await service.getFarms({
      counties_served: ['NonExistentCounty'],
    });

    expect(result).toEqual([]);
  });

  // ── DTO shape ─────────────────────────────────────────────────────────────

  test('returned FarmDTO has correct shape and ISO timestamps', async () => {
    const row = makeFarmRow();
    MockFarm.findAll.mockResolvedValue([row] as any);

    const [dto] = await service.getFarms();

    expect(dto).toMatchObject({
      id: 'uuid-1',
      owner_user_id: 'owner-1',
      usda_farm_id: 1001,
      farm_name: 'Test Farm',
      counties_served: ['Hinds', 'Madison'],
      food_categories: ['Vegetables', 'Fruits'],
      status: FarmStatus.APPROVED,
    });
    expect(dto.createdAt).toBe(new Date('2025-01-01').toISOString());
    expect(dto.updatedAt).toBe(new Date('2025-06-01').toISOString());
  });

  // ── error propagation ─────────────────────────────────────────────────────

  test('propagates database errors', async () => {
    MockFarm.findAll.mockRejectedValue(new Error('DB connection failed'));

    await expect(service.getFarms()).rejects.toThrow('DB connection failed');
  });
});

// ─── FarmService.updateFarm ──────────────────────────────────────────────────

describe('FarmService.updateFarm', () => {
  let service: FarmService;

  /** Creates a mock Farm instance (as returned by findByPk) */
  const makeFarmInstance = (overrides: Partial<Record<string, unknown>> = {}) => {
    const data: Record<string, unknown> = {
      id: 'uuid-1',
      owner_user_id: 'owner-1',
      usda_farm_id: 1001,
      farm_name: 'Original Name',
      description: 'Original description',
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
      status: FarmStatus.PENDING_APPROVAL,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-06-01'),
      ...overrides,
    };

    const freshUpdatedAt = new Date('2025-06-02T12:00:00.000Z');

    return {
      ...data,
      save: jest.fn().mockResolvedValue(undefined),
      reload: jest.fn().mockImplementation(function (this: Record<string, unknown>) {
        // Simulate database refreshing updatedAt after save
        this.updatedAt = freshUpdatedAt;
        return Promise.resolve(undefined);
      }),
      toJSON() {
        return { ...this };
      },
    };
  };

  beforeEach(() => {
    service = new FarmService();
    mockSendEmail.mockClear();
  });

  // ── partial update ────────────────────────────────────────────────────────

  test('single field partial update: only that field is changed', async () => {
    const instance = makeFarmInstance();
    MockFarm.findByPk.mockResolvedValue(instance as any);

    const result = await service.updateFarm('uuid-1', { farm_name: 'New Name' });

    expect(instance.save).toHaveBeenCalledTimes(1);
    expect(result.farm_name).toBe('New Name');
    // Other fields unchanged
    expect(result.description).toBe('Original description');
    expect(result.primary_phone).toBe('555-0100');
  });

  test('multiple fields update: all provided fields change', async () => {
    const instance = makeFarmInstance();
    MockFarm.findByPk.mockResolvedValue(instance as any);

    const result = await service.updateFarm('uuid-1', {
      farm_name: 'Updated Farm',
      description: 'New description',
      primary_phone: '555-9999',
    });

    expect(result.farm_name).toBe('Updated Farm');
    expect(result.description).toBe('New description');
    expect(result.primary_phone).toBe('555-9999');
  });

  // ── timestamp verification ────────────────────────────────────────────────

  test('reload() is called after save to get fresh updatedAt', async () => {
    const instance = makeFarmInstance();
    MockFarm.findByPk.mockResolvedValue(instance as any);

    await service.updateFarm('uuid-1', { farm_name: 'New Name' });

    expect(instance.save).toHaveBeenCalledTimes(1);
    expect(instance.reload).toHaveBeenCalledTimes(1);
    // reload must be called AFTER save
    const saveOrder = (instance.save as jest.Mock).mock.invocationCallOrder[0];
    const reloadOrder = (instance.reload as jest.Mock).mock.invocationCallOrder[0];
    expect(reloadOrder).toBeGreaterThan(saveOrder);
  });

  test('returned updatedAt reflects fresh value from database (post-reload)', async () => {
    const instance = makeFarmInstance();
    MockFarm.findByPk.mockResolvedValue(instance as any);

    const result = await service.updateFarm('uuid-1', { farm_name: 'New Name' });

    // Should be the freshUpdatedAt set in reload mock, not the original
    expect(result.updatedAt).toBe(new Date('2025-06-02T12:00:00.000Z').toISOString());
    expect(result.updatedAt).not.toBe(new Date('2025-06-01').toISOString());
  });

  // ── empty input ───────────────────────────────────────────────────────────

  test('empty input object: no data changes, save still called', async () => {
    const instance = makeFarmInstance();
    MockFarm.findByPk.mockResolvedValue(instance as any);

    const result = await service.updateFarm('uuid-1', {});

    expect(instance.save).toHaveBeenCalledTimes(1);
    expect(result.farm_name).toBe('Original Name');
    expect(result.description).toBe('Original description');
  });

  // ── invalid farm id ───────────────────────────────────────────────────────

  test('nonexistent farm id: throws error', async () => {
    MockFarm.findByPk.mockResolvedValue(null);

    await expect(service.updateFarm('nonexistent-id', { farm_name: 'X' })).rejects.toThrow(
      'Farm with id nonexistent-id not found.'
    );
  });

  // ── update then fetch ─────────────────────────────────────────────────────

  test('update a farm then fetch it: DTO matches updated values', async () => {
    const instance = makeFarmInstance();
    MockFarm.findByPk.mockResolvedValue(instance as any);

    const updateInput = {
      farm_name: 'Freshly Updated',
      description: 'New desc',
      bipoc_owned: true,
    };

    const dto = await service.updateFarm('uuid-1', updateInput);

    expect(dto.id).toBe('uuid-1');
    expect(dto.farm_name).toBe('Freshly Updated');
    expect(dto.description).toBe('New desc');
    expect(dto.bipoc_owned).toBe(true);
    expect(dto.updatedAt).toBe(new Date('2025-06-02T12:00:00.000Z').toISOString());
  });

  // ── error propagation ─────────────────────────────────────────────────────

  test('propagates database errors from findByPk', async () => {
    MockFarm.findByPk.mockRejectedValue(new Error('DB error'));

    await expect(service.updateFarm('uuid-1', {})).rejects.toThrow('DB error');
  });

  test('propagates errors from save()', async () => {
    const instance = makeFarmInstance();
    (instance.save as jest.Mock).mockRejectedValue(new Error('Save failed'));
    MockFarm.findByPk.mockResolvedValue(instance as any);

    await expect(service.updateFarm('uuid-1', { farm_name: 'X' })).rejects.toThrow('Save failed');
  });

  test('rejected farm resubmission generates diff and emails admins', async () => {
    const instance = makeFarmInstance({
      status: FarmStatus.REJECTED,
      rejection_reason: 'Missing GAP documentation',
    });
    MockFarm.findByPk.mockResolvedValue(instance as any);

    const result = await service.updateFarm('uuid-1', {
      farm_name: 'Resubmitted Farm Name',
      description: 'Updated farm description',
    });

    expect(result.status).toBe(FarmStatus.PENDING_APPROVAL);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);

    const [to, subject, htmlBody] = mockSendEmail.mock.calls[0];
    expect(to).toBe('mfsn@uwblueprint.org');
    expect(subject).toContain('Farm Resubmitted: Resubmitted Farm Name');
    expect(htmlBody).toContain('Missing GAP documentation');
    expect(htmlBody).toContain('Farm Name');
    expect(htmlBody).toContain('Description');
    expect(htmlBody).toContain('Original Name');
    expect(htmlBody).toContain('Resubmitted Farm Name');
  });

  test('rejected farm update with no actual field change does not email admins', async () => {
    const instance = makeFarmInstance({
      status: FarmStatus.REJECTED,
      rejection_reason: 'Missing GAP documentation',
    });
    MockFarm.findByPk.mockResolvedValue(instance as any);

    const result = await service.updateFarm('uuid-1', {
      farm_name: 'Original Name',
    });

    expect(result.status).toBe(FarmStatus.REJECTED);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
