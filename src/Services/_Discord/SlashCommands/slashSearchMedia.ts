import { WikiSlashCommand } from "../../../Modules/DiscordModule/Types/WikiSlashCommand";
import { DiscordMediaRequest } from "../../../Modules/DiscordModule/Utilities/DiscordMediaRequest";

export default function command(): WikiSlashCommand {
  return {
    name: "search-media",
    description: "Search through Dr. Khalifa's sermons, programs and audios",
    options: [
      {
        name: "query",
        description: "What are you looking for?",
        type: "STRING",
      },
      {
        name: "strict-search",
        description:
          "Enforce the specific word order in the query to match in results",
        type: "STRING",
        choices: [
          {
            name: "yes",
            value: "yes",
          },
        ],
        optional: true,
      },
    ],
    handler: async (interaction) => {
      await new DiscordMediaRequest(interaction).getResultsAndReply();
      return interaction;
    },
  };
}
