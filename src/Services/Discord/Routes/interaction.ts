import {
  Client,
  CommandInteraction,
  GatewayDispatchEvents,
  GatewayIntentBits,
} from "discord.js";
import { APIEndpoint } from "../../../Modules/APIModule/Types/APIEndpoint";

export default function route(): APIEndpoint {
  return {
    route: "/interaction",
    method: "post",
    handler: async (req, res) => {
      console.log(req.body);

      const { interaction, authorization } = req.body;

      console.log(JSON.parse(interaction), JSON.parse(authorization));

      if (!interaction || !authorization) {
        return {
          success: false,
          http_status_code: 400,
          error: {
            name: "Bad Request",
            description:
              "Missing client, interaction, or authorization in body",
          },
        };
      }

      await (JSON.parse(interaction) as CommandInteraction).reply({
        content: "Received!",
      });

      return {
        success: true,
        http_status_code: 200,
      };
    },
  };
}
