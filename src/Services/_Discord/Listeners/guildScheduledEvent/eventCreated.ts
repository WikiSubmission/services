import { EmbedBuilder } from "discord.js";
import { DiscordBot } from "../../../../Modules/DiscordModule";
import { DiscordAlert } from "../../../../Modules/DiscordModule/Utilities/DiscordAlertManager";
import { DiscordMemberManager } from "../../../../Modules/DiscordModule/Utilities/DiscordMemberManager";

export default function listener(): void {
  DiscordBot.shared.addEventListener(
    "guildScheduledEventCreate",
    async (scheduledEvent) => {
      const resolvedMember = await DiscordMemberManager.get(
        scheduledEvent.creator,
        scheduledEvent.guild,
      );

      if (resolvedMember && resolvedMember.moderatedGuild) {
        await new DiscordAlert(resolvedMember.moderatedGuild).send(
          "STAFF-LOG",
          {
            embeds: [
              new EmbedBuilder()
                .setAuthor({
                  name: `An event was created`,
                  iconURL: scheduledEvent.creator?.displayAvatarURL(),
                })
                .addFields(
                  {
                    name: "Title",
                    value: `[${scheduledEvent.name}](https://discord.com/events/${scheduledEvent.guildId}/${scheduledEvent.id})`,
                  },
                  {
                    name: "Channel",
                    value: `<#${scheduledEvent.channelId || "--"}>`,
                  },
                )
                .setFooter({
                  text:
                    scheduledEvent.creatorId ===
                    DiscordBot.shared.client.user?.id
                      ? `/event`
                      : "",
                })
                .setColor("DarkBlue")
                .setTimestamp(new Date()),
            ],
          },
        );
      }

      DiscordBot.shared.logEvent(
        "guildScheduledEventCreate",
        `Event "${scheduledEvent.name}" created in "${scheduledEvent.guild?.name || "–"}"`,
      );
    },
  );
}
