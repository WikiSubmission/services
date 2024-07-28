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

import { WikiEvents } from "../Modules/LogsModule";
import { preLaunch } from "./preLaunch";
import { loadEnvironment } from "./loadEnvironment";
import { loadServices } from "./loadServices";

(async () => {
  preLaunch();

  WikiEvents.emit("system:launch", `--- LAUNCHING ---`);
  WikiEvents.emit("system:launch", `Date: ${new Date().toISOString()}\n`);

  WikiEvents.emit("system:launch", `--- SETTING ENVIRONMENT VARIABLES ---\n`);
  await loadEnvironment();

  WikiEvents.emit("system:launch", `--- STARTING SERVICES ---\n`);
  await loadServices();
})();
