const mockCreate = jest.fn();
const mockFindAll = jest.fn();
const mockFindByPk = jest.fn();
const mockMax = jest.fn();

jest.mock('@/models/image.model', () => ({
  __esModule: true,
  default: {
    create: mockCreate,
    findAll: mockFindAll,
    findByPk: mockFindByPk,
    max: mockMax,
  },
}));

import ImageService from '@/services/implementations/imageService';

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'img-1',
  farm_id: 'farm-1',
  storage_key: 'farms/farm-1/img-1',
  content_type: 'image/jpeg',
  // BIGINT columns come back from postgres as strings; toDTO should coerce to number
  size: '2048',
  dimensions: { width: 100, height: 200 },
  index: 0,
  ...overrides,
});

describe('ImageService.createImageRecord', () => {
  const service = new ImageService();

  test('persists the row with the given id and returns a numeric size', async () => {
    mockCreate.mockResolvedValue(makeRow());

    const dto = await service.createImageRecord(
      'img-1',
      'farm-1',
      'farms/farm-1/img-1',
      'image/jpeg',
      2048,
      { width: 100, height: 200 },
      0
    );

    expect(mockCreate).toHaveBeenCalledWith({
      id: 'img-1',
      farm_id: 'farm-1',
      storage_key: 'farms/farm-1/img-1',
      content_type: 'image/jpeg',
      size: 2048,
      dimensions: { width: 100, height: 200 },
      index: 0,
    });
    expect(dto.size).toBe(2048);
    expect(typeof dto.size).toBe('number');
    expect(dto).toMatchObject({ id: 'img-1', farm_id: 'farm-1', index: 0 });
  });
});

describe('ImageService.getImagesByFarm', () => {
  const service = new ImageService();

  test('queries by farm ordered by index ascending and maps to DTOs', async () => {
    mockFindAll.mockResolvedValue([makeRow({ id: 'a', index: 0 }), makeRow({ id: 'b', index: 1 })]);

    const dtos = await service.getImagesByFarm('farm-1');

    expect(mockFindAll).toHaveBeenCalledWith({
      where: { farm_id: 'farm-1' },
      order: [['index', 'ASC']],
    });
    expect(dtos.map((d) => d.id)).toEqual(['a', 'b']);
  });
});

describe('ImageService.getImageById', () => {
  const service = new ImageService();

  test('returns the DTO when found', async () => {
    mockFindByPk.mockResolvedValue(makeRow());
    await expect(service.getImageById('img-1')).resolves.toMatchObject({ id: 'img-1' });
  });

  test('throws when not found', async () => {
    mockFindByPk.mockResolvedValue(null);
    await expect(service.getImageById('missing')).rejects.toThrow(
      'Image with id missing not found.'
    );
  });
});

describe('ImageService.updateImageRecord', () => {
  const service = new ImageService();

  test('updates provided fields, then saves and reloads', async () => {
    const row = {
      ...makeRow(),
      save: jest.fn().mockResolvedValue(undefined),
      reload: jest.fn().mockResolvedValue(undefined),
    };
    mockFindByPk.mockResolvedValue(row);

    const dto = await service.updateImageRecord('img-1', { index: 3, contentType: 'image/png' });

    expect(row.index).toBe(3);
    expect(row.content_type).toBe('image/png');
    expect(row.save).toHaveBeenCalled();
    expect(row.reload).toHaveBeenCalled();
    expect(dto.index).toBe(3);
  });

  test('throws when not found', async () => {
    mockFindByPk.mockResolvedValue(null);
    await expect(service.updateImageRecord('missing', { index: 1 })).rejects.toThrow('not found');
  });
});

describe('ImageService.deleteImageRecord', () => {
  const service = new ImageService();

  test('destroys the row when found', async () => {
    const row = { ...makeRow(), destroy: jest.fn().mockResolvedValue(undefined) };
    mockFindByPk.mockResolvedValue(row);

    await service.deleteImageRecord('img-1');

    expect(row.destroy).toHaveBeenCalled();
  });

  test('throws when not found', async () => {
    mockFindByPk.mockResolvedValue(null);
    await expect(service.deleteImageRecord('missing')).rejects.toThrow('not found');
  });
});

describe('ImageService.getNextIndex', () => {
  const service = new ImageService();

  test('returns 0 when the farm has no images', async () => {
    mockMax.mockResolvedValue(null);
    await expect(service.getNextIndex('farm-1')).resolves.toBe(0);
  });

  test('returns max index + 1 when images exist', async () => {
    mockMax.mockResolvedValue(4);
    await expect(service.getNextIndex('farm-1')).resolves.toBe(5);
    expect(mockMax).toHaveBeenCalledWith('index', { where: { farm_id: 'farm-1' } });
  });
});
