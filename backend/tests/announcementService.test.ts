import Announcement from '@/models/announcement.model';
import AnnouncementService from '@/services/implementations/announcementService';
import { Op } from 'sequelize';

jest.mock('@/models/announcement.model');

const MockAnnouncement = Announcement as jest.Mocked<typeof Announcement>;

// ─── helpers ────────────────────────────────────────────────────────────────

const offsetDate = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const TODAY = offsetDate(0);
const YESTERDAY = offsetDate(-1);
const TOMORROW = offsetDate(1);
const NEXT_WEEK = offsetDate(7);

/** Builds a fake Announcement instance (as returned by findByPk / create) */
const makeAnnouncementInstance = (overrides: Partial<Record<string, unknown>> = {}) => {
  const data: Record<string, unknown> = {
    id: 'announcement-1',
    message: 'Test announcement',
    start_date: new Date(`${TODAY}T00:00:00.000-06:00`),
    end_date: new Date(`${NEXT_WEEK}T23:59:59.999-06:00`),
    created_by: 'user-1',
    deleted_at: null,
    createdAt: new Date(TODAY),
    updatedAt: new Date(TODAY),
    ...overrides,
  };

  return {
    ...data,
    update: jest.fn().mockImplementation(async function (
      this: Record<string, unknown>,
      values: Record<string, unknown>
    ) {
      Object.assign(this, values);
      return this;
    }),
  };
};

// ─── AnnouncementService.createAnnouncement ──────────────────────────────────

describe('AnnouncementService.createAnnouncement', () => {
  let service: AnnouncementService;

  beforeEach(() => {
    service = new AnnouncementService();
    MockAnnouncement.findAll.mockReset();
    MockAnnouncement.create.mockReset();
  });

  test('past start_date throws an error', async () => {
    await expect(
      service.createAnnouncement('user-1', { message: 'Hello', start_date: YESTERDAY })
    ).rejects.toThrow('Start date cannot be in the past');
  });

  test('end_date before start_date throws an error', async () => {
    await expect(
      service.createAnnouncement('user-1', {
        message: 'Hello',
        start_date: NEXT_WEEK,
        end_date: TOMORROW,
      })
    ).rejects.toThrow('Start date cannot be after end date');
  });

  test("today's start_date succeeds", async () => {
    MockAnnouncement.findAll.mockResolvedValue([]);
    const instance = makeAnnouncementInstance({
      start_date: new Date(`${TODAY}T00:00:00.000-06:00`),
      end_date: null,
    });
    MockAnnouncement.create.mockResolvedValue(instance as any);

    const result = await service.createAnnouncement('user-1', {
      message: 'Hello',
      start_date: TODAY,
    });

    expect(result.announcement.message).toBe('Test announcement');
    expect(result.overlappingAnnouncements).toEqual([]);
  });

  test('1 day announcement', async () => {
    MockAnnouncement.findAll.mockResolvedValue([]);
    const instance = makeAnnouncementInstance({
      start_date: new Date(`${TODAY}T00:00:00.000-06:00`),
      end_date: null,
    });
    MockAnnouncement.create.mockResolvedValue(instance as any);

    const result = await service.createAnnouncement('user-1', {
      message: 'Hello',
      start_date: TODAY,
      end_date: TODAY,
    });

    expect(result.announcement.message).toBe('Test announcement');
    expect(result.overlappingAnnouncements).toEqual([]);
  });

  test('returns overlapping announcements alongside the created announcement', async () => {
    const overlapping = makeAnnouncementInstance({ id: 'announcement-2', message: 'Overlapping' });
    MockAnnouncement.findAll.mockResolvedValue([overlapping] as any);
    const created = makeAnnouncementInstance();
    MockAnnouncement.create.mockResolvedValue(created as any);

    const result = await service.createAnnouncement('user-1', {
      message: 'Hello',
      start_date: TODAY,
      end_date: NEXT_WEEK,
    });

    expect(result.overlappingAnnouncements).toHaveLength(1);
    expect(result.overlappingAnnouncements[0].id).toBe('announcement-2');
  });
});

// ─── AnnouncementService.updateAnnouncement ──────────────────────────────────

