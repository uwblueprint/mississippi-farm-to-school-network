import IAnnouncementService from '@/services/interfaces/announcementService';
import {
  AnnouncementDTO,
  CreateAnnouncementDTO,
  CreateAnnouncementResult,
  UpdateAnnouncementDTO,
} from '@/types';
import { getErrorMessage } from '@/utilities/errorUtils';
import logger from '@/utilities/logger';
import { DateTime } from 'luxon';
import { Collections, getFirestore, newId, toDate, toIso } from '@/utilities/firestore';

const Logger = logger(__filename);
const CST = 'America/Chicago';

type AnnouncementDoc = {
  message: string;
  start_date: string;
  end_date: string | null;
  created_by: string;
  deleted_at: string | null;
  createdAt: string;
  updatedAt: string;
};

const toStartOfDayCST = (dateStr: string): Date =>
  DateTime.fromISO(dateStr, { zone: CST }).startOf('day').toJSDate();

const toEndOfDayCST = (dateStr: string): Date =>
  DateTime.fromISO(dateStr, { zone: CST }).endOf('day').toJSDate();

const isPast = (date: Date) => {
  const todayCST = DateTime.now().setZone(CST).startOf('day').toJSDate();
  return date < todayCST;
};

class AnnouncementService implements IAnnouncementService {
  private announcements() {
    return getFirestore().collection(Collections.announcements);
  }

