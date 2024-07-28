import { EmbedBuilder } from "discord.js";
import { DiscordBot } from "../../../../Modules/DiscordModule";
import { DiscordConfig } from "../../../../Modules/DiscordModule/Vars/DiscordConfig";
import { DiscordScheduledActions } from "../../../../Modules/DiscordModule/Utilities/DiscordScheduledActions";

/**
 * Message event listener to manually trigger a scheduled action immediately. This will not interrupt its original cycle.
 */
export default function listener(): void {
  DiscordBot.shared.addEventListener("messageCreate", async (message) => {
    if (!message.content.startsWith("!action")) return;
    if (
      message.member &&
      !DiscordConfig.wikiSubmissionMaintainers.includes(message.member.user.id)
    )
      return;
    if (message.content.includes(" ") && !message.content.endsWith(" ")) {
      const [_, actionId] = message.content.split(" ");
      const result = await DiscordScheduledActions.trigger(actionId);
      await message.reply(
        result instanceof Error
          ? `\`${result.message}\``
          : `\`Successfully triggered action "${actionId}"\` (note: this will not disrupt its original cycle)`,
      );
    } else {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Actions")
            .addFields(
              DiscordScheduledActions.listActiveActions().map((a) => ({
                name: `${a}`,
                value: `${DiscordScheduledActions.actions.get(a)?.action.description || "--"}\nRegular Interval: \`${DiscordScheduledActions.actions.get(a)?.action.interval || "--"}\``,
              })),
            )
            .setColor("DarkButNotBlack")
            .setFooter({
              text: 'To trigger an action immediately, type "!action [action-id]"',
            }),
        ],
      });
    }
  });
}
