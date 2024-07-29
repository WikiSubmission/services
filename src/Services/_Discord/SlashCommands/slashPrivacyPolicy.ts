import { EmbedBuilder } from "discord.js";
import { WikiSlashCommand } from "../../../Modules/DiscordModule/Types/WikiSlashCommand";
import { DiscordBot } from "../../../Modules/DiscordModule";

export default function command(): WikiSlashCommand {
  return {
    name: "help",
    description: "Link to developer support and privacy policy information",
    handler: async (interaction) => {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Bot Support")
            .setFields(
              { name: 'Developer Support Server', value: 'https://discord.gg/guHAKnghZT' },
              { name: 'Privacy Policy', value: 'https://wikisubmission.org/privacy-policy' },
              { name: 'Contact', value: "https://wikisubmission.org/contact" }
            )
            .setThumbnail(DiscordBot.shared.client.user?.displayAvatarURL() || null)
            .setColor("DarkButNotBlack"),
        ],
      });
      return interaction;
    },
  };
}
