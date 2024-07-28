import { EmbedBuilder } from "discord.js";
import { DiscordScheduledActions } from "../../../Modules/DiscordModule/Utilities/DiscordScheduledActions";
import { DiscordConfig } from "../../../Modules/DiscordModule/Vars/DiscordConfig";
import { DiscordAlert } from "../../../Modules/DiscordModule/Utilities/DiscordAlertManager";

export default function action(): void {
  DiscordScheduledActions.create({
    id: "DailyJailReminder",
    description: "Send a daily notice in the jail chat",
    interval: "EVERY_DAY",
    action: async () => {
      for (const knownGuild of DiscordConfig.knownGuilds) {
        if (knownGuild.jail) {
          await new DiscordAlert(knownGuild.id).send("JAIL-CHAT", {
            embeds: [
              new EmbedBuilder()
                .setTitle("Reminder")
                .setDescription(
                  "If you have been jailed, staff may consider releasing you if you pledge to reform and not violate the server rules again. You may make this pledge in this chat or message a staff member.",
                )
                .setColor("Yellow"),
            ],
          });
        }
      }
    },
  });
}