describe('AnnouncementService.updateAnnouncement', () => {
  let service: AnnouncementService;

  beforeEach(() => {
    service = new AnnouncementService();
    MockAnnouncement.findByPk.mockReset();
    MockAnnouncement.findAll.mockReset();
  });

  test('updating a past (expired) announcement throws an error', async () => {
    const pastAnnouncement = makeAnnouncementInstance({
      end_date: new Date('2025-06-01T23:59:59.999-06:00'),
    });
    MockAnnouncement.findByPk.mockResolvedValue(pastAnnouncement as any);
    MockAnnouncement.findAll.mockResolvedValue([]);

    await expect(
      service.updateAnnouncement('announcement-id', { message: 'testing' })
    ).rejects.toThrow('Cannot update announcements that have ended.');
  });

  test('updating a soft-deleted announcement throws an error', async () => {
    const deletedAnnouncement = makeAnnouncementInstance({
      deleted_at: new Date(YESTERDAY),
    });
    MockAnnouncement.findByPk.mockResolvedValue(deletedAnnouncement as any);

    await expect(
      service.updateAnnouncement('announcement-1', { message: 'Updated' })
    ).rejects.toThrow('Cannot update announcements that have ended.');
  });

  test('updating a nonexistent announcement throws an error', async () => {
    MockAnnouncement.findByPk.mockResolvedValue(null);

    await expect(service.updateAnnouncement('nonexistent', { message: 'Updated' })).rejects.toThrow(
      'Announcement not found'
    );
  });
});

// ─── AnnouncementService.deleteAnnouncement ──────────────────────────────────

describe('AnnouncementService.deleteAnnouncement', () => {
  let service: AnnouncementService;

  beforeEach(() => {
    service = new AnnouncementService();
    MockAnnouncement.findByPk.mockReset();
  });

  test('deleting a live announcement sets deleted_at', async () => {
    const liveAnnouncement = makeAnnouncementInstance();
    MockAnnouncement.findByPk.mockResolvedValue(liveAnnouncement as any);

    const result = await service.deleteAnnouncement('announcement-1');

    expect(liveAnnouncement.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(Date) })
    );
    expect(result.deleted_at).toBeDefined();
  });

  test('deleting an already-deleted announcement is a no-op and returns the announcement as-is', async () => {
    const deletedAt = new Date(YESTERDAY);
    const deletedAnnouncement = makeAnnouncementInstance({ deleted_at: deletedAt });
    MockAnnouncement.findByPk.mockResolvedValue(deletedAnnouncement as any);

    const result = await service.deleteAnnouncement('announcement-1');

    expect(deletedAnnouncement.update).not.toHaveBeenCalled();
    expect(result.deleted_at).toBe(deletedAt.toISOString());
  });

  test('deleting an expired announcement throws an error', async () => {
    const expiredAnnouncement = makeAnnouncementInstance({
      // use a date well in the past so it's unambiguously expired in CST
      end_date: new Date('2020-01-01T23:59:59.999-06:00'),
    });
    MockAnnouncement.findByPk.mockResolvedValue(expiredAnnouncement as any);

    await expect(service.deleteAnnouncement('announcement-1')).rejects.toThrow(
      'Cannot delete announcements that have ended.'
    );
  });
});

// ─── AnnouncementService.getLiveAndUpcomingAnnouncements ─────────────────────

describe('AnnouncementService.getLiveAndUpcomingAnnouncements', () => {
  let service: AnnouncementService;

  beforeEach(() => {
    service = new AnnouncementService();
    MockAnnouncement.findAll.mockReset();
  });

  test('does not return soft-deleted announcements', async () => {
    MockAnnouncement.findAll.mockResolvedValue([]);

    const result = await service.getLiveAndUpcomingAnnouncements();

    const whereClause = MockAnnouncement.findAll.mock.calls[0][0]?.where as Record<string, unknown>;
    expect(whereClause.deleted_at).toBeNull();
    expect(result).toEqual([]);
  });

  test('does not return expired announcements', async () => {
    MockAnnouncement.findAll.mockResolvedValue([]);

    await service.getLiveAndUpcomingAnnouncements();

    // Confirm the query requires end_date IS NULL or end_date >= now
    const whereClause = MockAnnouncement.findAll.mock.calls[0][0]?.where as any;
    const orClauses: any[] = whereClause[Op.or];
    const hasNullEndDate = orClauses.some((clause) => clause?.end_date === null);
    const hasEndDateGte = orClauses.some((clause) => clause?.end_date?.[Op.gte] instanceof Date);
    expect(hasNullEndDate).toBe(true);
    expect(hasEndDateGte).toBe(true);
  });

  test('returns live and upcoming announcements ordered by start_date ASC', async () => {
    const upcoming = makeAnnouncementInstance({
      id: 'announcement-2',
      start_date: new Date(`${NEXT_WEEK}T00:00:00.000-06:00`),
    });
    const live = makeAnnouncementInstance({
      id: 'announcement-1',
      start_date: new Date(`${TODAY}T00:00:00.000-06:00`),
    });
    MockAnnouncement.findAll.mockResolvedValue([live, upcoming] as any);

    const result = await service.getLiveAndUpcomingAnnouncements();

    expect(result).toHaveLength(2);
    expect(MockAnnouncement.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ order: [['start_date', 'ASC']] })
    );
  });
});

