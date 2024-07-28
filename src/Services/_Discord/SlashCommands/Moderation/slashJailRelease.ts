import { WikiSlashCommand } from "../../../../Modules/DiscordModule/Types/WikiSlashCommand";
import { DiscordMemberManager } from "../../../../Modules/DiscordModule/Utilities/DiscordMemberManager";
import { DiscordConfig } from "../../../../Modules/DiscordModule/Vars/DiscordConfig";

export default function command(): WikiSlashCommand {
  return {
    name: "unjail",
    description: "Unjail a user",
    options: [
      {
        name: "user",
        description: "Enter the user to unjail",
        type: "USER",
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

      const suspect = interaction.options.get("user")?.value?.toString();

      if (!suspect) {
        await interaction.reply({
          content: `\`Unable to find user\``,
          ephemeral: true,
        });
      } else {
        const resolvedSuspect = await DiscordMemberManager.get(
          suspect,
          interaction.guild,
        );
        if (resolvedSuspect) {
          const result = await resolvedSuspect.unjail(interaction.member);
          await interaction.editReply({
            content: result instanceof Error ? result.message : `\`Success\``,
          });
        } else {
          await interaction.editReply({
            content: `\`Failed to find that user - they may have left\``,
          });
        }
      }
      return interaction;
    },
  };
}
