import {
  Awaitable,
  Client,
  ClientEvents,
  GatewayIntentBits,
  Guild,
  GuildChannel,
  GuildMember,
  GuildScheduledEvent,
  Interaction,
  Message,
  PartialGuildMember,
  REST,
  Routes,
} from "discord.js";
import { WikiSlashCommand } from "./Types/WikiSlashCommand";
import { DiscordUtilities } from "./Utilities/DiscordUtilities";
import { DiscordHelpers } from "./DiscordHelpers";
import { WikiLog } from "../LogsModule";

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
          name: "The Submission Server",
          type: 3,
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
    WikiLog.discord(
      "launch",
      `Initialized client. Username: "${this.client.user?.username}". Guilds: ${this.client.guilds.cache.size}.`,
    );
  }

  /**
   * @method registerSlashCommands
   * @description Registers extracted slash commands from the /_Discord/SlashCommands folder (private ones marked by a provided guildSpecific property)
   */
  async registerSlashCommands() {
    if (process.argv.includes("no-sync")) {
      WikiLog.discord("launch", "Skipping command sync as requested");
      return;
    }

    const { privateCommands } = await this.getSlashCommands();
    const { token, clientId } = await this.getPrivateBotCredentials();

    const rest = new REST().setToken(token);

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

        WikiLog.discord(
          "launch",
          `Synced GUILD commands (${allocatedCommands.length}) for "${this.client.guilds.cache.find((i) => i.id === guildId)?.name || "--"}" (${allocatedCommands.map((i) => `/${i.name}`).join(", ")})`,
        );
      } catch (error) {
        WikiLog.discord("launch", `No access to GUILD ${guildId} - skipping`);
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
        // If SAFE_MODE environment variable is 'true', avoid handling Submission Server events. This is to avoid duplicate event triggers during tests while a production instance is running.
        if (process.env.SAFE_MODE === "true") {
          const submissionServerId = '911268076933230662';

          const isGuildRelated = (data: any): data is Guild | GuildChannel | GuildMember | PartialGuildMember | Message | Interaction | GuildScheduledEvent => {
            return (data.guild && data.guild.id === submissionServerId) ||
              (data.guildId && data.guildId === submissionServerId);
          };

          if (isGuildRelated(args[0])) return;
        }
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
