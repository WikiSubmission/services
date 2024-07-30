import { SystemUtils } from "../../../../Utilities/SystemUtils";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";
import { SerializedInteraction } from "../../../../Modules/DiscordModule/Types/SerializedInteraction";
import { DiscordQuranRequest } from "../../../../Modules/DiscordModule/Utilities/DiscordQuranRequest";
import { DiscordNewsletterRequest } from "../../../../Modules/DiscordModule/Utilities/DiscordNewsletterRequest";
import { DiscordRequestResult } from "../../../../Modules/DiscordModule/Types/DiscordRequestResult";
import { DiscordMediaRequest } from "../../../../Modules/DiscordModule/Utilities/DiscordMediaRequest";
import { GlobalBot } from "../../../../Modules/DiscordModule/GlobalBot";

export default function listener(): void {
  GlobalBot.shared.addEventListener(
    "interactionCreate",
    async (interaction) => {
      if (interaction.isButton()) {
        if (interaction.customId.startsWith("page_")) {
          // Get cached interaction.
          const db = await SystemUtils.getSupabaseClient();
          const request = await db
            .from("GlobalCache")
            .select("*")
            .eq("key", interaction.message.interaction?.id)
            .single();

          if (request && request.data?.value) {
            const cachedInteraction: SerializedInteraction = JSON.parse(
              request.data.value,
            );

            // Verify if requestor can change the page.
            if (
              // Original requester.
              cachedInteraction.user === interaction.user.id ||
              // Or, insider and above.
              DiscordUtilities.verifyMember(
                interaction.member,
                "INSIDER_AND_ABOVE",
              )
            ) {
              // Extract desired page from custom ID.
              const desiredPage = parseInt(
                interaction.customId.split("_")[1],
                10,
              );

              // Get new data.
              try {
                let output: DiscordRequestResult;

                switch (cachedInteraction.commandName) {
                  case "search-newsletters":
                    output = await new DiscordNewsletterRequest(
                      cachedInteraction,
                      desiredPage,
                    ).getResults();
                    break;

                  case "search-media":
                    output = await new DiscordMediaRequest(
                      cachedInteraction,
                      desiredPage,
                    ).getResults();
                    break;

                  default: // === "search-quran"
                    output = await new DiscordQuranRequest(
                      cachedInteraction,
                      desiredPage,
                    ).getResults();
                }

                // Update the embed.
                if (output) {
                  await interaction.update({
                    content: output.content,
                    embeds: output.embeds,
                    components: output.components,
                  });
                } else {
                  // Would be weird if we end up here, but might as well add it:
                  await interaction.reply({
                    content: `\`Unknown command\``,
                    ephemeral: true,
                  });
                }
              } catch (error: any) {
                // Errors thrown from re-processing the request, or otherwise an internal error.
                await interaction.reply({
                  content: `\`${error.message || "Internal Server Error"}\``,
                  ephemeral: true,
                });
              }
            } else {
              // User not authorized to change page.
              await interaction.reply({
                content:
                  "`Only the original requester may change the page. You can make your own request.`",
                ephemeral: true,
              });
              return;
            }
          } else {
            // Cached interaction not found in DB.
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
