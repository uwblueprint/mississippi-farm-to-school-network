import { AuthContext } from '@/middlewares/auth';
import AnnouncementService from '@/services/implementations/announcementService';
import IAnnouncementService from '@/services/interfaces/announcementService';
import {
  AnnouncementDTO,
  CreateAnnouncementDTO,
  CreateAnnouncementResult,
  PublicAnnouncementDTO,
  Role,
  UpdateAnnouncementDTO,
} from '@/types';
import authHelper from '@/utilities/authHelpers';

const announcementService: IAnnouncementService = new AnnouncementService();

const announcementResolvers = {
  Query: {
    liveAnnouncements: async (
      _parent: undefined,
      __: unknown,
      context: AuthContext
    ): Promise<AnnouncementDTO[]> => {
      await authHelper.requireRole(context, [Role.ADMIN, Role.FARMER]);
      return announcementService.getLiveAnnouncements();
    },
    publicAnnouncements: async (): Promise<PublicAnnouncementDTO[]> => {
      const live = await announcementService.getLiveAnnouncements();
      return live.map(({ id, message, start_date, end_date }) => ({
        id,
        message,
        start_date,
        end_date,
      }));
    },
    liveAndUpcomingAnnouncements: async (
      _parent: undefined,
      __: unknown,
      context: AuthContext
    ): Promise<AnnouncementDTO[]> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      return announcementService.getLiveAndUpcomingAnnouncements();
    },
    pastAnnouncements: async (
      _parent: undefined,
      __: unknown,
      context: AuthContext
    ): Promise<AnnouncementDTO[]> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      return announcementService.getPastAnnouncements();
    },
  },
  Mutation: {
    createAnnouncement: async (
      _parent: undefined,
      { input }: { input: CreateAnnouncementDTO },
      context: AuthContext
    ): Promise<CreateAnnouncementResult> => {
      const admin = await authHelper.requireRole(context, [Role.ADMIN]);
      return announcementService.createAnnouncement(admin.id, input);
    },
    updateAnnouncement: async (
      _parent: undefined,
      { id, input }: { id: string; input: UpdateAnnouncementDTO },
      context: AuthContext
    ): Promise<CreateAnnouncementResult> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      return announcementService.updateAnnouncement(id, input);
    },
    deleteAnnouncement: async (
      _parent: undefined,
      { id }: { id: string },
      context: AuthContext
    ): Promise<AnnouncementDTO> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      return announcementService.deleteAnnouncement(id);
    },
  },
};

export default announcementResolvers;
