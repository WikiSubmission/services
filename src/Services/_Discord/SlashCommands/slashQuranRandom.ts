import { EmbedBuilder } from "discord.js";
import { NetworkUtilities } from "../../../Utilities/NetworkUtilities";
import { Ports } from "../../../Vars/Ports";
import { DataQuranItem } from "../../../Modules/DatabaseModule/Types/DataQuran";
import { WikiSlashCommand } from "../../../Modules/DiscordModule/Types/WikiSlashCommand";

export default function command(): WikiSlashCommand {
  return {
    name: "random-verse",
    description: "Get a random verse from the Quran",
    options: [
      {
        name: "language",
        description: "Choose another language",
        type: "STRING",
        choices: ["turkish"].map((i) => ({
          name: i,
          value: i,
        })),
        localizations: [
          {
            name: "dil",
            description: "Farklı dil?",
            language: "tr",
          },
        ],
        optional: true,
      },
    ],
    localizations: [
      {
        name: "rastgele",
        description: "Rastgele ayet",
        language: "tr",
      },
    ],
    handler: async (interaction) => {
      const result = await NetworkUtilities.GET_INTERNAL<DataQuranItem[]>(
        `https://api.wikisubmission.org`,
        "/quran/random-verse?normalize_god_capitalization=true",
      );

      if (result && result.results) {
        let isTurkish =
          interaction.options.get("language")?.value === "turkish" ||
          interaction.locale === "tr";

        if (interaction.options.get("language")?.value === "english") {
          isTurkish = false;
        }

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                isTurkish
                  ? `Sure ${result.results[0].chapter_number}, ${result.results[0].chapter_title_turkish}`
                  : `Sura ${result.results[0].chapter_number}, ${result.results[0].chapter_title_english}`,
              )
              .setDescription(
                `**[${result.results[0].verse_id}]** ${result.results[0][isTurkish ? "verse_text_turkish" : "verse_text_english"]}\n\n${result.results[0].verse_text_arabic}`,
              )
              .setFooter({
                text: isTurkish
                  ? "Kuran: Son Ahit • Turkish"
                  : "Quran: The Final Testament • Random Verse",
              })
              .setColor("DarkButNotBlack"),
          ],
        });
      } else {
        await interaction.reply({
          content: `\`API Error\``,
          ephemeral: true,
        });
      }
      return interaction;
    },
  };
}
