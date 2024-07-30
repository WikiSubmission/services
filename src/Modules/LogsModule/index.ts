import { ClientEvents, DiscordAPIError } from "discord.js";
import {
  APIRequestEvent,
  APIResponseEvent,
} from "../APIModule/Types/APIEmittedEvents";
import { DiscordAlert } from "../DiscordModule/Utilities/DiscordAlertManager";
import { WebhookLog } from "./WebhookLog";

type BaseLogTypes = "launch" | "error";

export class WikiLog {
  static system(message: string) {
    const log = `[${WikiLog.timestamp()}] [SYSTEM] ${message}`;

    console.log(log);
  }

  static systemError(error: Error | any, sourceHint?: string, crash?: boolean) {
    const log = `[${this.timestamp}] [SYSTEM] [${error instanceof Error ? `[ERROR] ${error.name}: ${error.message}` : typeof Error === "object" ? JSON.stringify(error) : `${error}`}]${sourceHint ? ` (sourceHint: ${sourceHint})` : ``}${crash ? ` [CRASHING PROCESS]` : ``}`;

    new WebhookLog(log, "DISCORD_WEBHOOK_SYSTEM_ERROR_LOG");

    if (crash) {
      throw new Error(log);
    } else {
      console.error(log);
    }
  }

  static api(type: BaseLogTypes, message: string) {
    const log = `[${this.timestamp()}] [API] [${type.toUpperCase()}] ${message}`;

    console.log(log);
  }

  static apiRequest(data: APIRequestEvent) {
    const log = `[${this.timestamp()}] [API] [${data.id}] IN ---> ${data.method} ${data.route} @ ${data.host} (IP: ${data.ip})`;

    console.log(log);
  }

  static apiResponse(data: APIResponseEvent) {
    const log = `${this.timestamp()}] [API] [${data.id}] OUT --> ${data.statusCode} (${data.ping})${data.error ? ` ${data.error.name} | ${Array.isArray(data.error.description) ? data.error.description.join(", ") : data.error.description} | Fault: ${data.error.fault} | Severity: ${data.error.severity}` : ""}`;

    console.log(log);
  }

  static apiError(error: Error | any, sourceHint?: string, crash?: boolean) {
    const log = `[${this.timestamp}] [API] [${error instanceof Error ? `[ERROR] ${error.name}: ${error.message}` : typeof Error === "object" ? JSON.stringify(error) : `${error}`}]${sourceHint ? ` (sourceHint: ${sourceHint})` : ``}${crash ? ` [CRASHING PROCESS]` : ``}`;

    if (crash) {
      throw new Error(log);
    } else {
      console.error(log);
    }

    new WebhookLog(log, "DISCORD_WEBHOOK_API_ERROR_LOG");
  }

  static discord(type: BaseLogTypes, message: string) {
    const log = `[${this.timestamp()}] [DISCORD] [${type.toUpperCase()}] ${message}`;

    console.log(log);
  }

  static discordEvent(type: keyof ClientEvents, message: string) {
    const log = `[${this.timestamp()}] [DISCORD] [${type.toUpperCase()}] ${message}`;

    console.log(log);
  }

  static discordError(
    error: string | DiscordAPIError | Error | any,
    sourceHint?: string,
  ) {
    const log =
      error instanceof DiscordAPIError
        ? `[${this.timestamp()}] [DISCORD] [ERROR] ${error.name}: ${error.message} (${error.status})${sourceHint ? ` (${sourceHint})` : ""}`
        : error instanceof Error
          ? `[${this.timestamp()}] [DISCORD] [Internal Error] ${error.message}${sourceHint ? ` (sourceHint: ${sourceHint})` : ""}`
          : typeof error === "string"
            ? `[${this.timestamp()}] [DISCORD] [Internal Error] ${error}${sourceHint ? ` (sourceHint: ${sourceHint})` : ""}`
            : `[${this.timestamp()}] [DISCORD] [Unknown Error] ${error?.message || "--"}${sourceHint ? ` sourceHint: (${sourceHint})` : ""}`;

    console.log(log);

    new DiscordAlert("1080271049377202177").send("DISCORD-ERRORLOG", {
      content: `\`\`\`${log}\`\`\``,
    });
  }

  static timestamp() {
    return `${new Date().toISOString().split("T")[1]}`;
  }
}
