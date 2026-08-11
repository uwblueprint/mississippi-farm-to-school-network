import { CreateFarmInput, FarmRejectionResolutionType, FarmStatus } from '@/types';
import { FakeFirestore } from './helpers/fakeFirestore';

let mockFirestoreInstance: FakeFirestore;

jest.mock('@/utilities/firestore', () => ({
  ...jest.requireActual('@/utilities/firestore'),
  getFirestore: () => mockFirestoreInstance,
}));

const mockSendEmail = jest.fn();
jest.mock('@/services/implementations/emailService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ sendEmail: mockSendEmail })),
}));

const mockGetUserById = jest.fn();
jest.mock('@/services/implementations/userService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ getUserById: mockGetUserById })),
}));

import FarmService from '@/services/implementations/farmService';

const baseInput: CreateFarmInput = {
  farm_name: 'Test Farm',
  primary_phone: '555-555-5555',
  primary_email: 'farm@example.com',
  farm_address: '123 Farm Rd',
  usda_farm_id: 'usda-1',
  county: 'Hinds',
  location: { lat: 32.3, lng: -90.18 },
  seasonal_products: [],
  meat_products: [],
  other_products: [],
  growing_practices: [],
  food_safety_certifications: [],
};

describe('FarmService (Firestore)', () => {
  let service: FarmService;

  beforeEach(() => {
    mockFirestoreInstance = new FakeFirestore();
    service = new FarmService();
    mockSendEmail.mockReset().mockResolvedValue(undefined);
    mockGetUserById.mockReset();
  });

  describe('createFarm', () => {
    test('creates a farm and reserves its usda_farm_id', async () => {
      const farm = await service.createFarm('owner-1', baseInput);
      expect(farm.owner_user_id).toBe('owner-1');
      expect(farm.usda_farm_id).toBe('usda-1');
      expect(farm.status).toBe(FarmStatus.PENDING_APPROVAL);
    });

    test('rejects a second farm created with an already-used usda_farm_id', async () => {
      await service.createFarm('owner-1', baseInput);

      await expect(
        service.createFarm('owner-2', { ...baseInput, farm_name: 'Other Farm' })
      ).rejects.toThrow('Farm with that USDA farm ID already exists.');
    });

    test('two farms with different usda_farm_ids can both be created', async () => {
      await service.createFarm('owner-1', baseInput);
      await expect(
        service.createFarm('owner-2', { ...baseInput, usda_farm_id: 'usda-2' })
      ).resolves.toMatchObject({ usda_farm_id: 'usda-2' });
    });
  });

  describe('updateFarm usda_farm_id reassignment', () => {
    test('moving a farm to a usda_farm_id already used by another farm is rejected', async () => {
      const farmA = await service.createFarm('owner-1', baseInput);
      await service.createFarm('owner-2', { ...baseInput, usda_farm_id: 'usda-2' });

      await expect(service.updateFarm(farmA.id, { usda_farm_id: 'usda-2' })).rejects.toThrow(
        'Farm with that USDA farm ID already exists.'
      );
    });

    test('a farm can be moved to a free usda_farm_id, freeing up the old one for reuse', async () => {
      const farmA = await service.createFarm('owner-1', baseInput);

      await service.updateFarm(farmA.id, { usda_farm_id: 'usda-new' });

      // usda-1 should be free again for a new farm.
      await expect(
        service.createFarm('owner-2', { ...baseInput, usda_farm_id: 'usda-1' })
      ).resolves.toMatchObject({ usda_farm_id: 'usda-1' });
    });
  });

  describe('resubmitFarm', () => {
    test('moves a rejected farm back to PENDING_APPROVAL and resolves open rejections atomically', async () => {
      const farm = await service.createFarm('owner-1', baseInput);
      // createFarmRejection both records the rejection and flips the farm to REJECTED.
      await service.createFarmRejection(farm.id, 'admin-1', 'Missing details');

      const resubmitted = await service.resubmitFarm(farm.id, 'owner-1', {
        farm_name: 'Updated Farm Name',
      });

      expect(resubmitted.status).toBe(FarmStatus.PENDING_APPROVAL);
      expect(resubmitted.farm_name).toBe('Updated Farm Name');

      const rejection = await service.getLatestFarmRejectionByFarmId(farm.id);
      expect(rejection?.resolved_at).not.toBeNull();
      expect(rejection?.resolution_type).toBe(FarmRejectionResolutionType.RESUBMITTED);
    });

    test('throws when the farm is not currently REJECTED', async () => {
      const farm = await service.createFarm('owner-1', baseInput);
      await expect(
        service.resubmitFarm(farm.id, 'owner-1', { farm_name: 'New Name' })
      ).rejects.toThrow('not REJECTED');
    });
  });
});
