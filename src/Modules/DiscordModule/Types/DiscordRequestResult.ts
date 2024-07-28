import { EmbedBuilder, ActionRowBuilder } from "discord.js";

export interface DiscordRequestResult {
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<any>[];
  content?: string;
}
