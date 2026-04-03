import { down, up } from '@/migrations/2026.04.02T00.00.00.create_farm_rejections_table';

describe('farm_rejections migration', () => {
  test('migration up creates farm_rejections table with expected columns and constraints', async () => {
    const createTable = jest.fn().mockResolvedValue(undefined);
    const addIndex = jest.fn().mockResolvedValue(undefined);

    const context = {
      getQueryInterface: () => ({
        createTable,
        addIndex,
      }),
    };

    await up({ context } as never);

    expect(createTable).toHaveBeenCalledTimes(1);

    const [tableName, schema] = createTable.mock.calls[0] as [
      string,
      Record<string, { allowNull?: boolean; onUpdate?: string; onDelete?: string }>,
    ];

    expect(tableName).toBe('farm_rejections');
    expect(schema.id?.allowNull).toBe(false);
    expect(schema.farm_id?.allowNull).toBe(false);
    expect(schema.farm_id?.onUpdate).toBe('CASCADE');
    expect(schema.farm_id?.onDelete).toBe('CASCADE');
    expect(schema.rejected_by_user_id?.allowNull).toBe(false);
    expect(schema.rejected_by_user_id?.onUpdate).toBe('CASCADE');
    expect(schema.rejected_by_user_id?.onDelete).toBe('RESTRICT');
    expect(schema.rejection_reason?.allowNull).toBe(false);
    expect(schema.farm_snapshot?.allowNull).toBe(false);
    expect(schema.farm_snapshot_updated_at?.allowNull).toBe(false);
    expect(schema.created_at?.allowNull).toBe(false);
    expect(schema.resolved_at?.allowNull).toBe(true);
    expect(schema.resolution_type?.allowNull).toBe(true);

    expect(addIndex).toHaveBeenCalledWith('farm_rejections', ['farm_id', 'created_at'], {
      name: 'farm_rejections_farm_id_created_at_desc_idx',
      fields: ['farm_id', { name: 'created_at', order: 'DESC' }],
    });
  });

  test('migration down drops farm_rejections table cleanly', async () => {
    const dropTable = jest.fn().mockResolvedValue(undefined);
    const query = jest.fn().mockResolvedValue(undefined);

    const context = {
      getQueryInterface: () => ({
        dropTable,
        sequelize: { query },
      }),
    };

    await down({ context } as never);

    expect(dropTable).toHaveBeenCalledWith('farm_rejections');
    expect(query).toHaveBeenCalledWith(
      'DROP TYPE IF EXISTS "enum_farm_rejections_resolution_type";'
    );
  });
});
