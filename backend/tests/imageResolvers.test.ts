import { FarmStatus } from '@/types';
import type { AuthContext } from '@/middlewares/auth';

const mockGetFarmById = jest.fn();
const mockGetUploadUrl = jest.fn();
const mockFileExists = jest.fn();
const mockGetFile = jest.fn();
const mockDeleteFile = jest.fn();
const mockCreateImageRecord = jest.fn();
const mockGetImagesByFarm = jest.fn();
const mockGetImageById = jest.fn();
const mockUpdateImageRecord = jest.fn();
const mockDeleteImageRecord = jest.fn();
const mockGetNextIndex = jest.fn();
const mockRequireAuth = jest.fn();
const mockRequireOwnerOrAdmin = jest.fn();
const mockRandomUUID = jest.fn();

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: () => mockRandomUUID(),
}));

jest.mock('@/services/implementations/farmService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ getFarmById: mockGetFarmById })),
}));

jest.mock('@/services/implementations/fileStorageService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getUploadUrl: mockGetUploadUrl,
    fileExists: mockFileExists,
    getFile: mockGetFile,
    deleteFile: mockDeleteFile,
  })),
}));

jest.mock('@/services/implementations/imageService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    createImageRecord: mockCreateImageRecord,
    getImagesByFarm: mockGetImagesByFarm,
    getImageById: mockGetImageById,
    updateImageRecord: mockUpdateImageRecord,
    deleteImageRecord: mockDeleteImageRecord,
    getNextIndex: mockGetNextIndex,
  })),
}));

jest.mock('@/utilities/authHelpers', () => ({
  __esModule: true,
  default: {
    requireAuth: mockRequireAuth,
    requireOwnerOrAdmin: mockRequireOwnerOrAdmin,
  },
}));

import imageResolvers from '@/graphql/resolvers/imageResolvers';

const authContext = {} as AuthContext;

const mutation = imageResolvers.Mutation as unknown as {
  requestImageUploadUrl: (
    parent: unknown,
    args: { farmId: string; contentType: string },
    context: AuthContext
  ) => Promise<{ uploadUrl: string; imageId: string; storageKey: string }>;
  uploadImageToFarm: (
    parent: unknown,
    args: { input: Record<string, unknown> },
    context: AuthContext
  ) => Promise<{ index: number }>;
  modifyImage: (
    parent: unknown,
    args: { imageId: string; input: Record<string, unknown> },
    context: AuthContext
  ) => Promise<unknown>;
  deleteImage: (
    parent: unknown,
    args: { imageId: string },
    context: AuthContext
  ) => Promise<boolean>;
};

const getImages = imageResolvers.Query.getImages as unknown as (
  parent: unknown,
  args: { farmId: string },
  context: AuthContext
) => Promise<unknown>;

const imageField = imageResolvers.Image as unknown as {
  farmId: (image: { farm_id: string }) => string;
  contentType: (image: { content_type: string }) => string;
  url: (image: { storage_key: string }) => Promise<string>;
};

beforeEach(() => {
  mockRequireAuth.mockResolvedValue({ id: 'owner-1' });
  mockRequireOwnerOrAdmin.mockResolvedValue({ id: 'owner-1' });
  mockGetFarmById.mockResolvedValue({ owner_user_id: 'owner-1', status: FarmStatus.APPROVED });
  mockRandomUUID.mockReturnValue('img-uuid');
  mockGetUploadUrl.mockResolvedValue('https://upload.example/signed');
  mockFileExists.mockResolvedValue(true);
  mockGetNextIndex.mockResolvedValue(7);
  mockGetImagesByFarm.mockResolvedValue([]);
  mockGetFile.mockResolvedValue('https://read.example/signed');
  mockCreateImageRecord.mockImplementation(
    async (
      id: string,
      farmId: string,
      storageKey: string,
      contentType: string,
      size: number,
      dimensions: unknown,
      index: number
    ) => ({
      id,
      farm_id: farmId,
      storage_key: storageKey,
      content_type: contentType,
      size,
      dimensions,
      index,
    })
  );
});

