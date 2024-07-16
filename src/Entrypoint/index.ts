/**
 *
 * WikiSubmission Services
 *
 * This file represents the node entry point.
 *
 * Run `npm run install` to install dependencies.
 * Use `npm run services` to compile and start the application.
 * Use `npm run service:[service-name]` to launch only a specific service.
 * Use `npm run docker` in a machine with docker to reverse proxy all requests from port 80.
 */

import dotenv from "dotenv";
import { WikiEvents } from "../Modules/LogsModule";
import { WikiService } from "../Modules/ServiceModule";
import { FileUtils } from "../Utilities/FileUtils";
export const ActiveServices = new Map<string, WikiService>();

(async () => {
  preLaunch();

  WikiEvents.emit("system:launch", `--- LAUNCHING ---`);
  WikiEvents.emit("system:launch", `Date: ${new Date().toISOString()}\n`);

  WikiEvents.emit("system:launch", `--- SETTING ENVIRONMENT VARIABLES ---\n`);
  await loadEnvironment();

  WikiEvents.emit("system:launch", `--- STARTING SERVICES ---\n`);
  await loadServices();
})();

/**
 * @function preLaunch
 * @description Prevent any post launch issues before starting services here.
 */
function preLaunch() {
  (BigInt?.prototype as any).toJSON = function () {
    return 1919;
  };
}

/**
 * @function loadEnvironment
 * @description Sets the environment variables. Only Supabase credentials are required upfront. All others are fetched on-demand.
 */
async function loadEnvironment() {
  dotenv.config();
  if (
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_API_KEY
  ) {
    WikiEvents.emit("system:launch", `Environment variables loaded\n`);
  } else {
    throw new Error(
      `Missing environment variables: SUPABASE_URL, SUPABASE_API_KEY`,
    );
  }
}

/**
 * @function loadServices
 * @description Loads all services one by one via file structure inference. Services are located in the `Services` folder, with a subfolder for each service. Each service subfolder must contain a `service.ts` file at its root. This file must export a default object conforming to the `WikiService` interface, containing everything we need.
 */
async function loadServices() {
  // If specified, get the specific service name from command-line arguments
  const specificServiceCLArg = process.argv
    .find((arg) => arg.startsWith("--service="))
    ?.split("=")[1]
    ?.toLowerCase();

  const services: (() => Promise<WikiService>)[] =
    await FileUtils.getDefaultExportsFromDirectory<() => Promise<WikiService>>(
      "",
      true,
      true,
      specificServiceCLArg ? [specificServiceCLArg] : undefined,
    );

  for (const serviceModule of services) {
    const service = await serviceModule();

    if (specificServiceCLArg && service.config.name !== specificServiceCLArg) {
      continue;
    }

    ActiveServices.set(service.config.name, service);

    console.log("\n");
  }

  if (services.length === 0)
    throw new Error(
      `No services found${specificServiceCLArg ? ` - "${specificServiceCLArg}" is not a valid service name` : ""}`,
    );

  console.log("\n");
  WikiEvents.emit("system:launch", `--- READY ---\n`);
}
