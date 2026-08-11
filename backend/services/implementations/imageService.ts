import IImageService from '@/services/interfaces/imageService';
import { ImageDTO, ImageDimensionsDTO } from '@/types';
import { getErrorMessage } from '@/utilities/errorUtils';
import logger from '@/utilities/logger';
import { Collections, getFirestore } from '@/utilities/firestore';

const Logger = logger(__filename);

type ImageDoc = {
  farm_id: string;
  storage_key: string;
  content_type: string;
  size: number;
  dimensions: ImageDimensionsDTO;
  index: number;
};

function toDTO(id: string, row: ImageDoc): ImageDTO {
  return {
    id,
    farm_id: row.farm_id,
    storage_key: row.storage_key,
    content_type: row.content_type,
    size: Number(row.size),
    dimensions: row.dimensions,
    index: row.index,
  };
}

class ImageService implements IImageService {
  private images() {
    return getFirestore().collection(Collections.images);
  }

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
      const data: ImageDoc = {
        farm_id: farmId,
        storage_key: storageKey,
        content_type: contentType,
        size,
        dimensions,
        index,
      };
      await this.images().doc(id).set(data);
      return toDTO(id, data);
    } catch (error: unknown) {
      Logger.error(`Failed to create image record. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getImagesByFarm(farmId: string): Promise<ImageDTO[]> {
    try {
      const snap = await this.images().where('farm_id', '==', farmId).get();
      return snap.docs
        .map((doc) => toDTO(doc.id, doc.data() as ImageDoc))
        .sort((a, b) => a.index - b.index);
    } catch (error: unknown) {
      Logger.error(`Failed to get images for farm. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getImageById(imageId: string): Promise<ImageDTO> {
    try {
      const doc = await this.images().doc(imageId).get();
      if (!doc.exists) {
        throw new Error(`Image with id ${imageId} not found.`);
      }
      return toDTO(doc.id, doc.data() as ImageDoc);
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
      const ref = this.images().doc(imageId);
      const doc = await ref.get();
      if (!doc.exists) {
        throw new Error(`Image with id ${imageId} not found.`);
      }
      const data = doc.data() as ImageDoc;
      if (updates.index !== undefined) {
        data.index = updates.index;
      }
      if (updates.contentType !== undefined) {
        data.content_type = updates.contentType;
      }
      await ref.set(data);
      return toDTO(imageId, data);
    } catch (error: unknown) {
      Logger.error(`Failed to update image record. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async deleteImageRecord(imageId: string): Promise<void> {
    try {
      const ref = this.images().doc(imageId);
      const doc = await ref.get();
      if (!doc.exists) {
        throw new Error(`Image with id ${imageId} not found.`);
      }
      await ref.delete();
    } catch (error: unknown) {
      Logger.error(`Failed to delete image record. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getNextIndex(farmId: string): Promise<number> {
    try {
      const snap = await this.images().where('farm_id', '==', farmId).get();
      let max = -1;
      for (const doc of snap.docs) {
        const index = (doc.data() as ImageDoc).index;
        if (typeof index === 'number' && index > max) {
          max = index;
        }
      }
      return max + 1;
    } catch (error: unknown) {
      Logger.error(`Failed to compute next image index. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }
}

export default ImageService;
