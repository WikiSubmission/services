import { Guild, MessageCreateOptions, MessagePayload } from "discord.js";
import { DiscordUtilities } from "./DiscordUtilities";
import Bottleneck from "bottleneck";
import { DiscordModeratedGuild } from "../Types/ModeratedGuild";
import { DiscordBot } from "..";

type AlertDestination =
  | "STAFF-LOG"
  | "ANTI-RAID"
  | "MOD-CHAT"
  | "WELCOME"
  | "JAIL-LOG"
  | "JAIL-CHAT"
  | "CHOOSE-ROLES"
  | "DEV-SYSTEMLOG"
  | "DEV-EVENTLOG"
  | "DEV-ERRORLOG";

export class DiscordAlert {
  private moderatedGuild: DiscordModeratedGuild | null;
  private limiter: Bottleneck;

  constructor(moderatedGuild: DiscordModeratedGuild | Guild | string | null) {
    this.moderatedGuild = DiscordUtilities.getModeratedGuild(moderatedGuild);
    this.limiter = new Bottleneck({
      minTime: 361 * 2,
      maxConcurrent: 1,
    });
  }

  async send(
    destination: AlertDestination,
    data: string | MessagePayload | MessageCreateOptions,
  ) {
    if (!this.moderatedGuild) return;

    const channelId = this.resolveDestination(destination);
    const guildId = this.moderatedGuild.id;
    const channel = await DiscordUtilities.getChannelById(channelId, guildId);

    await this.limiter.schedule(async () => {
      try {
        await channel?.send(data);
      } catch (error) {
        DiscordBot.shared.logError(
          error,
          `@ DiscordAlert (payload: ${data.toString()})`,
        );
      }
    });
  }

  private resolveDestination(destination: AlertDestination): string | null {
    if (!this.moderatedGuild) return null;

    switch (destination) {
      case "STAFF-LOG":
        return this.moderatedGuild.keyChannels.staffLog;
      case "ANTI-RAID":
        return this.moderatedGuild.keyChannels.antiRaid;
      case "MOD-CHAT":
        return this.moderatedGuild.keyChannels.modChat;
      case "WELCOME":
        return this.moderatedGuild.keyChannels.welcomeChannel;
      case "CHOOSE-ROLES":
        return this.moderatedGuild.keyChannels.chooseRoles || null;
      case "JAIL-LOG":
        return this.moderatedGuild.jail?.jailLogChannelId || null;
      case "JAIL-CHAT":
        return this.moderatedGuild.jail?.jailChannelId || null;
      case "DEV-SYSTEMLOG":
        return "1252774885231562762";
      case "DEV-EVENTLOG":
        return "1252774367381950494";
      case "DEV-ERRORLOG":
        return "1252774804013056022";
    }
  }
}
