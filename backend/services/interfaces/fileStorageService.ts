/**
 * Interface for file storage service
 * Provides operations for managing files in Firebase Cloud Storage
 */
export interface IFileStorageService {
  /**
   * Retrieves a signed URL for accessing a file
   * @param fileName name of file
   * @param expirationTimeMinutes expiration time in minutes for generated URL (default: 60)
   * @returns Signed URL to access the file
   * @throws Error if file does not exist or retrieval fails
   */
  getFile(fileName: string, expirationTimeMinutes?: number): Promise<string>;

  /**
   * Creates a new file in storage
   * @param fileName name of file in storage
   * @param filePath local path to file to upload
   * @param contentType MIME type of file (optional)
   * @throws Error if file name already exists or upload fails
   */
  createFile(fileName: string, filePath: string, contentType?: string | null): Promise<void>;

  /**
   * Updates an existing file in storage
   * @param fileName name of file in storage
   * @param filePath local path to file
   * @param contentType MIME type of file (optional)
   * @throws Error if file does not exist or update fails
   */
  updateFile(fileName: string, filePath: string, contentType?: string | null): Promise<void>;

  /**
   * Deletes a file from storage
   * @param fileName name of file to delete
   * @throws Error if file does not exist or deletion fails
   */
  deleteFile(fileName: string): Promise<void>;
}

export default IFileStorageService;
