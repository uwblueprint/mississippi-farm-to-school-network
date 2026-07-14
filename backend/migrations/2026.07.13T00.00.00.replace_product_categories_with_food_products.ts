import type { MigrationFn } from 'umzug/lib/types';
import type { Sequelize } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

const ADDED_ARRAY_COLUMNS = ['seasonal_products', 'meat_products', 'other_products'];
const ADDED_DETAIL_COLUMNS = [
  'seasonal_products_detail',
  'meat_products_detail',
  'other_products_detail',
];

export const up: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  for (const column of ADDED_ARRAY_COLUMNS) {
    await queryInterface.addColumn('farms', column, {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    });
  }

  for (const column of ADDED_DETAIL_COLUMNS) {
    await queryInterface.addColumn('farms', column, {
      type: DataTypes.TEXT,
      allowNull: true,
    });
  }

  await queryInterface.removeColumn('farms', 'product_categories');
  await queryInterface.removeColumn('farms', 'specific_products');
};

export const down: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.addColumn('farms', 'specific_products', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
  });

  await queryInterface.addColumn('farms', 'product_categories', {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: [],
  });

  for (const column of ADDED_DETAIL_COLUMNS) {
    await queryInterface.removeColumn('farms', column);
  }

  for (const column of ADDED_ARRAY_COLUMNS) {
    await queryInterface.removeColumn('farms', column);
  }
};
