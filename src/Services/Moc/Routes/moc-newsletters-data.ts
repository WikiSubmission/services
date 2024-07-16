import { APIEndpoint } from "../../../Modules/APIModule/Types/APIEndpoint";
import { APIFileResponse } from "../../../Modules/APIModule/Types/APIResponse";
import { WikiDatabase } from "../../../Modules/DatabaseModule";

export default function route(): APIEndpoint {
  return {
    method: "get",
    route: "/moc/newsletters/data",
    handler: async (req, res) => {
      const data = JSON.stringify(
        await WikiDatabase.getTable("DataNewsletters"),
        null,
        2,
      );

      const size = Buffer.byteLength(data, "utf-8");

      return new APIFileResponse({
        name: "DataNewsletters",
        extension: "json",
        type: "application/json",
        size,
        body: data,
      });
    },
  };
}
