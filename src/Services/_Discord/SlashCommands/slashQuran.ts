import { WikiSlashCommand } from "../../../Modules/DiscordModule/Types/WikiSlashCommand";
import { DiscordQuranRequest } from "../../../Modules/DiscordModule/Utilities/DiscordQuranRequest";

export default function command(): WikiSlashCommand {
  return {
    name: "quran",
    description: "Quran | English 🇺🇸",
    options: [
      {
        name: "verse",
        description: "Verse #:# (or #:#-#)",
        type: "STRING",
        localizations: [
          {
            name: "ayet",
            description: "Ayet numarasını girin",
            language: "tr",
          },
        ],
      },
      {
        name: "no-footnotes",
        description: "Ignore subtitles & footnotes?",
        type: "STRING",
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
        name: "with-transliteration",
        description: "Include Arabic transliteration?",
        type: "STRING",
        choices: [
          {
            name: "yes",
            value: "yes",
          },
        ],
        optional: true,
        localizations: [
          {
            name: "transliterasyon",
            description: "transliterasyon içerir?",
            language: "tr",
          },
        ],
      },
    ],
    handler: async (interaction) => {
      await new DiscordQuranRequest(interaction).getResultsAndReply();
      return interaction;
    },
  };
}