describe('imageResolvers.Mutation.requestImageUploadUrl', () => {
  test('builds the farm-scoped storage key and returns the signed upload target', async () => {
    const result = await mutation.requestImageUploadUrl(
      undefined,
      { farmId: 'farm-1', contentType: 'image/jpeg' },
      authContext
    );

    expect(result).toEqual({
      uploadUrl: 'https://upload.example/signed',
      imageId: 'img-uuid',
      storageKey: 'farms/farm-1/img-uuid',
    });
    expect(mockGetUploadUrl).toHaveBeenCalledWith('farms/farm-1/img-uuid', 'image/jpeg');
    expect(mockRequireOwnerOrAdmin).toHaveBeenCalledWith(authContext, 'owner-1');
  });
});

describe('imageResolvers.Mutation.uploadImageToFarm', () => {
  const baseInput = {
    imageId: 'img-uuid',
    farmId: 'farm-1',
    contentType: 'image/jpeg',
    size: 2048,
    dimensions: { width: 100, height: 200 },
  };

  test('auto-assigns the next index when none is provided', async () => {
    const result = await mutation.uploadImageToFarm(undefined, { input: baseInput }, authContext);

    expect(mockGetNextIndex).toHaveBeenCalledWith('farm-1');
    expect(mockCreateImageRecord).toHaveBeenCalledWith(
      'img-uuid',
      'farm-1',
      'farms/farm-1/img-uuid',
      'image/jpeg',
      2048,
      { width: 100, height: 200 },
      7
    );
    expect(result.index).toBe(7);
  });

  test('uses the provided index without calling getNextIndex', async () => {
    await mutation.uploadImageToFarm(undefined, { input: { ...baseInput, index: 0 } }, authContext);

    expect(mockGetNextIndex).not.toHaveBeenCalled();
    expect(mockCreateImageRecord).toHaveBeenCalledWith(
      'img-uuid',
      'farm-1',
      'farms/farm-1/img-uuid',
      'image/jpeg',
      2048,
      { width: 100, height: 200 },
      0
    );
  });

  test('throws when the uploaded object is missing from storage', async () => {
    mockFileExists.mockResolvedValue(false);

    await expect(
      mutation.uploadImageToFarm(undefined, { input: baseInput }, authContext)
    ).rejects.toThrow('Uploaded file was not found in storage.');
    expect(mockCreateImageRecord).not.toHaveBeenCalled();
  });
});

describe('imageResolvers.Query.getImages', () => {
  test('does not require ownership for an approved farm', async () => {
    mockGetFarmById.mockResolvedValue({ owner_user_id: 'owner-1', status: FarmStatus.APPROVED });

    await getImages(undefined, { farmId: 'farm-1' }, authContext);

    expect(mockRequireOwnerOrAdmin).not.toHaveBeenCalled();
    expect(mockGetImagesByFarm).toHaveBeenCalledWith('farm-1');
  });

  test('requires ownership for a non-approved farm', async () => {
    mockGetFarmById.mockResolvedValue({
      owner_user_id: 'owner-1',
      status: FarmStatus.PENDING_APPROVAL,
    });

    await getImages(undefined, { farmId: 'farm-1' }, authContext);

    expect(mockRequireOwnerOrAdmin).toHaveBeenCalledWith(authContext, 'owner-1');
  });

  test('wraps a missing-farm error as a user input error', async () => {
    mockGetFarmById.mockRejectedValue(new Error('Farm with id farm-x not found.'));

    await expect(getImages(undefined, { farmId: 'farm-x' }, authContext)).rejects.toThrow(
      'Farm with id farm-x not found.'
    );
  });
});

describe('imageResolvers.Image field resolvers', () => {
  test('map snake_case fields and resolve a signed read url', async () => {
    expect(imageField.farmId({ farm_id: 'farm-1' })).toBe('farm-1');
    expect(imageField.contentType({ content_type: 'image/png' })).toBe('image/png');

    await expect(imageField.url({ storage_key: 'farms/farm-1/img-1' })).resolves.toBe(
      'https://read.example/signed'
    );
    expect(mockGetFile).toHaveBeenCalledWith('farms/farm-1/img-1');
  });
});

describe('imageResolvers.Mutation.deleteImage', () => {
  test('removes the file from storage and the row from the database', async () => {
    mockGetImageById.mockResolvedValue({
      farm_id: 'farm-1',
      storage_key: 'farms/farm-1/img-1',
    });

    const result = await mutation.deleteImage(undefined, { imageId: 'img-1' }, authContext);

    expect(mockDeleteFile).toHaveBeenCalledWith('farms/farm-1/img-1');
    expect(mockDeleteImageRecord).toHaveBeenCalledWith('img-1');
    expect(result).toBe(true);
  });
});
