// import { WikiSubmissionBot } from "../../..";
// import { DiscordMemberManager } from "../../Utilities/DiscordMemberManager";

// export default function listener(): void {
//   WikiSubmissionBot.addEventListener(
//     "interactionCreate",
//     async (interaction) => {
//       if (interaction.isButton()) {
//         if (interaction.customId.startsWith("unjail")) {
//           await interaction.deferReply({ ephemeral: true });

//           const [_, userId, __] = interaction.customId.split("*");

//           const suspect = await DiscordMemberManager.get(
//             userId,
//             interaction.guildId,
//           );

//           if (suspect && suspect.member) {
//             const result = await suspect.unjail(interaction.member);
//             if (result instanceof Error) {
//               await interaction.editReply({ content: `\`${result.message}\`` });
//             } else {
//               await interaction.editReply({ content: `\`Success\`` });
//             }
//           } else {
//             await interaction.editReply({ content: `\`Error\`` });
//           }
//         }
//       }
//     },
//   );
// }
