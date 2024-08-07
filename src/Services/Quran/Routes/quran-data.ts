import { APIEndpoint } from "../../../Modules/APIModule/Types/APIEndpoint";
import { APIFileResponse } from "../../../Modules/APIModule/Types/APIResponse";
import { WikiDatabase } from "../../../Modules/DatabaseModule";

export default function route(): APIEndpoint {
  return {
    method: "get",
    route: "/quran/data",
    handler: async (req, res) => {
      const data = JSON.stringify(
        await WikiDatabase.getTable("DataQuran"),
        null,
        2,
      );

      const size = Buffer.byteLength(data, "utf-8");

      return new APIFileResponse({
        name: "DataQuran",
        extension: "json",
        type: "application/json",
        size,
        body: data,
        forceDownload: true,
        ...(data.length === 0
          ? {
              error: {
                name: "Internal Server Error",
                description: `Please try again later`,
                severity: "high",
                fault: "server",
              },
            }
          : {}),
      });
    },
  };
}
