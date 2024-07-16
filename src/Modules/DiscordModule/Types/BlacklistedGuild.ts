export type DiscordBlacklistedGuild = {
  server_id: string;
  server_name: string;
  blacklist_reason: string | null;
  created_at: number;
};
