import { EmbedBuilder } from "discord.js";
import { WikiSlashCommand } from "../../../Modules/DiscordModule/Types/WikiSlashCommand";
import { GlobalBot } from "../../../Modules/DiscordModule/GlobalBot";

export default function command(): WikiSlashCommand {
  return {
    name: "add-bot",
    description: "Add the bot to your server",
    handler: async (interaction) => {
      const { clientId } = await GlobalBot.shared.getGlobalBotCredentials();
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Add this bot to your server")
            .setFields({
              name: "Link",
              value: `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=274877962240&integration_type=0&scope=bot`,
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
