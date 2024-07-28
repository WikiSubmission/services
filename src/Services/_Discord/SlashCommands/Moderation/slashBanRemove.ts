import { WikiSlashCommand } from "../../../../Modules/DiscordModule/Types/WikiSlashCommand";
import { DiscordMemberManager } from "../../../../Modules/DiscordModule/Utilities/DiscordMemberManager";
import { DiscordConfig } from "../../../../Modules/DiscordModule/Vars/DiscordConfig";

export default function command(): WikiSlashCommand {
  return {
    name: "unban",
    description: "Unban a user",
    options: [
      {
        name: "user-id",
        description: "Enter their user ID",
        type: "USER",
      },
      {
        name: "reason",
        description: "Unban reason?",
        type: "STRING",
        optional: true,
      },
    ],
    accessControl: "MOD_AND_ABOVE",
    guildSpecific: DiscordConfig.knownGuilds
      .filter((i) => i.jail)
      .map((i) => ({
        name: i.name,
        id: i.id,
      })),
    disabledInDM: true,
    handler: async (interaction) => {
      await interaction.deferReply({ ephemeral: true });

      const suspect = interaction.options.get("user-id")?.value?.toString();
      const reason = interaction.options.get("reason")?.value?.toString();

      if (!suspect) {
        await interaction.editReply({
          content: `\`Unable to find user\``,
        });
      } else {
        const result = await DiscordMemberManager.unban(
          suspect,
          interaction.member,
          interaction.guild,
          reason
            ? `${reason} - <@${interaction.user.id}>`
            : `Unbanned by <@${interaction.user.id}>`,
        );

        await interaction.editReply({
          content: result instanceof Error ? result.message : `\`Success\``,
        });
      }
      return interaction;
    },
  };
}
