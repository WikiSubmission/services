import { APIEndpoint } from "../../../Modules/APIModule/Types/APIEndpoint";
import { APIJSONResponse } from "../../../Modules/APIModule/Types/APIResponse";
import { WikiDatabase } from "../../../Modules/DatabaseModule";
import { DataQuranItem } from "../../../Modules/DatabaseModule/Types/DataQuran";
import { MiscUtils } from "../../../Utilities/MiscUtilities";

export default function route(): APIEndpoint {
  return {
    method: "get",
    route: "/quran/:query1?/:query2?",
    alternateRoutes: ["/quran/verse/:query1?/:query2"],
    caching: {
      duration: "5s",
    },
    handler: async (req, res) => {
      const data = await WikiDatabase.getTable("DataQuran");
      // only chapter ?
      const requestedChapter = MiscUtils.parseChapter(
        req.params?.query1,
        req.params?.query2,
      ); // --> chapter: number (1-114) | null;

      if (requestedChapter) {
        const result = data.filter(
          (ch) => ch.chapter_number === requestedChapter,
        );

        return new APIJSONResponse({
          success: result.length > 0,
          http_status_code: result.length > 0 ? 200 : 404,
          results: result.sort((a, b) => {
            const indexA = Number(a.verse_index);
            const indexB = Number(b.verse_index);
            return indexA - indexB;
          }),
          ...(result.length === 0
            ? {
                error: {
                  name: "Chapter Not Found",
                  description: `Chapter must be a number between 1 - 114.`,
                  fault: "client",
                  severity: "low",
                },
              }
            : {}),
        });
      }

      // chapter + verse ?
      const requestedVerse = MiscUtils.parseVerse(
        req.params?.query1,
        req.params?.query2,
      ); // --> { chapter: number | null, verse: number[] | null } | null

      if (requestedVerse) {
        const [chapter, versesArray] = [
          requestedVerse.chapter,
          requestedVerse.verse,
        ];
        if (chapter && versesArray) {
          const result = data.filter((i) => {
            return (
              i.chapter_number === chapter &&
              versesArray.includes(i.verse_number)
            );
          });

          return new APIJSONResponse({
            success: result.length > 0,
            http_status_code: result.length > 0 ? 200 : 404,
            results: result.sort((a, b) => {
              const indexA = Number(a.verse_index);
              const indexB = Number(b.verse_index);
              return indexA - indexB;
            }),
            ...(result.length === 0
              ? {
                  error: {
                    name: "Verse Not Found",
                    description: `Verse "${requestedVerse.chapter}:${requestedVerse.verse}" not found`,
                    fault: "client",
                    severity: "low",
                  },
                }
              : {}),
          });
        }
      }

      // verses separated by comma?
      else if (req.params?.query1?.includes(",")) {
        const possibleVersesRequested = req.params?.query1
          ?.split(",")
          .map((v) => v.trim()); // trim spaces
        const versesMatched: string[] = [];
        let data: DataQuranItem[] = [];

        for (const v of possibleVersesRequested) {
          // split by ":" to check for ranges
          const parts = v.split(":");
          if (parts.length === 2) {
            const startVerse = parts[0].trim();
            const endVerse = parts[1].trim();

            if (startVerse && endVerse) {
              // check for a range, e.g., "2-3"
              const rangeMatch = endVerse.match(/(\d+)-(\d+)/);
              if (rangeMatch) {
                const rangeStart = parseInt(rangeMatch[1]);
                const rangeEnd = parseInt(rangeMatch[2]);

                if (!isNaN(rangeStart) && !isNaN(rangeEnd)) {
                  for (let i = rangeStart; i <= rangeEnd; i++) {
                    const verseId = `${startVerse}:${i}`;
                    let matchingVerse = data.find(
                      (e) => e.verse_id === verseId,
                    );
                    if (matchingVerse) {
                      data.push(matchingVerse);
                      versesMatched.push(matchingVerse.verse_id);
                    }
                  }
                }
              } else {
                // single verse
                let matchingVerse = data.find((e) => e.verse_id === v);
                if (matchingVerse) {
                  data.push(matchingVerse);
                  versesMatched.push(matchingVerse.verse_id);
                }
              }
            }
          }
        }

        return new APIJSONResponse({
          success: data.length > 0,
          http_status_code: data.length > 0 ? 200 : 404,
          results: data,
          ...(data.length === 0
            ? {
                error: {
                  name: "Verse(s) Not Found",
                  description: `Make sure the request query is in the correct format`,
                  fault: "client",
                  severity: "low",
                },
              }
            : {}),
        });
      }

      return new APIJSONResponse({
        success: false,
        http_status_code: 400,
        results: [],
        error: {
          fault: "client",
          name: "Bad Request",
          description: "Couldn't find the verse(s)",
          severity: "low",
        },
      });
    },
  };
}