// ─── AnnouncementService.getPastAnnouncements ────────────────────────────────

describe('AnnouncementService.getPastAnnouncements', () => {
  let service: AnnouncementService;

  beforeEach(() => {
    service = new AnnouncementService();
    MockAnnouncement.findAll.mockReset();
  });

  test('returns expired announcements', async () => {
    const expired = makeAnnouncementInstance({
      end_date: new Date(`${YESTERDAY}T23:59:59.999-06:00`),
    });
    MockAnnouncement.findAll.mockResolvedValue([expired] as any);

    const result = await service.getPastAnnouncements();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('announcement-1');
  });

  test('returns soft-deleted announcements', async () => {
    const deleted = makeAnnouncementInstance({ deleted_at: new Date(YESTERDAY) });
    MockAnnouncement.findAll.mockResolvedValue([deleted] as any);

    const result = await service.getPastAnnouncements();

    expect(result).toHaveLength(1);
    expect(result[0].deleted_at).toBeDefined();
  });

  test('returns announcements ordered by start_date DESC', async () => {
    MockAnnouncement.findAll.mockResolvedValue([]);

    await service.getPastAnnouncements();

    expect(MockAnnouncement.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ order: [['start_date', 'DESC']] })
    );
  });
});

// ─── AnnouncementService.getOverlappingAnnouncements ─────────────────────────

describe('AnnouncementService.getOverlappingAnnouncements', () => {
  let service: AnnouncementService;

  beforeEach(() => {
    service = new AnnouncementService();
    MockAnnouncement.findAll.mockReset();
  });

  test('returns announcements that overlap with the given range', async () => {
    const overlapping = makeAnnouncementInstance({ id: 'announcement-2' });
    MockAnnouncement.findAll.mockResolvedValue([overlapping] as any);

    const result = await service.getOverlappingAnnouncements(
      new Date(`${TODAY}T00:00:00.000-06:00`),
      new Date(`${NEXT_WEEK}T23:59:59.999-06:00`)
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('announcement-2');
  });

  test('returns empty array when no announcements overlap', async () => {
    MockAnnouncement.findAll.mockResolvedValue([]);

    const result = await service.getOverlappingAnnouncements(
      new Date(`${TODAY}T00:00:00.000-06:00`),
      new Date(`${NEXT_WEEK}T23:59:59.999-06:00`)
    );

    expect(result).toEqual([]);
  });

  test('excludes the announcement with excludeId from results', async () => {
    MockAnnouncement.findAll.mockResolvedValue([]);

    await service.getOverlappingAnnouncements(
      new Date(`${TODAY}T00:00:00.000-06:00`),
      new Date(`${NEXT_WEEK}T23:59:59.999-06:00`),
      'announcement-1'
    );

    // Confirm the excludeId condition is present in the Op.and array
    const whereClause = MockAnnouncement.findAll.mock.calls[0][0]?.where as any;
    const andClauses: unknown[] = whereClause[Op.and];
    const hasExclude = andClauses.some((clause: any) => clause?.id?.[Op.ne] === 'announcement-1');
    expect(hasExclude).toBe(true);
  });

  test('handles open-ended new announcement (null endDate)', async () => {
    const overlapping = makeAnnouncementInstance({ end_date: null });
    MockAnnouncement.findAll.mockResolvedValue([overlapping] as any);

    const result = await service.getOverlappingAnnouncements(
      new Date(`${TODAY}T00:00:00.000-06:00`),
      null
    );

    expect(result).toHaveLength(1);
  });
});
