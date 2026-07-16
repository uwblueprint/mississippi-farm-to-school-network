import { promises as fs } from 'fs';
import * as path from 'path';

import IFileStorageService from '../interfaces/fileStorageService';
import { getErrorMessage } from '@/utilities/errorUtils';
import logger from '@/utilities/logger';

const Logger = logger(__filename);

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * getFile only receives the key, and keys carry no extension, so recover the
 * MIME type from the bytes. Covers the formats the UI accepts (PNG / JPEG).
 */
function sniffContentType(buffer: Buffer): string {
  if (buffer.subarray(0, 8).equals(PNG_MAGIC)) {
    return 'image/png';
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  return 'application/octet-stream';
}

/**
 * LOCAL-ONLY (demo/dev) implementation of IFileStorageService.
 *
 * Firebase Cloud Storage rejects every write while the project's billing account
 * is disabled ("The billing account for the owning project is disabled"), which
 * blocks farm image uploads entirely. This stores bytes on local disk instead and
 * hands back `data:` URLs, so the upload -> gallery -> delete flow works with no
 * cloud dependency.
 *
 * Selected via USE_LOCAL_FILE_STORAGE=true (see fileStorageResolvers). The real
 * FileStorageService is untouched and is still used whenever the flag is off, so
 * this never affects production.
 *
 * NOT for production: `data:` URLs inline the file bytes into every GraphQL
 * response, and local disk is not shared between instances.
 */
class LocalFileStorageService implements IFileStorageService {
  rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }

  /**
   * Storage keys look like "farms/<farmId>/<fileId>", so keep the nesting but
   * refuse anything that would escape rootDir (e.g. a key containing "..").
   */
  private resolveKey(fileName: string): string {
    const root = path.resolve(this.rootDir);
    const target = path.resolve(root, fileName);
    if (target !== root && !target.startsWith(root + path.sep)) {
      throw new Error(`Invalid storage key: ${fileName}`);
    }
    return target;
  }

  async getFile(fileName: string): Promise<string> {
    try {
      const buffer = await fs.readFile(this.resolveKey(fileName));
      return `data:${sniffContentType(buffer)};base64,${buffer.toString('base64')}`;
    } catch (error: unknown) {
      Logger.error(`Failed to read local file. Reason = ${getErrorMessage(error)}`);
      throw new Error(`File name with ${fileName} does not exist.`);
    }
  }

  async uploadBytes(fileName: string, buffer: Buffer): Promise<void> {
    try {
      const target = this.resolveKey(fileName);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, buffer);
    } catch (error: unknown) {
      Logger.error(`Failed to write local file. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async createFile(fileName: string, filePath: string): Promise<void> {
    await this.uploadBytes(fileName, await fs.readFile(filePath));
  }

  async updateFile(fileName: string, filePath: string): Promise<void> {
    await this.uploadBytes(fileName, await fs.readFile(filePath));
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      await fs.unlink(this.resolveKey(fileName));
    } catch (error: unknown) {
      Logger.error(`Failed to delete local file. Reason = ${getErrorMessage(error)}`);
      throw new Error(`File name with ${fileName} does not exist.`);
    }
  }
}

export default LocalFileStorageService;
