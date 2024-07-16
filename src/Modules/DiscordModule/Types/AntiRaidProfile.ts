export interface DiscordAntiRaidProfile {
  lastMessageTimestamp: number;
  lastMessageGap: number;
  content: string[];
  channels: string[];
  flagCount: number;
}
