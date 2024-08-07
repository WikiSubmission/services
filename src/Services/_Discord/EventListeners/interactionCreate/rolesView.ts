import { EmbedBuilder } from "discord.js";
import { DiscordMemberManager } from "../../../../Modules/DiscordModule/Utilities/DiscordMemberManager";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";
import { PrivateBot } from "../../../../Modules/DiscordModule/PrivateBot";

export default function listener(): void {
  PrivateBot.shared.addEventListener(
    "interactionCreate",
    async (interaction) => {
      if (!interaction.guildId) return;
      if (!DiscordUtilities.getModeratedGuild(interaction.guild)) return;

      if (interaction.isButton()) {
        if (interaction.customId === "view_roles") {
          const resolvedMember = await DiscordMemberManager.get(
            interaction.member,
            interaction.guild,
          );

          if (resolvedMember && resolvedMember.member) {
            await interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setTitle("View Roles")
                  .addFields(
                    {
                      name: `User`,
                      value: resolvedMember.completeUserString(),
                    },
                    {
                      name: `Roles`,
                      value: resolvedMember.roleListDiscordFormat(),
                    },
                  )
                  .setThumbnail(resolvedMember.member.displayAvatarURL())
                  .setColor("DarkButNotBlack"),
              ],
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: "`Failed to fetch your profile`",
              ephemeral: true,
            });
          }
        }
      }
    },
  );
}
