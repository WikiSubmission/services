import { EmbedBuilder } from "discord.js";
import { DiscordBot } from "../../../../Modules/DiscordModule";
import { DiscordAlert } from "../../../../Modules/DiscordModule/Utilities/DiscordAlertManager";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";

export default function listener(): void {
  DiscordBot.shared.addEventListener("guildBanRemove", async (ban) => {
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
          .setThumbnail(ban.user.displayAvatarURL())
          .setFooter({
            text: unbanLog?.executor
              ? unbanLog.executor.displayName
              : "User Unban",
            iconURL: unbanLog?.executor
              ? unbanLog.executor.displayAvatarURL()
              : undefined,
          })
          .setTimestamp(Date.now())
          .setColor("DarkGreen"),
      ],
    });
  });
}
