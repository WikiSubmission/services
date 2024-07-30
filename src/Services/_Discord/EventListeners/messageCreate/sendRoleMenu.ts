import { PrivateBot } from "../../../../Modules/DiscordModule/PrivateBot";
import { DiscordAlert } from "../../../../Modules/DiscordModule/Utilities/DiscordAlertManager";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";
import { DiscordConfig } from "../../../../Modules/DiscordModule/DiscordConfig";
import { SystemUtils } from "../../../../Utilities/SystemUtils";

/**
 * Message event listener to send the role menu if an admin or above types "!rolemenu".
 */
export default function listener(): void {
  PrivateBot.shared.addEventListener("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (!message.guildId) return;

    if (message.content !== "!rolemenu") return;

    if (!DiscordUtilities.verifyMember(message.member, "ADMIN")) return;

    const moderatedGuild = DiscordConfig.knownGuilds.find(
      (i) => i.id === message.guildId,
    );

    if (!moderatedGuild) return;

    await message.delete();

    await new DiscordAlert(message.guildId).send("CHOOSE-ROLES", {
      content: `🙏 **Religion**`,
      components: [
        {
          type: 1,
          components: [
            {
              type: 3,
              custom_id: `role_update`,
              options: moderatedGuild.choosableRoles
                .filter((role) => role.category === "Religion")[0]
                ?.roleNames.map((roleName) => ({
                  label: roleName,
                  value: `Religion:${PrivateBot.shared.client.guilds.cache.find((g) => g.id === moderatedGuild.id)?.roles.cache.find((r) => r.name === roleName)?.id}:${roleName}`,
                })),
            },
          ],
        },
      ],
    });

    await new DiscordAlert(message.guildId).send("CHOOSE-ROLES", {
      content: `🙋‍♂️ **Gender**`,
      components: [
        {
          type: 1,
          components: [
            {
              type: 3,
              custom_id: `role_update`,
              options: moderatedGuild.choosableRoles
                .filter((role) => role.category === "Gender")[0]
                ?.roleNames.map((roleName) => ({
                  label: roleName,
                  value: `Gender:${PrivateBot.shared.client.guilds.cache.find((g) => g.id === moderatedGuild.id)?.roles.cache.find((r) => r.name === roleName)?.id}:${roleName}`,
                })),
            },
          ],
        },
      ],
    });

    await SystemUtils.stimulateDelay(500);

    await new DiscordAlert(message.guildId).send("CHOOSE-ROLES", {
      content: `🌎 **Region**`,
      components: [
        {
          type: 1,
          components: [
            {
              type: 3,
              custom_id: `role_update`,
              options: moderatedGuild.choosableRoles
                .filter((role) => role.category === "Region")[0]
                ?.roleNames.map((roleName) => ({
                  label: roleName,
                  value: `Region:${PrivateBot.shared.client.guilds.cache.find((g) => g.id === moderatedGuild.id)?.roles.cache.find((r) => r.name === roleName)?.id}:${roleName}`,
                  description: getRegionDescription(roleName) || undefined,
                })),
            },
          ],
        },
      ],
    });

    await SystemUtils.stimulateDelay(500);

    await new DiscordAlert(message.guildId).send("CHOOSE-ROLES", {
      content: `🕰️ **Age**`,
      components: [
        {
          type: 1,
          components: [
            {
              type: 3,
              custom_id: `role_update`,
              options: moderatedGuild.choosableRoles
                .filter((role) => role.category === "Age")[0]
                ?.roleNames.map((roleName) => ({
                  label: roleName,
                  value: `Age:${PrivateBot.shared.client.guilds.cache.find((g) => g.id === moderatedGuild.id)?.roles.cache.find((r) => r.name === roleName)?.id}:${roleName}`,
                })),
            },
          ],
        },
      ],
    });

    await SystemUtils.stimulateDelay(500);

    await new DiscordAlert(message.guildId).send("CHOOSE-ROLES", {
      content: `💍 **Marital Status**`,
      components: [
        {
          type: 1,
          components: [
            {
              type: 3,
              custom_id: `role_update`,
              options: moderatedGuild.choosableRoles
                .filter((role) => role.category === "Marital Status")[0]
                ?.roleNames.map((roleName) => ({
                  label: roleName,
                  value: `Marital Status:${PrivateBot.shared.client.guilds.cache.find((g) => g.id === moderatedGuild.id)?.roles.cache.find((r) => r.name === roleName)?.id}:${roleName}`,
                })),
            },
          ],
        },
      ],
    });

    await SystemUtils.stimulateDelay(500);

    const reminderRoles = moderatedGuild.choosableRoles
      .filter((role) => role.category === "Reminders")[0]
      ?.roleNames.map((roleName) => ({
        label: roleName,
        value: `Reminders:${PrivateBot.shared.client.guilds.cache.find((g) => g.id === moderatedGuild.id)?.roles.cache.find((r) => r.name === roleName)?.id}:${roleName}`,
        description: getReminderDescription(roleName) || undefined,
      }));

    await new DiscordAlert(message.guildId).send("CHOOSE-ROLES", {
      content: `🔔 **Reminders**`,
      components: [
        {
          type: 1,
          components: [
            {
              type: 3,
              custom_id: `role_update`,
              options: reminderRoles,
              max_values: reminderRoles.length,
            },
          ],
        },
      ],
    });

    await SystemUtils.stimulateDelay(500);

    const otherLanguageRoles = moderatedGuild.choosableRoles
      .filter((role) => role.category === "Other Languages")[0]
      ?.roleNames.map((roleName) => ({
        label: roleName,
        value: `Other Languages:${PrivateBot.shared.client.guilds.cache.find((g) => g.id === moderatedGuild.id)?.roles.cache.find((r) => r.name === roleName)?.id}:${roleName}`,
      }));

    await new DiscordAlert(message.guildId).send("CHOOSE-ROLES", {
      content: `🌐 **Other Languages**`,
      components: [
        {
          type: 1,
          components: [
            {
              type: 3,
              custom_id: `role_update`,
              options: otherLanguageRoles,
              max_values: otherLanguageRoles.length,
            },
          ],
        },
      ],
    });

    await SystemUtils.stimulateDelay(500);

    await new DiscordAlert(message.guildId).send("CHOOSE-ROLES", {
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 1,
              custom_id: `view_roles`,
              label: "View my roles",
            },
            {
              type: 2,
              style: 2,
              custom_id: `clear_roles`,
              label: "Clear my roles",
            },
          ],
        },
      ],
    });
  });
}

function getRegionDescription(region: string): string | null {
  switch (region) {
    case "Americas":
      return "United States, Canada, or South America";
    case "Europe":
      return "European Union & United Kingsom";
    case "Africa":
      return "African Contintent";
    case "Asia":
      return "General Asian Continent";
    case "Middle East":
      return "Middle Eastern Region";
    case "Australia":
      return "Australia / New Zealand Region";
    default:
      return null;
  }
}

function getReminderDescription(region: string): string | null {
  switch (region) {
    case "Quran Study Ping":
      return "Every Sunday morning U.S. time (9AM PT)";
    case "Discussion Ping":
      return "Whenever there's a good discussion";
    case "Recitation Ping":
      return "Usually every day, multiple times (in VC4)";
    case "Meditation Ping":
      return "Every week or so";
    default:
      return null;
  }
}
