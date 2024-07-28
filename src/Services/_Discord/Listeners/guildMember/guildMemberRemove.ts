import { EmbedBuilder, VoiceChannel } from "discord.js";
import { DiscordBot } from "../../../../Modules/DiscordModule";
import { DiscordMemberManager } from "../../../../Modules/DiscordModule/Utilities/DiscordMemberManager";
import { DiscordAlert } from "../../../../Modules/DiscordModule/Utilities/DiscordAlertManager";
import { DateUtilities } from "../../../../Utilities/DateUtils";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";
import { DiscordDBMember } from "../../../../Modules/DiscordModule/Types/DiscordDBMember";
import { SystemUtilities } from "../../../../Utilities/SystemUtils";

export default function listener(): void {
  DiscordBot.shared.addEventListener("guildMemberRemove", async (member) => {

    if (!DiscordUtilities.getModeratedGuild(member.guild)) return;

    const resolvedMember = await DiscordMemberManager.get(
      member,
      member.guild.id,
    );
    const supabaseClient = await SystemUtilities.getSupabaseClient();

    if (
      resolvedMember &&
      resolvedMember.member &&
      resolvedMember.moderatedGuild
    ) {
      // Update member counter.
      await updateMemberCounter();

      // Notify staff.
      await new DiscordAlert(resolvedMember.moderatedGuild).send("STAFF-LOG", {
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: `${resolvedMember.member.displayName} has left`,
              iconURL: resolvedMember.member.displayAvatarURL(),
            })
            .addFields(
              { name: "User", value: resolvedMember.completeUserString() },
              {
                name: "Roles",
                value:
                  member.roles.cache.size > 0
                    ? member.roles.cache
                        .filter((i) => i.name !== "@everyone")
                        .map((i) => `<@&${i.id}>`)
                        .join(", ")
                    : "None",
              },
              {
                name: "Joined Server",
                value: DateUtilities.distanceFromNow(member.joinedTimestamp),
              },
              {
                name: "Account Created",
                value: resolvedMember.accountCreatedRelativeTimeString(),
              },
            )
            .setFooter({ text: `Member count: ${member.guild.memberCount}` })
            .setThumbnail(resolvedMember.member.displayAvatarURL())
            .setColor("DarkRed")
            .setTimestamp(Date.now()),
        ],
      });

      // Update database with latest data.
      await updateMemberDatabaseRecord();

      DiscordBot.shared.logEvent(
        "guildMemberRemove",
        `User "${resolvedMember.member.user.username}" has left "${resolvedMember.member.guild.name}"`,
      );
    }

    async function updateMemberCounter() {
      const memberCount = member.guild.memberCount;
      if (
        resolvedMember?.moderatedGuild &&
        resolvedMember.moderatedGuild.keyChannels.memberCount
      ) {
        const memberCountChannel =
          await DiscordUtilities.getChannelById<VoiceChannel>(
            resolvedMember?.moderatedGuild?.keyChannels.memberCount,
            member.guild.id,
          );

        if (memberCountChannel && memberCountChannel.type === 2) {
          memberCountChannel.setName(
            memberCount % 19 === 0
              ? `Members: ${memberCount} (19 x ${memberCount / 19})`
              : `Members: ${memberCount}`,
          );
        }
      }
    }

    async function updateMemberDatabaseRecord() {
      if (!resolvedMember) return;

      const request = await supabaseClient
        .from("DiscordMembers")
        .upsert<DiscordDBMember>({
          id: `${member.user.id}*${member.guild.id}`,
          user_id: member.user.id,
          user_name: member.user.username,
          display_name: member.user.displayName,
          avatar_url: member.displayAvatarURL(),
          joined_timestamp: member.joinedTimestamp || Date.now(),
          created_timestamp: member.user.createdTimestamp,
          guild_id: member.guild.id,
          roles: resolvedMember.roleIdArrayAsString() || "",
        });

      if (request.error) {
        DiscordBot.shared.logError(request);
      }
    }
  });
}
