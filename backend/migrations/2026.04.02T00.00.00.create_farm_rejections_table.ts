import type { MigrationFn } from 'umzug/lib/types';
import type { Sequelize } from 'sequelize-typescript';
import { DataTypes, Sequelize as SequelizeStatic } from 'sequelize';

export const up: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.createTable('farm_rejections', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    farm_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'farms',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    rejected_by_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    farm_snapshot: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    farm_snapshot_updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: SequelizeStatic.fn('now'),
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolution_type: {
      type: DataTypes.ENUM('RESUBMITTED', 'APPROVED', 'WITHDRAWN'),
      allowNull: true,
    },
  });

  await queryInterface.addIndex('farm_rejections', ['farm_id', 'created_at'], {
    name: 'farm_rejections_farm_id_created_at_desc_idx',
    fields: [
      'farm_id',
      {
        name: 'created_at',
        order: 'DESC',
      },
    ],
  });
};

export const down: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.dropTable('farm_rejections');
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_farm_rejections_resolution_type";'
  );
};
