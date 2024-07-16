import { DiscordBot } from "../../../../Modules/DiscordModule";
import { SystemUtilities } from "../../../../Utilities/SystemUtils";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";
import { DiscordQuranRequest } from "../../../../Modules/DiscordModule/Utilities/DiscordRequest";
import { parse } from "best-effort-json-parser";
import { DiscordCachedInteraction } from "../../../../Modules/DiscordModule/Types/DiscordCachedInteraction";
import { ActionRowBuilder, ButtonBuilder } from "discord.js";

export default function listener(): void {
  DiscordBot.shared.addEventListener(
    "interactionCreate",
    async (interaction) => {
      if (interaction.isButton()) {
        if (interaction.customId.startsWith("page:")) {
          // Get cached interaction.
          const db = await SystemUtilities.getSupabaseClient();
          const request = await db
            .from("GlobalCache")
            .select("*")
            .eq("key", interaction.message.interaction?.id)
            .single();

          if (request && request.data?.value) {
            const cachedInteraction = new DiscordCachedInteraction(
              parse(request.data.value),
            );

            // Verify if requestor can change the page.
            if (
              // Original requester.
              cachedInteraction.userId !== interaction.user.id ||
              // Or, insider and above.
              !DiscordUtilities.verifyMember(
                interaction.member,
                "INSIDER_AND_ABOVE",
              )
            ) {
              await interaction.reply({
                content:
                  "`Only the original requester may change the page. You can make your own request.`",
                ephemeral: true,
              });
            }

            // Get page movement.
            // Structured as: "page:[MOVEMENT]*[CURRENT_PAGE]/[TOTALPAGES]"
            const movement = interaction.customId
              .split("page:")[1]
              .split("*")[0];
            const currentPage = parseInt(
              interaction.customId
                .split("page:")[1]
                .split("*")[1]
                .split("/")[0],
              10,
            );
            const totalPages = parseInt(
              interaction.customId
                .split("page:")[1]
                .split("*")[1]
                .split("/")[1],
              10,
            );
            const newPage =
              movement === "previous" ? currentPage - 1 : currentPage + 1;

            // Re-calculate the data, based on the command.

            if (cachedInteraction.commandName.startsWith("search")) {
              if (cachedInteraction.commandName.includes("quran")) {
                console.log(
                  `Passing new page #: ${newPage} (current is ${currentPage})`,
                );
                const { content, embeds, components } =
                  await new DiscordQuranRequest(
                    cachedInteraction,
                    newPage,
                  ).resolveSearchRequest();

                console.log("------------");
                console.log(`New data:`);
                console.log(content);
                console.log(JSON.stringify(embeds));
                console.log(JSON.stringify(components));
                console.log(
                  `Movement: ${movement}, CurrentPage: ${currentPage}, TotalPages: ${totalPages}, NewPage: ${newPage}`,
                );
                console.log("------------");

                await interaction.update({
                  content,
                  embeds,
                  components:
                    totalPages > 1
                      ? [
                          new ActionRowBuilder<any>().setComponents(
                            new ButtonBuilder()
                              .setLabel("Next page")
                              .setCustomId(
                                `page:next*${newPage + 1}/${totalPages}`,
                              )
                              .setStyle(1),

                            ...(currentPage > 1
                              ? [
                                  new ButtonBuilder()
                                    .setLabel("Previous Page")
                                    .setCustomId(
                                      `page:previous*${currentPage - 1}/${totalPages}`,
                                    )
                                    .setStyle(2),
                                ]
                              : []),
                          ),
                        ]
                      : [],
                });
              }
            }
          } else {
            await interaction.reply({
              content: "`Request expired. Please make a new one.`",
              ephemeral: true,
            });
          }
        }
      }
    },
  );
}
