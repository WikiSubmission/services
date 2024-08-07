import { loadEnvironment } from "../../Entrypoint/loadEnvironment";
import { preLaunch } from "../../Entrypoint/preLaunch";
import { APIJSONResponse } from "../../Modules/APIModule/Types/APIResponse";
import { DiscordBots } from "../../Modules/DiscordModule";
import { WikiService } from "../../Modules/WikiServiceModule";

/**
 * This is the node entry point for the Discord service.
 * It is run separately (npm run service:discord) to the rest of the app, to avoid
 * issues with load balancing (which would create redundant, duplicate listeners).
 * A more suitable solution should be implemented later but this works for now.
 */
(async () => {
  preLaunch();
  await loadEnvironment();
  await WikiService.create({
    name: "Discord",
    customService: async () => {
      await DiscordBots.shared.start();
    },
    api: {
      name: "DiscordAPI",
      description: "Server instance",
      port: 8080,
      endpoints: [
        {
          route: "*",
          method: "get",
          alternateRoutes: ["/health"],
          handler: async () => {
            return new APIJSONResponse({
              success: true,
              http_status_code: 200,
            });
          },
        },
      ],
    },
  });
})();