  async createAnnouncement(
    createdBy: string,
    announcement: CreateAnnouncementDTO
  ): Promise<CreateAnnouncementResult> {
    const startDate = toStartOfDayCST(announcement.start_date);
    const endDate = announcement.end_date ? toEndOfDayCST(announcement.end_date) : null;

    if (isPast(startDate)) {
      throw new Error('Start date cannot be in the past');
    }
    if (endDate && isPast(endDate)) {
      throw new Error('End date cannot be in the past');
    }
    if (endDate && startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }

    try {
      const overlappingAnnouncements = await this.getOverlappingAnnouncements(startDate, endDate);
      const id = newId();
      const now = new Date().toISOString();
      const data: AnnouncementDoc = {
        message: announcement.message,
        start_date: startDate.toISOString(),
        end_date: endDate ? endDate.toISOString() : null,
        created_by: createdBy,
        deleted_at: null,
        createdAt: now,
        updatedAt: now,
      };
      await this.announcements().doc(id).set(data);
      return {
        announcement: this.convertToAnnouncementDTO(id, data),
        overlappingAnnouncements,
      };
    } catch (error: unknown) {
      Logger.error(`Failed to create announcement. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async updateAnnouncement(
    id: string,
    newAnnouncement: UpdateAnnouncementDTO
  ): Promise<CreateAnnouncementResult> {
    const doc = await this.announcements().doc(id).get();
    if (!doc.exists) {
      throw new Error('Announcement not found');
    }
    const existing = doc.data() as AnnouncementDoc;

    const existingEnd = existing.end_date ? toDate(existing.end_date) : null;
    if ((existingEnd && isPast(existingEnd)) || existing.deleted_at) {
      throw new Error('Cannot update announcements that have ended.');
    }

    const startDate = newAnnouncement.start_date
      ? toStartOfDayCST(newAnnouncement.start_date)
      : toDate(existing.start_date);
    const endDate = newAnnouncement.end_date
      ? toEndOfDayCST(newAnnouncement.end_date)
      : existing.end_date
        ? toDate(existing.end_date)
        : null;

    if (newAnnouncement.start_date && isPast(startDate)) {
      throw new Error('Start date cannot be in the past');
    }

    if (newAnnouncement.end_date && endDate && isPast(endDate)) {
      throw new Error('End date cannot be in the past');
    }

    if (endDate && endDate < startDate) {
      throw new Error('End date cannot be before start date');
    }

    try {
      const overlappingAnnouncements = await this.getOverlappingAnnouncements(
        startDate,
        endDate,
        id
      );

      const updated: AnnouncementDoc = {
        ...existing,
        message: newAnnouncement.message ?? existing.message,
        start_date: startDate.toISOString(),
        end_date: endDate ? endDate.toISOString() : null,
        updatedAt: new Date().toISOString(),
      };
      await this.announcements().doc(id).set(updated);

      return {
        announcement: this.convertToAnnouncementDTO(id, updated),
        overlappingAnnouncements,
      };
    } catch (error: unknown) {
      Logger.error(`Failed to update announcement. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async deleteAnnouncement(id: string): Promise<AnnouncementDTO> {
    const doc = await this.announcements().doc(id).get();
    if (!doc.exists) {
      throw new Error('Announcement not found');
    }
    const existing = doc.data() as AnnouncementDoc;
    if (existing.end_date && isPast(toDate(existing.end_date))) {
      throw new Error('Cannot delete announcements that have ended.');
    }
    if (existing.deleted_at) {
      return this.convertToAnnouncementDTO(id, existing);
    }

    try {
      const updated: AnnouncementDoc = {
        ...existing,
        deleted_at: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await this.announcements().doc(id).set(updated);
      return this.convertToAnnouncementDTO(id, updated);
    } catch (error: unknown) {
      Logger.error(`Failed to delete announcement. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getLiveAndUpcomingAnnouncements(): Promise<AnnouncementDTO[]> {
    const snap = await this.announcements().get();
    const now = new Date();
    return snap.docs
      .map((doc) => ({ id: doc.id, data: doc.data() as AnnouncementDoc }))
      .filter(({ data }) => {
        if (data.deleted_at) return false;
        if (!data.end_date) return true;
        return toDate(data.end_date) >= now;
      })
      .sort((a, b) => toDate(a.data.start_date).getTime() - toDate(b.data.start_date).getTime())
      .map(({ id, data }) => this.convertToAnnouncementDTO(id, data));
  }

  async getPastAnnouncements(): Promise<AnnouncementDTO[]> {
    const snap = await this.announcements().get();
    const now = new Date();
    return snap.docs
      .map((doc) => ({ id: doc.id, data: doc.data() as AnnouncementDoc }))
      .filter(({ data }) => {
        if (data.deleted_at) return true;
        if (!data.end_date) return false;
        return toDate(data.end_date) < now;
      })
      .sort((a, b) => toDate(b.data.start_date).getTime() - toDate(a.data.start_date).getTime())
      .map(({ id, data }) => this.convertToAnnouncementDTO(id, data));
  }

  async getOverlappingAnnouncements(
    startDate: Date,
    endDate: Date | null,
    excludeId?: string
  ): Promise<AnnouncementDTO[]> {
    const snap = await this.announcements().get();
    return snap.docs
      .map((doc) => ({ id: doc.id, data: doc.data() as AnnouncementDoc }))
      .filter(({ id, data }) => {
        if (data.deleted_at) return false;
        if (excludeId && id === excludeId) return false;

        const existingStart = toDate(data.start_date);
        const existingEnd = data.end_date ? toDate(data.end_date) : null;

        if (existingEnd == null) {
          return endDate ? existingStart <= endDate : true;
        }

        if (existingEnd < startDate) return false;
        return endDate ? existingStart <= endDate : true;
      })
      .map(({ id, data }) => this.convertToAnnouncementDTO(id, data));
  }

  private convertToAnnouncementDTO(id: string, announcement: AnnouncementDoc): AnnouncementDTO {
    return {
      id,
      message: announcement.message,
      start_date: toIso(announcement.start_date),
      end_date: announcement.end_date ? toIso(announcement.end_date) : undefined,
      created_by: announcement.created_by,
      deleted_at: announcement.deleted_at ? toIso(announcement.deleted_at) : undefined,
      createdAt: toIso(announcement.createdAt),
      updatedAt: toIso(announcement.updatedAt),
    };
  }
}

export default AnnouncementService;
