export interface DiscordDBMember {
  /** A unique ID for the user, based on the specific guild, in the format: user_id*guild_id e.g. 1234*6789 */
  id: string;

  /** Standard GuildMember properties */
  user_id: string;
  user_name: string;
  display_name: string;
  guild_id: string;
  roles: string;
  avatar_url: string;
  created_timestamp: number;
  joined_timestamp: number;
}
