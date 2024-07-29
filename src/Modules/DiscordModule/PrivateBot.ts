import {
  Awaitable,
  Client,
  ClientEvents,
  GatewayIntentBits,
  REST,
  Routes,
} from "discord.js";
import { WikiEvents } from "../LogsModule";
import { WikiSlashCommand } from "./Types/WikiSlashCommand";
import { DiscordUtilities } from "./Utilities/DiscordUtilities";
import { DiscordHelpers } from "./DiscordHelpers";

export class PrivateBot extends DiscordHelpers {
  // Access class through shared instance.
  static shared = new PrivateBot();

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
      GatewayIntentBits.DirectMessages,
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
   * @method login
   * @description Initializes the Discord client with using the bot token.
   */
  async login(): Promise<void> {
    const { token } = await this.getPrivateBotCredentials();
    await this.client.login(token);
    WikiEvents.emit(
      "discord:launch",
      `Initialized client. Username: "${this.client.user?.username}". Guilds: ${this.client.guilds.cache.size}.`,
    );
  }

  /**
   * @method registerSlashCommands
   * @description Registers extracted slash commands from the /_Discord/SlashCommands folder (private ones marked by a provided guildSpecific property)
   */
  async registerSlashCommands() {
    if (process.argv.includes("no-sync")) {
      WikiEvents.emit("discord:launch", "Skipping command sync as requested");
      return;
    }

    const { privateCommands } = await this.getSlashCommands();
    const { token, clientId } = await this.getPrivateBotCredentials();

    const rest = new REST().setToken(token);

    await rest.put(Routes.applicationCommands(clientId), {
      body: [],
    });

    const guildCommands = new Map<string, WikiSlashCommand[]>();
    for (const command of privateCommands) {
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
        WikiEvents.emit(
          "discord:launch",
          `No access to GUILD ${guildId} - skipping`,
        );
      }
    }

    this.addEventListener("interactionCreate", async (interaction) => {
      if (interaction.isCommand()) {
        // Find the command that matches the interaction by matching the name.
        for (const slashCommand of privateCommands) {
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
        WikiEvents.emit("discord:error", error);
      }
    };

    if (oneTimeEvent) {
      this.client.once(event, wrappedListener);
    } else {
      this.client.on(event, wrappedListener);
    }
  }
}
