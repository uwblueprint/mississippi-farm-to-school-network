import FileStorageService from '@/services/implementations/fileStorageService';
import IFileStorageService from '@/services/interfaces/fileStorageService';

const defaultBucket = process.env.FIREBASE_STORAGE_DEFAULT_BUCKET || '';
const fileStorageService: IFileStorageService = new FileStorageService(defaultBucket);

const fileStorageResolvers = {
  Query: {
    getFile: async (_parent: undefined, { fileUUID }: { fileUUID: string }): Promise<string> => {
      return fileStorageService.getFile(fileUUID);
    },
  },
  Mutation: {
    createFile: async (
      _parent: undefined,
      {
        fileName,
        filePath,
        contentType,
      }: { fileName: string; filePath: string; contentType?: string }
    ): Promise<boolean> => {
      await fileStorageService.createFile(fileName, filePath, contentType || null);
      return true;
    },
    updateFile: async (
      _parent: undefined,
      {
        fileName,
        filePath,
        contentType,
      }: { fileName: string; filePath: string; contentType?: string }
    ): Promise<boolean> => {
      await fileStorageService.updateFile(fileName, filePath, contentType || null);
      return true;
    },
    deleteFile: async (
      _parent: undefined,
      { fileName }: { fileName: string }
    ): Promise<boolean> => {
      await fileStorageService.deleteFile(fileName);
      return true;
    },
  },
};

export default fileStorageResolvers;
