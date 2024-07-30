import EventEmitter from "events";
import { FileUtils } from "../../Utilities/FileUtils";
import { SystemUtils } from "../../Utilities/SystemUtils";
import { WikiSlashCommand } from "./Types/WikiSlashCommand";
import {
  CommandInteraction,
  ButtonInteraction,
  ClientEvents,
  DiscordAPIError,
} from "discord.js";
import { DiscordUtilities } from "./Utilities/DiscordUtilities";
import { WikiLog } from "../LogsModule";

export class DiscordHelpers {
  /**
   * @method attachListeners
   * @description Executes default exports in /_Discord/EventListeners folder (which each should call the addEventListener() on the shared instance of this class)
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
      WikiLog.discord("launch", `Attached listeners (${listeners.length})`);
    } else {
      WikiLog.discord("launch", `No listeners to attach`);
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

      WikiLog.discord(
        "launch",
        `Scheduled actions (${scheduleActions.length})`,
      );
    } else {
      WikiLog.discord("launch", `No actions to schedule`);
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
    return await SystemUtils.cachedFunction(
      "DiscordCredentials",
      "1h",
      async () => {
        // Since it's a private bot anyway, we will use the same token / client ID.
        return {
          token: await SystemUtils.getEnvFromSupabase(
            "DISCORD_SUBMISSIONMOD_TOKEN",
          ),
          clientId: await SystemUtils.getEnvFromSupabase(
            "DISCORD_SUBMISSIONMOD_CLIENT_ID",
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
    return await SystemUtils.cachedFunction(
      "DiscordPublicBotCredentials",
      "1h",
      async () => {
        return {
          token: await SystemUtils.getEnvFromSupabase(
            process.env.NODE_ENV === "production"
              ? "DISCORD_WIKISUBMISSION_TOKEN"
              : "DISCORD_TESTING_TOKEN",
          ),
          clientId: await SystemUtils.getEnvFromSupabase(
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
        WikiLog.discordError(
          error,
          "slashCommandHandler @ Modules/DiscordModule/DiscordHelpers.ts",
        );
      }
    }
  }

  logInteraction(interaction: CommandInteraction | ButtonInteraction) {
    WikiLog.discordEvent(
      "interactionCreate",
      DiscordUtilities.parseInteraction(interaction) || "--",
    );
  }

  logEvent(event: keyof ClientEvents, description: string) {
    WikiLog.discordEvent(event, description);
  }

  logError(error: DiscordAPIError | Error | any, sourceHint?: string) {
    WikiLog.discordError(error, sourceHint);
  }
}
