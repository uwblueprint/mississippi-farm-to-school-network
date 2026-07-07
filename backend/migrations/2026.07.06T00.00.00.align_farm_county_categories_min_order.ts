import type { MigrationFn } from 'umzug/lib/types';
import type { Sequelize } from 'sequelize-typescript';

export const up: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.renameColumn('farms', 'food_categories', 'product_categories');

  await queryInterface.sequelize.query(
    'ALTER TABLE "farms" ALTER COLUMN "counties_served" TYPE VARCHAR(255) USING "counties_served"[1];'
  );
  await queryInterface.renameColumn('farms', 'counties_served', 'county');

  await queryInterface.sequelize.query(
    'ALTER TABLE "farms" ALTER COLUMN "minimum_order" TYPE INTEGER USING "minimum_order"::integer;'
  );
};

export const down: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.sequelize.query(
    'ALTER TABLE "farms" ALTER COLUMN "minimum_order" TYPE VARCHAR(255) USING "minimum_order"::varchar;'
  );

  await queryInterface.renameColumn('farms', 'county', 'counties_served');
  await queryInterface.sequelize.query(
    'ALTER TABLE "farms" ALTER COLUMN "counties_served" TYPE VARCHAR(255)[] USING ARRAY["counties_served"];'
  );

  await queryInterface.renameColumn('farms', 'product_categories', 'food_categories');
};
