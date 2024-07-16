// import { WikiSubmissionBot } from "../../..";
// import { NetworkUtilities } from "../../../../../../../Utilities/NetworkUtilities";

// export default function listener(): void {
//   WikiSubmissionBot.addEventListener(
//     "interactionCreate",
//     async (interaction) => {
//       if (interaction.isButton()) {
//         if (interaction.customId.startsWith("start_event")) {
//           await interaction.deferReply({ ephemeral: true });

//           const [_, eventId] = interaction.customId.split(":");

//           const event = await NetworkUtilities.PATCH(
//             `https://discord.com/api/v10`,
//             `/guilds/${interaction.guildId}/scheduled-events/${eventId}`,
//             {
//               status: 2,
//             },
//             {
//               headers: {
//                 Authorization: `Bot ${WikiSubmissionBot.authentication.token}`,
//               },
//             },
//           );

//           if (event) {
//             await interaction.editReply({ content: `\`Success\`` });
//           } else {
//             await interaction.editReply({ content: `\`Error\`` });
//           }
//         }
//       }
//     },
//   );
// }
