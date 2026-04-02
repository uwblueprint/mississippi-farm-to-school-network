import type { MigrationFn } from 'umzug/lib/types';
import type { Sequelize } from 'sequelize-typescript';
import { DataType } from 'sequelize-typescript';

export const up: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.createTable('announcements', {
    id: {
      type: DataType.UUID,
      primaryKey: true,
      defaultValue: DataType.UUIDV4,
      allowNull: false,
    },
    message: {
      type: DataType.TEXT,
      allowNull: false,
    },
    start_date: {
      type: DataType.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataType.DATE,
      allowNull: true,
    },
    deleted_at: {
      type: DataType.DATE,
      allowNull: true,
    },
    created_by: {
      type: DataType.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    created_at: {
      type: DataType.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('NOW()'),
    },
    updated_at: {
      type: DataType.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('NOW()'),
    },
  });
};

export const down: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.dropTable('announcements');
};