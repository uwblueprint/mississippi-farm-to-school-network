import Image from '@/models/image.model';
import IImageService from '@/services/interfaces/imageService';
import { ImageDTO, ImageDimensionsDTO } from '@/types';
import { getErrorMessage } from '@/utilities/errorUtils';
import logger from '@/utilities/logger';

const Logger = logger(__filename);

function toDTO(row: Image): ImageDTO {
  return {
    id: row.id,
    farm_id: row.farm_id,
    storage_key: row.storage_key,
    content_type: row.content_type,
    size: Number(row.size),
    dimensions: row.dimensions,
    index: row.index,
  };
}

class ImageService implements IImageService {
  async createImageRecord(
    id: string,
    farmId: string,
    storageKey: string,
    contentType: string,
    size: number,
    dimensions: ImageDimensionsDTO,
    index: number
  ): Promise<ImageDTO> {
    try {
      const row = await Image.create({
        id,
        farm_id: farmId,
        storage_key: storageKey,
        content_type: contentType,
        size,
        dimensions,
        index,
      });
      return toDTO(row);
    } catch (error: unknown) {
      Logger.error(`Failed to create image record. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getImagesByFarm(farmId: string): Promise<ImageDTO[]> {
    try {
      const rows = await Image.findAll({
        where: { farm_id: farmId },
        order: [['index', 'ASC']],
      });
      return rows.map(toDTO);
    } catch (error: unknown) {
      Logger.error(`Failed to get images for farm. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getImageById(imageId: string): Promise<ImageDTO> {
    try {
      const row = await Image.findByPk(imageId);
      if (!row) {
        throw new Error(`Image with id ${imageId} not found.`);
      }
      return toDTO(row);
    } catch (error: unknown) {
      Logger.error(`Failed to get image record. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async updateImageRecord(
    imageId: string,
    updates: { index?: number; contentType?: string }
  ): Promise<ImageDTO> {
    try {
      const row = await Image.findByPk(imageId);
      if (!row) {
        throw new Error(`Image with id ${imageId} not found.`);
      }
      if (updates.index !== undefined) {
        row.index = updates.index;
      }
      if (updates.contentType !== undefined) {
        row.content_type = updates.contentType;
      }
      await row.save();
      await row.reload();
      return toDTO(row);
    } catch (error: unknown) {
      Logger.error(`Failed to update image record. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async deleteImageRecord(imageId: string): Promise<void> {
    try {
      const row = await Image.findByPk(imageId);
      if (!row) {
        throw new Error(`Image with id ${imageId} not found.`);
      }
      await row.destroy();
    } catch (error: unknown) {
      Logger.error(`Failed to delete image record. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getNextIndex(farmId: string): Promise<number> {
    try {
      const max = (await Image.max('index', { where: { farm_id: farmId } })) as number | null;
      return max === null ? 0 : max + 1;
    } catch (error: unknown) {
      Logger.error(`Failed to compute next image index. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }
}

export default ImageService;
