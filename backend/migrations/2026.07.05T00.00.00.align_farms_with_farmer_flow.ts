import type { MigrationFn } from 'umzug/lib/types';
import type { Sequelize } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

const REMOVED_BOOLEAN_COLUMNS = [
  'bipoc_owned',
  'gap_certified',
  'food_safety_plan',
  'agritourism',
  'sells_at_markets',
  'csa_boxes',
  'online_sales',
  'delivery',
  'interested_in_f2s',
];

const ADDED_ARRAY_COLUMNS = [
  'growing_practices',
  'food_safety_certifications',
  'farm_experiences',
  'farm_characteristics',
  'farm_to_school_sales',
];

export const up: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.renameColumn('farms', 'description', 'specific_products');

  await queryInterface.sequelize.query(
    'ALTER TABLE "farms" ALTER COLUMN "usda_farm_id" TYPE VARCHAR(255) USING "usda_farm_id"::varchar;'
  );

  for (const column of ADDED_ARRAY_COLUMNS) {
    await queryInterface.addColumn('farms', column, {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    });
  }

  await queryInterface.addColumn('farms', 'carousel_photos', {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: [],
  });

  await queryInterface.addColumn('farms', 'minimum_order', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn('farms', 'delivery_details', {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  await queryInterface.addColumn('farms', 'cover_photo', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.changeColumn('farms', 'cities_served', {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
  });

  for (const column of REMOVED_BOOLEAN_COLUMNS) {
    await queryInterface.removeColumn('farms', column);
  }

  await queryInterface.removeColumn('farms', 'f2s_experience');
  await queryInterface.addColumn('farms', 'f2s_experience', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
};

export const down: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.removeColumn('farms', 'f2s_experience');
  await queryInterface.addColumn('farms', 'f2s_experience', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  for (const column of REMOVED_BOOLEAN_COLUMNS) {
    await queryInterface.addColumn('farms', column, {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  }

  await queryInterface.changeColumn('farms', 'cities_served', {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
  });

  await queryInterface.removeColumn('farms', 'cover_photo');
  await queryInterface.removeColumn('farms', 'delivery_details');
  await queryInterface.removeColumn('farms', 'minimum_order');
  await queryInterface.removeColumn('farms', 'carousel_photos');

  for (const column of ADDED_ARRAY_COLUMNS) {
    await queryInterface.removeColumn('farms', column);
  }

  await queryInterface.sequelize.query(
    'ALTER TABLE "farms" ALTER COLUMN "usda_farm_id" TYPE INTEGER USING "usda_farm_id"::integer;'
  );

  await queryInterface.renameColumn('farms', 'specific_products', 'description');
};
