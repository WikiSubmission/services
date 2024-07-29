import { WikiEvents } from "../LogsModule";
import { DiscordHelpers } from "./DiscordHelpers";
import { GlobalBot } from "./GlobalBot";
import { PrivateBot } from "./PrivateBot";

export class DiscordBots extends DiscordHelpers {
  static shared = new DiscordBots();

  async start() {
    WikiEvents.emit("discord:launch", "LAUNCHING PRIVATE BOT");
    await PrivateBot.shared.login();
    await PrivateBot.shared.registerSlashCommands();

    console.log("\n");

    WikiEvents.emit("discord:launch", "LAUNCHING GLOBAL BOT");
    await GlobalBot.shared.login();
    await GlobalBot.shared.registerSlashCommands();

    console.log("\n");

    WikiEvents.emit("discord:launch", "ATTACHING EVENT LISTENERS");
    await this.attachEventListeners();

    console.log("\n");

    WikiEvents.emit("discord:launch", "SCHEDULING ACTIONS");
    await this.scheduleActions();
  }
}