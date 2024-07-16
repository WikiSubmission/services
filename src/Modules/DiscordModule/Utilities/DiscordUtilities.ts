import {
  APIInteractionGuildMember,
  ButtonInteraction,
  ClientUser,
  CommandInteraction,
  Guild,
  GuildBan,
  GuildMember,
  LocalizationMap,
  TextChannel,
  User,
} from "discord.js";
import { DiscordModeratedGuild } from "../Types/ModeratedGuild";
import { DiscordConfig } from "../Vars/DiscordConfig";
import { DiscordBot } from "..";
import { WikiEvents } from "../../LogsModule";
import { WikiSlashCommand } from "../Types/WikiSlashCommand";
import { OriginalSlashCommand } from "../Types/OriginalSlashCommand";

export class DiscordUtilities {
  static getModeratedGuild(
    guild: DiscordModeratedGuild | Guild | string | null,
  ): DiscordModeratedGuild | null {
    if (!guild) return null;
    else if (guild instanceof Guild) {
      return DiscordConfig.knownGuilds.find((g) => g.id === guild.id) || null;
    } else if (typeof guild === "string") {
      return DiscordConfig.knownGuilds.find((g) => g.id === guild) || null;
    } else return guild;
  }

  static async userToGuildMember(
    user: User | ClientUser | GuildMember | APIInteractionGuildMember | null,
    guild: Guild | string | null,
  ): Promise<GuildMember | null> {
    if (!user || !guild) return null;
    else if (user instanceof GuildMember) return user;
    else if (user instanceof User || user instanceof ClientUser) {
      const moderatedGuild = DiscordUtilities.getModeratedGuild(guild);

      if (!moderatedGuild) return null;

      const guildData = DiscordBot.shared.client.guilds.cache.find(
        (g) => g.id === moderatedGuild.id,
      );

      const member =
        guildData?.members.cache.get(user.id) ||
        (await guildData?.members.fetch(user));

      return member ? member : null;
    } else {
      return DiscordUtilities.getMemberById(
        user.user.id,
        guild instanceof Guild ? guild.id : guild ? guild : null,
      );
    }
  }

  static async getMemberById(
    memberId: string | null,
    guildId: string | null,
  ): Promise<GuildMember | null> {
    if (!memberId || !guildId) return null;

    try {
      const result = (
        await DiscordBot.shared.client.guilds.fetch(guildId)
      ).members.fetch(memberId);

      return result;
    } catch (error) {
      WikiEvents.emit("discord:error", error);
      return null;
    }
  }

  static async getChannelById<T = TextChannel>(
    channelId: string | null,
    guildId: string | null,
  ): Promise<T | null> {
    if (!channelId || !guildId) return null;

    try {
      const guild = await DiscordBot.shared.client.guilds.fetch(guildId);
      const channel = guild.channels.cache.get(channelId);

      if (channel && channel.type === 0) {
        return channel as T;
      } else {
        return null;
      }
    } catch (error) {
      WikiEvents.emit("discord:error", error);
      return null;
    }
  }

