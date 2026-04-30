import { randomUUID } from 'crypto';

import { UserInputError } from 'apollo-server';

import { AuthContext } from '@/middlewares/auth';
import FarmService from '@/services/implementations/farmService';
import FileStorageService from '@/services/implementations/fileStorageService';
import StoredFileService from '@/services/implementations/storedFileService';
import IFarmService from '@/services/interfaces/farmService';
import IFileStorageService from '@/services/interfaces/fileStorageService';
import IStoredFileService from '@/services/interfaces/storedFileService';
import { FarmStatus } from '@/types';
import authHelper from '@/utilities/authHelpers';
import { getErrorMessage } from '@/utilities/errorUtils';

const defaultBucket = process.env.FIREBASE_STORAGE_DEFAULT_BUCKET || '';
const fileStorageService: IFileStorageService = new FileStorageService(defaultBucket);
const storedFileService: IStoredFileService = new StoredFileService();
const farmService: IFarmService = new FarmService();

const fileStorageResolvers = {
  Query: {
    getFile: async (
      _parent: undefined,
      { fileId }: { fileId: string },
      context: AuthContext
    ): Promise<string> => {
      let record;
      try {
        record = await storedFileService.getFileRecordById(fileId);
      } catch (error: unknown) {
        throw new UserInputError(getErrorMessage(error));
      }

      const farm = await farmService.getFarmById(record.farm_id);

      if (farm.status !== FarmStatus.APPROVED) {
        await authHelper.requireOwnerOrAdmin(context, record.owner_user_id);
      }

      return fileStorageService.getFile(record.storage_key);
    },
  },
  Mutation: {
    createFile: async (
      _parent: undefined,
      {
        originalFileName,
        filePath,
        farmId,
        contentType,
      }: {
        originalFileName: string;
        filePath: string;
        farmId: string;
        contentType?: string | null;
      },
      context: AuthContext
    ): Promise<string> => {
      const user = await authHelper.requireAuth(context);
      const farm = await farmService.getFarmById(farmId);
      await authHelper.requireOwnerOrAdmin(context, farm.owner_user_id);

      const fileId = randomUUID();
      const storageKey = `farms/${farmId}/${fileId}`;

      await fileStorageService.createFile(storageKey, filePath, contentType ?? null);
      await storedFileService.createFileRecord(
        storageKey,
        originalFileName,
        user.id,
        farmId,
        contentType ?? null
      );

      return fileId;
    },
    updateFile: async (
      _parent: undefined,
      {
        fileId,
        filePath,
        contentType,
      }: { fileId: string; filePath: string; contentType?: string | null },
      context: AuthContext
    ): Promise<boolean> => {
      await authHelper.requireAuth(context);
      let record;
      try {
        record = await storedFileService.getFileRecordById(fileId);
      } catch (error: unknown) {
        throw new UserInputError(getErrorMessage(error));
      }
      await authHelper.requireOwnerOrAdmin(context, record.owner_user_id);

      await fileStorageService.updateFile(record.storage_key, filePath, contentType ?? null);
      if (contentType !== undefined) {
        await storedFileService.updateFileRecordById(fileId, contentType);
      }
      return true;
    },
    deleteFile: async (
      _parent: undefined,
      { fileId }: { fileId: string },
      context: AuthContext
    ): Promise<boolean> => {
      await authHelper.requireAuth(context);
      let record;
      try {
        record = await storedFileService.getFileRecordById(fileId);
      } catch (error: unknown) {
        throw new UserInputError(getErrorMessage(error));
      }
      await authHelper.requireOwnerOrAdmin(context, record.owner_user_id);

      await fileStorageService.deleteFile(record.storage_key);
      await storedFileService.deleteFileRecordById(fileId);
      return true;
    },
  },
};

export default fileStorageResolvers;
