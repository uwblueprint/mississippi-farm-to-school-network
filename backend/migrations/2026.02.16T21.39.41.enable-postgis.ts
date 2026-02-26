import type { MigrationFn } from 'umzug/lib/types';
import type { Sequelize } from 'sequelize-typescript';

export const up: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
};

export const down: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS postgis;');
};