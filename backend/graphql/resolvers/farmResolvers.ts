import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server';
import FarmService from '@/services/implementations/farmService';
import UserService from '@/services/implementations/userService';
import AuthService from '@/services/implementations/authService';
import IFarmService from '@/services/interfaces/farmService';
import IUserService from '@/services/interfaces/userService';
import IAuthService from '@/services/interfaces/authService';
import {
  CreateFarmInput,
  FarmDTO,
  FarmFilter,
  FarmStatus,
  UpdateFarmInput,
  Role,
  ActiveFarmRejectionDTO,
} from '@/types';
import { AuthContext } from '@/middlewares/auth';
import authHelper from '@/utilities/authHelpers';
import EmailService from '@/services/implementations/emailService';
import IEmailService from '@/services/interfaces/emailService';
import nodemailerConfig from '@/nodemailer.config';
import logger from '@/utilities/logger';
import { getErrorMessage } from '@/utilities/errorUtils';
import { createFileStorageService } from '@/utilities/fileStorage';
import IFileStorageService from '@/services/interfaces/fileStorageService';

const Logger = logger(__filename);
const farmService: IFarmService = new FarmService();
const fileStorageService: IFileStorageService = createFileStorageService();
const userService: IUserService = new UserService();
const emailService: IEmailService = new EmailService(nodemailerConfig);

const authService: IAuthService = new AuthService(userService, emailService);

