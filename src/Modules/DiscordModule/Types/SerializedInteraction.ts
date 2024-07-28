import { CommandInteractionOption, GuildMember } from "discord.js";

export interface SerializedInteraction {
  type: number;
  id: string;
  channelId: string;
  guildId: string | null;
  user: string;
  locale: string;
  commandId: string;
  commandName: string;
  commandType: number;
  commandGuildId: string | null;
  deferred: boolean;
  replied: boolean;
  ephemeral: boolean | null;
  options: CommandInteractionOption[];
}
