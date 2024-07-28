import { DiscordBot } from "../../../../Modules/DiscordModule";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";

/**
 * Message event listener to send wrong channel alerts to any channels specified in DiscordSettings
 */
export default function listener(): void {
  DiscordBot.shared.addEventListener("messageCreate", async (message) => {
    if (message.author.bot) return;

    const moderatedGuild = DiscordUtilities.getModeratedGuild(message.guildId);

    if (!moderatedGuild) return;

    for (const voiceChannel of moderatedGuild.keyVoiceChannels) {
      if (
        voiceChannel.wrongChannelAlerts &&
        message.channelId === voiceChannel.voice
      ) {
        const reply = await message.reply({
          content: `**Wrong channel.** Please continue in <#${voiceChannel.text}>.`,
        });
        setTimeout(async () => {
          await reply.delete();
        }, 6180);
      }
    }
  });
}
