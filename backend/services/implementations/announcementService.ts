import IAnnouncementService from '@/services/interfaces/announcementService';
import Announcement from '@/models/announcement.model';
import {
  AnnouncementDTO,
  CreateAnnouncementDTO,
  CreateAnnouncementResult,
  UpdateAnnouncementDTO,
} from '@/types';
import { getErrorMessage } from '@/utilities/errorUtils';
import logger from '@/utilities/logger';
import { DateTime } from 'luxon';
import { Op } from 'sequelize';

const Logger = logger(__filename);
const CST = 'America/Chicago';

const toStartOfDayCST = (dateStr: string): Date =>
  DateTime.fromISO(dateStr, { zone: CST }).startOf('day').toJSDate();

const toEndOfDayCST = (dateStr: string): Date =>
  DateTime.fromISO(dateStr, { zone: CST }).endOf('day').toJSDate();

const isPast = (date: Date) => {
  // compare against midnight CST of today so same-day announcements are allowed
  const todayCST = DateTime.now().setZone(CST).startOf('day').toJSDate();
  return date < todayCST;
};

class AnnouncementService implements IAnnouncementService {
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

      const newAnnouncement = await Announcement.create({
        ...announcement,
        start_date: startDate,
        end_date: endDate,
        created_by: createdBy,
        deleted_at: null,
      });
      return {
        announcement: this.convertToAnnouncementDTO(newAnnouncement),
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
    const announcementToUpdate = await Announcement.findByPk(id);

    if (!announcementToUpdate) {
      throw new Error('Announcement not found');
    }

    if (
      (announcementToUpdate.end_date && isPast(announcementToUpdate.end_date)) ||
      announcementToUpdate.deleted_at
    ) {
      throw new Error('Cannot update announcements that have ended.');
    }

    const startDate = newAnnouncement.start_date
      ? toStartOfDayCST(newAnnouncement.start_date)
      : announcementToUpdate.start_date;
    const endDate = newAnnouncement.end_date
      ? toEndOfDayCST(newAnnouncement.end_date)
      : announcementToUpdate.end_date;

    if (newAnnouncement.start_date && isPast(startDate)) {
      throw new Error('Start date cannot be in the past');
    }

    if (newAnnouncement.end_date) {
      // ! is safe to use here since if newAnnouncement.end_date exists, so does endDate
      if (isPast(endDate!)) {
        throw new Error('End date cannot be in the past');
      }

      if (endDate! < startDate) {
        throw new Error('End date cannot be before start date');
      }
    }

    try {
      const overlappingAnnouncements = await this.getOverlappingAnnouncements(
        startDate,
        endDate,
        id
      );

      const updatedAnnouncement = await announcementToUpdate.update({
        ...newAnnouncement,
        start_date: startDate,
        end_date: endDate,
      });

      return {
        announcement: this.convertToAnnouncementDTO(updatedAnnouncement),
        overlappingAnnouncements,
      };
    } catch (error: unknown) {
      Logger.error(`Failed to update announcement. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async deleteAnnouncement(id: string): Promise<AnnouncementDTO> {
    const announcementToDelete = await Announcement.findByPk(id);
    if (!announcementToDelete) {
      throw new Error('Announcement not found');
    }
    if (announcementToDelete.end_date && isPast(announcementToDelete.end_date)) {
      throw new Error('Cannot delete announcements that have ended.');
    }
    // deleting an already deleted announcement is a no-op
    if (announcementToDelete.deleted_at) {
      return this.convertToAnnouncementDTO(announcementToDelete);
    }

    try {
      const announcement = await announcementToDelete.update({ deleted_at: new Date() });
      return this.convertToAnnouncementDTO(announcement);
    } catch (error: unknown) {
      Logger.error(`Failed to delete announcement. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getLiveAndUpcomingAnnouncements(): Promise<AnnouncementDTO[]> {
    const announcements = await Announcement.findAll({
      where: {
        deleted_at: null,
        [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: new Date() } }],
      },
      order: [['start_date', 'ASC']],
    });

    return announcements.map(this.convertToAnnouncementDTO);
  }

  async getPastAnnouncements(): Promise<AnnouncementDTO[]> {
    const announcements = await Announcement.findAll({
      where: {
        [Op.or]: [{ [Op.not]: { deleted_at: null } }, { end_date: { [Op.lt]: new Date() } }],
      },
      order: [['start_date', 'DESC']],
    });
    return announcements.map(this.convertToAnnouncementDTO);
  }

  async getOverlappingAnnouncements(
    startDate: Date,
    endDate: Date | null,
    excludeId?: string
  ): Promise<AnnouncementDTO[]> {
    const announcements = await Announcement.findAll({
      where: {
        // while Op.and is redundant, it allows for conditional querying
        [Op.and]: [
          { deleted_at: null },
          excludeId ? { id: { [Op.ne]: excludeId } } : {},

          {
            [Op.or]: [
              // existing event is open-ended:
              // if an existing event has no end_date && the endDate is not specified, they overlap
              // if an existing event has no end_date && the start_date <= endDate, they overlap
              {
                [Op.and]: [
                  { end_date: null },
                  endDate ? { start_date: { [Op.lte]: endDate } } : {},
                ],
              },

              // existing event is bounded:
              // if an existing event's end_date >= startDate && the endDate is not specified, they overlap
              // if an existing event's end_date >= startDate && the event's start_date <= endDate, they overlap
              {
                [Op.and]: [
                  { end_date: { [Op.gte]: startDate } },
                  endDate ? { start_date: { [Op.lte]: endDate } } : {},
                ],
              },
            ],
          },
        ],
      },
    });
    return announcements.map(this.convertToAnnouncementDTO);
  }

  private convertToAnnouncementDTO(announcement: Announcement): AnnouncementDTO {
    return {
      id: announcement.id,
      message: announcement.message,
      start_date: announcement.start_date.toISOString(),
      end_date: announcement.end_date?.toISOString(),
      created_by: announcement.created_by,
      deleted_at: announcement.deleted_at?.toISOString(),
      createdAt: announcement.createdAt.toISOString(),
      updatedAt: announcement.updatedAt.toISOString(),
    };
  }
}

export default AnnouncementService;
