import { ApplicationCommandOption, LocalizationMap } from "discord.js";

export interface OriginalSlashCommand {
  name: string;
  name_localizations?: LocalizationMap;

  description: string;
  description_localizations?: LocalizationMap;

  type?: number;

  dm_permission?: boolean;

  options?: ApplicationCommandOption[];
}
