import { randomUUID } from 'crypto';

import { UserInputError } from 'apollo-server';

import { AuthContext } from '@/middlewares/auth';
import FarmService from '@/services/implementations/farmService';
import FileStorageService from '@/services/implementations/fileStorageService';
import ImageService from '@/services/implementations/imageService';
import IFarmService from '@/services/interfaces/farmService';
import IFileStorageService from '@/services/interfaces/fileStorageService';
import IImageService from '@/services/interfaces/imageService';
import { FarmStatus, ImageDTO, ImageDimensionsDTO } from '@/types';
import authHelper from '@/utilities/authHelpers';
import { getErrorMessage } from '@/utilities/errorUtils';

const defaultBucket = process.env.FIREBASE_STORAGE_DEFAULT_BUCKET || '';
const fileStorageService: IFileStorageService = new FileStorageService(defaultBucket);
const imageService: IImageService = new ImageService();
const farmService: IFarmService = new FarmService();

function buildStorageKey(farmId: string, imageId: string): string {
  return `farms/${farmId}/${imageId}`;
}

const imageResolvers = {
  Image: {
    farmId: (image: ImageDTO): string => image.farm_id,
    contentType: (image: ImageDTO): string => image.content_type,
    url: (image: ImageDTO): Promise<string> => fileStorageService.getFile(image.storage_key),
  },
  Query: {
    getImages: async (
      _parent: undefined,
      { farmId }: { farmId: string },
      context: AuthContext
    ): Promise<ImageDTO[]> => {
      let farm;
      try {
        farm = await farmService.getFarmById(farmId);
      } catch (error: unknown) {
        throw new UserInputError(getErrorMessage(error));
      }

      if (farm.status !== FarmStatus.APPROVED) {
        await authHelper.requireOwnerOrAdmin(context, farm.owner_user_id);
      }

      return imageService.getImagesByFarm(farmId);
    },
  },
  Mutation: {
    requestImageUploadUrl: async (
      _parent: undefined,
      { farmId, contentType }: { farmId: string; contentType: string },
      context: AuthContext
    ): Promise<{ uploadUrl: string; imageId: string; storageKey: string }> => {
      await authHelper.requireAuth(context);
      const farm = await farmService.getFarmById(farmId);
      await authHelper.requireOwnerOrAdmin(context, farm.owner_user_id);

      const imageId = randomUUID();
      const storageKey = buildStorageKey(farmId, imageId);
      const uploadUrl = await fileStorageService.getUploadUrl(storageKey, contentType);

      return { uploadUrl, imageId, storageKey };
    },
    uploadImageToFarm: async (
      _parent: undefined,
      {
        input,
      }: {
        input: {
          imageId: string;
          farmId: string;
          contentType: string;
          size: number;
          dimensions: ImageDimensionsDTO;
          index?: number | null;
        };
      },
      context: AuthContext
    ): Promise<ImageDTO> => {
      await authHelper.requireAuth(context);
      const farm = await farmService.getFarmById(input.farmId);
      await authHelper.requireOwnerOrAdmin(context, farm.owner_user_id);

      const storageKey = buildStorageKey(input.farmId, input.imageId);
      const exists = await fileStorageService.fileExists(storageKey);
      if (!exists) {
        throw new UserInputError('Uploaded file was not found in storage.');
      }

      const index =
        input.index === undefined || input.index === null
          ? await imageService.getNextIndex(input.farmId)
          : input.index;

      return imageService.createImageRecord(
        input.imageId,
        input.farmId,
        storageKey,
        input.contentType,
        input.size,
        input.dimensions,
        index
      );
    },
    modifyImage: async (
      _parent: undefined,
      {
        imageId,
        input,
      }: { imageId: string; input: { index?: number | null; contentType?: string | null } },
      context: AuthContext
    ): Promise<ImageDTO> => {
      await authHelper.requireAuth(context);
      let image;
      try {
        image = await imageService.getImageById(imageId);
      } catch (error: unknown) {
        throw new UserInputError(getErrorMessage(error));
      }
      const farm = await farmService.getFarmById(image.farm_id);
      await authHelper.requireOwnerOrAdmin(context, farm.owner_user_id);

      return imageService.updateImageRecord(imageId, {
        index: input.index ?? undefined,
        contentType: input.contentType ?? undefined,
      });
    },
    deleteImage: async (
      _parent: undefined,
      { imageId }: { imageId: string },
      context: AuthContext
    ): Promise<boolean> => {
      await authHelper.requireAuth(context);
      let image;
      try {
        image = await imageService.getImageById(imageId);
      } catch (error: unknown) {
        throw new UserInputError(getErrorMessage(error));
      }
      const farm = await farmService.getFarmById(image.farm_id);
      await authHelper.requireOwnerOrAdmin(context, farm.owner_user_id);

      await fileStorageService.deleteFile(image.storage_key);
      await imageService.deleteImageRecord(imageId);
      return true;
    },
  },
};

export default imageResolvers;
