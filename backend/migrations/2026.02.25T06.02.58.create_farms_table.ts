import type { MigrationFn } from 'umzug/lib/types';
import type { Sequelize } from 'sequelize-typescript';
import { DataTypes, Sequelize as SequelizeStatic } from 'sequelize';

export const up: MigrationFn = async (params) => {
  const sequelize = params.context as Sequelize;
  const queryInterface = sequelize.getQueryInterface();

  // Ensure PostGIS is available before creating a geography column
  await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');

  await queryInterface.createTable('farms', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
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
    usda_farm_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    farm_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    primary_phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    primary_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    social_media: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    farm_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    counties_served: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    cities_served: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    location: {
      type: DataTypes.GEOGRAPHY('POINT', 4326),
      allowNull: false,
    },
    food_categories: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    market_sales_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    bipoc_owned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    gap_certified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    food_safety_plan: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    agritourism: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    sells_at_markets: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    csa_boxes: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    online_sales: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    delivery: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    f2s_experience: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    interested_in_f2s: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED'),
      allowNull: false,
      defaultValue: 'PENDING_APPROVAL',
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

  await sequelize.query('DROP TABLE IF EXISTS "farms";');
  await sequelize.query('DROP TYPE IF EXISTS "enum_farms_status";');
};