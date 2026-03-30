import { AnnouncementDTO, CreateAnnouncementDTO, UpdateAnnouncementDTO } from '@/types';

interface IAnnouncementService {
  /**
   * Create an announcement
   * @param createdBy user's id
   * @param announcement announcement details
   * @returns AnnouncementDTO object containing the created announcement's information
   * @throws Error if announcement creation fails
   */
  createAnnouncement(createdBy: string, announcement: CreateAnnouncementDTO): Promise<AnnouncementDTO>;

  /**
   * Update an announcement
   * @param id announcement's id
   * @param announcement announcement details
   * @returns AnnouncementDTO object containing the updated announcement's information
   * @throws Error if announcement update fails
   */
  updateAnnouncement(id: string, announcement: UpdateAnnouncementDTO): Promise<AnnouncementDTO>;

  /**
   * Delete an announcement
   * @param id announcement's id
   * @returns AnnouncementDTO object containing the deleted announcement's information
   * @throws Error if announcement deletion fails
   */
  deleteAnnouncement(id: string): Promise<AnnouncementDTO>;

  /**
   * Get live and upcoming announcements
   * @returns array of AnnouncementDTOs
   * @throws Error if announcement retrieval fails
   */
  getLiveAndUpcomingAnnouncements(): Promise<AnnouncementDTO[]>;

  /**
   * Get past announcements
   * @returns array of AnnouncementDTOs
   * @throws Error if announcement retrieval fails
   */
  getPastAnnouncements(): Promise<AnnouncementDTO[]>;


  /**
   * Get overlapping announcements
   * @param startDate announcement's start date
   * @param endDate announcement's end date
   * @param excludeId announcement's id to exclude
   * @returns array of AnnouncementDTOs
   * @throws Error if announcement retrieval fails
   */
  getOverlappingAnnouncements(startDate: Date, endDate: Date | null, excludeId?: string): Promise<AnnouncementDTO[]>;
}

export default IAnnouncementService;
