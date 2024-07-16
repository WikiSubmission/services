import { DataQuranLanguageKeys } from "../../../Modules/DatabaseModule/Types/DataQuran";
import { WikiSlashCommand } from "../../../Modules/DiscordModule/Types/WikiSlashCommand";
import { DiscordQuranRequest } from "../../../Modules/DiscordModule/Utilities/DiscordRequest";
import baseCommand from "./slashQuran";

export default function command(): WikiSlashCommand {
  return {
    ...baseCommand(),
    name: "search-quran",
    description: "Quran | Search the text",
    options: [
      {
        name: "query",
        type: "STRING",
        description: "What are you looking for?",
        localizations: [
          {
            name: "sure",
            description: "Sure numarasını girin",
            language: "tr",
          },
        ],
      },
      {
        name: "ignore-commentary",
        type: "STRING",
        description: "Ignore subtitles & footnotes?",
        choices: [
          {
            name: "yes",
            value: "yes",
          },
        ],
        optional: true,
        localizations: [
          {
            name: "yorum-yok",
            description: "Altyazı ve dipnot yok mu?",
            language: "tr",
          },
        ],
      },
      {
        name: "language",
        description: "Which language?",
        type: "STRING",
        choices: [
          ...DataQuranLanguageKeys.filter((i) => i !== "arabic_clean")
            .filter((i) => i !== "arabic_transliteration")
            .map((i) => ({
              name: i,
              value: i,
            })),
        ],
        optional: true,
      },
      {
        name: "with-arabic",
        description: "Include Arabic?",
        type: "STRING",
        localizations: [
          {
            name: "arapça",
            description: "Arapça içerir?",
            language: "tr",
          },
        ],
        choices: [
          {
            name: "yes",
            value: "yes",
          },
        ],
        optional: true,
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
      await new DiscordQuranRequest(interaction).searchRequest();
      return interaction;
    },
  };
}
