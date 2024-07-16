import { APIEndpoint } from "../../../Modules/APIModule/Types/APIEndpoint";
import { APIJSONResponse } from "../../../Modules/APIModule/Types/APIResponse";
import { WikiDatabase } from "../../../Modules/DatabaseModule";
import { MiscUtils } from "../../../Utilities/MiscUtilities";

export default function route(): APIEndpoint {
  return {
    method: "get",
    route: "/moc/newsletters/search",
    alternateRoutes: ["/moc/sp/search", "/moc/submitters-perspectives/search"],
    caching: {
      duration: "1m",
    },
    handler: async (req, res) => {
      const data = await WikiDatabase.getTable("DataNewsletters");

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

      const result = data.filter((i) => {
        const textToMatch = i.sp_content?.toLowerCase();

        return req.query?.ignore_word_order === "true"
          ? // split query by space and check if every word exists, at minimum
            requestedQuery
              .toLowerCase()
              .split(" ")
              .every((word) => textToMatch?.includes(word))
          : textToMatch?.includes(requestedQuery.toLowerCase()); // standard search
      });

      if (req.query?.highlight === "true") {
        for (let i = 0; i < result.length; i++) {
          // main text highlight
          const mediaText = result[i].sp_content;
          const highlightedText = MiscUtils.queryHighlight(
            requestedQuery,
            mediaText,
            req.query?.highlightMethod === "html" ? "html" : "markdown",
          );

          result[i] = {
            ...result[i],
            sp_content: highlightedText || result[i].sp_content,
          };
        }
      }

      return new APIJSONResponse({
        success: result.length > 0,
        http_status_code: result.length > 0 ? 200 : 404,
        results: result,
        ...(result.length === 0
          ? {
              error: {
                name: "No Newsletter Instances Found",
                description: `Could not find any newsletter instance(s) with "${requestedQuery}"`,
                fault: "client",
                severity: "low",
              },
            }
          : {}),
      });
    },
  };
}
