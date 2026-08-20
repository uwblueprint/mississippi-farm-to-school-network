import { DateTime } from 'luxon';
import { FakeFirestore } from './helpers/fakeFirestore';

let mockFirestoreInstance: FakeFirestore;

jest.mock('@/utilities/firestore', () => ({
  ...jest.requireActual('@/utilities/firestore'),
  getFirestore: () => mockFirestoreInstance,
}));

import AnnouncementService from '@/services/implementations/announcementService';
import { Collections } from '@/utilities/firestore';

const CST = 'America/Chicago';

const offsetDate = (days: number): string =>
  DateTime.now().setZone(CST).plus({ days }).toISODate()!;

const toStartOfDayCST = (dateStr: string): Date =>
  DateTime.fromISO(dateStr, { zone: CST }).startOf('day').toJSDate();

const toEndOfDayCST = (dateStr: string): Date =>
  DateTime.fromISO(dateStr, { zone: CST }).endOf('day').toJSDate();

const TODAY = offsetDate(0);
const YESTERDAY = offsetDate(-1);
const TOMORROW = offsetDate(1);
const NEXT_WEEK = offsetDate(7);
const LAST_WEEK = offsetDate(-7);

let seq = 0;

type SeedOptions = {
  id?: string;
  message?: string;
  startDate?: string;
  endDate?: string | null;
  deletedAt?: string | null;
};

const seedAnnouncement = async ({
  id,
  message = 'Test announcement',
  startDate = TODAY,
  endDate = NEXT_WEEK,
  deletedAt = null,
}: SeedOptions = {}): Promise<string> => {
  const docId = id ?? `announcement-${++seq}`;
  const now = new Date().toISOString();
  await mockFirestoreInstance
    .collection(Collections.announcements)
    .doc(docId)
    .set({
      message,
      start_date: toStartOfDayCST(startDate).toISOString(),
      end_date: endDate ? toEndOfDayCST(endDate).toISOString() : null,
      created_by: 'user-1',
      deleted_at: deletedAt,
      createdAt: now,
      updatedAt: now,
    });
  return docId;
};

let service: AnnouncementService;

beforeEach(() => {
  mockFirestoreInstance = new FakeFirestore();
  service = new AnnouncementService();
});