  static completeUserString(
    member: GuildMember | User | GuildBan | null,
    omitTag?: boolean,
  ): string {
    if (!member) return "--";
    else if (member instanceof User) {
      return `${omitTag ? "" : `<@${member.id}> `}(${member.username}${member.displayName === member.username ? `)` : ` / ${member.displayName})`}`;
    } else if (member instanceof GuildMember || member instanceof GuildBan) {
      return `${omitTag ? "" : `<@${member.user.id}> `} (${member.user.username}${member.user.displayName === member.user.username ? `)` : ` / ${member.user.displayName})`}`;
    } else {
      return `--`;
    }
  }

  static verifyMember(
    member: GuildMember | APIInteractionGuildMember | null,
    accessControlList:
      | string[]
      | "VERIFIED_AND_ABOVE"
      | "INSIDER_AND_ABOVE"
      | "MOD_AND_ABOVE"
      | "ADMIN",
  ): boolean {
    if (!member || !member.roles) return false;

    const roles =
      member instanceof GuildMember
        ? new Set(member.roles.cache.map((r) => r.id))
        : new Set(member.roles);

    if (member?.user.id === DiscordBot.shared.client.user?.id) return true;

    let requiredRoles: Set<string> = new Set();

    // Determine required roles
    switch (accessControlList) {
      case "VERIFIED_AND_ABOVE":
        requiredRoles = new Set(
          DiscordConfig.knownGuilds
            .flatMap((guild) => guild.keyRoles)
            .flatMap((keyRoles) => [
              keyRoles?.verified,
              keyRoles?.moderator,
              keyRoles?.admin,
              keyRoles?.developer,
            ])
            .filter((roleId): roleId is string => Boolean(roleId)),
        );
        break;

      case "INSIDER_AND_ABOVE":
        requiredRoles = new Set(
          DiscordConfig.knownGuilds
            .flatMap((guild) => guild.keyRoles)
            .flatMap((keyRoles) => [
              keyRoles?.insider,
              keyRoles?.moderator,
              keyRoles?.admin,
              keyRoles?.developer,
            ])
            .filter((roleId): roleId is string => Boolean(roleId)),
        );
        break;

      case "MOD_AND_ABOVE":
        requiredRoles = new Set(
          DiscordConfig.knownGuilds
            .flatMap((guild) => guild.keyRoles)
            .flatMap((keyRoles) => [
              keyRoles?.moderator,
              keyRoles?.admin,
              keyRoles?.developer,
            ])
            .filter((roleId): roleId is string => Boolean(roleId)),
        );
        break;

      case "ADMIN":
        requiredRoles = new Set(
          DiscordConfig.knownGuilds
            .flatMap((guild) => guild.keyRoles)
            .flatMap((keyRoles) => [keyRoles?.admin, keyRoles?.developer])
            .filter((roleId): roleId is string => Boolean(roleId)),
        );
        break;

      default:
        // Validate against a custom string array
        if (Array.isArray(accessControlList)) {
          requiredRoles = new Set(accessControlList);
        }
        break;
    }

    return Array.from(roles).some((roleId) => requiredRoles.has(roleId));
  }

  static parseInteraction(
    interaction: CommandInteraction | ButtonInteraction,
  ): string | null {
    if (interaction instanceof CommandInteraction) {
      return `[SLASH COMMAND] /${interaction.commandName}${interaction.options.data.length > 0 ? ` ${interaction.options.data.map((i) => `[${i.name}:${i.value}]`).join(" ")}` : ""} @ ${interaction.guild ? `"${interaction.guild.name}" (${interaction.guild.id})` : "N.A."} / @${interaction.user.username} (${interaction.user.id})`;
    } else if (interaction instanceof ButtonInteraction) {
      return null;
    } else return null;
  }

  static parseCommands(commands: WikiSlashCommand[]) {
    const output: OriginalSlashCommand[] = [];
    for (const command of commands) {
      output.push({
        type: 1,

        name: command.name,
        ...(command.localizations
          ? {
              name_localizations: accessLocalization(
                "NAME",
                command.localizations,
              ),
            }
          : {}),

        description: command.description,
        ...(command.localizations
          ? {
              description_localizations: accessLocalization(
                "DESCRIPTION",
                command.localizations,
              ),
            }
          : {}),

        dm_permission: command.disabledInDM ? false : true,

        ...(command.options
          ? {
              options: command.options?.map((option) => ({
                type: mapCommandTypeToAPI(option.type),

                name: option.name,
                ...(option.localizations
                  ? {
                      name_localizations: accessLocalization(
                        "NAME",
                        option.localizations,
                      ),
                    }
                  : {}),

                description: option.description,
                ...(option.localizations
                  ? {
                      description_localizations: accessLocalization(
                        "DESCRIPTION",
                        option.localizations,
                      ),
                    }
                  : {}),

                ...(option.choices
                  ? {
                      choices: option.choices?.map((c) => ({
                        name: c.name,
                        value: c.value,
                      })),
                    }
                  : {}),

                required: option.optional ? false : true,
              })),
            }
          : {}),
      });
    }

    function accessLocalization(
      propertyToAccess: "NAME" | "DESCRIPTION",
      object?: { language: string; name: string; description: string }[],
    ): LocalizationMap | undefined {
      if (!object) return undefined;
      const typeB: LocalizationMap = {};
      object.forEach((localization) => {
        const { language, name, description } = localization;
        typeB[language as keyof LocalizationMap] =
          propertyToAccess === "DESCRIPTION"
            ? description || name || null
            : name || description || null;
      });
      return typeB;
    }

    function mapCommandTypeToAPI(commandType: string): number {
      switch (commandType) {
        case "SUB_COMMAND":
          return 1;
        case "SUB_COMMAND_GROUP":
          return 2;
        case "STRING":
          return 3;
        case "INTEGER":
          return 4;
        case "BOOLEAN":
          return 5;
        case "USER":
          return 6;
        case "CHANNEL":
          return 7;
        case "ROLE":
          return 8;
        case "MENTIONABLE":
          return 9;
        case "NUMBER":
          return 10;
        default:
          throw new Error(`Unsupported command option type: ${commandType}`);
      }
    }

    return output;
  }
}
