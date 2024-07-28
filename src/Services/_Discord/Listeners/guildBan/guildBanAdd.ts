import { EmbedBuilder } from "discord.js";
import { DiscordBot } from "../../../../Modules/DiscordModule";
import { DiscordAlert } from "../../../../Modules/DiscordModule/Utilities/DiscordAlertManager";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";

export default function listener(): void {
  DiscordBot.shared.addEventListener("guildBanAdd", async (ban) => {

    if (!DiscordUtilities.getModeratedGuild(ban.guild)) return;

    const auditLogs = await ban.guild.fetchAuditLogs({
      type: 22,
      limit: 5,
    });

    const banLog = auditLogs.entries.find((e) => e.target?.id === ban.user.id);

    await new DiscordAlert(ban.guild).send("STAFF-LOG", {
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: `${ban.user.username} was banned`,
            iconURL: ban.user.displayAvatarURL(),
          })
          .setDescription(ban.reason || banLog?.reason || null)
          .addFields(
            {
              name: "User",
              value: DiscordUtilities.completeUserString(ban.user),
            },
            {
              name: "ID",
              value: `\`${ban.user.id}\``,
            },
          )
          .setThumbnail(ban.user.displayAvatarURL() || null)
          .setFooter({
            text: banLog?.executor?.displayName || "User Ban",
            iconURL: banLog?.executor
              ? banLog.executor.displayAvatarURL()
              : undefined,
          })
          .setTimestamp(Date.now())
          .setColor("DarkRed"),
      ],
    });

    DiscordBot.shared.logEvent(
      "guildBanAdd",
      `User "${ban.user.username}" was banned from "${ban.guild.name}"`,
    );
  });
}
