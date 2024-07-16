import { APIEndpoint } from "../../../Modules/APIModule/Types/APIEndpoint";
import { APIJSONResponse } from "../../../Modules/APIModule/Types/APIResponse";
import { WikiDatabase } from "../../../Modules/DatabaseModule";
import { DataMocMediaItem } from "../../../Modules/DatabaseModule/Types/DataMocMedia";
import { MiscUtils } from "../../../Utilities/MiscUtilities";

export default function route(): APIEndpoint {
  return {
    method: "get",
    route: "/moc/media/search",
    caching: {
      duration: "1m",
    },
    handler: async (req, res) => {
      const data = await WikiDatabase.getTable("DataMocMedia");

      const requestedQuery = MiscUtils.parseSearchQuery(
        req.query?.q?.toString() || req.query?.search?.toString(),
      );

      if (!requestedQuery) {
        return new APIJSONResponse({
          success: false,
          http_status_code: 400,
          results: [],
          error: {
            fault: "client",
            name: "Bad Request",
            description: "Missing query parameter",
            severity: "low",
          },
        });
      }

      const result = data
        .filter((i) => {
          const textToMatch = i.media_transcript?.toLowerCase();

          return req.query?.ignore_word_order === "true"
            ? // split query by space and check if every word exists, at minimum
              requestedQuery
                .toLowerCase()
                .split(" ")
                .every((word) => textToMatch?.includes(word))
            : textToMatch?.includes(requestedQuery.toLowerCase()); // standard search
        })
        .filter((i) => {
          // filter by type, if requested
          switch (getExtent()) {
            case "FullScan":
              return true;
            case "AudiosScan":
              return i.media_type === "Audios";
            case "ProgramsScan":
              return i.media_type === "Programs";
            case "SermonsScan":
              return i.media_type === "Sermons";
            default:
              return true;
          }
        });

      if (req.query?.highlight === "true") {
        for (let i = 0; i < result.length; i++) {
          // main text highlight
          const mediaText = result[i].media_transcript;
          const highlightedText = MiscUtils.queryHighlight(
            requestedQuery,
            mediaText,
            req.query?.highlightMethod === "html" ? "html" : "markdown",
          );

          result[i] = {
            ...result[i],
            media_transcript: highlightedText || result[i].media_transcript,
          };
        }
      }

      result.forEach((i) => {
        (i.media_title = parseMocTitle(i)),
          (i.media_markdown = populateMarkdown(i));
      });

      return new APIJSONResponse({
        success: result.length > 0,
        http_status_code: result.length > 0 ? 200 : 404,
        results: result,
        ...(result.length === 0
          ? {
              error: {
                name: "No Media Instances Found",
                description: `Could not find any media instance(s) with "${requestedQuery}"`,
                fault: "client",
                severity: "low",
              },
            }
          : {}),
      });

      function getExtent() {
        const q = req.query?.extent;
        if (!q) return "FullScan";
        switch (q?.toString().toLowerCase()) {
          case "sermons":
            return "SermonsScan";
          case "audios":
            return "AudiosScan";
          case "programs":
            return "ProgramsScan";
          default:
            return "FullScan";
        }
      }
    },
  };
}

function parseMocTitle(i: DataMocMediaItem) {
  switch (i.media_type) {
    case "sermons":
      return `${i.media_version?.toString().split("_")[0]} ${i.media_version?.toString().slice(-3)} (Sermon)`;
    case "programs":
      return `${i.media_youtube_title} @ ${i.media_start_timestamp?.split(",")[0].replace("00:", "")}`;
    case "audios":
      return `Audio ${i.media_episode} @ ${i.media_start_timestamp?.split(",")[0].replace("00:", "")} (V${
        i.media_version ?? "1"
      })`;
    default:
      return "";
  }
}

function populateMarkdown(i: DataMocMediaItem) {
  switch (i.media_type) {
    case "sermons":
      return `[${i.media_version?.toString().split("_")[0]} ${i.media_version
        ?.toString()
        .slice(
          -3,
        )} (Sermon) @ ${normalizeTimestamp(i.media_start_timestamp)}](https://youtu.be/${i.media_youtube_id}?t=${i.media_youtube_timestamp})`;
    case "programs":
      return `[${i.media_title} @ ${i.media_start_timestamp?.split(",")[0].replace("00:", "")}](https://youtu.be/${i.media_youtube_id}?t=${i.media_youtube_timestamp})`;
    case "audios":
      return `[Audio ${i.media_episode} @ ${i.media_start_timestamp?.split(",")[0].replace("00:", "")} (V${
        i.media_version
      })](https://youtu.be/${i.media_youtube_id}?t=${i.media_youtube_timestamp})`;
    default:
      return "";
  }
}

function normalizeTimestamp(timestamp: any) {
  const parts = timestamp?.split(":") ?? ["0", "0"];
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2]?.split(",")[0], 10);
  const normalizedTimestamp = `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  return normalizedTimestamp;
}
