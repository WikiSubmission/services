import { CommandInteraction, CommandInteractionOption } from "discord.js";

export class DiscordCachedInteraction {
  id: string;
  userId: string;
  commandName: string;
  guildId?: string;
  options?: CommandInteractionOption[];

  constructor(
    interaction: CommandInteraction | DiscordCachedInteraction | any,
  ) {
    this.id = interaction.id;
    this.userId = interaction.userId || interaction.user.id;
    this.commandName = interaction.commandName;
    this.guildId = interaction.guildId || undefined;
    this.options = interaction.options?.data || interaction.options;
  }

  getStringOption(key: string): string | null {
    return (this.options?.find((i) => i.name === key)?.value as string) || null;
  }

  getIntegerOption(key: string): number | null {
    return (this.options?.find((i) => i.name === key)?.value as number) || null;
  }
}
