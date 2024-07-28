import { WikiSlashCommand } from "../../../Modules/DiscordModule/Types/WikiSlashCommand";
import { DiscordNewsletterRequest } from "../../../Modules/DiscordModule/Utilities/DiscordNewsletterRequest";

export default function command(): WikiSlashCommand {
  return {
    name: "search-newsletters",
    description: "Search through the Submitters Perspectives Newsletters",
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
      await new DiscordNewsletterRequest(interaction).getResultsAndReply();
      return interaction;
    },
  };
}
