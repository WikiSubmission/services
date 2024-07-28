import {
  ClientEvents,
  Awaitable,
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  DiscordAPIError,
  CommandInteraction,
  ButtonInteraction,
} from "discord.js";
import { WikiSlashCommand } from "./Types/WikiSlashCommand";
import { SystemUtilities } from "../../Utilities/SystemUtils";
import { WikiEvents } from "../LogsModule";
import { FileUtils } from "../../Utilities/FileUtils";
import { DiscordUtilities } from "./Utilities/DiscordUtilities";
import EventEmitter from "events";

/**
 * @class DiscordBot
 * @description Configures and launches the WikiSubmission Discord Bot
 */
export class DiscordBot {
  // Access class through shared instance.
  static shared = new DiscordBot();

  // Create Discord client.
  client: Client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildScheduledEvents,
      GatewayIntentBits.GuildVoiceStates,
      /** PRIVILEGED INTENTS: */
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages
    ],
    presence: {
      status: "online",
      activities: [
        {
          name: "Righteousness",
          type: 5,
        },
      ],
    },
  });

  /**
   * @method start
   * @description Initialize the bot
   */
  async start() {
    // Login.
    await this.login();

    // Listeners.
    await this.attachEventListeners();
    await this.listenForSlashCommands();

    // Sync commands.
    if (!process.argv.includes("discord-nosync")) {
      await this.syncCommands();
    }

    // Schedule actions.
    await this.scheduleActions();
  }

  /**
   * @method login
   * @description Initializes the Discord client with using the bot token.
   */
  async login(): Promise<void> {
    const { token } = await this.getCredentials();
    await this.client.login(token);
    WikiEvents.emit(
      "discord:launch",
      `Initialized client. Username: "${this.client.user?.username}". Guilds: ${this.client.guilds.cache.size}.`,
    );
  }

  /**
   * @method attachListeners
   * @description Executes default exports in /_Discord/Listener folder (which each should call the addEventListener() on the shared instance of this class)
   */
  async attachEventListeners() {
    EventEmitter.defaultMaxListeners = 20;
    this.client.removeAllListeners();
    const listeners = await FileUtils.getDefaultExportsFromDirectory<
      () => void
    >("/_Discord/Listeners", true);
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

  /**
   * @method getSlashCommands
   * @description
   */
  private async getSlashCommands(): Promise<WikiSlashCommand[]> {
    const slashCommands =
      await FileUtils.getDefaultExportsFromDirectory<WikiSlashCommand>(
        "/_Discord/SlashCommands",
      );

    return slashCommands;
  }

  /**
   * @method syncCommands
   * @description Registers extracted slash commands from the /_Discord/SlashCommands folder
   */
  async syncCommands() {
    const slashCommands = await this.getSlashCommands();

    if (slashCommands.length > 0) {
      const { clientId, token } = await this.getCredentials();

      const rest = new REST().setToken(token);

      // Global commands.
      try {
        await rest.put(Routes.applicationCommands(clientId), {
          body: DiscordUtilities.parseCommands(
            slashCommands.filter((i) => i.guildSpecific === undefined),
          ),
        });
        WikiEvents.emit(
          "discord:launch",
          `Synced GLOBAL commands (${slashCommands.length}) (${slashCommands.map((command) => `/${command.name}`).join(", ")})`,
        );
      } catch (error) {
        console.error(error);
        WikiEvents.emit("discord:error", error);
      }

      // Guild commands.
      const guildCommands = new Map<string, WikiSlashCommand[]>();
      for (const command of slashCommands.filter(
        (c) => c.guildSpecific !== undefined,
      )) {
        for (const guild of command.guildSpecific || []) {
          guildCommands.set(guild.id, [
            ...(guildCommands.get(guild.id) || []),
            command,
          ]);
        }
      }
      for (const [guildId, allocatedCommands] of guildCommands) {
        try {
          await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
            body: DiscordUtilities.parseCommands(allocatedCommands),
          });
          WikiEvents.emit(
            "discord:launch",
            `Synced GUILD commands (${allocatedCommands.length}) for "${this.client.guilds.cache.find((i) => i.id === guildId)?.name || "--"}" (${allocatedCommands.map((i) => `/${i.name}`).join(", ")})`,
          );
        } catch (error) {
          WikiEvents.emit("discord:error", error);
        }
      }
    } else {
      WikiEvents.emit("discord:launch", `No slash commands to sync`);
    }
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
   * @method addEventListener
   * @description Type-friendly method to register an event handler to the client
   */
  addEventListener<Event extends keyof ClientEvents>(
    event: Event,
    listener: (...args: ClientEvents[Event]) => Awaitable<void>,
    oneTimeEvent?: boolean,
  ) {
    const wrappedListener = async (...args: ClientEvents[Event]) => {
      try {
        await listener(...args);
      } catch (error) {
        WikiEvents.emit("discord:error", error);
        console.error(error);
      }
    };

    if (oneTimeEvent) {
      this.client.once(event, wrappedListener);
    } else {
      this.client.on(event, wrappedListener);
    }
  }

  /**
   * @method getCredentials
   * @description Retrieve token & client ID from cloud
   */
  async getCredentials(): Promise<{ token: string; clientId: string }> {
    return await SystemUtilities.cachedFunction(
      "DiscordCredentials",
      "1h",
      async () => {
        return {
          token: await SystemUtilities.getEnvFromSupabase(
            process.env.NODE_ENV === "production"
              ? "DISCORD_TOKEN"
              : "DISCORD_TOKEN_DEV",
          ),
          clientId: await SystemUtilities.getEnvFromSupabase(
            process.env.NODE_ENV === "production"
              ? "DISCORD_CLIENT_ID"
              : "DISCORD_CLIENT_ID_DEV",
          ),
        };
      },
    );
  }

  /**
   * @method listenForSlashCommands
   * @description Attaches a slash command listener to the Discord client.
   */
  async listenForSlashCommands(): Promise<void> {
    const slashCommands = await this.getSlashCommands();
    if (slashCommands.length > 0) {
      this.addEventListener("interactionCreate", async (interaction) => {
        if (interaction.isCommand()) {
          // Find the command that matches the interaction by matching the name.
          for (const slashCommand of slashCommands) {
            // Handle the interaction.
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
                    content:
                      "`This command is restricted for specific servers only.`",
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
                    content:
                      "`This command is restricted for specific users only.`",
                    ephemeral: true,
                  });
                  return;
                }

                // Execute command.
                const result = await slashCommand.handler(interaction);

                WikiEvents.emit("discord:interactionCreate", result);
              } catch (error) {
                WikiEvents.emit("discord:error", error);
              }
            }
          }
        }
      });
    }
  }

  logInteraction(interaction: CommandInteraction | ButtonInteraction) {
    const summary = DiscordUtilities.parseInteraction(interaction);
    if (summary) {
      WikiEvents.emit(
        "discord:interactionCreate",
        `[interactionCreate] ${summary}`,
      );
    }
  }

  logEvent(event: keyof ClientEvents, description: string) {
    WikiEvents.emit("discord:event", `[${event}] ${description}`);
  }

  logError(error: DiscordAPIError | Error | any, sourceHint?: string) {
    WikiEvents.emit(
      "discord:error",
      error instanceof DiscordAPIError
        ? `[Error] ${error.name}: ${error.message} (${error.status})${sourceHint ? ` (${sourceHint})` : ""}`
        : error instanceof Error
          ? `[Internal Error] ${error.message}${sourceHint ? ` (${sourceHint})` : ""}`
          : typeof error === "string"
            ? `[Internal Error] ${error}${sourceHint ? ` (${sourceHint})` : ""}`
            : `[Unknown Error] ${error?.message || "--"}${sourceHint ? ` (${sourceHint})` : ""}`,
    );
  }
}
