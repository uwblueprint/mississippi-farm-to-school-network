/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config();
require('ts-node/register');
require('tsconfig-paths/register');

require('@/umzug').migrator.runAsCLI();
