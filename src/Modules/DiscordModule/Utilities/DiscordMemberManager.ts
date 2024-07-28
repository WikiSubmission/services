import {
  APIInteractionGuildMember,
  ActionRowBuilder,
  ButtonBuilder,
  ClientUser,
  EmbedBuilder,
  Guild,
  GuildMember,
  PartialGuildMember,
  User,
} from "discord.js";
import { DiscordUtilities } from "./DiscordUtilities";
import { DateUtilities } from "../../../Utilities/DateUtils";
import { DiscordDBMember } from "../Types/DiscordDBMember";
import { DiscordModeratedGuild } from "../Types/ModeratedGuild";
import { DiscordBot } from "..";
import { SystemUtilities } from "../../../Utilities/SystemUtils";
import { DiscordAlert } from "./DiscordAlertManager";

export class DiscordMemberManager {
  public identifier:
    | string
    | User
    | ClientUser
    | GuildMember
    | APIInteractionGuildMember
    | PartialGuildMember
    | null;
  public member: GuildMember | null;
  public moderatedGuild: DiscordModeratedGuild | null;

  private constructor(identifier: DiscordMemberManager["identifier"]) {
    this.identifier = identifier;
    this.member = null;
    this.moderatedGuild = null;
  }

  static async get(
    identifier: DiscordMemberManager["identifier"],
    moderatedGuild: DiscordModeratedGuild | string | Guild | null,
  ): Promise<DiscordMemberManager | null> {
    const manager = new DiscordMemberManager(identifier);
    await manager._resolveMember(moderatedGuild);
    return manager.member ? manager : null;
  }

  completeUserString(): string {
    if (!this.member) return "--";

    return DiscordUtilities.completeUserString(this.member);
  }

  roleListDiscordFormat(): string {
    if (!this.member) "--";
    return `${this.member?.roles.cache
      .filter((c) => c.name !== "@everyone")
      .map((r) => `<@&${r.id}>`)
      .join(", ")}`;
  }

  roleIdArray(): string[] {
    if (!this.member) return [];
    return this.member?.roles.cache
      .filter((i) => i.name !== "@everyone")
      .map((i) => i.id);
  }

  roleIdArrayAsString(): string {
    if (!this.member || this.member.roles.cache.size === 0) return "";
    return (
      this.member?.roles.cache
        .filter((i) => i.name !== "@everyone")
        .map((i) => i.id)
        .join(",") || ""
    );
  }

  accountCreatedRelativeTimeString(): string {
    return DateUtilities.distanceFromNow(
      this.member?.user.createdTimestamp || 'recently',
    );
  }

