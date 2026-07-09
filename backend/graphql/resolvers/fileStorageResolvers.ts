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

type FarmImageDTO = {
  fileId: string;
  originalFileName: string;
  contentType: string | null;
  url: string;
};

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
    filesByFarm: async (
      _parent: undefined,
      { farmId }: { farmId: string },
      context: AuthContext
    ): Promise<FarmImageDTO[]> => {
      const farm = await farmService.getFarmById(farmId);
      await authHelper.requireOwnerOrAdmin(context, farm.owner_user_id);

      const records = await storedFileService.getRecordsByFarm(farmId);

      return Promise.all(
        records.map(async (record) => ({
          fileId: record.id,
          originalFileName: record.original_file_name,
          contentType: record.content_type,
          url: await fileStorageService.getFile(record.storage_key),
        }))
      );
    },
  },
  Mutation: {
    uploadFarmImage: async (
      _parent: undefined,
      {
        farmId,
        originalFileName,
        contentType,
        dataBase64,
      }: {
        farmId: string;
        originalFileName: string;
        contentType: string;
        dataBase64: string;
      },
      context: AuthContext
    ): Promise<FarmImageDTO> => {
      const user = await authHelper.requireAuth(context);
      const farm = await farmService.getFarmById(farmId);
      await authHelper.requireOwnerOrAdmin(context, farm.owner_user_id);

      const buffer = Buffer.from(dataBase64, 'base64');
      if (buffer.length === 0) {
        throw new UserInputError('dataBase64 did not decode to any file bytes.');
      }

      const fileId = randomUUID();
      const storageKey = `farms/${farmId}/${fileId}`;

      await fileStorageService.uploadBytes(storageKey, buffer, contentType);
      const record = await storedFileService.createFileRecord(
        storageKey,
        originalFileName,
        user.id,
        farmId,
        contentType
      );

      return {
        fileId: record.id,
        originalFileName: record.original_file_name,
        contentType: record.content_type,
        url: await fileStorageService.getFile(storageKey),
      };
    },
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
