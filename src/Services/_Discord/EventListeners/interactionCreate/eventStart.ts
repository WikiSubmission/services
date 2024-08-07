import { PrivateBot } from "../../../../Modules/DiscordModule/PrivateBot";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";

export default function listener(): void {
  PrivateBot.shared.addEventListener(
    "interactionCreate",
    async (interaction) => {
      if (!DiscordUtilities.getModeratedGuild(interaction.guild)) return;

      if (interaction.isButton()) {
        if (interaction.customId.startsWith("start_event")) {
          await interaction.deferReply({ ephemeral: true });

          const [_, eventId] = interaction.customId.split(":");

          const event = await fetch(
            `https://discord.com/api/v10/guilds/${interaction.guildId}/scheduled-events/${eventId}`,
            {
              method: "PATCH",
              body: JSON.stringify({ status: 2 }),
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bot ${(await PrivateBot.shared.getPrivateBotCredentials()).token}`,
              },
            },
          );

          if (event.ok) {
            await interaction.editReply({ content: `\`Success\`` });
          } else {
            await interaction.editReply({ content: `\`Error\`` });
          }
        }
      }
    },
  );
}
