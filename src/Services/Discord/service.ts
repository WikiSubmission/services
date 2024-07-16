import { WikiService } from "../../Modules/ServiceModule";
import { DiscordBot } from "../../Modules/DiscordModule";
import { Ports } from "../../Vars/Ports";

export default async function service(): Promise<WikiService> {
  return await WikiService.create({
    name: "Discord",
    // api: {
    //   name: "DiscordAPI",
    //   description: "API to handle Discord interactions",
    //   port: Ports.DiscordAPI,
    //   endpoints: "INFER",
    // },
    customService: async () => {
      // await DiscordBot.shared.start();
      console.log("--UNDER DEVELOPMENT--");
    },
  });
}