  async addRole(
    roles: string | string[] | null,
    reason?: string,
    updateDatabase?: boolean,
    alertStaff?: {
      extendedAuthorText: string;
      footerText?: string;
    },
    handleConflicts?: {
      sameCategoryRolesToRemove: string[];
    },
  ): Promise<"ADDED" | "ALREADY_HAS_ROLE" | "ROLE_DOES_NOT_EXIST" | "ERROR"> {
    if (!roles || !this.member || !this.moderatedGuild) return "ERROR";

    const roleIds = Array.isArray(roles) ? roles : [roles];
    const guild = DiscordBot.shared.client.guilds.cache.get(
      this.moderatedGuild.id,
    );

    if (!guild) return "ERROR";

    let resolvedRoles = roleIds.map((roleId) => guild.roles.cache.get(roleId));
    if (resolvedRoles.includes(undefined)) {
      const refreshedGuild = await guild.fetch();
      resolvedRoles = roleIds.map((roleId) =>
        refreshedGuild.roles.cache.get(roleId),
      );
    }

    if (resolvedRoles.includes(undefined)) return "ROLE_DOES_NOT_EXIST";

    try {
      // Add roles after handling conflicts.
      await this.member.roles.add(roleIds, reason);

      // Remove any conflicting roles.
      const rolesRemoved: string[] = [];
      if (handleConflicts) {
        for (const conflictingRole of handleConflicts.sameCategoryRolesToRemove) {
          if (this.hasRole(conflictingRole)) {
            rolesRemoved.push(conflictingRole);
            await this.removeRole(
              conflictingRole,
              `Replaced with another role`,
            );
          }
        }
      }

      // Update database.
      if (updateDatabase) {
        const supabaseClient = await SystemUtilities.getSupabaseClient();
        await supabaseClient.from("DiscordMembers").upsert<DiscordDBMember>({
          id: `${this.member.user.id}*${this.moderatedGuild.id}`,
          user_id: this.member.user.id,
          user_name: this.member.user.username,
          display_name: this.member.displayName || this.member.user.username,
          guild_id: this.member.guild.id,
          joined_timestamp: this.member.joinedTimestamp || Date.now(),
          created_timestamp: this.member.user.createdTimestamp,
          avatar_url: this.member.displayAvatarURL(),
          roles: this.roleIdArrayAsString(),
        });
      }

      // Alert staff, if specified.
      if (alertStaff && this.moderatedGuild) {
        await new DiscordAlert(this.moderatedGuild.id).send("STAFF-LOG", {
          embeds: [
            new EmbedBuilder()
              .setAuthor({
                name: `${this.member.displayName} ${alertStaff.extendedAuthorText || "updated their role"}`,
                iconURL: this.member.displayAvatarURL(),
              })
              .addFields(
                { name: "User", value: `${this.completeUserString()}` },
                {
                  name: "Added",
                  value: `+ ${resolvedRoles.map((role) => `<@&${role?.id}>`).join(", ")}`,
                },
                ...(rolesRemoved.length || 0 > 0
                  ? [
                      {
                        name: "Replaced",
                        value: `– ${rolesRemoved.map((role) => `<@&${DiscordBot.shared.client.guilds.cache.find((g) => g.id === this.moderatedGuild?.id)?.roles.cache.find((r) => r.name === role || r.id === role)?.id}>`).join(" ")}`,
                      },
                    ]
                  : []),
              )
              .setColor("DarkNavy")
              .setFooter(
                alertStaff.footerText ? { text: alertStaff.footerText } : null,
              ),
          ],
        });
      }
      return "ADDED";
    } catch (error) {
      DiscordBot.shared.logError(error, "@ DiscordMemberManager, addRole");
      return "ERROR";
    }
  }

