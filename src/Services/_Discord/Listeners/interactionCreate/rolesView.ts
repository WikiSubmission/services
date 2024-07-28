import { DiscordBot } from "../../../../Modules/DiscordModule";
import { DiscordMemberManager } from "../../../../Modules/DiscordModule/Utilities/DiscordMemberManager";

export default function listener(): void {
  DiscordBot.shared.addEventListener(
    "interactionCreate",
    async (interaction) => {
      if (!interaction.guildId) return;
      if (interaction.isButton()) {
        if (interaction.customId === "view_roles") {
          const resolvedMember = await DiscordMemberManager.get(
            interaction.member,
            interaction.guild,
          );

          if (resolvedMember && resolvedMember.member) {
            await interaction.reply({
              embeds: [
                {
                  title: "View Roles",
                  fields: [
                    {
                      name: `User`,
                      value: resolvedMember.completeUserString(),
                    },
                    {
                      name: `Roles`,
                      value: resolvedMember.roleListDiscordFormat(),
                    },
                  ],
                  thumbnail: {
                    url: resolvedMember.member.displayAvatarURL(),
                  },
                },
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
