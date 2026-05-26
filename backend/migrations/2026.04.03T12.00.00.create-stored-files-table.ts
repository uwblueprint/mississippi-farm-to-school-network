import type { MigrationFn } from 'umzug/lib/types';
import type { Sequelize } from 'sequelize-typescript';
import { DataTypes, Sequelize as SequelizeStatic } from 'sequelize';

export const up: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.createTable('stored_files', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    storage_key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    original_file_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    owner_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
    content_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: SequelizeStatic.fn('now'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: SequelizeStatic.fn('now'),
    },
  });
};

export const down: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.dropTable('stored_files');
};
