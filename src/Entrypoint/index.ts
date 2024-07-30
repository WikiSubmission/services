/**
 *
 * WikiSubmission Services
 *
 * This file represents the node entry point.
 *
 * Run `npm run install` to install dependencies.
 * Use `npm run services` to compile and start the application.
 * Use `npm run service:[service-name]` to launch only a specific service.
 * Use `npm run docker` to run with docker and reverse proxy all requests from port 80.
 */

import { preLaunch } from "./preLaunch";
import { loadEnvironment } from "./loadEnvironment";
import { loadServices } from "./loadServices";
import { WikiLog } from "../Modules/LogsModule";

(async () => {
  preLaunch();

  WikiLog.system(`--- LAUNCHING ---`);
  WikiLog.system(`Date: ${new Date().toISOString()}\n`);

  WikiLog.system(`--- SETTING ENVIRONMENT VARIABLES ---\n`);
  await loadEnvironment();

  WikiLog.system(`--- STARTING SERVICES ---\n`);
  await loadServices();
})();
