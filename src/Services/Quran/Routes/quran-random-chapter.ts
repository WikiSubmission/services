import { APIEndpoint } from "../../../Modules/APIModule/Types/APIEndpoint";
import { APIJSONResponse } from "../../../Modules/APIModule/Types/APIResponse";
import { WikiDatabase } from "../../../Modules/DatabaseModule";

export default function route(): APIEndpoint {
  return {
    method: "get",
    route: "/quran/random-chapter",
    alternateRoutes: ["/quran/randomchapter"],
    handler: async (req, res) => {
      const randomChapterInt = Math.floor(Math.random() * (114 - 1 + 1) + 1);

      const data = await WikiDatabase.getTable("DataQuran");
      const result =
        data.length > 0
          ? data.filter((i) => i.chapter_number === randomChapterInt)
          : [];

      result.sort((a, b) => {
        const indexA = Number(a.verse_index);
        const indexB = Number(b.verse_index);
        return indexA - indexB;
      });

      return new APIJSONResponse({
        success: result.length > 0,
        http_status_code: result.length > 0 ? 200 : 400,
        results: result,
      });
    },
  };
}
