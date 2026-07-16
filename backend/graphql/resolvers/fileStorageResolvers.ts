import { randomUUID } from 'crypto';

import { UserInputError } from 'apollo-server';

import { AuthContext } from '@/middlewares/auth';
import FarmService from '@/services/implementations/farmService';
import FileStorageService from '@/services/implementations/fileStorageService';
import LocalFileStorageService from '@/services/implementations/localFileStorageService';
import StoredFileService from '@/services/implementations/storedFileService';
import IFarmService from '@/services/interfaces/farmService';
import IFileStorageService from '@/services/interfaces/fileStorageService';
import IStoredFileService from '@/services/interfaces/storedFileService';
import { FarmStatus, StoredFileDTO } from '@/types';
import authHelper from '@/utilities/authHelpers';
import { getErrorMessage } from '@/utilities/errorUtils';

type FarmImageDTO = {
  fileId: string;
  originalFileName: string;
  contentType: string | null;
  url: string;
};

const defaultBucket = process.env.FIREBASE_STORAGE_DEFAULT_BUCKET || '';

// LOCAL DEMO ESCAPE HATCH: Firebase Cloud Storage 403s on every write while the
// project's billing account is disabled, which blocks image uploads entirely.
// Setting USE_LOCAL_FILE_STORAGE=true swaps in a disk-backed implementation of
// the same interface so uploads work locally. Leave it unset/false anywhere real
// — the Firebase-backed FileStorageService below is the production path.
const useLocalFileStorage = process.env.USE_LOCAL_FILE_STORAGE === 'true';
const fileStorageService: IFileStorageService = useLocalFileStorage
  ? new LocalFileStorageService(process.env.LOCAL_FILE_STORAGE_DIR || '/app/uploads')
  : new FileStorageService(defaultBucket);
const storedFileService: IStoredFileService = new StoredFileService();
const farmService: IFarmService = new FarmService();

const toFarmImageDTO = async (record: StoredFileDTO): Promise<FarmImageDTO> => ({
  fileId: record.id,
  originalFileName: record.original_file_name,
  contentType: record.content_type,
  url: await fileStorageService.getFile(record.storage_key),
});

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

      return Promise.all(records.map((record) => toFarmImageDTO(record)));
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

      return toFarmImageDTO(record);
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

  // Field resolver on FarmDTO (merged with farmResolvers in graphql/index.ts).
  // Lives here because this is where the stored-file + storage services are wired.
  FarmDTO: {
    /**
     * The farm's first (oldest) uploaded image, or null when it has none.
     *
     * NOTE: stored_files has no `kind` column yet, so "the farm's image" can only
     * mean images[0] — the same assumption the edit page's "Dashboard Image"
     * makes. Once images are categorised, filter by kind here instead.
     */
    primary_image_url: async (farm: { id: string }): Promise<string | null> => {
      try {
        const records = await storedFileService.getRecordsByFarm(farm.id);
        if (records.length === 0) {
          return null;
        }
        return await fileStorageService.getFile(records[0].storage_key);
      } catch {
        // A single unreadable/missing file must not fail the whole farms query —
        // the card just falls back to its empty state.
        return null;
      }
    },
  },
};

export default fileStorageResolvers;
