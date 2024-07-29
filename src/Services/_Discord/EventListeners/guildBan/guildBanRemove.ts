import { EmbedBuilder } from "discord.js";
import { DiscordAlert } from "../../../../Modules/DiscordModule/Utilities/DiscordAlertManager";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";
import { PrivateBot } from "../../../../Modules/DiscordModule/PrivateBot";

export default function listener(): void {
  PrivateBot.shared.addEventListener("guildBanRemove", async (ban) => {
    if (!DiscordUtilities.getModeratedGuild(ban.guild)) return;

    const auditLogs = await ban.guild.fetchAuditLogs({
      type: 23,
      limit: 5,
    });

    const unbanLog = auditLogs.entries.find(
      (e) => e.target?.id === ban.user.id,
    );

    await new DiscordAlert(ban.guild).send("STAFF-LOG", {
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: `${ban.user.username} was unbanned`,
            iconURL: ban.user.displayAvatarURL(),
          })
          .setDescription(
            unbanLog?.reason
              ? `${unbanLog.reason}`
              : ban?.reason
                ? `${ban.reason}`
                : null || null,
          )
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
            text: unbanLog?.executor?.displayName || "User Unban",
            iconURL: unbanLog?.executor
              ? unbanLog.executor.displayAvatarURL()
              : undefined,
          })
          .setTimestamp(Date.now())
          .setColor("DarkGreen"),
      ],
    });

    PrivateBot.shared.logEvent(
      "guildBanRemove",
      `User "${ban.user.username}" was unbanned from "${ban.guild.name}"`,
    );
  });
}
