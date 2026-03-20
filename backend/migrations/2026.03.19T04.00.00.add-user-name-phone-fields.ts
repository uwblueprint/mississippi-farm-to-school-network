import type { MigrationFn } from 'umzug/lib/types';
import type { Sequelize } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

export const up: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.addColumn('users', 'first_name', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'default_value',
  });

  await queryInterface.addColumn('users', 'last_name', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'default_value',
  });

  await queryInterface.addColumn('users', 'phone', {
    type: DataTypes.STRING,
    allowNull: true,
  });
};

export const down: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.removeColumn('users', 'first_name');
  await queryInterface.removeColumn('users', 'last_name');
  await queryInterface.removeColumn('users', 'phone');
};
