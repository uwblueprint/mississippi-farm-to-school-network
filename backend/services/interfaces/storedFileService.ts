import { StoredFileDTO } from '@/types';

interface IStoredFileService {
  createFileRecord(
    storageKey: string,
    originalFileName: string,
    ownerUserId: string,
    farmId: string,
    contentType?: string | null
  ): Promise<StoredFileDTO>;

  getFileRecordById(fileId: string): Promise<StoredFileDTO>;

  updateFileRecordById(fileId: string, contentType?: string | null): Promise<StoredFileDTO>;

  deleteFileRecordById(fileId: string): Promise<void>;
}

export default IStoredFileService;
