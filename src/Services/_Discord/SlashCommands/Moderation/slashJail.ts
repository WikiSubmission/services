import { WikiSlashCommand } from "../../../../Modules/DiscordModule/Types/WikiSlashCommand";
import { DiscordMemberManager } from "../../../../Modules/DiscordModule/Utilities/DiscordMemberManager";
import { DiscordConfig } from "../../../../Modules/DiscordModule/Vars/DiscordConfig";

export default function command(): WikiSlashCommand {
  return {
    name: "jail",
    description: "Jail a user",
    options: [
      {
        name: "user",
        description: "Enter the user to jail",
        type: "USER",
      },
      {
        name: "reason",
        description: "Jail reason?",
        type: "STRING",
        choices: [
          "violating discord tos",
          "excessive spam",
          "personal attacks",
          "trolling",
          "profanity",
          "mocking or ridiculing",
          "advertising",
          "suspicious activity",
          "other",
        ].map((i) => ({
          name: i,
          value: i,
        })),
      },
    ],
    accessControl: "MOD_AND_ABOVE",
    guildSpecific: DiscordConfig.knownGuilds
      .filter((i) => i.jail)
      .map((i) => ({
        name: i.name,
        id: i.id,
      })),
    handler: async (interaction) => {
      await interaction.deferReply({ ephemeral: true });

      const suspect = interaction.options.get("user")?.value?.toString();

      if (!suspect) {
        await interaction.editReply({
          content: `\`Unable to find user\``,
        });
      } else {
        const resolvedSuspect = await DiscordMemberManager.get(
          suspect,
          interaction.guildId,
        );
        if (resolvedSuspect) {
          const result = await resolvedSuspect.jail(
            interaction.member,
            interaction.options.get("reason")?.value?.toString() || undefined,
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