describe('AnnouncementService.createAnnouncement', () => {
  test('past start_date throws an error', async () => {
    await expect(
      service.createAnnouncement('user-1', { message: 'Hello', start_date: YESTERDAY })
    ).rejects.toThrow('Start date cannot be in the past');
  });

  test('past end_date throws an error', async () => {
    await expect(
      service.createAnnouncement('user-1', {
        message: 'Hello',
        start_date: TODAY,
        end_date: YESTERDAY,
      })
    ).rejects.toThrow('End date cannot be in the past');
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

  test("today's start_date succeeds and persists the announcement", async () => {
    const result = await service.createAnnouncement('user-1', {
      message: 'Hello',
      start_date: TODAY,
    });

    expect(result.announcement.message).toBe('Hello');
    expect(result.announcement.end_date).toBeUndefined();
    expect(result.overlappingAnnouncements).toEqual([]);

    const doc = await mockFirestoreInstance
      .collection(Collections.announcements)
      .doc(result.announcement.id)
      .get();
    expect(doc.exists).toBe(true);
    expect(doc.data()?.message).toBe('Hello');
  });

  test('1 day announcement', async () => {
    const result = await service.createAnnouncement('user-1', {
      message: 'Hello',
      start_date: TODAY,
      end_date: TODAY,
    });

    expect(result.announcement.start_date).toBe(toStartOfDayCST(TODAY).toISOString());
    expect(result.announcement.end_date).toBe(toEndOfDayCST(TODAY).toISOString());
  });

  test('returns overlapping announcements alongside the created announcement', async () => {
    const existingId = await seedAnnouncement({ message: 'Overlapping' });

    const result = await service.createAnnouncement('user-1', {
      message: 'Hello',
      start_date: TODAY,
      end_date: NEXT_WEEK,
    });

    expect(result.overlappingAnnouncements).toHaveLength(1);
    expect(result.overlappingAnnouncements[0].id).toBe(existingId);
  });
});

describe('AnnouncementService.updateAnnouncement', () => {
  test('updating a past (expired) announcement throws an error', async () => {
    const id = await seedAnnouncement({ startDate: LAST_WEEK, endDate: YESTERDAY });

    await expect(service.updateAnnouncement(id, { message: 'testing' })).rejects.toThrow(
      'Cannot update announcements that have ended.'
    );
  });

  test('updating a soft-deleted announcement throws an error', async () => {
    const id = await seedAnnouncement({ deletedAt: new Date().toISOString() });

    await expect(service.updateAnnouncement(id, { message: 'Updated' })).rejects.toThrow(
      'Cannot update announcements that have ended.'
    );
  });

  test('updating a nonexistent announcement throws an error', async () => {
    await expect(service.updateAnnouncement('nonexistent', { message: 'Updated' })).rejects.toThrow(
      'Announcement not found'
    );
  });

  test('updating start_date to after existing end_date throws an error', async () => {
    const id = await seedAnnouncement({ startDate: TODAY, endDate: TOMORROW });

    await expect(service.updateAnnouncement(id, { start_date: NEXT_WEEK })).rejects.toThrow(
      'End date cannot be before start date'
    );
  });

  test('updating the message persists the change', async () => {
    const id = await seedAnnouncement();

    const result = await service.updateAnnouncement(id, { message: 'Updated' });

    expect(result.announcement.message).toBe('Updated');
    const doc = await mockFirestoreInstance.collection(Collections.announcements).doc(id).get();
    expect(doc.data()?.message).toBe('Updated');
  });
});

describe('AnnouncementService.deleteAnnouncement', () => {
  test('deleting a live announcement sets deleted_at', async () => {
    const id = await seedAnnouncement();

    const result = await service.deleteAnnouncement(id);

    expect(result.deleted_at).toBeDefined();
    const doc = await mockFirestoreInstance.collection(Collections.announcements).doc(id).get();
    expect(doc.data()?.deleted_at).not.toBeNull();
  });

  test('deleting an already-deleted announcement is a no-op and returns the announcement as-is', async () => {
    const deletedAt = toStartOfDayCST(YESTERDAY).toISOString();
    const id = await seedAnnouncement({ deletedAt });

    const result = await service.deleteAnnouncement(id);

    expect(result.deleted_at).toBe(deletedAt);
  });

  test('deleting an expired announcement throws an error', async () => {
    const id = await seedAnnouncement({ startDate: LAST_WEEK, endDate: YESTERDAY });

    await expect(service.deleteAnnouncement(id)).rejects.toThrow(
      'Cannot delete announcements that have ended.'
    );
  });

  test('deleting a nonexistent announcement throws an error', async () => {
    await expect(service.deleteAnnouncement('nonexistent')).rejects.toThrow(
      'Announcement not found'
    );
  });
});

describe('AnnouncementService.getLiveAnnouncements', () => {
  test('returns only announcements that have started, not ended, and are not deleted', async () => {
    const liveId = await seedAnnouncement({ startDate: TODAY, endDate: NEXT_WEEK });
    await seedAnnouncement({ startDate: TOMORROW, endDate: NEXT_WEEK });
    await seedAnnouncement({ startDate: LAST_WEEK, endDate: YESTERDAY });
    await seedAnnouncement({
      startDate: TODAY,
      endDate: NEXT_WEEK,
      deletedAt: new Date().toISOString(),
    });

    const result = await service.getLiveAnnouncements();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(liveId);
  });

  test('includes started announcements with no end_date', async () => {
    const id = await seedAnnouncement({ startDate: YESTERDAY, endDate: null });

    const result = await service.getLiveAnnouncements();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(id);
  });

  test('returns announcements ordered by start_date ASC', async () => {
    const later = await seedAnnouncement({ startDate: TODAY, endDate: NEXT_WEEK });
    const earlier = await seedAnnouncement({ startDate: offsetDate(-3), endDate: NEXT_WEEK });

    const result = await service.getLiveAnnouncements();

    expect(result.map((a) => a.id)).toEqual([earlier, later]);
  });
});

describe('AnnouncementService.getLiveAndUpcomingAnnouncements', () => {
  test('does not return soft-deleted announcements', async () => {
    await seedAnnouncement({ deletedAt: new Date().toISOString() });

    const result = await service.getLiveAndUpcomingAnnouncements();

    expect(result).toEqual([]);
  });

  test('does not return expired announcements', async () => {
    await seedAnnouncement({ startDate: LAST_WEEK, endDate: YESTERDAY });
    const openEndedId = await seedAnnouncement({ startDate: LAST_WEEK, endDate: null });

    const result = await service.getLiveAndUpcomingAnnouncements();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(openEndedId);
  });

  test('returns live and upcoming announcements ordered by start_date ASC', async () => {
    const upcoming = await seedAnnouncement({ startDate: NEXT_WEEK, endDate: NEXT_WEEK });
    const live = await seedAnnouncement({ startDate: TODAY, endDate: NEXT_WEEK });

    const result = await service.getLiveAndUpcomingAnnouncements();

    expect(result.map((a) => a.id)).toEqual([live, upcoming]);
  });
});

describe('AnnouncementService.getPastAnnouncements', () => {
  test('returns expired announcements', async () => {
    const id = await seedAnnouncement({ startDate: LAST_WEEK, endDate: YESTERDAY });

    const result = await service.getPastAnnouncements();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(id);
  });

  test('returns soft-deleted announcements', async () => {
    await seedAnnouncement({ deletedAt: new Date().toISOString() });

    const result = await service.getPastAnnouncements();

    expect(result).toHaveLength(1);
    expect(result[0].deleted_at).toBeDefined();
  });

  test('does not return live announcements', async () => {
    await seedAnnouncement({ startDate: TODAY, endDate: NEXT_WEEK });

    const result = await service.getPastAnnouncements();

    expect(result).toEqual([]);
  });

  test('returns announcements ordered by start_date DESC', async () => {
    const older = await seedAnnouncement({ startDate: offsetDate(-10), endDate: YESTERDAY });
    const newer = await seedAnnouncement({ startDate: offsetDate(-5), endDate: YESTERDAY });

    const result = await service.getPastAnnouncements();

    expect(result.map((a) => a.id)).toEqual([newer, older]);
  });
});

describe('AnnouncementService.getOverlappingAnnouncements', () => {
  test('returns announcements that overlap with the given range', async () => {
    const id = await seedAnnouncement({ startDate: TODAY, endDate: NEXT_WEEK });

    const result = await service.getOverlappingAnnouncements(
      toStartOfDayCST(TODAY),
      toEndOfDayCST(NEXT_WEEK)
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(id);
  });

  test('returns empty array when no announcements overlap', async () => {
    await seedAnnouncement({ startDate: TODAY, endDate: TOMORROW });

    const result = await service.getOverlappingAnnouncements(
      toStartOfDayCST(offsetDate(3)),
      toEndOfDayCST(NEXT_WEEK)
    );

    expect(result).toEqual([]);
  });

  test('excludes the announcement with excludeId from results', async () => {
    const id = await seedAnnouncement({ startDate: TODAY, endDate: NEXT_WEEK });

    const result = await service.getOverlappingAnnouncements(
      toStartOfDayCST(TODAY),
      toEndOfDayCST(NEXT_WEEK),
      id
    );

    expect(result).toEqual([]);
  });

  test('excludes soft-deleted announcements', async () => {
    await seedAnnouncement({
      startDate: TODAY,
      endDate: NEXT_WEEK,
      deletedAt: new Date().toISOString(),
    });

    const result = await service.getOverlappingAnnouncements(
      toStartOfDayCST(TODAY),
      toEndOfDayCST(NEXT_WEEK)
    );

    expect(result).toEqual([]);
  });

  test('handles open-ended new announcement (null endDate)', async () => {
    const id = await seedAnnouncement({ startDate: TODAY, endDate: null });

    const result = await service.getOverlappingAnnouncements(toStartOfDayCST(TODAY), null);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(id);
  });
});
