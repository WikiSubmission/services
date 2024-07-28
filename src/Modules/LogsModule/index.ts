import { EventEmitter } from "eventemitter3";
import {
  ButtonInteraction,
  ClientEvents,
  CommandInteraction,
  DiscordAPIError,
} from "discord.js";
import {
  APIRequestEvent,
  APIResponseEvent,
} from "../APIModule/Types/APIEmittedEvents";
import { DiscordUtilities } from "../DiscordModule/Utilities/DiscordUtilities";

type SystemEvents = "system:launch" | "system:error" | "system:critical-error";
type ServiceEvents = "service:launch" | "service:error";
type APIEvents = "api:launch" | "api:request" | "api:response" | "api:error";
type DiscordEvents =
  | "discord:launch"
  | "discord:event"
  | `discord:${keyof ClientEvents}`;
type DatabaseEvents = "database:launch" | "database:error";

type WikiEventTypes =
  | SystemEvents
  | ServiceEvents
  | APIEvents
  | DiscordEvents
  | DatabaseEvents;

const events = new EventEmitter();

class WikiSubmissionEvents {
  constructor() {
    this.systemLogs();
    this.serviceLogs();
    this.apiLogs();
    this.databaseLogs();
    this.discordLogs();
  }

  on(event: WikiEventTypes, listener: (...args: any[]) => void): void {
    events.on(event, listener);
  }

  emit(event: WikiEventTypes, ...args: any[]): void {
    events.emit(event, ...args);
  }

  once(event: WikiEventTypes, listener: (...args: any[]) => void): void {
    events.once(event, listener);
  }

  private systemLogs() {
    events.on("system:launch", (data?: string) => {
      if (data) {
        console.log(
          `[${new Date().toISOString().split("T")[1]}] [SYSTEM] ${data}`,
        );
      }
    });

    events.on("system:error", (data?: string) => {
      if (data) {
        console.log(
          `[${new Date().toISOString().split("T")[1]}] [SYSTEM] [ERROR] ${data}`,
        );
      }
    });

    events.on("system:critical-error", (data?: string) => {
      if (data) {
        console.log(
          `[${new Date().toISOString().split("T")[1]}] [CRITICAL ERROR] ${data}`,
        );
        throw new Error();
      }
    });
  }

  private serviceLogs() {
    events.on("service:launch", (data?: string) => {
      if (data) {
        console.log(
          `[${new Date().toISOString().split("T")[1]}] [SERVICE] ${data}`,
        );
      }
    });

    events.on("service:error", (data?: string) => {
      if (data) {
        console.log(
          `[${new Date().toISOString().split("T")[1]}] [SERVICE] [ERROR] ${data}`,
        );
      }
    });
  }

  private apiLogs() {
    events.on("api:launch", (data?: string) => {
      if (data) {
        console.log(
          `[${new Date().toISOString().split("T")[1]}] [API] ${data}`,
        );
      }
    });

    events.on("api:request", (data?: APIRequestEvent) => {
      if (data) {
        console.log(
          `[${new Date().toISOString().split("T")[1]}] [API] [${data.id}] IN ---> ${data.method} ${data.route} @ ${data.host} (IP: ${data.ip})`,
        );
      }
    });

    events.on("api:response", (data?: APIResponseEvent) => {
      if (data) {
        console.log(
          `[${new Date().toISOString().split("T")[1]}] [API] [${data.id}] OUT --> ${data.statusCode} (${data.ping})${data.error ? ` ${data.error.name} | ${Array.isArray(data.error.description) ? data.error.description.join(", ") : data.error.description} | Fault: ${data.error.fault} | Severity: ${data.error.severity}` : ""}`,
        );
      }
    });
  }

  private databaseLogs() {
    events.on("database:launch", (data?: string) => {
      if (data) {
        console.log(
          `[${new Date().toISOString().split("T")[1]}] [DATABASE] ${data}`,
        );
      }
    });

    events.on("database:error", (data?: string) => {
      if (data) {
        console.log(
          `[${new Date().toISOString().split("T")[1]}] [DATABASE] [ERROR] ${data}`,
        );
      }
    });
  }

  private discordLogs() {
    events.on("discord:launch", (data?: string) => {
      if (data) {
        console.log(
          `[${new Date().toISOString().split("T")[1]}] [DISCORD] ${data}`,
        );
      }
    });
    events.on(
      "discord:interactionCreate",
      (data?: CommandInteraction | ButtonInteraction) => {
        if (data) {
          console.log(
            `[${new Date().toISOString().split("T")[1]}] [DISCORD] [COMMAND] ${DiscordUtilities.parseInteraction(data) || "--"}`,
          );
        }
      },
    );
    events.on(
      "discord:error",
      (error: DiscordAPIError | Error | any, sourceHint?: string) => {
        console.log(
          error instanceof DiscordAPIError
            ? `[Error] ${error.name}: ${error.message} (${error.status})${sourceHint ? ` (${sourceHint})` : ""}`
            : error instanceof Error
              ? `[Internal Error] ${error.message}${sourceHint ? ` (${sourceHint})` : ""}`
              : typeof error === "string"
                ? `[Internal Error] ${error}${sourceHint ? ` (${sourceHint})` : ""}`
                : `[Unknown Error] ${error?.message || "--"}${sourceHint ? ` (${sourceHint})` : ""}`,
        );
      },
    );
  }
}

export const WikiEvents = new WikiSubmissionEvents();
