import { Ports } from "../../Vars/Ports";
import { WikiService } from "../../Modules/ServiceModule";

export default async function service(): Promise<WikiService> {
  return await WikiService.create({
    name: "Quran",
    api: {
      name: "QuranAPI",
      description: "Quran: The Final Testament API",
      port: Ports.QuranAPI,
      endpoints: "INFER",
    },
    databases: [
      {
        tableName: "DataQuran",
        sync: {
          method: "MEMORY",
          options: {
            waitMinutesBeforeOnChangeSync: 1,
            dataSortKey: "verse_index",
          },
        },
      },
    ],
  });
}
