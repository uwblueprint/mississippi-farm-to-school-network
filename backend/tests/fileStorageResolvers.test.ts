import { FarmStatus, Role } from '@/types';

const mockGetFarmById = jest.fn();
const mockGetCurrentUser = jest.fn();
const mockUploadBytes = jest.fn();
const mockGetFile = jest.fn();
const mockCreateFileRecord = jest.fn();
const mockGetRecordsByFarm = jest.fn();

jest.mock('@/services/implementations/farmService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getFarmById: mockGetFarmById,
  })),
}));

jest.mock('@/services/implementations/userService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getCurrentUser: mockGetCurrentUser,
  })),
}));

jest.mock('@/services/implementations/fileStorageService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    uploadBytes: mockUploadBytes,
    getFile: mockGetFile,
  })),
}));

jest.mock('@/services/implementations/storedFileService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    createFileRecord: mockCreateFileRecord,
    getRecordsByFarm: mockGetRecordsByFarm,
  })),
}));

import fileStorageResolvers from '@/graphql/resolvers/fileStorageResolvers';

const uploadFarmImage = fileStorageResolvers.Mutation.uploadFarmImage as (
  parent: unknown,
  args: { farmId: string; originalFileName: string; contentType: string; dataBase64: string },
  context: { firebaseUid?: string }
) => Promise<{ fileId: string; originalFileName: string; contentType: string | null; url: string }>;

const filesByFarm = fileStorageResolvers.Query.filesByFarm as (
  parent: unknown,
  args: { farmId: string },
  context: { firebaseUid?: string }
) => Promise<
  Array<{ fileId: string; originalFileName: string; contentType: string | null; url: string }>
>;

const OWNER = { id: 'owner-1', role: Role.FARMER, is_verified: true };
const OTHER = { id: 'other-2', role: Role.FARMER, is_verified: true };
const SIGNED_URL = 'https://signed.example/read';
const HELLO_BASE64 = Buffer.from('hello').toString('base64');

beforeEach(() => {
  mockGetFarmById.mockResolvedValue({
    id: 'farm-1',
    owner_user_id: 'owner-1',
    status: FarmStatus.APPROVED,
  });
  mockGetCurrentUser.mockResolvedValue(OWNER);
  mockGetFile.mockResolvedValue(SIGNED_URL);
});

describe('fileStorageResolvers uploadFarmImage', () => {
  beforeEach(() => {
    mockUploadBytes.mockResolvedValue(undefined);
    mockCreateFileRecord.mockImplementation(async (storageKey: string, name: string) => ({
      id: storageKey.split('/')[2],
      storage_key: storageKey,
      original_file_name: name,
      owner_user_id: 'owner-1',
      farm_id: 'farm-1',
      content_type: 'image/png',
    }));
  });

  test('uploads bytes and returns signed url for the farm owner', async () => {
    const result = await uploadFarmImage(
      null,
      {
        farmId: 'farm-1',
        originalFileName: 'a.png',
        contentType: 'image/png',
        dataBase64: HELLO_BASE64,
      },
      { firebaseUid: 'fb-owner' }
    );

    expect(mockUploadBytes).toHaveBeenCalledTimes(1);
    const [storageKey, buffer, contentType] = mockUploadBytes.mock.calls[0];
    expect(storageKey).toMatch(/^farms\/farm-1\//);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.toString()).toBe('hello');
    expect(contentType).toBe('image/png');
    expect(mockCreateFileRecord).toHaveBeenCalledWith(
      storageKey,
      'a.png',
      'owner-1',
      'farm-1',
      'image/png'
    );
    expect(result.url).toBe(SIGNED_URL);
    expect(result.originalFileName).toBe('a.png');
  });

  test('rejects a non-owner non-admin user', async () => {
    mockGetCurrentUser.mockResolvedValue(OTHER);
    await expect(
      uploadFarmImage(
        null,
        {
          farmId: 'farm-1',
          originalFileName: 'a.png',
          contentType: 'image/png',
          dataBase64: HELLO_BASE64,
        },
        { firebaseUid: 'fb-other' }
      )
    ).rejects.toThrow();
    expect(mockUploadBytes).not.toHaveBeenCalled();
  });

  test('rejects empty decoded bytes', async () => {
    await expect(
      uploadFarmImage(
        null,
        { farmId: 'farm-1', originalFileName: 'a.png', contentType: 'image/png', dataBase64: '' },
        { firebaseUid: 'fb-owner' }
      )
    ).rejects.toThrow('did not decode');
    expect(mockUploadBytes).not.toHaveBeenCalled();
  });
});

describe('fileStorageResolvers filesByFarm', () => {
  beforeEach(() => {
    mockGetRecordsByFarm.mockResolvedValue([
      {
        id: 'file-1',
        storage_key: 'farms/farm-1/file-1',
        original_file_name: 'a.png',
        owner_user_id: 'owner-1',
        farm_id: 'farm-1',
        content_type: 'image/png',
      },
    ]);
  });

  test('returns signed read urls for each farm image', async () => {
    const result = await filesByFarm(null, { farmId: 'farm-1' }, { firebaseUid: 'fb-owner' });
    expect(result).toEqual([
      {
        fileId: 'file-1',
        originalFileName: 'a.png',
        contentType: 'image/png',
        url: SIGNED_URL,
      },
    ]);
    expect(mockGetFile).toHaveBeenCalledWith('farms/farm-1/file-1');
  });

  test('rejects a non-owner non-admin user', async () => {
    mockGetCurrentUser.mockResolvedValue(OTHER);
    await expect(
      filesByFarm(null, { farmId: 'farm-1' }, { firebaseUid: 'fb-other' })
    ).rejects.toThrow();
    expect(mockGetRecordsByFarm).not.toHaveBeenCalled();
  });
});
