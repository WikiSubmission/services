import { WikiLog } from "../LogsModule";
import { DiscordHelpers } from "./DiscordHelpers";
import { GlobalBot } from "./GlobalBot";
import { PrivateBot } from "./PrivateBot";

export class DiscordBots extends DiscordHelpers {
  static shared = new DiscordBots();

  async start() {
    WikiLog.discord("launch", "LAUNCHING PRIVATE BOT");
    await PrivateBot.shared.login();
    await PrivateBot.shared.registerSlashCommands();

    console.log("\n");

    WikiLog.discord("launch", "LAUNCHING GLOBAL BOT");
    await GlobalBot.shared.login();
    await GlobalBot.shared.registerSlashCommands();

    console.log("\n");

    WikiLog.discord("launch", "ATTACHING EVENT LISTENERS");
    await this.attachEventListeners();

    console.log("\n");

    WikiLog.discord("launch", "SCHEDULING ACTIONS");
    await this.scheduleActions();
  }
}
