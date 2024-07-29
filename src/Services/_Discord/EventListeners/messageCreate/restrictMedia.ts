import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from "discord.js";
import { DiscordMemberManager } from "../../../../Modules/DiscordModule/Utilities/DiscordMemberManager";
import { DiscordConfig } from "../../../../Modules/DiscordModule/DiscordConfig";
import { DiscordAlert } from "../../../../Modules/DiscordModule/Utilities/DiscordAlertManager";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";
import { S3Utils } from "../../../../Utilities/S3Utils";
import { SystemUtils } from "../../../../Utilities/SystemUtils";
import { PrivateBot } from "../../../../Modules/DiscordModule/PrivateBot";

/**
 * Message event listener to restrict media, file, or links for certain users as an Anti-Raid measure.
 */
export default function listener(): void {
  PrivateBot.shared.addEventListener("messageCreate", async (message) => {
    if (!message.member) return;

    // Ignore unsupported guilds.
    const moderatedGuild = DiscordConfig.knownGuilds.find(
      (g) => g.id === message.guildId,
    );
    if (!moderatedGuild) return;

    // Ignore bots.
    if (message.author.bot) {
      return;
    }

    // Resolve author.
    const resolvedAuthor = await DiscordMemberManager.get(
      message.member,
      message.guildId,
    );
    if (!resolvedAuthor || !resolvedAuthor.member) return;

    // Ignore if author has trusted role.
    if (resolvedAuthor.verify("VERIFIED_AND_ABOVE")) {
      return;
    }

    // Ignore if user is a long-time member.
    if (
      (resolvedAuthor.member.joinedTimestamp ?? 0) <
      Date.now() - 365 * 24 * 60 * 60 * 1000
    ) {
      return;
    }

    // Ignore if the defined grace period has been passed since joined.
    if (
      resolvedAuthor.member.joinedTimestamp &&
      (Date.now() - resolvedAuthor.member.joinedTimestamp) / (1000 * 60 * 60) >
        DiscordConfig.mediaRestrictionHours
    ) {
      return;
    }

    // At this point, the user is subject to media restriction.

    // Block any links.
    if (
      message.content.includes("https://") ||
      message.content.includes(".com")
    ) {
      await message.reply({
        content: `\`Link sharing is restricted until ${DiscordConfig.mediaRestrictionHours} hours have passed since joining the server.\``,
      });

      await message.delete();

      // Emit a server event.
      PrivateBot.shared.logEvent(
        "messageCreate",
        `Message containing link ("${message.content}") from "${message.member.user.username}" has been blocked`,
      );

      // Notify staff.
      await new DiscordAlert(message.guildId).send("ANTI-RAID", {
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: `Link blocked from ${message.author.displayName}`,
              iconURL: message.author.displayAvatarURL(),
            })
            .addFields(
              {
                name: "User",
                value: DiscordUtilities.completeUserString(message.author),
              },
              { name: "Content", value: `\`\`\`${message.content}\`\`\`` },
              {
                name: "Channel",
                value: `<#${message.channel.id}>`,
              },
              {
                name: "Block Reason",
                value: `New user (<${DiscordConfig.mediaRestrictionHours} hours since joined)`,
              },
            )
            .setFooter({ text: "Beware of suspicious links" })
            .setThumbnail(message.author.displayAvatarURL())
            .setColor("DarkRed")
            .setTimestamp(Date.now()),
        ],
        components: [
          new ActionRowBuilder<any>().addComponents(
            new ButtonBuilder()
              .setLabel("Exempt")
              .setCustomId(`verify*${message.author.id}*Anti Raid`)
              .setStyle(1),
            new ButtonBuilder()
              .setLabel("Jail")
              .setCustomId(`jail*${message.author.id}*Anti Raid`)
              .setStyle(4),
          ),
        ],
      });
    }

    // Block any attachments.
    else if (message.attachments.size > 0) {
      await message.reply({
        content: `\`Media/file sharing is restricted until ${DiscordConfig.mediaRestrictionHours} hours have passed since joining the server.\``,
      });

      for (const [_, attachment] of message.attachments) {
        // Create a temporary backup. The file is stored in the 'wikisubmission' S3 bucket under the _internal/cache directory. The file is named as follows: "<user_id>-<attachment_name>". The Library API exposes this folder: e.g. docs.wikisubmission.org/library/tmp/<file_name>. The file will expire after 7 days.
        await S3Utils.uploadObjectFromURL(
          `tmp/${message.member.id}-${attachment.name}`,
          `${attachment.proxyURL}`,
          attachment.size,
          attachment.contentType || "application/octet-stream",
        );

        // Emit a server event.
        PrivateBot.shared.logEvent(
          "messageCreate",
          `Message containing media ("https://docs.wikisubmission.org/library/tmp/${message.author.id}-${attachment.name}") from "${message.member.user.username}" has been blocked`,
        );

        // Notify staff.
        await new DiscordAlert(message.guildId).send("ANTI-RAID", {
          embeds: [
            new EmbedBuilder()
              .setAuthor({
                name: `Attachment blocked from ${message.author.displayName}`,
                iconURL: message.author.displayAvatarURL(),
              })
              .addFields(
                {
                  name: "User",
                  value: DiscordUtilities.completeUserString(message.author),
                },
                {
                  name: "Attachment",
                  value: `${attachment.name} | [URL](https://docs.wikisubmission.org/library/tmp/${message.author.id}-${attachment.name})`,
                },
                {
                  name: "Channel",
                  value: `<#${message.channel.id}>`,
                },
                {
                  name: "Block Reason",
                  value: `New user (<${DiscordConfig.mediaRestrictionHours} hours since joined)`,
                },
              )
              .setFooter({ text: "Beware of suspicious links" })
              .setThumbnail(message.author.displayAvatarURL())
              .setColor("DarkRed")
              .setTimestamp(Date.now()),
          ],
          components: [
            new ActionRowBuilder<any>().addComponents(
              new ButtonBuilder()
                .setLabel("Exempt")
                .setCustomId(`verify*${message.author.id}*Anti Raid`)
                .setStyle(1),
              new ButtonBuilder()
                .setLabel("Jail")
                .setCustomId(`jail*${message.author.id}*Anti Raid`)
                .setStyle(4),
            ),
          ],
        });

        await SystemUtils.stimulateDelay(19 * 6);
      }

      await message.delete();
    }
  });
}
