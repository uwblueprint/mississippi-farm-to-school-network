import StoredFile from '@/models/storedFile.model';
import IStoredFileService from '@/services/interfaces/storedFileService';
import { StoredFileDTO } from '@/types';
import { getErrorMessage } from '@/utilities/errorUtils';
import logger from '@/utilities/logger';

const Logger = logger(__filename);

const STORAGE_KEY_PATTERN =
  /^farms\/([^/]+)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

function parseFileIdFromStorageKey(storageKey: string, farmId: string): string {
  const match = STORAGE_KEY_PATTERN.exec(storageKey);
  if (!match || match[1] !== farmId) {
    throw new Error('Invalid storage key for farm.');
  }
  return match[2];
}

function toDTO(row: StoredFile): StoredFileDTO {
  return {
    id: row.id,
    storage_key: row.storage_key,
    original_file_name: row.original_file_name,
    owner_user_id: row.owner_user_id,
    farm_id: row.farm_id,
    content_type: row.content_type,
  };
}

class StoredFileService implements IStoredFileService {
  async createFileRecord(
    storageKey: string,
    originalFileName: string,
    ownerUserId: string,
    farmId: string,
    contentType?: string | null
  ): Promise<StoredFileDTO> {
    try {
      const id = parseFileIdFromStorageKey(storageKey, farmId);
      const row = await StoredFile.create({
        id,
        storage_key: storageKey,
        original_file_name: originalFileName,
        owner_user_id: ownerUserId,
        farm_id: farmId,
        content_type: contentType ?? null,
      });
      return toDTO(row);
    } catch (error: unknown) {
      Logger.error(`Failed to create stored file record. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getFileRecordById(fileId: string): Promise<StoredFileDTO> {
    try {
      const row = await StoredFile.findByPk(fileId);
      if (!row) {
        throw new Error(`File with id ${fileId} not found.`);
      }
      return toDTO(row);
    } catch (error: unknown) {
      Logger.error(`Failed to get stored file record. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async updateFileRecordById(fileId: string, contentType?: string | null): Promise<StoredFileDTO> {
    try {
      const row = await StoredFile.findByPk(fileId);
      if (!row) {
        throw new Error(`File with id ${fileId} not found.`);
      }
      if (contentType !== undefined) {
        row.content_type = contentType;
      }
      await row.save();
      await row.reload();
      return toDTO(row);
    } catch (error: unknown) {
      Logger.error(`Failed to update stored file record. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async deleteFileRecordById(fileId: string): Promise<void> {
    try {
      const row = await StoredFile.findByPk(fileId);
      if (!row) {
        throw new Error(`File with id ${fileId} not found.`);
      }
      await row.destroy();
    } catch (error: unknown) {
      Logger.error(`Failed to delete stored file record. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }
}

export default StoredFileService;
