import { PrivateBot } from "../../../../Modules/DiscordModule/PrivateBot";
import { DiscordMemberManager } from "../../../../Modules/DiscordModule/Utilities/DiscordMemberManager";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";
import { DiscordConfig } from "../../../../Modules/DiscordModule/Vars/DiscordConfig";

export default function listener(): void {
  PrivateBot.shared.addEventListener(
    "interactionCreate",
    async (interaction) => {
      if (!interaction.guildId) return;
      if (!DiscordUtilities.getModeratedGuild(interaction.guild)) return;

      if (interaction.isStringSelectMenu()) {
        if (
          interaction.customId === "role_update" &&
          interaction.values.length > 0 &&
          interaction.guildId &&
          DiscordConfig.knownGuilds
            .map((i) => i.id)
            .includes(interaction.guildId)
        ) {
          const resolvedMember = await DiscordMemberManager.get(
            interaction.member,
            interaction.guildId,
          );

          if (!resolvedMember) {
            await interaction.reply({
              content: `\`Unable to resolve member\``,
              ephemeral: true,
            });
            return;
          }

          const rolesToAdd = interaction.values.map((value) => {
            const [roleCategory, roleId, roleName] = value.split(":");
            return { roleCategory, roleId, roleName };
          });

          const sameCategoryRolesToRemove =
            DiscordConfig.knownGuilds
              .find((g) => g.id === interaction.guildId)
              ?.choosableRoles.find(
                (c) =>
                  !c.allowMultiple && c.category === rolesToAdd[0].roleCategory,
              )
              ?.roleNames.filter((i) => i !== rolesToAdd[0].roleName) || [];

          const result = await resolvedMember.addRole(
            rolesToAdd.map((i) => i.roleId),
            "Choose Roles",
            true,
            {
              extendedAuthorText: `updated their role`,
              footerText: rolesToAdd[0].roleCategory,
            },
            {
              sameCategoryRolesToRemove: sameCategoryRolesToRemove,
            },
          );

          if (result === "ADDED") {
            await interaction.reply({
              content: `\`Success\` – you now have the ${rolesToAdd.map((role) => `<@&${role.roleId}>`).join(", ")} role${rolesToAdd.length > 1 ? "s" : ""}`,
              ephemeral: true,
            });
          } else if (result === "ALREADY_HAS_ROLE") {
            await interaction.reply({
              content: `\`You already have the role${rolesToAdd.length > 1 ? "s" : ""}: ${rolesToAdd.map((role) => `<@&${role.roleId}>`).join(", ")}\``,
              ephemeral: true,
            });
          } else if (result === "ROLE_DOES_NOT_EXIST") {
            await interaction.reply({
              content: `\`Role does not exist: ${rolesToAdd.map((i) => i.roleName).join(", ")}\``,
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: `\`Failed to add role${rolesToAdd.length > 1 ? "s" : ""} - try again later: ${rolesToAdd.map((role) => `<@&${role.roleId}>`).join(", ")}\``,
              ephemeral: true,
            });
          }
        }
      }
    },
  );
}
