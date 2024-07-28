import { WikiSlashCommand } from "../../../../Modules/DiscordModule/Types/WikiSlashCommand";
import { DiscordMemberManager } from "../../../../Modules/DiscordModule/Utilities/DiscordMemberManager";
import { DiscordConfig } from "../../../../Modules/DiscordModule/Vars/DiscordConfig";

export default function command(): WikiSlashCommand {
  return {
    name: "ban",
    description: "Ban a user",
    options: [
      {
        name: "user",
        description: "Enter the user to jail",
        type: "USER",
      },
      {
        name: "reason",
        description: "Ban reason?",
        type: "STRING",
      },
      {
        name: "delete-messages",
        description: "Delete their recent messages?",
        type: "STRING",
        optional: true,
        choices: [
          {
            name: "last hour",
            value: "1h",
          },
          {
            name: "last 1 day",
            value: "1d",
          },
          {
            name: "last week",
            value: "1w",
          },
        ],
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
      const reason = interaction.options.get("reason")?.value?.toString();
      const deleteMessagesDuration = interaction.options
        .get("delete-messages")
        ?.value?.toString() as "1h" | "1d" | "1d" | undefined;

      if (!suspect) {
        await interaction.editReply({
          content: `\`Unable to find user\``,
        });
      } else if (!reason) {
        await interaction.editReply({
          content: `\`A reason is required\``,
        });
      } else {
        const resolvedSuspect = await DiscordMemberManager.get(
          suspect,
          interaction.guild,
        );
        if (resolvedSuspect) {
          const result = await resolvedSuspect.ban(
            interaction.member,
            deleteMessagesDuration,
            reason
              ? `${reason} - <@${interaction.user.id}>`
              : `Banned by <@${interaction.user.id}>`,
          );
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
