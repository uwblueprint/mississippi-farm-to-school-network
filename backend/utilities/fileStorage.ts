import FileStorageService from '@/services/implementations/fileStorageService';
import LocalFileStorageService from '@/services/implementations/localFileStorageService';
import IFileStorageService from '@/services/interfaces/fileStorageService';

// LOCAL DEMO ESCAPE HATCH: Firebase Cloud Storage 403s on every write while the
// project's billing account is disabled, which blocks image uploads entirely.
// Setting USE_LOCAL_FILE_STORAGE=true swaps in a disk-backed implementation of
// the same interface so uploads work locally. Leave it unset/false anywhere real
// — the Firebase-backed FileStorageService is the production path.
export function createFileStorageService(): IFileStorageService {
  if (process.env.USE_LOCAL_FILE_STORAGE === 'true') {
    return new LocalFileStorageService(process.env.LOCAL_FILE_STORAGE_DIR || '/app/uploads');
  }
  return new FileStorageService(process.env.FIREBASE_STORAGE_DEFAULT_BUCKET || '');
}
