import { APIEndpoint } from "../../../Modules/APIModule/Types/APIEndpoint";
import { APIJSONResponse } from "../../../Modules/APIModule/Types/APIResponse";
import { WikiDatabase } from "../../../Modules/DatabaseModule";
import { MiscUtils } from "../../../Utilities/MiscUtilities";

export default function route(): APIEndpoint {
  return {
    method: "get",
    route: "/quran/search/:query?",
    caching: {
      duration: "10s",
    },
    handler: async (req, res) => {
      const data = await WikiDatabase.getTable("DataQuran");

      const requestedQuery = MiscUtils.parseSearchQuery(
        req.query?.q?.toString() || req.query?.search?.toString(),
      );

      if (!requestedQuery)
        return new APIJSONResponse({
          success: false,
          http_status_code: 400,
          results: [],
          error: {
            name: "Bad Request",
            description: "Missing query parameter",
          },
        });

      /** Get the language if specified - defaults to English */
      let requestedLanguage = MiscUtils.parseQuranLanguage(
        req.query?.lan?.toString() || req.query?.language?.toString(),
      );

      if (requestedLanguage === "arabic") requestedLanguage = "arabic_clean";

      const matches = data.filter((i) => {
        const textToMatch = MiscUtils.getQuranProperty(
          i,
          "text",
          requestedLanguage,
        )?.toLowerCase();

        return req.query?.ignore_word_order === "true"
          ? // split query by space and check if every word exists, at minimum
            requestedQuery
              .toLowerCase()
              .split(" ")
              .every((word) => textToMatch?.includes(word))
          : textToMatch?.includes(requestedQuery.toLowerCase()); // standard search
      });

      const additionalMatches =
        req.query?.ignore_commentary === "true"
          ? []
          : data.filter((i) => {
              const headerToMatch =
                MiscUtils.getQuranProperty(
                  i,
                  "subtitle",
                  requestedLanguage,
                )?.toLowerCase() ?? null;
              const footnoteToMatch =
                MiscUtils.getQuranProperty(
                  i,
                  "footnote",
                  requestedLanguage,
                )?.toLowerCase() ?? null;

              return req.query?.ignore_word_order === "true"
                ? // split query by space and check if every word exists, at minimum
                  requestedQuery
                    .split(" ")
                    .every(
                      (word) =>
                        headerToMatch?.includes(word) ||
                        footnoteToMatch?.includes(word),
                    )
                : headerToMatch?.includes(`${requestedQuery}`.toLowerCase()) ||
                    footnoteToMatch?.includes(
                      `${requestedQuery}`.toLowerCase(),
                    ); // standard search
            });

      const result =
        req.query?.ignore_commentary !== "true"
          ? Array.from(new Set(matches.concat(additionalMatches)))
          : matches;

      if (req.query?.highlight === "true") {
        for (let i = 0; i < result.length; i++) {
          // main text highlight
          const verseText = result[i][`verse_text_${requestedLanguage}`];
          const highlightedText = MiscUtils.queryHighlight(
            requestedQuery,
            verseText,
            req.query?.highlightMethod === "html" ? "html" : "markdown",
          );

          // header highlight
          const verseSubtitleText =
            result[i].verse_subtitle_english &&
            (requestedLanguage === "english" || requestedLanguage === "turkish")
              ? result[i][`verse_subtitle_${requestedLanguage}`]
              : null;

          const highlightedSubtitleText = verseSubtitleText
            ? MiscUtils.queryHighlight(
                requestedQuery,
                verseSubtitleText,
                req.query?.highlightMethod === "html" ? "html" : "markdown",
              )
            : null;

          // footnote highlight
          const verseFootnoteText =
            result[i].verse_footnote_english &&
            (requestedLanguage === "english" || requestedLanguage === "turkish")
              ? result[i][`verse_footnote_${requestedLanguage}`]
              : null;

          const highlightedFootnoteText = verseFootnoteText
            ? MiscUtils.queryHighlight(
                requestedQuery,
                verseFootnoteText,
                req.query?.highlightMethod === "html" ? "html" : "markdown",
              )
            : null;

          result[i] = {
            ...result[i],

            [`verse_subtitle_${requestedLanguage}`]: highlightedSubtitleText,

            [`verse_text_${requestedLanguage}`]: highlightedText,

            [`verse_footnote_${requestedLanguage}`]: highlightedFootnoteText,
          };
        }
      }

      /** Sort by index */
      result.sort((a, b) => {
        const indexA = Number(a.verse_index);
        const indexB = Number(b.verse_index);
        return indexA - indexB;
      });

      if (req.query.normalize_god_capitalization === "true") {
        result.forEach((i) => {
          i.verse_text_english = i.verse_text_english.replace(/GOD/g, "God");
        });
      }

      return new APIJSONResponse({
        success: result.length > 0,
        http_status_code: result.length > 0 ? 200 : 204,
        results: result,
        ...(result.length === 0
          ? {
              error: {
                name: "No Verses Found",
                description: `Could not find any verse(s) with "${requestedQuery}"`,
              },
            }
          : {}),
      });
    },
  };
}
