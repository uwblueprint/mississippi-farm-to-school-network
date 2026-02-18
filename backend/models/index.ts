import * as path from 'path';

import dotenv from 'dotenv';
import { Sequelize } from 'sequelize-typescript';

dotenv.config();

const DATABASE_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.DATABASE_URL!
    : `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.DB_HOST}:5432/${process.env.POSTGRES_DB_DEV}`;

export const sequelize = new Sequelize(DATABASE_URL, {
  models: [path.join(__dirname, '/*.model.ts')],
  dialect: 'postgres',
  logging: false,
});
