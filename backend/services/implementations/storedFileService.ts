import IStoredFileService from '@/services/interfaces/storedFileService';
import { StoredFileDTO } from '@/types';
import { getErrorMessage } from '@/utilities/errorUtils';
import logger from '@/utilities/logger';
import { Collections, getFirestore } from '@/utilities/firestore';

const Logger = logger(__filename);

const STORAGE_KEY_PATTERN =
  /^farms\/([^/]+)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

type StoredFileDoc = {
  storage_key: string;
  original_file_name: string;
  owner_user_id: string;
  farm_id: string;
  content_type: string | null;
  createdAt: string;
};

function parseFileIdFromStorageKey(storageKey: string, farmId: string): string {
  const match = STORAGE_KEY_PATTERN.exec(storageKey);
  if (!match || match[1] !== farmId) {
    throw new Error('Invalid storage key for farm.');
  }
  return match[2];
}

function toDTO(id: string, row: StoredFileDoc): StoredFileDTO {
  return {
    id,
    storage_key: row.storage_key,
    original_file_name: row.original_file_name,
    owner_user_id: row.owner_user_id,
    farm_id: row.farm_id,
    content_type: row.content_type,
  };
}

class StoredFileService implements IStoredFileService {
  private files() {
    return getFirestore().collection(Collections.storedFiles);
  }

  async createFileRecord(
    storageKey: string,
    originalFileName: string,
    ownerUserId: string,
    farmId: string,
    contentType?: string | null
  ): Promise<StoredFileDTO> {
    try {
      const id = parseFileIdFromStorageKey(storageKey, farmId);
      const data: StoredFileDoc = {
        storage_key: storageKey,
        original_file_name: originalFileName,
        owner_user_id: ownerUserId,
        farm_id: farmId,
        content_type: contentType ?? null,
        createdAt: new Date().toISOString(),
      };
      await this.files().doc(id).set(data);
      return toDTO(id, data);
    } catch (error: unknown) {
      Logger.error(`Failed to create stored file record. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getFileRecordById(fileId: string): Promise<StoredFileDTO> {
    try {
      const doc = await this.files().doc(fileId).get();
      if (!doc.exists) {
        throw new Error(`File with id ${fileId} not found.`);
      }
      return toDTO(doc.id, doc.data() as StoredFileDoc);
    } catch (error: unknown) {
      Logger.error(`Failed to get stored file record. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getRecordsByFarm(farmId: string): Promise<StoredFileDTO[]> {
    try {
      const snap = await this.files().where('farm_id', '==', farmId).get();
      return snap.docs
        .map((doc) => toDTO(doc.id, doc.data() as StoredFileDoc))
        .sort((a, b) => {
          const aCreated = (snap.docs.find((d) => d.id === a.id)?.data() as StoredFileDoc)
            ?.createdAt;
          const bCreated = (snap.docs.find((d) => d.id === b.id)?.data() as StoredFileDoc)
            ?.createdAt;
          return String(aCreated ?? '').localeCompare(String(bCreated ?? ''));
        });
    } catch (error: unknown) {
      Logger.error(`Failed to list stored file records. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async updateFileRecordById(fileId: string, contentType?: string | null): Promise<StoredFileDTO> {
    try {
      const ref = this.files().doc(fileId);
      const doc = await ref.get();
      if (!doc.exists) {
        throw new Error(`File with id ${fileId} not found.`);
      }
      const data = doc.data() as StoredFileDoc;
      if (contentType !== undefined) {
        data.content_type = contentType;
      }
      await ref.set(data);
      return toDTO(fileId, data);
    } catch (error: unknown) {
      Logger.error(`Failed to update stored file record. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async deleteFileRecordById(fileId: string): Promise<void> {
    try {
      const ref = this.files().doc(fileId);
      const doc = await ref.get();
      if (!doc.exists) {
        throw new Error(`File with id ${fileId} not found.`);
      }
      await ref.delete();
    } catch (error: unknown) {
      Logger.error(`Failed to delete stored file record. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }
}

export default StoredFileService;
