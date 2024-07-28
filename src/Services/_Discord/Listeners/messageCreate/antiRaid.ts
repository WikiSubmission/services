import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from "discord.js";
import { DiscordBot } from "../../../../Modules/DiscordModule";
import { DiscordAntiRaidProfile } from "../../../../Modules/DiscordModule/Types/AntiRaidProfile";
import { DiscordAlert } from "../../../../Modules/DiscordModule/Utilities/DiscordAlertManager";
import { DiscordMemberManager } from "../../../../Modules/DiscordModule/Utilities/DiscordMemberManager";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";
import { DiscordConfig } from "../../../../Modules/DiscordModule/Vars/DiscordConfig";
import { DateUtilities } from "../../../../Utilities/DateUtils";
import { WikiCache } from "../../../../Modules/CachingModule";

/**
 * Message event listener to prevent new user spam / raid attempts by detecting unusual message frequency patterns.
 */
export default function listener(): void {
  DiscordBot.shared.addEventListener("messageCreate", async (message) => {
    if (!message || !message.member) return;

    // Ignore unsupported guilds.
    const moderatedGuild = DiscordConfig.knownGuilds.find(
      (g) => g.id === message.guildId,
    );
    if (!moderatedGuild) return;

    // Ignore bots.
    if (message.author.bot) return;

    // Ignore if author has trusted role.
    if (DiscordUtilities.verifyMember(message.member, "VERIFIED_AND_ABOVE")) {
      return;
    }

    // Ignore if user is a long-time member.
    if (
      (message.member.joinedTimestamp ?? 0) <
      Date.now() - 365 * 24 * 60 * 60 * 1000
    ) {
      return;
    }

    // Ignore messages sent to an unmonitored channel.
    if (!moderatedGuild.antiRaidProtectedChannels.includes(message.channelId)) {
      return;
    }

    // Get the current Anti-Raid profile of the user.
    const antiRaidProfile = await WikiCache.get<DiscordAntiRaidProfile>(
      "PublicCache",
      `@antiraid:${message.author.id}`,
    );

    // If it doesn't exist, create a new one and store for 15 seconds (max consideration period)
    if (!antiRaidProfile) {
      await WikiCache.set(
        "PublicCache",
        `@antiraid:${message.author.id}`,
        {
          lastMessageTimestamp: message.createdTimestamp,
          lastMessageGap: 0,
          content: [message.content],
          channels: [message.channelId],
          flagCount: 1,
        },
        "15s",
      );
    } else {
      // Looks like a profile exists (they've interacted recently). Simply continue to the monitor messaging pattern. Violating of any of the two rules below will raise an anti raid flag.
      if (
        // RULE 1 (usually detects cross-channel spam)
        // This condition is VIOLATED once you've sent over 10 messages in the last 15 seconds to over 3 channels
        (antiRaidProfile.flagCount < 9 &&
          antiRaidProfile.channels.length <= 3 &&
          antiRaidProfile.lastMessageGap > 4000) ||
        // RULE 2 (usually detects same-channel spam)
        // This condition is VIOLATED once you've sent over 10 messages during the 15 second period.
        (antiRaidProfile.channels.length <= 2 &&
          antiRaidProfile.content.length <= 9)
      ) {
        // If both rules are satisfied, no red flags have been raised yet: simply update the existing temporary Anti-Raid profile.
        await WikiCache.set(
          "PublicCache",
          `@antiraid:${message.author.id}`,
          {
            lastMessageTimestamp: message.createdTimestamp,
            lastMessageGap:
              message.createdTimestamp - antiRaidProfile.lastMessageTimestamp,
            content: [...antiRaidProfile.content, message.content],
            channels: antiRaidProfile.channels.includes(message.channelId)
              ? [...antiRaidProfile.channels]
              : [...antiRaidProfile.channels, message.channelId],
            flagCount: antiRaidProfile.flagCount + 1,
          },
          "15s",
        );

        return;
      } else {
        // If either of the rules are VIOLATED, appropriate action must now be taken as this is likely a spammer / raid attempt.

        // 1. Update Anti-Raid profile with most recent message.
        await WikiCache.set(
          "PublicCache",
          `@antiraid:${message.author.id}`,
          {
            lastMessageTimestamp: message.createdTimestamp,
            lastMessageGap:
              message.createdTimestamp - antiRaidProfile.lastMessageTimestamp,
            content: [...antiRaidProfile.content, message.content],
            channels: antiRaidProfile.channels.includes(message.channelId)
              ? [...antiRaidProfile.channels]
              : [...antiRaidProfile.channels, message.channelId],
            flagCount: antiRaidProfile.flagCount + 1,
          },
          "10s",
        );

        // 2. Jail the member.
        const resolvedAuthor = await DiscordMemberManager.get(
          message.member,
          moderatedGuild,
        );
        if (!resolvedAuthor || !resolvedAuthor.member) {
          return;
        }

        const jail = await resolvedAuthor.jail(
          DiscordBot.shared.client.user,
          "Anti-Raid (Spam Detection)",
        );

        if (jail instanceof Error) {
          DiscordBot.shared.logError(
            `Failed to jail Anti-Raid suspect: "${jail.message}"`,
            "@ addEventListener(`messageCreate`)",
          );
        }

        // 3. Short timeout for damage control.
        await resolvedAuthor.member.timeout(0.5 * 60 * 500, "Anti Raid");

        // 4. Alert staff.
        await new DiscordAlert(message.guildId).send("MOD-CHAT", {
          content: `<@&${moderatedGuild.keyRoles.moderator}>`,
          embeds: [
            new EmbedBuilder()
              .setTitle("Unusual Activity Detected")
              .setDescription(
                `User ${DiscordUtilities.completeUserString(resolvedAuthor.member)} was flagged by Anti-Raid.`,
              )
              .addFields(
                {
                  name: "Flagged Spam",
                  value: antiRaidProfile.content
                    .map((i) => `\`\`\`${i}\`\`\``)
                    .join("\n")
                    .substring(0, 1000),
                },
                {
                  name: "Account Age",
                  value: `Joined the server **${DateUtilities.distanceFromNow(resolvedAuthor.member.joinedTimestamp)}**. Account created **${DateUtilities.distanceFromNow(message.author.createdTimestamp)}**.`,
                },
                {
                  name: "Affected Channels",
                  value: `${antiRaidProfile.channels.map((id) => `<#${id}>`).join(", ")}`,
                },
                {
                  name: "Actions Taken",
                  value: `* Deleted recent messages\n* Jailed user (<#${moderatedGuild.jail?.jailChannelId}>)`,
                },
              )
              .setFooter({
                text: "Anti-Raid",
                iconURL: DiscordBot.shared.client.user?.displayAvatarURL(),
              })
              .setThumbnail(message.author.displayAvatarURL())
              .setColor("DarkRed")
              .setTimestamp(Date.now()),
          ],
          components: [
            new ActionRowBuilder<any>().addComponents(
              new ButtonBuilder()
                .setLabel("Unjail")
                .setCustomId(`unjail*${message.author.id}*Anti Raid`)
                .setStyle(1),
              new ButtonBuilder()
                .setLabel("Ban")
                .setCustomId(`ban*${message.author.id}*Anti Raid`)
                .setStyle(4),
            ),
          ],
        });

        // Delete their recent messages.
        antiRaidProfile.channels.forEach(async (c) => {
          try {
            const fetchedChannel =
              await DiscordBot.shared.client.channels.fetch(c);

            if (fetchedChannel && fetchedChannel.type === 0) {
              const fetchedMessages = await fetchedChannel.messages.fetch({
                limit: 20,
              });

              fetchedMessages.forEach(async (fetchedMessage) => {
                if (fetchedMessage.author.id === message.author.id) {
                  try {
                    await fetchedMessage.delete();
                  } catch (_) {
                    return;
                  }
                }
              });
            }
          } catch (_) {}
        });

        DiscordBot.shared.logEvent(
          "messageCreate",
          `Jailed Anti-Raid suspect "${resolvedAuthor.completeUserString()}" in "${resolvedAuthor.member.guild.name}"`,
        );

        await WikiCache.delete("PublicCache", `@antiraid:${message.author.id}`);
      }
    }
  });
}
