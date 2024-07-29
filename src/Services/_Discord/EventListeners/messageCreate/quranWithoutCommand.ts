import { EmbedBuilder } from "discord.js";
import { NetworkUtilities } from "../../../../Utilities/NetworkUtilities";
import { DataQuranItem } from "../../../../Modules/DatabaseModule/Types/DataQuran";
import { PrivateBot } from "../../../../Modules/DiscordModule/PrivateBot";

/**
 * Message event listener to detect any Quranic verses prefixed with "q" and send them accordingly.
 */
export default function listener(): void {
  PrivateBot.shared.addEventListener("messageCreate", async (message) => {
    if (message.author.bot) return;

    const verses = detectQuranicVerses(message.content);

    let description = "";
    if (verses.length > 0) {
      for (const verse of verses) {
        const request = await NetworkUtilities.GET_INTERNAL<DataQuranItem[]>(
          "https://api.wikisubmission.org",
          `/quran/${verse.toLowerCase().replace("q", "")}&normalize_god_capitalization=true`,
        );

        if (request && (request.results?.length || 0 > 0)) {
          for (const i of request?.results || []) {
            if (i.verse_subtitle_english) {
              description += `${safeMarkdown(`\`${i.verse_subtitle_english}\``)}\n\n`;
            }
            description +=
              `**[${i.verse_id}]** ` +
              safeMarkdown(`${i.verse_text_english}\n\n`);
            if (message.content.toLowerCase().includes("-a")) {
              description += `(${i.verse_id_arabic}) ${i.verse_text_arabic}\n\n`;
            }
            if (message.content.toLowerCase().includes("-t")) {
              description += `${i.verse_text_arabic_transliteration}\n\n`;
            }
            if (
              message.content.toLowerCase().includes("-f") &&
              i.verse_footnote_english
            ) {
              description += `*${safeMarkdown(i.verse_footnote_english)}*\n\n`;
            }
          }
        }

        if (request?.results?.length || 0 > 0) {
          await message.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(description.slice(0, 4000))
                .setFooter({
                  text: `Quran: The Final Testament • Referenced Verses`,
                })
                .setColor("DarkButNotBlack"),
            ],
          });
        }
      }
    } else {
      return;
    }
  });
}

function detectQuranicVerses(text: string): string[] {
  // e.g. Q94:3, Q1:1, Q44:4-5, Q 1:1, Q 44:4-5
  const versePattern = /\b[qQ]\s?\d{1,3}:\d{1,3}(-\d{1,3})?\b/g;

  const matches = text.match(versePattern);

  return matches || [];
}

function safeMarkdown(s?: string | null): string {
  if (!s) return s || "";
  else return s.replace(/(?<!\*)\*{1,2}(?!\*)/g, "±") ?? "";
}
