import { EmbedBuilder } from "discord.js";
import { WikiSlashCommand } from "../../../Modules/DiscordModule/Types/WikiSlashCommand";
import { NetworkUtilities } from "../../../Utilities/NetworkUtilities";
import { DataPrayerTimes } from "../../../Modules/DatabaseModule/Types/DataPrayerTimes";
import { Ports } from "../../../Vars/Ports";
import { SystemUtilities } from "../../../Utilities/SystemUtils";

export default function command(): WikiSlashCommand {
  return {
    name: "prayer-times",
    description: "Look up live prayer times for any part of the world",
    options: [
      {
        name: "location",
        description:
          "You can enter a city, landmark, address, or exact coordinates",
        type: "STRING",
        localizations: [
          {
            name: "konum",
            description: "Şehir mi yoksa yakındaki simge yapı mı?",
            language: "tr",
          },
        ],
      },
      {
        name: "hide-visibility",
        description:
          "Hide the result from public (only you can view and dismiss it)",
        type: "STRING",
        choices: [
          {
            name: "yes",
            value: "yes",
          },
        ],
        optional: true,
      },
    ],
    localizations: [
      {
        name: "namazvakitleri",
        description: "Bir şehir için namaz vakitlerini yükleyin",
        language: "tr",
      },
    ],
    handler: async (interaction) => {
      const request = await NetworkUtilities.GET_INTERNAL<DataPrayerTimes>(
        `http://localhost:${Ports.PrayerTimesAPI}`,
        `/prayer-times/?q=${interaction.options.get("location")!.value}`,
        {
          backupEndpoint: "https://api.wikisubmission.org",
        },
      );

      if (request && request.results) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(request.results.location_string)
              .addFields(
                {
                  name: "Local Time",
                  value: codify(request.results.local_time),
                },
                {
                  name: "Now",
                  value: codify(
                    `${capitalized(request.results.current_prayer)} (began ${request.results.current_prayer_time_elapsed} ago)`,
                  ),
                },
                {
                  name: "Starting Soon",
                  value: codify(
                    `${capitalized(request.results.upcoming_prayer)} (${request.results.upcoming_prayer_time_left} left)`,
                  ),
                },
                {
                  name: "Schedule",
                  value: codify(
                    `Fajr: ${request.results.times.fajr}\nDhuhr: ${request.results.times.dhuhr}\nAsr: ${request.results.times.asr}\nMaghrib: ${request.results.times.maghrib}\nIsha: ${request.results.times.isha}\n\nSunrise: ${request.results.times.sunrise}`,
                  ),
                },
                {
                  name: "Coordinates",
                  value: codify(
                    `${request.results.coordinates.latitude}, ${request.results.coordinates.longitude}`,
                  ),
                },
              )
              .setAuthor({
                name: `Prayer Times`,
                iconURL: `https://flagcdn.com/48x36/${request.results.country_code.toLowerCase()}.png`,
              })
              .setFooter({
                text: request.results.local_timezone,
              })
              .setColor("DarkButNotBlack"),
          ],
          ephemeral:
            interaction.options.get("hide-visibility")?.value === "yes",
        });
      } else {
        await interaction.reply({
          content: `\`${request?.error?.description || "Internal Server Error"}\``,
          ephemeral: true,
        });
      }
      return interaction;
    },
  };
}

function codify(s: string) {
  return `\`\`\`${s}\`\`\``;
}

function capitalized(s: string) {
  return SystemUtilities.capitalize(s);
}
