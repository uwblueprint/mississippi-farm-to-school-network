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

/** Mirror of IMAGE_ACCEPT in frontend/src/lib/fileDrop.ts; keep the two in sync. */
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg'];

/** Mirrors MAX_UPLOAD_BYTES in frontend/src/lib/fileDrop.ts; keep the two in sync. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);

/**
 * The declared contentType comes from the client and can lie. Uploads are served
 * back under whatever type they were stored with, so the bytes have to be the
 * image they claim to be — otherwise HTML declared as "image/png" is stored as
 * HTML and executes on the storage origin.
 */
const sniffImageType = (buffer: Buffer): 'image/png' | 'image/jpeg' | null => {
  if (buffer.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) {
    return 'image/png';
  }
  if (buffer.subarray(0, JPEG_MAGIC.length).equals(JPEG_MAGIC)) {
    return 'image/jpeg';
  }
  return null;
};

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

      // A single unreadable/missing file must not empty the whole gallery — the
      // images that still resolve keep rendering.
      const results = await Promise.allSettled(records.map((record) => toFarmImageDTO(record)));
      return results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
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
      if (buffer.length > MAX_UPLOAD_BYTES) {
        throw new UserInputError('Image must be under 10MB.');
      }
      if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
        throw new UserInputError('Only JPG or PNG images can be uploaded.');
      }
      if (sniffImageType(buffer) !== contentType) {
        throw new UserInputError('File contents do not match the declared image type.');
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

      try {
        await fileStorageService.deleteFile(record.storage_key);
      } catch {
        // An already-missing blob must not strand its record: the row would then
        // be undeletable, and the record being gone is the desired end state
        // either way. The storage layer has already logged the reason.
      }
      await storedFileService.deleteFileRecordById(fileId);
      return true;
    },
  },

  // Field resolver on FarmDTO (merged with farmResolvers in graphql/index.ts).
  // Lives here because this is where the stored-file + storage services are wired.
  FarmDTO: {
    /**
     * The farm's cover image, or null when it has none.
     *
     * `cover_photo` holds the stored_files id of the cover image (an id, not a
     * URL — storage URLs are short-lived signed URLs, so they are resolved
     * fresh on every read). Farms from before the cover/carousel buckets
     * existed fall back to their first (oldest) uploaded image.
     */
    primary_image_url: async (farm: {
      id: string;
      cover_photo?: string | null;
    }): Promise<string | null> => {
      try {
        const records = await storedFileService.getRecordsByFarm(farm.id);
        if (records.length === 0) {
          return null;
        }
        const cover = farm.cover_photo
          ? records.find((record) => record.id === farm.cover_photo)
          : undefined;
        return await fileStorageService.getFile((cover ?? records[0]).storage_key);
      } catch {
        // A single unreadable/missing file must not fail the whole farms query —
        // the card just falls back to its empty state.
        return null;
      }
    },
  },
};

export default fileStorageResolvers;