const MAX_FARMS_PAGE_SIZE = 100;
const farmResolvers = {
  Query: {
    farmsByProximity: async (
      _: unknown,
      { lat, lng, radiusKm }: { lat: number; lng: number; radiusKm: number }
    ) => {
      if (!isFinite(lat) || !isFinite(lng) || !isFinite(radiusKm))
        throw new Error('lat, lng, and radiusKm must be finite numbers');
      if (lat < -90 || lat > 90) throw new Error('lat must be between -90 and 90');
      if (lng < -180 || lng > 180) throw new Error('lng must be between -180 and 180');
      if (radiusKm <= 0) throw new Error('radiusKm must be positive');
      if (radiusKm > 40075) throw new Error('radiusKm exceeds maximum allowed value');
      return farmService.getFarmsByProximity(lat, lng, radiusKm);
    },
    farms: async (
      _parent: undefined,
      {
        filter,
        pageNumber: rawPageNumber,
        pageSize: rawPageSize,
      }: { filter?: FarmFilter; pageNumber?: number | null; pageSize?: number | null },
      context: AuthContext
    ) => {
      const pageNumber = rawPageNumber ?? 1;
      const pageSize = rawPageSize ?? 50;

      if (!Number.isInteger(pageNumber) || pageNumber < 1) {
        throw new Error('pageNumber must be an integer >= 1');
      }
      if (!Number.isInteger(pageSize) || pageSize < 1) {
        throw new Error('pageSize must be an integer >= 1');
      }
      if (pageSize > MAX_FARMS_PAGE_SIZE) {
        throw new Error(`pageSize must not exceed ${MAX_FARMS_PAGE_SIZE}`);
      }

      const isAdmin = await authHelper
        .requireRole(context, [Role.ADMIN])
        .then(() => true)
        .catch(() => false);

      if (!isAdmin) {
        return farmService.getFarms(pageNumber, pageSize, {
          ...filter,
          status: FarmStatus.APPROVED,
          is_archived: false,
        });
      }

      return farmService.getFarms(pageNumber, pageSize, filter);
    },
    // The authenticated user's own farms across every status except DELETED (the public
    // `farms` query clamps non-admins to APPROVED, so it can't back a farmer dashboard).
    myFarms: async (
      _parent: undefined,
      _args: undefined,
      context: AuthContext
    ): Promise<FarmDTO[]> => {
      const user = await authHelper.requireAuth(context);
      const farms = await farmService.getFarmsByOwner(user.id);
      return farms.filter((farm) => !farm.is_archived);
    },
    myApprovedFarmDeletions: async (
      _parent: undefined,
      _args: undefined,
      context: AuthContext
    ): Promise<FarmDTO[]> => {
      const user = await authHelper.requireAuth(context);
      // Approved deletions are soft-deleted, which getFarmsByOwner hides by default.
      const farms = await farmService.getFarmsByOwner(user.id, { includeDeleted: true });
      return farms.filter(
        (farm) => farm.status === FarmStatus.DELETED && Boolean(farm.deletion_approved_at)
      );
    },
    farmDeletionRequests: async (
      _parent: undefined,
      _args: undefined,
      context: AuthContext
    ): Promise<FarmDTO[]> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      return farmService.getFarmDeletionRequests();
    },
    farmById: async (
      _parent: undefined,
      { id }: { id: string },
      context: AuthContext
    ): Promise<FarmDTO> => {
      const farm = await farmService.getFarmById(id);
      // Owner may read their own farm (any status) to populate the edit form;
      // admins may read any farm. Mirrors latestActiveFarmRejection's auth.
      await authHelper.requireOwnerOrAdmin(context, farm.owner_user_id);
      return farm;
    },
    farmsByStatus: async (
      _parent: undefined,
      { status }: { status: FarmStatus },
      context: AuthContext
    ): Promise<FarmDTO[]> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      return farmService.getFarmsByStatus(status);
    },
    latestActiveFarmRejection: async (
      _parent: undefined,
      { farmId }: { farmId: string },
      context: AuthContext
    ): Promise<ActiveFarmRejectionDTO | null> => {
      await authHelper.requireEmailVerified(context);
      const farm = await farmService.getFarmById(farmId);
      await authHelper.requireOwnerOrAdmin(context, farm.owner_user_id);
      return farmService.getLatestActiveRejection(farmId);
    },
    latestFarmRejection: async (
      _parent: undefined,
      { farmId }: { farmId: string },
      context: AuthContext
    ): Promise<ActiveFarmRejectionDTO | null> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      const rejection = await farmService.getLatestFarmRejectionByFarmId(farmId);
      if (!rejection) return null;
      return {
        id: rejection.id,
        farm_id: rejection.farm_id,
        rejection_reason: rejection.rejection_reason,
        created_at: rejection.created_at,
      };
    },
  },

  Mutation: {
    createFarm: async (
      _parent: undefined,
      { input }: { input: CreateFarmInput },
      context: AuthContext
    ): Promise<FarmDTO> => {
      const currentUser = await authHelper.requireRole(context, [Role.FARMER]);
      const createdFarm = await farmService.createFarm(currentUser.id, input);

      const subject = 'New Farm Application Submitted';
      const emailBody = {
        title: 'New Farm Application Submitted',
        previewText: 'A new farm application is ready for review.',
        body: `A new farm application has been submitted for ${input.farm_name}. Please review the application and approve or reject it.`,
        ctaText: 'Review application',
        ctaUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/admin/farms`,
        isFarmerEmail: false,
      };
      try {
        await emailService.sendEmail(process.env.MAILER_USER!, subject, emailBody);
      } catch {
        // email failure should not fail the mutation
      }

      return createdFarm;
    },

    createFarmForFarmer: async (
      _parent: undefined,
      { email, input }: { email: string; input: CreateFarmInput },
      context: AuthContext
    ): Promise<FarmDTO> => {
      await authHelper.requireRole(context, [Role.ADMIN]);

      // The farm belongs to the farmer, not the admin; it stays PENDING_APPROVAL like any new farm.
      const farmer = await userService.getOrCreateFarmerByEmail(email);
      const createdFarm = await farmService.createFarm(farmer.user.id, input);

      try {
        await authService.sendFarmAddedEmail(
          farmer.user.email,
          input.farm_name,
          farmer.isNewAccount
        );
      } catch (error: unknown) {
        // The farm already exists; failing here would invite a retry that creates a duplicate.
        Logger.error(
          `Created farm ${createdFarm.id} for ${farmer.user.email} but failed to send the notification email. Reason = ${getErrorMessage(error)}`
        );
      }

      return createdFarm;
    },

    updateFarm: async (
      _parent: undefined,
      { id, input }: { id: string; input: UpdateFarmInput },
      context: AuthContext
    ): Promise<FarmDTO> => {
      const currentUser = await authHelper.requireEmailVerified(context);
      const farm = await farmService.getFarmById(id);

      await authHelper.requireOwnerOrAdmin(context, farm.owner_user_id);

      // The archived check itself runs inside farmService.updateFarm against the
      // same read it uses for the write, so it can't race a concurrent archiveFarm.
      return farmService.updateFarm(id, input, currentUser.role === Role.ADMIN);
    },

    approveFarm: async (
      _parent: undefined,
      { id }: { id: string },
      context: AuthContext
    ): Promise<FarmDTO> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      return farmService.approveFarm(id);
    },

    rejectFarm: async (
      _parent: undefined,
      { id, rejectionReason }: { id: string; rejectionReason: string },
      context: AuthContext
    ): Promise<ActiveFarmRejectionDTO> => {
      const admin = await authHelper.requireRole(context, [Role.ADMIN]);
      const trimmed = rejectionReason.trim();
      if (!trimmed) {
        throw new UserInputError('A rejection reason is required.');
      }

      const rejection = await farmService.createFarmRejection(id, admin.id, trimmed);
      return {
        id: rejection.id,
        farm_id: rejection.farm_id,
        rejection_reason: rejection.rejection_reason,
        created_at: rejection.created_at,
      };
    },

    resubmitFarm: async (
      _parent: undefined,
      { id, input }: { id: string; input: UpdateFarmInput },
      context: AuthContext
    ): Promise<FarmDTO> => {
      const currentUser = await authHelper.requireEmailVerified(context);
      const farm = await farmService.getFarmById(id);
      await authHelper.requireOwnerOrAdmin(context, farm.owner_user_id);

      // The archived check itself runs inside farmService.resubmitFarm's transaction
      // against the same read it uses for the write, so it can't race a concurrent
      // archiveFarm call.
      return farmService.resubmitFarm(id, currentUser.id, input, currentUser.role === Role.ADMIN);
    },

    archiveFarm: async (
      _parent: undefined,
      { id }: { id: string },
      context: AuthContext
    ): Promise<FarmDTO> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      return farmService.archiveFarm(id);
    },

    unarchiveFarm: async (
      _parent: undefined,
      { id }: { id: string },
      context: AuthContext
    ): Promise<FarmDTO> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      return farmService.unarchiveFarm(id);
    },

    deleteFarm: async (
      _parent: undefined,
      { id, reason }: { id: string; reason?: string | null },
      context: AuthContext
    ): Promise<FarmDTO> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      return farmService.deleteFarm(id, reason);
    },

    restoreFarm: async (
      _parent: undefined,
      { id }: { id: string },
      context: AuthContext
    ): Promise<FarmDTO> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      return farmService.restoreFarm(id);
    },

    permanentlyDeleteFarm: async (
      _parent: undefined,
      { id }: { id: string },
      context: AuthContext
    ): Promise<string> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      const storageKeys = await farmService.permanentlyDeleteFarm(id);

      // The records are already gone, so a blob that fails to delete is only an
      // orphaned file; the storage layer logs the reason.
      await Promise.allSettled(storageKeys.map((key) => fileStorageService.deleteFile(key)));

      return id;
    },

    requestFarmDeletion: async (
      _parent: undefined,
      { id }: { id: string },
      context: AuthContext
    ): Promise<FarmDTO> => {
      await authHelper.requireEmailVerified(context);
      const farm = await farmService.getFarmById(id);
      await authHelper.requireOwnerOrAdmin(context, farm.owner_user_id);
      const updated = await farmService.requestFarmDeletion(id);

      if (!farm.deletion_requested_at) {
        const emailBody = {
          title: 'Farm Deletion Requested',
          previewText: 'A farm has asked to be deleted.',
          body: `${farm.farm_name} has asked for its farm profile to be deleted. Please review the request and approve or deny it.`,
          ctaText: 'Review request',
          ctaUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/admin`,
          isFarmerEmail: false,
        };
        try {
          await emailService.sendEmail(
            process.env.MAILER_USER!,
            'Farm Deletion Requested',
            emailBody
          );
        } catch {
          // email failure should not fail the mutation
        }
      }

      return updated;
    },

    approveFarmDeletion: async (
      _parent: undefined,
      { id }: { id: string },
      context: AuthContext
    ): Promise<FarmDTO> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      return farmService.approveFarmDeletion(id);
    },

    denyFarmDeletion: async (
      _parent: undefined,
      { id }: { id: string },
      context: AuthContext
    ): Promise<FarmDTO> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      return farmService.denyFarmDeletion(id);
    },
  },

  FarmDTO: {
    owner: async (farm: FarmDTO, _args: unknown, context: AuthContext) => {
      try {
        await authHelper.requireRole(context, [Role.ADMIN]);
      } catch (error: unknown) {
        if (error instanceof AuthenticationError || error instanceof ForbiddenError) {
          return null;
        }
        throw error;
      }

      try {
        return await userService.getUserByFirebaseUid(farm.owner_user_id);
      } catch (error: unknown) {
        // A farm whose owner has no Firestore profile (e.g. deleted user, seed
        // data) shouldn't fail the whole farms list — the client here treats any
        // GraphQL error as a hard failure of the entire request, not just this field.
        Logger.warn(
          `Failed to resolve owner for farm ${farm.id}. Reason = ${getErrorMessage(error)}`
        );
        return null;
      }
    },
    usda_farm_id: async (
      farm: FarmDTO,
      _args: unknown,
      context: AuthContext
    ): Promise<string | null> => {
      try {
        await authHelper.requireOwnerOrAdmin(context, farm.owner_user_id);
        return farm.usda_farm_id;
      } catch (error: unknown) {
        if (error instanceof AuthenticationError || error instanceof ForbiddenError) {
          return null;
        }

        throw error;
      }
    },
  },
};

export default farmResolvers;
