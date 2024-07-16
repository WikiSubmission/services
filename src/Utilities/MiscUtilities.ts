import fill from "fill-range";
import {
  DataQuranLanguageSpecificStrings,
  DataQuranLanguageKeys,
  DataQuranItem,
} from "../Modules/DatabaseModule/Types/DataQuran";

export class MiscUtils {
  static parseSearchQuery(query: string | undefined): string | null {
    if (query && query.length > 0) {
      try {
        return decodeURIComponent(query);
      } catch (error) {
        return query?.replace(/[^a-zA-Z0-9]/g, "") ?? "";
      }
    } else return null;
  }

  static parseQuranLanguage(
    query: string | undefined,
  ): keyof DataQuranLanguageSpecificStrings {
    if (query === undefined || query === "") return "english";

    for (const l of DataQuranLanguageKeys) {
      if (query.toLowerCase() === l) return l;
    }

    return "english";
  }

  static parseChapter(
    query1: string | undefined,
    query2: string | undefined,
  ): number | null {
    if (query2) return null;
    if (
      query1 &&
      /^[0-9]+$/.test(query1) &&
      parseInt(query1, 10) &&
      parseInt(query1, 10) < 115
    )
      return parseInt(query1, 10);
    else return null;
  }

  static parseVerse(
    query1: string | undefined,
    query2: string | undefined,
  ): { chapter: number | null; verse: number[] | null } | null {
    /** validate: 1/1 */
    if (query1 && query2) {
      const verseStart = parseInt(query2.split("-")[0], 10);
      const verseEnd = parseInt(query2.split("-")[1], 10) || verseStart;
      return {
        chapter: parseInt(query1, 10),
        verse: fill(verseStart, verseEnd),
      };
    } else if (
      /** validate: 1:1 */
      query1 &&
      query1.includes(":") &&
      !query1.endsWith(":") &&
      !query1.startsWith(":") &&
      !isNaN(parseInt(query1.replace(":", "").replace("-", ""), 10)) &&
      !query1.includes(",")
    ) {
      const verseStart = parseInt(query1.split(":")[1].split("-")[0], 10);
      const verseEnd =
        parseInt(query1.split(":")[1].split("-")[1], 10) || verseStart;
      return {
        chapter: parseInt(query1.split(":")[0], 10),
        verse: fill(verseStart, verseEnd),
      };
    } else {
      return null;
    }
  }

  static getQuranProperty(
    data: DataQuranItem,
    property: "title" | "text" | "subtitle" | "footnote",
    language: keyof DataQuranLanguageSpecificStrings,
  ): string | null {
    switch (property) {
      case "title":
        for (const lan of DataQuranLanguageKeys) {
          if (language.toLowerCase() === lan) {
            if (lan !== "arabic_clean" && data[`chapter_title_${lan}`]) {
              return (
                data[`chapter_title_${lan}`] ??
                data.chapter_title_english ??
                null
              );
            }
          }
        }
        return data.chapter_title_english ?? null;

      case "text":
        for (const lan of DataQuranLanguageKeys) {
          if (language.toLowerCase() === lan) {
            if (data[`verse_text_${lan}`]) {
              return (
                data[`verse_text_${lan}`] ?? data.verse_text_english ?? null
              );
            }
          }
        }

      case "subtitle":
        for (const lan of DataQuranLanguageKeys) {
          if (language.toLowerCase() === lan) {
            if (
              (lan === "english" || lan === "turkish") &&
              data[`verse_subtitle_${lan}`]
            ) {
              return (
                data[`verse_subtitle_${lan}`] ??
                data.verse_subtitle_english ??
                null
              );
            }
          }
        }
        return data.verse_subtitle_english ?? null;

      case "footnote":
        for (const lan of DataQuranLanguageKeys) {
          if (language.toLowerCase() === lan) {
            if (
              (lan === "english" || lan === "turkish") &&
              data[`verse_footnote_${lan}`]
            ) {
              return (
                data[`verse_footnote_${lan}`] ??
                data.verse_footnote_english ??
                null
              );
            }
          }
        }
        return data.verse_footnote_english ?? null;
    }
  }

  static queryHighlight(
    query: string,
    reference: string | undefined | null,
    method?: "markdown" | "html",
  ): string | null {
    if (!reference) return null;

    const escapedHighlight = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `\\b(${escapedHighlight.replace(/\s+/g, "|")})\\b|(?<=\\b)(${escapedHighlight})`,
      "gi",
    );
    const highlightMethod = method ? method : "markdown";

    return reference
      .replace(
        /(?<!\*)\*{1,2}(?!\*)/g,
        highlightMethod === "markdown" ? "±" : "*",
      )
      .replace(
        regex,
        highlightMethod === "html"
          ? `<span class="text-red-800"><b>$&</b></span>`
          : `**$&**`,
      );
  }
}
