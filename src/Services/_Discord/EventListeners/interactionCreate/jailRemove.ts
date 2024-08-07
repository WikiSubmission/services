import { PrivateBot } from "../../../../Modules/DiscordModule/PrivateBot";
import { DiscordMemberManager } from "../../../../Modules/DiscordModule/Utilities/DiscordMemberManager";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";

export default function listener(): void {
  PrivateBot.shared.addEventListener(
    "interactionCreate",
    async (interaction) => {
      if (!DiscordUtilities.getModeratedGuild(interaction.guild)) return;

      if (interaction.isButton()) {
        if (interaction.customId.startsWith("unjail")) {
          await interaction.deferReply({ ephemeral: true });

          const [_, userId, __] = interaction.customId.split("*");

          const suspect = await DiscordMemberManager.get(
            userId,
            interaction.guildId,
          );

          if (suspect && suspect.member) {
            const result = await suspect.unjail(interaction.member);
            if (result instanceof Error) {
              await interaction.editReply({ content: `\`${result.message}\`` });
            } else {
              await interaction.editReply({ content: `\`Success\`` });
            }
          } else {
            await interaction.editReply({ content: `\`Error\`` });
          }
        }
      }
    },
  );
}
