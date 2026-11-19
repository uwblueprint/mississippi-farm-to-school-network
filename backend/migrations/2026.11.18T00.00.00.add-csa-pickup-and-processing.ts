import type { MigrationFn } from 'umzug/lib/types';
import type { Sequelize } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

const COLUMNS = ['csa_pickup_spots', 'csa_pickup_hours', 'processing_abilities'] as const;

export const up: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  for (const column of COLUMNS) {
    await queryInterface.addColumn('farms', column, {
      type: DataTypes.TEXT,
      allowNull: true,
    });
  }
};

export const down: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  for (const column of [...COLUMNS].reverse()) {
    await queryInterface.removeColumn('farms', column);
  }
};
