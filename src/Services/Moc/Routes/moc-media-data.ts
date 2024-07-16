import { APIEndpoint } from "../../../Modules/APIModule/Types/APIEndpoint";
import { APIFileResponse } from "../../../Modules/APIModule/Types/APIResponse";
import { WikiDatabase } from "../../../Modules/DatabaseModule";

export default function route(): APIEndpoint {
  return {
    method: "get",
    route: "/moc/media/data",
    handler: async (req, res) => {
      const data = JSON.stringify(
        await WikiDatabase.getTable("DataMocMedia"),
        null,
        2,
      );

      const size = Buffer.byteLength(data, "utf-8");

      return new APIFileResponse({
        name: "DataMocMedia",
        extension: "json",
        type: "application/json",
        size,
        body: data,
      });
    },
  };
}
