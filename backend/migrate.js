/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config();
require("ts-node/register");

require("./umzug").migrator.runAsCLI();