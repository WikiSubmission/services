import { WikiSlashCommand } from "../../../Modules/DiscordModule/Types/WikiSlashCommand";
import baseCommand from "./slashQuran";

export default function command(): WikiSlashCommand {
  return {
    ...baseCommand(),
    name: "tquran",
    description: "Quran | Turkish 🇹🇷",
    localizations: [
      {
        name: "kuran",
        description: "Kuran | Türkçe 🇹🇷",
        language: "tr",
      },
    ],
    options: [
      ...(baseCommand().options || []),
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
        optional: true,
      },
    ],
  };
}
