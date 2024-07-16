import { APIEndpoint } from "../../../Modules/APIModule/Types/APIEndpoint";
import { APIJSONResponse } from "../../../Modules/APIModule/Types/APIResponse";
import { WikiDatabase } from "../../../Modules/DatabaseModule";

export default function route(): APIEndpoint {
  return {
    method: "get",
    route: "/quran/random-verse",
    alternateRoutes: ["/quran/randomverse"],
    handler: async (req, res) => {
      const data = await WikiDatabase.getTable("DataQuran");
      const result =
        data.length > 0 ? [data[Math.floor(Math.random() * data.length)]] : [];
      return new APIJSONResponse({
        success: result.length > 0,
        http_status_code: result.length > 0 ? 200 : 400,
        results: result,
      });
    },
  };
}
