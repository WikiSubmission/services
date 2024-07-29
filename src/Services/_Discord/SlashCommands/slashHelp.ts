import { EmbedBuilder } from "discord.js";
import { WikiSlashCommand } from "../../../Modules/DiscordModule/Types/WikiSlashCommand";
import { GlobalBot } from "../../../Modules/DiscordModule/GlobalBot";

export default function command(): WikiSlashCommand {
  return {
    name: "help",
    description: "Link to developer support",
    handler: async (interaction) => {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Bot Support")
            .setFields({
              name: "Developer Support Server",
              value: "https://discord.gg/guHAKnghZT",
            })
            .setThumbnail(
              GlobalBot.shared.client.user?.displayAvatarURL() || null,
            )
            .setColor("DarkButNotBlack"),
        ],
      });
      return interaction;
    },
  };
}
