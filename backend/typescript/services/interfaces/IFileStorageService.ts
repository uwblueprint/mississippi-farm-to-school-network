export interface IFileStorageService {
  /**
   * create a file with the given name and path
   * @param fileName file name
   * @param filePath file path
   * @param fileContentType optional content type
   * @returns void when created successfully
   * @throws Error if creation fails
   */
  createFile(
    fileName: string,
    filePath: string,
    fileContentType?: string,
  ): Promise<void>;

  /**
   * update the file with the given name and path
   * @param fileName file name
   * @param filePath file path
   * @param fileContentType optional content type
   * @returns void when updated successfully
   * @throws Error if update fails
   */
  updateFile(
    fileName: string,
    filePath: string,
    fileContentType?: string,
  ): Promise<void>;

  /**
   * delete the file with the given name
   * @param fileName file name
   * @returns void when deleted successfully
   * @throws Error if deletion fails
   */
  deleteFile(fileName: string): Promise<void>;
}
