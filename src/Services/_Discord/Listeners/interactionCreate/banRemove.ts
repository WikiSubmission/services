import { DiscordBot } from "../../../../Modules/DiscordModule";
import { DiscordMemberManager } from "../../../../Modules/DiscordModule/Utilities/DiscordMemberManager";

export default function listener(): void {
  DiscordBot.shared.addEventListener(
    "interactionCreate",
    async (interaction) => {
      if (interaction.isButton()) {
        if (interaction.customId.startsWith("unban")) {
          await interaction.deferReply({ ephemeral: true });

          const [_, userId, reason] = interaction.customId.split("*");

          const result = await DiscordMemberManager.unban(
            userId,
            interaction.member,
            interaction.guild,
            reason,
          );

          if (result instanceof Error) {
            await interaction.editReply({
              content: `\`${result.message}\``,
            });
          } else {
            await interaction.editReply({ content: `\`Success\`` });
          }
        }
      }
    },
  );
}
