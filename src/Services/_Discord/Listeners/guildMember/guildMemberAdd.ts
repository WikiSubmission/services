import { EmbedBuilder, VoiceChannel } from "discord.js";
import { DiscordBot } from "../../../../Modules/DiscordModule";
import { DiscordMemberManager } from "../../../../Modules/DiscordModule/Utilities/DiscordMemberManager";
import { DiscordAlert } from "../../../../Modules/DiscordModule/Utilities/DiscordAlertManager";
import { DateUtilities } from "../../../../Utilities/DateUtils";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";
import { DiscordDBMember } from "../../../../Modules/DiscordModule/Types/DiscordDBMember";
import { SystemUtilities } from "../../../../Utilities/SystemUtils";

export default function listener(): void {
  DiscordBot.shared.addEventListener("guildMemberAdd", async (member) => {
    const resolvedMember = await DiscordMemberManager.get(member, member.guild);
    const supabaseClient = await SystemUtilities.getSupabaseClient();

    if (
      resolvedMember &&
      resolvedMember.member &&
      resolvedMember.moderatedGuild
    ) {
      // Update member counter.
      await updateMemberCounter();

      // Fetch database record.
      const memberRecord: { data: DiscordDBMember | null } =
        await supabaseClient
          .from("DiscordMembers")
          .select("*")
          .eq("id", `${member.user.id}*${member.guild.id}`)
          .single();

      // CASE: member record exists.
      if (memberRecord.data) {
        // Grant member role.
        await resolvedMember.addRole(
          resolvedMember.moderatedGuild.keyRoles.member,
        );

        await new DiscordAlert(resolvedMember.moderatedGuild).send(
          "STAFF-LOG",
          {
            embeds: [
              new EmbedBuilder()
                .setAuthor({
                  name: `${resolvedMember.member.user.username} has joined (again)`,
                  iconURL: resolvedMember.member.displayAvatarURL(),
                })
                .addFields(
                  { name: "User", value: resolvedMember.completeUserString() },
                  {
                    name: "Account Created",
                    value: resolvedMember.accountCreatedRelativeTimeString(),
                  },
                  {
                    name: "Last Joined",
                    value: DateUtilities.distanceFromNow(
                      memberRecord.data.joined_timestamp,
                    ),
                  },
                  {
                    name: "Previous Username",
                    value: `${memberRecord.data.user_name}${memberRecord.data.display_name ? ` / ${memberRecord.data.display_name}` : ""}`,
                  },
                  {
                    name: "Previous Roles",
                    value:
                      memberRecord.data.roles.length > 0
                        ? memberRecord.data.roles
                            .split(",")
                            .map((r) => `<@&${r}>`)
                            .join(", ")
                        : "Unavailable",
                  },
                )
                .setFooter({
                  text: `Member count: ${member.guild.memberCount}`,
                })
                .setThumbnail(resolvedMember.member.displayAvatarURL())
                .setColor("DarkOrange")
                .setTimestamp(Date.now()),
            ],
          },
        );

        // Re-jail if they were previously jailed.
        if (
          resolvedMember.moderatedGuild.jail &&
          memberRecord.data.roles
            .split(",")
            .includes(resolvedMember.moderatedGuild.jail.jailRoleId)
        ) {
          await resolvedMember.jail(DiscordBot.shared.client.user, "Re-joined");
          await new DiscordAlert(resolvedMember.moderatedGuild).send(
            "JAIL-CHAT",
            {
              content: `...you're back.`,
            },
          );
        } else {
          // Welcome back.
          if (
            resolvedMember.moderatedGuild.id === "911268076933230662" ||
            resolvedMember.moderatedGuild.id === "1080271049377202177"
          ) {
            await new DiscordAlert(resolvedMember.moderatedGuild).send(
              "WELCOME",
              {
                content: `<@${member.user.id}>`,
                embeds: [
                  new EmbedBuilder()
                    .setTitle("Peace be upon you!")
                    .setDescription(
                      `**Welcome back,** <@${member.user.id}>. Join <#911268076933230667> any time to get involved in discussions, ask questions, share your thoughts, or just listen in.\n\nYou can choose your server-roles at <#935279135012565052>.`,
                    )
                    .setFooter({
                      text:
                        member.guild.memberCount % 19 === 0
                          ? `Members: ${member.guild.memberCount} (19 x ${Math.floor(member.guild.memberCount / 19)})`
                          : `Members: ${member.guild.memberCount}`,
                    })
                    .setThumbnail(resolvedMember.member.displayAvatarURL())
                    .setColor("DarkBlue")
                    .setTimestamp(Date.now()),
                ],
              },
            );
          }
        }
      }

      // CASE: a new member has joined.
      else {
        // Grant member role.
        await resolvedMember.addRole(
          resolvedMember.moderatedGuild.keyRoles.member,
        );

        // Grant new member role.
        await resolvedMember.addRole(
          resolvedMember.moderatedGuild.keyRoles.newMember,
        );

        // Notify staff.
        await new DiscordAlert(resolvedMember.moderatedGuild).send(
          "STAFF-LOG",
          {
            embeds: [
              new EmbedBuilder()
                .setAuthor({
                  name: `${resolvedMember.member.user.username} has joined`,
                  iconURL: resolvedMember.member.displayAvatarURL(),
                })
                .addFields(
                  { name: "User", value: resolvedMember.completeUserString() },
                  {
                    name: "Account Created",
                    value: resolvedMember.accountCreatedRelativeTimeString(),
                  },
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
                )
                .setThumbnail(resolvedMember.member.displayAvatarURL())
                .setFooter({
                  text: `Member count: ${member.guild.memberCount}`,
                })
                .setColor("DarkGreen")
                .setTimestamp(Date.now()),
            ],
          },
        );

        // Welcome.
        await new DiscordAlert(resolvedMember.moderatedGuild).send("WELCOME", {
          embeds: [
            new EmbedBuilder()
              .setTitle("Peace be upon you!")
              .setDescription(
                `**Welcome to the Submission Server, <@${member.user.id}>.** Feel free to look around and check out the different channels. We have all kinds of content and resources available.\n\nThis server is most active with voice chat activity. Join <#911268076933230667> any time to get involved in discussions, ask questions, share your thoughts, or just listen in.\n\nYou can choose your server-roles at <#935279135012565052>.\n\nNew to Submission? Learn about the universal message at <#915714992119091220>.`,
              )
              .setFooter({
                text:
                  member.guild.memberCount % 19 === 0
                    ? `Members: ${member.guild.memberCount} (19 x ${Math.floor(member.guild.memberCount / 19)})`
                    : `Members: ${member.guild.memberCount}`,
              })
              .setThumbnail(resolvedMember.member.displayAvatarURL())
              .setColor("DarkBlue")
              .setTimestamp(Date.now()),
          ],
        });

        // Send new account alert, if a very new account.
        if (
          member.user.createdTimestamp >
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ) {
          await new DiscordAlert(resolvedMember.moderatedGuild).send(
            "ANTI-RAID",
            {
              embeds: [
                new EmbedBuilder()
                  .setTitle("New Account Alert")
                  .addFields(
                    {
                      name: "User",
                      value: `${member.user.displayName} / ${member.user.username} (<@${member.id}>)`,
                    },
                    {
                      name: "Alert",
                      value: `Brand new account – created **${DateUtilities.distanceFromNow(member.user.createdTimestamp)}**`,
                    },
                  )
                  .setFooter({ text: "Anti-Raid" })
                  .setThumbnail(resolvedMember.member.displayAvatarURL())
                  .setColor("DarkRed")
                  .setTimestamp(Date.now()),
              ],
            },
          );
        }
      }

      // Update database with latest data.
      await updateMemberDatabaseRecord();

      DiscordBot.shared.logEvent(
        "guildMemberAdd",
        `User "${resolvedMember.member.user.username}" has joined "${resolvedMember.member.guild.name}"`,
      );

      async function updateMemberCounter() {
        if (!resolvedMember) return;

        const memberCount = member.guild.memberCount;
        if (
          resolvedMember.moderatedGuild &&
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
            guild_id: member.guild.id,
            avatar_url: member.displayAvatarURL(),
            joined_timestamp: Date.now(),
            created_timestamp: member.user.createdTimestamp,
            roles: resolvedMember.roleIdArrayAsString() || "",
          });

        if (request.error) {
          DiscordBot.shared.logError(request.error);
        }
      }
    }
  });
}