  async removeRole(
    role: string | string[] | null,
    reason?: string,
    updateDatabase?: boolean,
    alertStaff?: {
      extendedAuthorText: string;
      footerText?: string;
    },
  ): Promise<"REMOVED" | "DOES_NOT_HAVE_ROLE" | "ERROR"> {
    if (!role || !this.member || !this.moderatedGuild) return "ERROR";

    const roles = Array.isArray(role) ? role : [role];
    const removedRoles: string[] = [];
    const guild = DiscordBot.shared.client.guilds.cache.get(
      this.moderatedGuild.id,
    );

    if (!guild) return "ERROR";

    for (const roleIdentifier of roles) {
      let roleToRemove = this.member.roles.cache.find(
        (r) => r.id === roleIdentifier || r.name === roleIdentifier,
      );

      if (!roleToRemove) {
        const refreshedGuild = await guild.fetch();
        roleToRemove = refreshedGuild.roles.cache.find(
          (r) => r.id === roleIdentifier || r.name === roleIdentifier,
        );
      }

      if (!roleToRemove) continue;

      try {
        await this.member.roles.remove(roleToRemove.id, reason);
        removedRoles.push(roleToRemove.id);
      } catch (error) {
        DiscordBot.shared.logError(error, "@ DiscordMemberManager/removeRole");
        return "ERROR";
      }
    }

    if (removedRoles.length === 0) return "DOES_NOT_HAVE_ROLE";

    // Update database.
    if (updateDatabase) {
      const supabaseClient = await SystemUtilities.getSupabaseClient();

      await supabaseClient.from("DiscordMembers").upsert<DiscordDBMember>({
        id: `${this.member.id}*${this.moderatedGuild.id}`,
        user_id: this.member.user.id,
        user_name: this.member.user.username,
        display_name: this.member.displayName || this.member.user.username,
        guild_id: this.member.guild.id,
        joined_timestamp: this.member.joinedTimestamp || Date.now(),
        created_timestamp: this.member.user.createdTimestamp,
        avatar_url: this.member.displayAvatarURL(),
        roles: this.roleIdArrayAsString(),
      });
    }
    // Alert staff, if specified.
    if (alertStaff && this.moderatedGuild) {
      await new DiscordAlert(this.moderatedGuild.id).send("STAFF-LOG", {
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: `${this.member.displayName} ${alertStaff.extendedAuthorText || `removed ${roles.length} role${roles.length > 1 ? "s" : ""}`}`,
              iconURL: this.member.displayAvatarURL(),
            })
            .addFields(
              { name: "User", value: `${this.completeUserString()}` },
              {
                name: "Removed",
                value: `– ${removedRoles.map((id) => `<@&${id}>`).join(" ")}`,
              },
            )
            .setColor("DarkRed"),
        ],
      });
    }

    return "REMOVED";
  }

  hasRole(idOrName: string | string[] | undefined | null): boolean {
    if (!idOrName || !this.member) return false;

    const checkRole = (roleIdOrName: string): boolean => {
      const role = this.member?.roles.cache.find(
        (role) => role.id === roleIdOrName || role.name === roleIdOrName,
      );
      return !!role;
    };

    if (Array.isArray(idOrName)) {
      return idOrName.some((roleIdOrName) => checkRole(roleIdOrName));
    } else {
      return checkRole(idOrName);
    }
  }

  async jail(
    executor: this["identifier"],
    reason?: string,
  ): Promise<void | Error> {
    if (!this.member) return new Error(`Unable to resolve suspect`);

    if (!this.moderatedGuild)
      return new Error(`Unable to resolve moderated guild`);

    const resolvedExecutor = await DiscordMemberManager.get(
      executor,
      this.moderatedGuild,
    );

    if (!resolvedExecutor?.member)
      return new Error(`Unable to resolve executor`);

    // Check for executor authorization.
    if (!resolvedExecutor.verify("MOD_AND_ABOVE"))
      return new Error(`Unauthorized`);

    // Prevent friendly fire.
    if (this.verify("MOD_AND_ABOVE")) return new Error(`No friendly fire`);

    // Ensure not already jailed.
    if (
      this.hasRole(this.moderatedGuild.jail?.jailRoleId) &&
      !this.hasRole(this.moderatedGuild.keyRoles.member)
    ) {
      return new Error(`User is already jailed`);
    }

    // Remove suspect member role.
    const addRole = await this.addRole(
      this.moderatedGuild.jail?.jailRoleId || null,
      `Jailed by ${resolvedExecutor.member.user.username}`,
      true,
    );
    const removeRole = await this.removeRole(
      this.moderatedGuild.keyRoles.member,
      `Jailed by ${resolvedExecutor.member.user.username}`,
      true,
    );

    // Success case.
    if (addRole === "ADDED" && removeRole === "REMOVED") {
      // Update jail database.
      const supabaseClient = await SystemUtilities.getSupabaseClient();
      await supabaseClient.from("DiscordMembers").upsert<DiscordDBMember>({
        id: `${this.member.user.id}*${this.member.guild.id}`,
        user_id: this.member.id,
        user_name: this.member.user.username,
        display_name: this.member.user.displayName,
        guild_id: this.member.guild.id,
        joined_timestamp: this.member.guild.joinedTimestamp,
        created_timestamp: this.member.user.createdTimestamp,
        avatar_url: this.member.displayAvatarURL(),
        roles: this.roleIdArrayAsString(),
      });

      // Send out alerts.
      await new DiscordAlert(this.moderatedGuild.id).send("JAIL-LOG", {
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: `${this.member.user.displayName} was jailed`,
              iconURL: this.member.user.displayAvatarURL(),
            })
            .setDescription(reason || null)
            .addFields({
              name: "User",
              value: DiscordUtilities.completeUserString(this.member),
            })
            .setThumbnail(this.member.displayAvatarURL())
            .setFooter({
              text: resolvedExecutor.member.displayName,
              iconURL: resolvedExecutor.member.displayAvatarURL(),
            })
            .setColor("DarkButNotBlack")
            .setTimestamp(Date.now()),
        ],
        components: [
          new ActionRowBuilder<any>().addComponents(
            new ButtonBuilder()
              .setLabel("Unjail")
              .setCustomId(`unjail*${this.member.user.id}*Anti Raid`)
              .setStyle(1),
            new ButtonBuilder()
              .setLabel("Ban")
              .setCustomId(`ban*${this.member.user.id}*Anti Raid`)
              .setStyle(4),
          ),
        ],
      });

      // Alert user.
      await new DiscordAlert(this.moderatedGuild.id).send("JAIL-CHAT", {
        content: `<@${this.member.user.id}>`,
        embeds: [
          new EmbedBuilder()
            .setDescription(
              "**You have been jailed.** Please wait for a moderator to review the incident.",
            )
            .addFields(reason ? [{ name: "Reason(s)", value: reason }] : [])
            .setFooter({
              text: `${DiscordUtilities.completeUserString(this.member.user, true)} jailed by ${resolvedExecutor.member.user.displayName}`,
              iconURL: resolvedExecutor.member.displayAvatarURL(),
            })
            .setColor("Red")
            .setTimestamp(Date.now()),
        ],
      });
    } else {
      // Unlikely, but possible failure while updating roles.
      return new Error(`Error while adjusting the user roles`);
    }
  }

  async unjail(executor: this["identifier"]): Promise<void | Error> {
    if (!this.member) return new Error(`Unable to resolve suspect`);

    if (!this.moderatedGuild)
      return new Error(`Unable to resolve moderated guild`);

    const resolvedExecutor = await DiscordMemberManager.get(
      executor,
      this.moderatedGuild,
    );

    if (!resolvedExecutor?.member)
      return new Error(`Unable to resolve executor`);

    // Check for executor authorization.
    if (!resolvedExecutor.verify("MOD_AND_ABOVE"))
      return new Error(`Unauthorized`);

    // Ensure member is jailed.
    if (
      !this.hasRole(this.moderatedGuild.jail?.jailRoleId) ||
      this.hasRole(this.moderatedGuild.keyRoles.member)
    ) {
      return new Error(`User is not jailed`);
    }

    // Remove jail role and add member role.
    const removeRole = await this.removeRole(
      this.moderatedGuild.jail?.jailRoleId || null,
      `Unjailed by ${resolvedExecutor.member.user.username}`,
      true,
    );
    const addRole = await this.addRole(
      this.moderatedGuild.keyRoles.member,
      `Unjailed by ${resolvedExecutor.member.user.username}`,
      true,
    );

    // Success case.
    if (removeRole === "REMOVED" && addRole === "ADDED") {
      // Update database.
      const supabaseClient = await SystemUtilities.getSupabaseClient();

      await supabaseClient.from("DiscordMembers").upsert<DiscordDBMember>({
        id: `${this.member.user.id}*${this.member.guild.id}`,
        user_id: this.member.id,
        user_name: this.member.user.username,
        display_name: this.member.user.displayName,
        guild_id: this.member.guild.id,
        joined_timestamp: this.member.guild.joinedTimestamp,
        created_timestamp: this.member.user.createdTimestamp,
        avatar_url: this.member.displayAvatarURL(),
        roles: this.roleIdArrayAsString().replace(
          `${this.moderatedGuild.jail?.jailRoleId},`,
          "",
        ),
      });

      // Send out alerts.
      await new DiscordAlert(this.moderatedGuild.id).send("JAIL-LOG", {
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: `${this.member.user.displayName} was unjailed`,
              iconURL: this.member.user.displayAvatarURL(),
            })
            .addFields({
              name: "User",
              value: DiscordUtilities.completeUserString(this.member),
            })
            .setThumbnail(this.member.displayAvatarURL())
            .setFooter({
              text: resolvedExecutor.member.displayName,
              iconURL: resolvedExecutor.member.displayAvatarURL(),
            })
            .setColor("DarkGreen")
            .setTimestamp(Date.now()),
        ],
      });

      // Alert user.
      await new DiscordAlert(this.moderatedGuild.id).send("JAIL-CHAT", {
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: `${this.member.user.displayName} unjailed`,
              iconURL: this.member.displayAvatarURL(),
            })
            .setFooter({
              text: resolvedExecutor.member.user.displayName,
              iconURL: resolvedExecutor.member.displayAvatarURL(),
            })
            .setColor("DarkGreen")
            .setTimestamp(Date.now()),
        ],
      });
    } else {
      // Unlikely, but possible failure while updating roles.
      return new Error(`Error while adjusting the user roles`);
    }
  }

  async ban(
    executor: this["identifier"],
    deleteMessages?: "1h" | "1d" | "1w",
    reason?: string,
  ): Promise<void | Error> {
    if (!this.member) return new Error(`Unable to resolve suspect`);

    if (!this.moderatedGuild)
      return new Error(`Unable to resolve moderated guild`);

    const resolvedExecutor = await DiscordMemberManager.get(
      executor,
      this.moderatedGuild,
    );

    if (!resolvedExecutor?.member)
      return new Error(`Unable to resolve executor`);

    // Check for executor authorization.
    if (!resolvedExecutor.verify("MOD_AND_ABOVE"))
      return new Error(`Unauthorized`);

    // Prevent friendly fire.
    if (this.verify("MOD_AND_ABOVE")) return new Error(`No friendly fire`);

    try {
      // Ban the user.
      const deleteMessageSeconds =
        deleteMessages === "1h"
          ? 3600
          : deleteMessages === "1d"
            ? 86400
            : deleteMessages === "1w"
              ? 604800
              : 0;

      const ban = await this.member.ban({
        deleteMessageSeconds,
        reason,
      });

      if (!ban) {
        return new Error(`Couldn't find that user`);
      }
    } catch (error: any) {
      DiscordBot.shared.logError(error, "@ DiscordMemberManager/ban");
      return new Error(`Failed to ban user: ${error?.message || "-"}`);
    }
  }

  static async unban(
    userId: string,
    executor: DiscordMemberManager["identifier"],
    moderatedGuild: DiscordModeratedGuild | string | Guild | null,
    reason?: string,
  ): Promise<void | Error> {
    const resolvedGuild = DiscordUtilities.getModeratedGuild(moderatedGuild);
    if (!resolvedGuild) return new Error(`Unable to resolve moderated guild`);

    const resolvedExecutor = await DiscordMemberManager.get(
      executor,
      resolvedGuild,
    );

    if (!resolvedExecutor?.member)
      return new Error(`Unable to resolve executor`);

    // Check for executor authorization.
    if (!resolvedExecutor.verify("MOD_AND_ABOVE"))
      return new Error(`Unauthorized`);

    const guild = DiscordBot.shared.client.guilds.cache.get(resolvedGuild.id);

    if (!guild) return new Error(`Unable to find guild`);

    try {
      // Unban the user.
      const member = await guild.bans.remove(userId, reason);

      if (!member) {
        return new Error(`Unable to find a banned user with ID of "${userId}"`);
      }
    } catch (error: any) {
      DiscordBot.shared.logError(error, "@ DiscordMemberManager/unban");
      return new Error(
        `Failed to unban user: ${error?.message || "-"}. Try doing it from server settings (bans section; paste their ID there).`,
      );
    }
  }

  verify(
    accessControlList:
      | string[]
      | "VERIFIED_AND_ABOVE"
      | "INSIDER_AND_ABOVE"
      | "MOD_AND_ABOVE"
      | "ADMIN",
  ): boolean {
    return DiscordUtilities.verifyMember(this.member, accessControlList);
  }

  private async _resolveMember(
    moderatedGuild: DiscordModeratedGuild | string | Guild | null,
  ): Promise<void | null> {
    if (!this.identifier || !moderatedGuild) return null;

    const guild = DiscordUtilities.getModeratedGuild(moderatedGuild);
    if (!guild) return null;

    this.moderatedGuild = guild;

    // Resolve member via user ID.
    if (typeof this.identifier === "string") {
      this.member = await (
        await DiscordBot.shared.client.guilds.fetch(guild.id)
      ).members.fetch(this.identifier);
    }

    // Resolve member via User/ClientUser object.
    else if (
      this.identifier instanceof User ||
      this.identifier instanceof ClientUser
    ) {
      const guildData = DiscordBot.shared.client.guilds.cache.find(
        (g) => g.id === guild.id,
      );

      const member =
        guildData?.members.cache.get(this.identifier.id) ||
        (await guildData?.members.fetch(this.identifier));

      this.member = member ? member : null;
    }

    // Member is already resolved.
    else if (this.identifier instanceof GuildMember) {
      this.member = this.identifier;
    }

    // Resolve member via APIInteractionGuildMember.
    else {
      const guildData = DiscordBot.shared.client.guilds.cache.find(
        (g) => g.id === guild.id,
      );

      const member =
        guildData?.members.cache.get(this.identifier.user.id) ||
        (await guildData?.members.fetch(this.identifier.user.id));

      this.member = member ? member : null;
    }
  }
}
