import { DiscordBot } from "../../../../Modules/DiscordModule";
import { DiscordMemberManager } from "../../../../Modules/DiscordModule/Utilities/DiscordMemberManager";

export default function listener(): void {
  DiscordBot.shared.addEventListener(
    "interactionCreate",
    async (interaction) => {
      if (interaction.isButton()) {
        if (interaction.customId.startsWith("ban")) {
          await interaction.deferReply({ ephemeral: true });

          const [_, userId, reason] = interaction.customId.split("*");

          const suspect = await DiscordMemberManager.get(
            userId,
            interaction.guildId,
          );

          if (suspect && suspect.member) {
            const result = await suspect.ban(
              interaction.member,
              undefined,
              reason,
            );
            if (result instanceof Error) {
              await interaction.editReply({
                content: `\`${result.message}\``,
              });
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
