import dotenv from 'dotenv';
import path from 'path';

/**
 * Load the repo-root `.env` once. Import this before any module that reads process.env.
 * Path is backend/ -> ../.env
 */
dotenv.config({ path: path.resolve(__dirname, '../.env') });
