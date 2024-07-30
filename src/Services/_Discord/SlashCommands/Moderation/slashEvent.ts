import {
  ActionRowBuilder,
  ButtonBuilder,
  DiscordAPIError,
  EmbedBuilder,
} from "discord.js";
import { WikiSlashCommand } from "../../../../Modules/DiscordModule/Types/WikiSlashCommand";
import { DiscordConfig } from "../../../../Modules/DiscordModule/DiscordConfig";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";
import { DateUtils } from "../../../../Utilities/DateUtils";
import { PrivateBot } from "../../../../Modules/DiscordModule/PrivateBot";
import { WikiLog } from "../../../../Modules/LogsModule";

export default function command(): WikiSlashCommand {
  return {
    name: "event",
    description: "Create an event",
    options: [
      {
        name: "title",
        description: "Event title?",
        type: "STRING",
      },
      {
        name: "channel",
        description: "Event channel? (choose a VOICE channel)",
        type: "STRING",
        choices: [
          ...DiscordConfig.knownGuilds.find(i => i.name === (process.env.NODE_ENV === "development" ? "WikiSubmission Developers" : "Submission"))!.keyVoiceChannels.map(v=>({
            name: v.name,
            value: v.voice
          }))
        ]
      },
      {
        name: "description",
        description: "Optional event description?",
        type: "STRING",
        optional: true,
      },
    ],
    disabledInDM: true,
    accessControl: "MOD_AND_ABOVE",
    guildSpecific: DiscordConfig.knownGuilds
      .filter((i) => i.jail)
      .map((i) => ({
        name: i.name,
        id: i.id,
      })),
    handler: async (interaction) => {
      await interaction.deferReply({ ephemeral: true });

      if (DiscordUtilities.verifyMember(interaction.member, "MOD_AND_ABOVE")) {
        const title = interaction.options.get("title")!.value as string;
        const channel = interaction.options.get("channel")!.value as string;
        const description = interaction.options.get("description")?.value as
          | string
          | undefined;
        const oneHourFromNow = DateUtils.getSpecificDate(1, "hour", "future");

        const post = await fetch(
          `https://discord.com/api/v10/guilds/${interaction.guildId}/scheduled-events`,
          {
            method: "post",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bot ${(await PrivateBot.shared.getPrivateBotCredentials()).token}`,
            },
            body: JSON.stringify({
              channel_id: channel,
              name: title,
              scheduled_start_time: oneHourFromNow,
              entity_type: 2,
              privacy_level: 2,
              description,
            }),
          },
        );

        const request = await post.json();

        if (request && request.id) {
          try {
            const embed = new EmbedBuilder()
              .setTitle(`Event Created`)
              .addFields(
                {
                  name: `Title`,
                  value: request.name,
                },
                {
                  name: `Channel`,
                  value: `<#${channel}>`,
                },
                {
                  name: `Scheduled Start Time`,
                  value: DateUtils.distanceFromNow(oneHourFromNow),
                },
                {
                  name: `Link`,
                  value: `https://discord.com/events/${interaction.guildId}/${request.id}`,
                },
              )
              .setColor("DarkButNotBlack")
              .setFooter({
                text: `Click "edit details" below to change any details.`,
              });

            const components = new ActionRowBuilder<any>().setComponents(
              new ButtonBuilder()
                .setLabel("Start Event Now")
                .setCustomId(`start_event:${request.id}`)
                .setStyle(4),
              new ButtonBuilder()
                .setLabel("Edit Details")
                .setURL(
                  `https://discord.com/events/${interaction.guildId}/${request.id}`,
                )
                .setStyle(5),
            );

            await interaction.editReply({
              embeds: [embed],
              components: [components],
            });
          } catch (error) {
            await interaction.editReply({
              content: `\`Error creating event: ${error instanceof DiscordAPIError ? error.message : `Internal Server Error`}\``,
            });
            WikiLog.discordError(
              error,
              "Services/_Discord/SlashCommands/slashEvent.ts",
            );
          }
        } else {
          await interaction.editReply({
            content: `\`The event channel must be a voice channel\``,
          });
        }
      } else {
        await interaction.editReply({
          content: `\`Unauthorized\``,
        });
      }
      return interaction;
    },
  };
}
