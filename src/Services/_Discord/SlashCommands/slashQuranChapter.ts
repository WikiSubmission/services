import { DataQuranLanguageKeys } from "../../../Modules/DatabaseModule/Types/DataQuran";
import { WikiSlashCommand } from "../../../Modules/DiscordModule/Types/WikiSlashCommand";
import baseCommand from "./slashQuran";

export default function command(): WikiSlashCommand {
  return {
    ...baseCommand(),
    name: "chapter",
    description: "Quran | Load a chapter",
    options: [
      {
        name: "chapter",
        description: "Chapter # (1 - 114)",
        type: "STRING",
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
        name: "transliteration",
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
        name: "language",
        description: "Which language?",
        type: "STRING",
        choices: DataQuranLanguageKeys.filter((i) => i !== "arabic_clean")
          .filter((i) => i !== "arabic")
          .filter((i) => i !== "arabic_transliteration")
          .map((i) => ({
            name: i,
            value: i,
          })),
        optional: true,
      },
    ],
  };
}
