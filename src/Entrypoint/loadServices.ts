import { WikiLog } from "../Modules/LogsModule";
import { WikiService } from "../Modules/WikiServiceModule";
import { FileUtils } from "../Utilities/FileUtils";

export const ActiveServices = new Map<string, WikiService>();

/**
 * @function loadServices
 * @description Loads all services one by one via file structure inference. Services are located in the `Services` folder, with a subfolder for each service. Each service subfolder must contain a `service.ts` file at its root. This file must export a default object conforming to the `WikiService` interface, containing everything we need.
 */
export async function loadServices() {
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
  WikiLog.system(`--- READY ---\n`);
}
