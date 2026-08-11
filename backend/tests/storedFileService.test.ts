import { FakeFirestore } from './helpers/fakeFirestore';

let mockFirestoreInstance: FakeFirestore;

jest.mock('@/utilities/firestore', () => ({
  ...jest.requireActual('@/utilities/firestore'),
  getFirestore: () => mockFirestoreInstance,
}));

import StoredFileService from '@/services/implementations/storedFileService';

const FARM_ID = 'farm-1';
const FILE_UUIDS = [
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
];

describe('StoredFileService.getRecordsByFarm', () => {
  let service: StoredFileService;

  beforeEach(() => {
    mockFirestoreInstance = new FakeFirestore();
    service = new StoredFileService();
  });

  test('returns a farm’s files sorted ascending by createdAt, regardless of insertion order', async () => {
    // Insert out of chronological order to make sure the result is actually sorted,
    // not just returned in whatever order Firestore happened to hand back the docs.
    await mockFirestoreInstance
      .collection('stored_files')
      .doc(FILE_UUIDS[1])
      .set({
        storage_key: `farms/${FARM_ID}/${FILE_UUIDS[1]}`,
        original_file_name: 'second.png',
        owner_user_id: 'owner-1',
        farm_id: FARM_ID,
        content_type: 'image/png',
        createdAt: '2026-01-02T00:00:00.000Z',
      });
    await mockFirestoreInstance
      .collection('stored_files')
      .doc(FILE_UUIDS[0])
      .set({
        storage_key: `farms/${FARM_ID}/${FILE_UUIDS[0]}`,
        original_file_name: 'first.png',
        owner_user_id: 'owner-1',
        farm_id: FARM_ID,
        content_type: 'image/png',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    await mockFirestoreInstance
      .collection('stored_files')
      .doc(FILE_UUIDS[2])
      .set({
        storage_key: `farms/${FARM_ID}/${FILE_UUIDS[2]}`,
        original_file_name: 'third.png',
        owner_user_id: 'owner-1',
        farm_id: FARM_ID,
        content_type: 'image/png',
        createdAt: '2026-01-03T00:00:00.000Z',
      });

    const records = await service.getRecordsByFarm(FARM_ID);

    expect(records.map((r) => r.original_file_name)).toEqual([
      'first.png',
      'second.png',
      'third.png',
    ]);
  });

  test('only returns files belonging to the requested farm', async () => {
    await service.createFileRecord(
      `farms/${FARM_ID}/${FILE_UUIDS[0]}`,
      'mine.png',
      'owner-1',
      FARM_ID
    );
    await service.createFileRecord(
      `farms/other-farm/${FILE_UUIDS[1]}`,
      'not-mine.png',
      'owner-2',
      'other-farm'
    );

    const records = await service.getRecordsByFarm(FARM_ID);
    expect(records).toHaveLength(1);
    expect(records[0].original_file_name).toBe('mine.png');
  });
});
