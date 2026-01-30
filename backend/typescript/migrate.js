/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", "..", ".env"),
});
require("tsconfig-paths/register");
require("ts-node/register");

require("./umzug").migrator.runAsCLI();
