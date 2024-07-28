import { EmbedBuilder, GuildMember } from "discord.js";
import { DiscordConfig } from "../../../Modules/DiscordModule/Vars/DiscordConfig";
import { DiscordScheduledActions } from "../../../Modules/DiscordModule/Utilities/DiscordScheduledActions";
import { DiscordBot } from "../../../Modules/DiscordModule";
import { DiscordAlert } from "../../../Modules/DiscordModule/Utilities/DiscordAlertManager";

export default function action(): void {
  DiscordScheduledActions.create({
    id: "DailyNewMemberGraduation",
    description:
      "Removes the New Member role for those who have joined for long enough",
    interval: "EVERY_DAY",
    action: async () => {
      for (const knownGuild of DiscordConfig.knownGuilds) {
        const guild = DiscordBot.shared.client.guilds.cache.find(
          (g) => g.id === knownGuild.id,
        );

        const cutOffTimestampForNewMembers =
          Date.now() -
          DiscordConfig.newMemberPeriodLengthDays * 24 * 60 * 60 * 1000;

        const stats = {
          newMembers: 0,
          graduatedMembers: new Map<string, GuildMember>(),
        };

        // Loop over every guild member
        for (const [id, member] of guild?.members.cache || []) {
          // Check if user has 'new member' role
          if (member.roles.cache.has(knownGuild.keyRoles.newMember)) {
            stats.newMembers++;

            // Check if they have been here for long enough
            if (
              member.joinedTimestamp &&
              member.joinedTimestamp < cutOffTimestampForNewMembers
            ) {
              // If so, remove the new member role
              await member.roles.remove(knownGuild.keyRoles.newMember);
              stats.graduatedMembers.set(id, member);
            }
          }
        }

        // Send a summary alert
        await new DiscordAlert(knownGuild.id).send("STAFF-LOG", {
          embeds: [
            new EmbedBuilder()
              .setTitle("New Member Summary as of Today")
              .addFields(
                {
                  name: `# of New Members`,
                  value: `${stats.newMembers}`,
                },
                {
                  name: `# Graduated Just Now`,
                  value: `${stats.graduatedMembers.size}`,
                },
                {
                  name: `Policy`,
                  value: `The <@&${knownGuild.keyRoles.newMember}> role is removed after **${DiscordConfig.newMemberPeriodLengthDays}** days have passed since joining the server`,
                },
              )
              .setColor("DarkOrange"),
          ],
        });
      }
    },
  });
}
