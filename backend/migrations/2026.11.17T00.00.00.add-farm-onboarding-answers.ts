import type { MigrationFn } from 'umzug/lib/types';
import type { Sequelize } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

export const up: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.addColumn('farms', 'about_us', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  await queryInterface.addColumn('farms', 'primary_contact_name', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await queryInterface.addColumn('farms', 'growing_practices_other', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  await queryInterface.addColumn('farms', 'food_safety_other', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  await queryInterface.addColumn('farms', 'farmers_markets', {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  await queryInterface.sequelize.query(
    'ALTER TABLE "farms" ALTER COLUMN "minimum_order" TYPE TEXT USING "minimum_order"::text;'
  );

  // "None of the above" is now "Other" plus a short description.
  await queryInterface.sequelize.query(`
    UPDATE "farms"
    SET "growing_practices" = array_replace("growing_practices", 'None of the above', 'Other')
    WHERE 'None of the above' = ANY ("growing_practices");
  `);
  await queryInterface.sequelize.query(`
    UPDATE "farms"
    SET "food_safety_certifications" = array_replace("food_safety_certifications", 'None of the above', 'Other')
    WHERE 'None of the above' = ANY ("food_safety_certifications");
  `);
};

export const down: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  // Rows migrated from "None of the above" have Other selected and no description.
  await queryInterface.sequelize.query(`
    UPDATE "farms"
    SET "growing_practices" = array_replace("growing_practices", 'Other', 'None of the above')
    WHERE "growing_practices_other" IS NULL
      AND 'Other' = ANY ("growing_practices");
  `);
  await queryInterface.sequelize.query(`
    UPDATE "farms"
    SET "food_safety_certifications" = array_replace("food_safety_certifications", 'Other', 'None of the above')
    WHERE "food_safety_other" IS NULL
      AND 'Other' = ANY ("food_safety_certifications");
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE "farms" ALTER COLUMN "minimum_order" TYPE INTEGER USING (
      CASE WHEN "minimum_order" ~ '^[0-9]+$' THEN "minimum_order"::integer ELSE NULL END
    );
  `);

  await queryInterface.removeColumn('farms', 'farmers_markets');
  await queryInterface.removeColumn('farms', 'food_safety_other');
  await queryInterface.removeColumn('farms', 'growing_practices_other');
  await queryInterface.removeColumn('farms', 'primary_contact_name');
  await queryInterface.removeColumn('farms', 'about_us');
};
