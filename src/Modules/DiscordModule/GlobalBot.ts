import {
  Awaitable,
  Client,
  ClientEvents,
  GatewayIntentBits,
  REST,
  Routes,
} from "discord.js";
import { DiscordUtilities } from "./Utilities/DiscordUtilities";
import { DiscordHelpers } from "./DiscordHelpers";
import { WikiLog } from "../LogsModule";

export class GlobalBot extends DiscordHelpers {
  // Access class through shared instance.
  static shared = new GlobalBot();

  // Create Discord client.
  client: Client = new Client({
    intents: [GatewayIntentBits.Guilds],
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
   * @method login
   * @description Initializes the Discord client with using the bot token.
   */
  async login(): Promise<void> {
    const { token } = await this.getGlobalBotCredentials();
    await this.client.login(token);
    WikiLog.discord(
      "launch",
      `Initialized client. Username: "${this.client.user?.username}". Guilds: ${this.client.guilds.cache.size}.`,
    );
  }

  /**
   * @method registerSlashCommands
   * @description Registers extracted slash commands from the /_Discord/SlashCommands folder (global ones do not have a guildSpecific property)
   */
  async registerSlashCommands() {
    if (process.argv.includes("no-sync")) {
      WikiLog.discord("launch", "Skipping command sync as requested");
      return;
    }

    const { globalCommands } = await this.getSlashCommands();
    const { token, clientId } = await this.getGlobalBotCredentials();

    const rest = new REST().setToken(token);
    try {
      await rest.put(Routes.applicationCommands(clientId), {
        body: DiscordUtilities.parseCommands(globalCommands),
      });

      WikiLog.discord(
        "launch",
        `Synced GLOBAL commands (${globalCommands.length}) (${globalCommands.map((command) => `/${command.name}`).join(", ")})`,
      );
    } catch (error) {
      WikiLog.discordError(
        "Failed to sync GLOBAL commands",
        "registerSlashCommands @ Modules/DiscordModule/GlobalBot.ts",
      );
      WikiLog.discordError(error);
    }

    this.addEventListener("interactionCreate", async (interaction) => {
      if (interaction.isCommand()) {
        // Find the command that matches the interaction by matching the name.
        for (const slashCommand of globalCommands) {
          this.slashCommandHandler(slashCommand, interaction);
        }
      }
    });
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
        WikiLog.discordError(error, "Event Listener");
      }
    };

    if (oneTimeEvent) {
      this.client.once(event, wrappedListener);
    } else {
      this.client.on(event, wrappedListener);
    }
  }
}
