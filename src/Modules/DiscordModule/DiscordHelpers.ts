import EventEmitter from "events";
import { FileUtils } from "../../Utilities/FileUtils";
import { SystemUtilities } from "../../Utilities/SystemUtils";
import { WikiEvents } from "../LogsModule";
import { WikiSlashCommand } from "./Types/WikiSlashCommand";
import {
  CommandInteraction,
  ButtonInteraction,
  ClientEvents,
  DiscordAPIError,
} from "discord.js";
import { DiscordAlert } from "./Utilities/DiscordAlertManager";
import { DiscordUtilities } from "./Utilities/DiscordUtilities";

export class DiscordHelpers {
  /**
   * @method attachListeners
   * @description Executes default exports in /_Discord/Listener folder (which each should call the addEventListener() on the shared instance of this class)
   */
  async attachEventListeners() {
    EventEmitter.defaultMaxListeners = 20;
    const listeners = await FileUtils.getDefaultExportsFromDirectory<
      () => void
    >("/_Discord/EventListeners", true);
    if (listeners.length > 0) {
      for (const listenerFunction of listeners) {
        listenerFunction();
      }
      WikiEvents.emit(
        "discord:launch",
        `Attached listeners (${listeners.length})`,
      );
    } else {
      WikiEvents.emit("discord:launch", `No listeners to attach`);
    }
  }

  async getSlashCommands(): Promise<{
    globalCommands: WikiSlashCommand[];
    privateCommands: WikiSlashCommand[];
  }> {
    const slashCommands =
      await FileUtils.getDefaultExportsFromDirectory<WikiSlashCommand>(
        "/_Discord/SlashCommands",
      );

    return {
      globalCommands: slashCommands.filter(
        (c) => c.guildSpecific === undefined,
      ),
      privateCommands: slashCommands.filter((c) => c.guildSpecific),
    };
  }

  /**
   * @method scheduleActions
   * @description Executes all default exports in the /_Discord/ScheduledActions folder
   */
  async scheduleActions() {
    const scheduleActions = await FileUtils.getDefaultExportsFromDirectory<
      () => void
    >("/_Discord/ScheduledActions", true);

    if (scheduleActions.length > 0) {
      for (const scheduleActionsFunction of scheduleActions) {
        scheduleActionsFunction();
      }

      WikiEvents.emit(
        "discord:launch",
        `Scheduled actions (${scheduleActions.length})`,
      );
    } else {
      WikiEvents.emit("discord:launch", `No actions to schedule`);
    }
  }

  /**
   * @method getCredentials
   * @description Retrieve private bot token & client ID
   */
  async getPrivateBotCredentials(): Promise<{
    token: string;
    clientId: string;
  }> {
    return await SystemUtilities.cachedFunction(
      "DiscordCredentials",
      "1h",
      async () => {
        return {
          token: await SystemUtilities.getEnvFromSupabase(
            process.env.NODE_ENV === "production"
              ? "DISCORD_SUBMISSIONMOD_TOKEN"
              : "DISCORD_SUBMISSIONMOD_TOKEN",
          ),
          clientId: await SystemUtilities.getEnvFromSupabase(
            process.env.NODE_ENV === "production"
              ? "DISCORD_SUBMISSIONMOD_CLIENT_ID"
              : "DISCORD_SUBMISSIONMOD_CLIENT_ID",
          ),
        };
      },
    );
  }

  /**
   * @method getPublicBotCredentials
   * @description Retrieve public bot token & client ID
   */
  async getGlobalBotCredentials(): Promise<{
    token: string;
    clientId: string;
  }> {
    return await SystemUtilities.cachedFunction(
      "DiscordPublicBotCredentials",
      "1h",
      async () => {
        return {
          token: await SystemUtilities.getEnvFromSupabase(
            process.env.NODE_ENV === "production"
              ? "DISCORD_WIKISUBMISSION_TOKEN"
              : "DISCORD_TESTING_TOKEN",
          ),
          clientId: await SystemUtilities.getEnvFromSupabase(
            process.env.NODE_ENV === "production"
              ? "DISCORD_WIKISUBMISSION_CLIENT_ID"
              : "DISCORD_TESTING_CLIENT_ID",
          ),
        };
      },
    );
  }

  async slashCommandHandler(
    slashCommand: WikiSlashCommand,
    interaction: CommandInteraction,
  ) {
    if (interaction.commandName === slashCommand.name) {
      try {
        // Case: Non-DM command.
        if (slashCommand.disabledInDM && !interaction.guildId) {
          await interaction.reply({
            content: "`This command has been disabled in DMs.`",
            ephemeral: true,
          });
          return;
        }

        // Case: Specific guild command.
        if (
          interaction.guild &&
          slashCommand.guildSpecific &&
          !slashCommand.guildSpecific
            .map((g) => g.id)
            .includes(interaction.guild.id)
        ) {
          await interaction.reply({
            content: "`This command is restricted for specific servers only.`",
            ephemeral: true,
          });
          return;
        }

        // Case: Specific member command.
        if (
          slashCommand.memberSpecific &&
          !slashCommand.memberSpecific
            .map((m) => m)
            .includes(interaction.user.id)
        ) {
          await interaction.reply({
            content: "`This command is restricted for specific users only.`",
            ephemeral: true,
          });
          return;
        }

        // Execute command.
        const result = await slashCommand.handler(interaction);

        this.logInteraction(result);
      } catch (error) {
        WikiEvents.emit("discord:error", error);
      }
    }
  }

  logInteraction(interaction: CommandInteraction | ButtonInteraction) {
    WikiEvents.emit("discord:interactionCreate", interaction);

    if (interaction instanceof CommandInteraction) {
      new DiscordAlert("1080271049377202177").send("DEV-EVENTLOG", {
        content: `\`\`\`[interactionCreate] ${DiscordUtilities.parseInteraction(interaction)}\`\`\``,
        flags: ["SuppressNotifications"],
      });
    }
  }

  logEvent(event: keyof ClientEvents, description: string) {
    WikiEvents.emit("discord:event", `[${event}] ${description}`);

    new DiscordAlert("1080271049377202177").send("DEV-EVENTLOG", {
      content: `\`\`\`[${event}] ${description}\`\`\``,
      flags: ["SuppressNotifications"],
    });
  }

  logError(error: DiscordAPIError | Error | any, sourceHint?: string) {
    const description =
      error instanceof DiscordAPIError
        ? `[DiscordAPIError] ${error.name}: ${error.message} (${error.status})${sourceHint ? ` (${sourceHint})` : ""}`
        : error instanceof Error
          ? `[Internal Error] ${error.message}${sourceHint ? ` (${sourceHint})` : ""}`
          : typeof error === "string"
            ? `[Internal Error] ${error}${sourceHint ? ` (${sourceHint})` : ""}`
            : `[Unknown Error] ${error?.message || "--"}${sourceHint ? ` (${sourceHint})` : ""}`;

    WikiEvents.emit("discord:error", description);

    new DiscordAlert("1080271049377202177").send("DEV-ERRORLOG", {
      content: `\`\`\`${description}\`\`\``,
    });
  }
}
