import { EmbedBuilder } from "discord.js";
import { DiscordBot } from "../../../../Modules/DiscordModule";

/**
 * Message event listener to get the bot installation link.
 */
export default function listener(): void {
  DiscordBot.shared.addEventListener("messageCreate", async (message) => {
    if (message.content === "!addbot") {
      const { clientId } = await DiscordBot.shared.getCredentials();
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Add the bot to your server")
            .addFields(
              {
                name: `Public Version`,
                value: `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=274877962240&integration_type=0&scope=bot\n\nThis is for **ALL public servers** and requires **minimal** permissions.`,
              },
              {
                name: `Private Version`,
                value: `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&integration_type=0&scope=bot\n\nThis is only for explictly **supported servers** and requires several management level permissions. Do NOT use this unless your server has been configured by the bot developers.`,
              },
            )
            .setColor("DarkButNotBlack"),
        ],
      });
    }
  });
}
