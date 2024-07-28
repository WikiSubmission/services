import { EmbedBuilder } from "discord.js";
import { DiscordBot } from "../../../../Modules/DiscordModule";
import { DiscordAlert } from "../../../../Modules/DiscordModule/Utilities/DiscordAlertManager";
import { DiscordMemberManager } from "../../../../Modules/DiscordModule/Utilities/DiscordMemberManager";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";
import { DiscordConfig } from "../../../../Modules/DiscordModule/Vars/DiscordConfig";

export default function listener(): void {
  DiscordBot.shared.addEventListener(
    "interactionCreate",
    async (interaction) => {
      if (interaction.isButton()) {
        if (interaction.customId.startsWith("verify")) {
          await interaction.deferReply({ ephemeral: true });

          const [_, userId, __] = interaction.customId.split("*");

          // Ignore unauthorized requests
          if (
            !DiscordUtilities.verifyMember(interaction.member, "MOD_AND_ABOVE")
          ) {
            await interaction.editReply({
              content: "`Unauthorized`",
            });
            return;
          }

          // Attempt to add the 'verified' role to the user
          const resolvedMember = await DiscordMemberManager.get(
            userId,
            interaction.guildId,
          );
          if (!resolvedMember) {
            await interaction.editReply({
              content: `\`Unable to resolve member\``,
            });
            return;
          }

          const moderatedGuild = DiscordConfig.knownGuilds.find(
            (g) => g.id === interaction.guildId,
          );
          if (!moderatedGuild) {
            await interaction.editReply({
              content: `\`Not in a moderated guild\``,
            });
            return;
          }

          const result = await resolvedMember.addRole(
            moderatedGuild.keyRoles.verified,
          );

          // Respond
          switch (result) {
            case "ADDED":
              await interaction.editReply({
                content: `\`User is now verified\``,
              });
              await new DiscordAlert(interaction.guildId).send("ANTI-RAID", {
                embeds: [
                  new EmbedBuilder()
                    .setAuthor({
                      name: `${resolvedMember.member?.user.username} is now verified`,
                      iconURL: resolvedMember.member?.displayAvatarURL(),
                    })
                    .setFooter({
                      text: interaction.user.username,
                      iconURL: interaction.user.displayAvatarURL(),
                    })
                    .setColor("DarkGreen"),
                ],
              });
              return;
            case "ALREADY_HAS_ROLE":
              await interaction.editReply({
                content: `\`User has already been verified\``,
              });
              return;
            case "ROLE_DOES_NOT_EXIST":
              await interaction.editReply({
                content: `\`That role does not exist\``,
              });
              return;
            case "ERROR":
              await interaction.editReply({
                content: `\`Failed to verify user - they may have left\``,
              });
              return;
          }
        }
      }
    },
  );
}
