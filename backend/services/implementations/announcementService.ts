import IAnnouncementService from '@/services/interfaces/announcementService';
import Announcement from '@/models/announcement.model';
import { AnnouncementDTO, CreateAnnouncementDTO, CreateAnnouncementResult, UpdateAnnouncementDTO } from '@/types';
import { getErrorMessage } from '@/utilities/errorUtils';
import logger from '@/utilities/logger';
import { Op } from 'sequelize';

const Logger = logger(__filename);


const isPast = (date: Date) => {
  return date < new Date();
};

class AnnouncementService implements IAnnouncementService {
  async createAnnouncement(createdBy: string, announcement: CreateAnnouncementDTO): Promise<CreateAnnouncementResult> {
    const startDate = new Date(new Date(announcement.start_date).setHours(0, 0, 0, 0));
    const endDate = announcement.end_date ? new Date(new Date(announcement.end_date).setHours(23, 59, 59, 999)) : null;

    if (isPast(startDate)) {
      throw new Error('Start date cannot be in the past');
    }
    if (endDate && isPast(endDate)) {
      throw new Error('End date cannot be in the past');
    }
    if (announcement.end_date && announcement.start_date > announcement.end_date) {
      throw new Error('Start date cannot be after end date');
    }

    const overlappingAnnouncements = await this.getOverlappingAnnouncements(startDate, endDate);

    try {
      const newAnnouncement = await Announcement.create({
        ...announcement,
        start_date: startDate,
        end_date: endDate,
        created_by: createdBy,
        deleted_at: null,
      });
      return {
        announcement: this.convertToAnnouncementDTO(newAnnouncement),
        overlappingAnnouncements: overlappingAnnouncements.map(this.convertToAnnouncementDTO),
      };
    } catch (error: unknown) {
      Logger.error(`Failed to create announcement. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async updateAnnouncement(id: string, newAnnouncement: UpdateAnnouncementDTO): Promise<CreateAnnouncementResult> {
    const announcementToUpdate = await Announcement.findByPk(id);

    if (!announcementToUpdate) {
      throw new Error('Announcement not found');
    }

    const startDate = newAnnouncement.start_date
      ? new Date(new Date(newAnnouncement.start_date).setHours(0, 0, 0, 0))
      : announcementToUpdate.start_date;
    const endDate = newAnnouncement.end_date
      ? new Date(new Date(newAnnouncement.end_date).setHours(23, 59, 59, 999))
      : announcementToUpdate.end_date;

    if ((announcementToUpdate.end_date && isPast(announcementToUpdate.end_date)) || (announcementToUpdate.deleted_at)) {
      throw new Error('Cannot update events that have ended.');
    }

    // check if a new start_date was provided and validate it
    if (newAnnouncement.start_date && isPast(startDate)) {
      throw new Error('Start date cannot be in the past');
    }

    // check if a new end_date was provided and validate it
    if (newAnnouncement.end_date) {
      if (isPast(endDate)) {
        throw new Error('End date cannot be in the past');
      }

      if (endDate < startDate) {
        throw new Error('End date cannot be before start date');
      }
    }

    const overlappingAnnouncements = await this.getOverlappingAnnouncements(startDate, endDate, id);

    try {
      const updatedAnnouncement = await announcementToUpdate.update({
        ...newAnnouncement,
        start_date: startDate,
        end_date: endDate,
      });

      return {
        announcement: this.convertToAnnouncementDTO(updatedAnnouncement),
        overlappingAnnouncements: overlappingAnnouncements.map(this.convertToAnnouncementDTO),
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
    if (announcementToDelete.end_date && isPast(announcementToDelete.end_date)){
      throw new Error('Cannot delete announcements that have ended.');
    }
    if (announcementToDelete.deleted_at) {
      throw new Error('Cannot delete announcements that have been deleted.');
    }
    const announcement = await announcementToDelete.update({ deleted_at: new Date() });
    return this.convertToAnnouncementDTO(announcement);
  }

  async getLiveAndUpcomingAnnouncements(): Promise<AnnouncementDTO[]> {
    const announcements = await Announcement.findAll({
      where: {
        deleted_at: null,
        [Op.or]: [
          { end_date: null },
          { end_date: { [Op.gte]: new Date() } },
        ]
      },
      order: [['start_date', 'ASC']],
    });

    return announcements.map(this.convertToAnnouncementDTO);
  }

  async getPastAnnouncements(): Promise<AnnouncementDTO[]> {
    const announcements = await Announcement.findAll({
      where: {
        [Op.or]: [
          { [Op.not]: { deleted_at: null } },
          { end_date: { [Op.lt]: new Date() } },
        ]
      },
      order: [['start_date', 'DESC']],
    });  
    return announcements.map(this.convertToAnnouncementDTO);
  }

  async getOverlappingAnnouncements(startDate: Date, endDate: Date | null, excludeId?: string): Promise<AnnouncementDTO[]> {
    const announcements = await Announcement.findAll({
      where: {
        [Op.and]: [
          excludeId ? { id: { [Op.ne]: excludeId } } : {},
          { deleted_at: null },
          { [Op.or]: [
            { end_date: null },
            { end_date: { [Op.gte]: startDate } },
          ] },
          endDate ? { start_date: { [Op.lte]: endDate } } : {},
        ]
      }
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