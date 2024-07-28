import { EmbedBuilder } from "discord.js";
import { WikiSlashCommand } from "../../../Modules/DiscordModule/Types/WikiSlashCommand";
import { RawData } from "../Miscalleneous/RawData";

export default function command(): WikiSlashCommand {
  return {
    name: "appendices",
    description: "Load the 38 Appendices list from Quran: The Final Testament",
    localizations: [
      {
        name: "ekler",
        description: `Kur'an-ı Kerim'den 38 Ek Listesi`,
        language: "tr",
      },
    ],
    handler: async (interaction) => {
      if (
        interaction.options.get("language")?.value === "turkish" ||
        interaction.locale === "tr"
      ) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Ekler")
              .setDescription(
                RawData.DataAppendices.map(
                  (i) =>
                    `${i.appendix_number}: [${i.appendix_title_turkish}](${i.appendix_url_turkish}) ([İngilizce](${i.appendix_url_english}))`,
                ).join("\n"),
              )
              .setFooter({ text: "Kuran: Son Ahit • Ekler" })
              .setColor("DarkButNotBlack"),
          ],
        });
      } else {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Appendices")
              .setDescription(
                RawData.DataAppendices.map(
                  (i) =>
                    `${i.appendix_number}: [${i.appendix_title_english}](${i.appendix_url_english})`,
                ).join("\n"),
              )
              .setFooter({ text: "Quran: The Final Testament • Appendices" })
              .setColor("DarkButNotBlack"),
          ],
        });
      }
      return interaction;
    },
  };
}
