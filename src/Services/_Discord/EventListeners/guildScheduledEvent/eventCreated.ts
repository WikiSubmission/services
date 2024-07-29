import { EmbedBuilder } from "discord.js";
import { DiscordAlert } from "../../../../Modules/DiscordModule/Utilities/DiscordAlertManager";
import { DiscordMemberManager } from "../../../../Modules/DiscordModule/Utilities/DiscordMemberManager";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";
import { PrivateBot } from "../../../../Modules/DiscordModule/PrivateBot";

export default function listener(): void {
  PrivateBot.shared.addEventListener(
    "guildScheduledEventCreate",
    async (scheduledEvent) => {
      if (!DiscordUtilities.getModeratedGuild(scheduledEvent.guild)) return;

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
                    PrivateBot.shared.client.user?.id
                      ? `/event`
                      : "",
                })
                .setColor("DarkBlue")
                .setTimestamp(new Date()),
            ],
          },
        );
      }

      PrivateBot.shared.logEvent(
        "guildScheduledEventCreate",
        `Event "${scheduledEvent.name}" created in "${scheduledEvent.guild?.name || "–"}"`,
      );
    },
  );
}
