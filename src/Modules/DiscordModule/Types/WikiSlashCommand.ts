import { ButtonInteraction, CommandInteraction } from "discord.js";

export interface WikiSlashCommand {
  name: string;
  description: string;
  handler: (
    interaction: CommandInteraction,
  ) => Promise<CommandInteraction | ButtonInteraction>;
  localizations?: {
    language: string;
    name: string;
    description: string;
  }[];
  options?: {
    name: string;
    description: string;
    localizations?: {
      language: string;
      name: string;
      description: string;
    }[];
    choices?: {
      name: string;
      value: string;
    }[];
    type:
      | "STRING"
      | "INTEGER"
      | "BOOLEAN"
      | "USER"
      | "CHANNEL"
      | "ROLE"
      | "SUB_COMMAND"
      | "SUB_COMMAND_GROUP";
    optional?: boolean;
  }[];
  guildSpecific?: {
    id: string;
    name: string;
  }[];
  memberSpecific?: string[];
  accessControl?:
    | string[]
    | "VERIFIED_AND_ABOVE"
    | "INSIDER_AND_ABOVE"
    | "MOD_AND_ABOVE"
    | "ADMIN";
  disabledInDM?: boolean;
}
