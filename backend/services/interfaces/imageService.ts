import { ImageDTO, ImageDimensionsDTO } from '@/types';

interface IImageService {
  /**
   * Persist a new image metadata row for a farm.
   * @param id id of the image (matches the id encoded in the storage key)
   * @param farmId id of the farm the image belongs to
   * @param storageKey key of the uploaded object in cloud storage
   * @param contentType MIME type of the uploaded image
   * @param size size of the uploaded image in bytes
   * @param dimensions pixel dimensions of the image
   * @param index ordering index (0 = thumbnail, >= 1 = gallery order)
   * @returns the created ImageDTO
   * @throws Error if creation fails
   */
  createImageRecord(
    id: string,
    farmId: string,
    storageKey: string,
    contentType: string,
    size: number,
    dimensions: ImageDimensionsDTO,
    index: number
  ): Promise<ImageDTO>;

  /**
   * Get all images for a farm ordered by index ascending.
   * @param farmId id of the farm
   * @returns array of ImageDTOs ordered by index
   * @throws Error if retrieval fails
   */
  getImagesByFarm(farmId: string): Promise<ImageDTO[]>;

  /**
   * Get a single image by id.
   * @param imageId id of the image
   * @returns the ImageDTO
   * @throws Error if the image does not exist
   */
  getImageById(imageId: string): Promise<ImageDTO>;

  /**
   * Update mutable metadata on an image.
   * @param imageId id of the image
   * @param updates fields to update (index and/or content type)
   * @returns the updated ImageDTO
   * @throws Error if the image does not exist or the update fails
   */
  updateImageRecord(
    imageId: string,
    updates: { index?: number; contentType?: string }
  ): Promise<ImageDTO>;

  /**
   * Delete an image metadata row.
   * @param imageId id of the image
   * @throws Error if the image does not exist or deletion fails
   */
  deleteImageRecord(imageId: string): Promise<void>;

  /**
   * Get the next available index for a farm (max existing index + 1, or 0 if none).
   * @param farmId id of the farm
   * @returns the next index to assign
   * @throws Error if retrieval fails
   */
  getNextIndex(farmId: string): Promise<number>;
}

export default IImageService;
