import { Ports } from "../../Vars/Ports";
import { WikiService } from "../../Modules/WikiServiceModule";

export default async function service(): Promise<WikiService> {
  return await WikiService.create({
    name: "Moc",
    api: {
      name: "Moc",
      description: "Media & Resources from Messenger of the Covenant",
      port: Ports.MocAPI,
      endpoints: "INFER",
    },
    databases: [
      {
        tableName: "DataMocMedia",
        sync: {
          method: "MEMORY",
          options: {
            waitMinutesBeforeOnChangeSync: 1,
          },
        },
      },
      {
        tableName: "DataNewsletters",
        sync: {
          method: "MEMORY",
          options: {
            waitMinutesBeforeOnChangeSync: 1,
          },
        },
      },
    ],
  });
}
