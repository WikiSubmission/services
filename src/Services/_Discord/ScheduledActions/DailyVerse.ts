import { EmbedBuilder } from "discord.js";
import { DiscordConfig } from "../../../Modules/DiscordModule/DiscordConfig";
import { DataQuranItem } from "../../../Modules/DatabaseModule/Types/DataQuran";
import { DiscordUtilities } from "../../../Modules/DiscordModule/Utilities/DiscordUtilities";
import { NetworkUtils } from "../../../Utilities/NetworkUtilities";
import { DiscordScheduledActions } from "../../../Modules/DiscordModule/Utilities/DiscordScheduledActions";

export default function action(): void {
  DiscordScheduledActions.create({
    id: "DailyVerse",
    description: "Send a random verse to Quran channel every day",
    interval: "EVERY_DAY",
    action: async () => {
      for (const knownGuild of DiscordConfig.knownGuilds) {
        if (knownGuild.keyChannels.quran) {
          const quranChannel = await DiscordUtilities.getChannelById(
            knownGuild.keyChannels.quran,
            knownGuild.id,
          );
          if (quranChannel) {
            const randomVerse = await NetworkUtils.GET_INTERNAL<
              DataQuranItem[]
            >("https://api.wikisubmission.org", "/quran/random-verse");
            if (randomVerse && randomVerse.results) {
              await quranChannel.send({
                embeds: [
                  new EmbedBuilder()
                    .setTitle("Verse of the Day")
                    .setDescription(
                      `**[${randomVerse.results[0].verse_id}]** ${randomVerse.results[0].verse_text_english}\n\n${randomVerse.results[0].verse_text_arabic}`,
                    )
                    .setFooter({
                      text: `Sura ${randomVerse.results[0].chapter_number}, ${randomVerse.results[0].chapter_title_english} (${randomVerse.results[0].chapter_title_arabic_transliteration})`,
                    })
                    .setColor("DarkButNotBlack"),
                ],
              });
            }
          }
        }
      }
    },
  });
}
