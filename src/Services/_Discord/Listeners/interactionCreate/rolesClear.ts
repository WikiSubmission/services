import { DiscordBot } from "../../../../Modules/DiscordModule";
import { DiscordMemberManager } from "../../../../Modules/DiscordModule/Utilities/DiscordMemberManager";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";

export default function listener(): void {
  DiscordBot.shared.addEventListener(
    "interactionCreate",
    async (interaction) => {
      if (!interaction.guildId) return;
      if (!DiscordUtilities.getModeratedGuild(interaction.guild)) return;

      if (interaction.isButton()) {
        if (interaction.customId === "clear_roles") {
          const resolvedMember = await DiscordMemberManager.get(
            interaction.member,
            interaction.guildId,
          );

          if (
            resolvedMember &&
            resolvedMember.member &&
            resolvedMember.moderatedGuild
          ) {
            const userRoleNames = resolvedMember.member.roles.cache
              .filter((role) => role.name !== "@everyone")
              .map((role) => role.name);

            const choosableRoleNames =
              resolvedMember.moderatedGuild.choosableRoles.flatMap(
                (category) => category.roleNames,
              );

            const rolesToRemove = choosableRoleNames.filter((roleName) =>
              userRoleNames.includes(roleName),
            );

            const result = await resolvedMember.removeRole(
              rolesToRemove,
              "Self cleared roles",
              true,
              {
                extendedAuthorText: `removed ${rolesToRemove.length} role${rolesToRemove.length > 1 ? "s" : ""}`,
              },
            );

            switch (result) {
              case "REMOVED":
                await interaction.reply({
                  content: `\`Success\` – cleared role${rolesToRemove.length > 1 ? "s" : ""} "${rolesToRemove.join(", ")}"`,
                  ephemeral: true,
                });
                return;

              default:
                await interaction.reply({
                  content: "`You do not have any roles to clear`",
                  ephemeral: true,
                });
                return;
            }
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
