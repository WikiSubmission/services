// import { WikiSubmissionBot } from "../../..";
// import { DiscordMemberManager } from "../../Utilities/DiscordMemberManager";

// export default function listener(): void {
//   WikiSubmissionBot.addEventListener(
//     "interactionCreate",
//     async (interaction) => {
//       if (interaction.isButton()) {
//         if (interaction.customId.startsWith("unban")) {
//           await interaction.deferReply({ ephemeral: true });

//           const [_, userId, reason] = interaction.customId.split("*");

//           const result = await DiscordMemberManager.unban(
//             userId,
//             interaction.member,
//             interaction.guild,
//             reason,
//           );

//           if (result instanceof Error) {
//             await interaction.editReply({
//               content: `\`${result.message}\``,
//             });
//           } else {
//             await interaction.editReply({ content: `\`Success\`` });
//           }
//         }
//       }
//     },
//   );
// }
