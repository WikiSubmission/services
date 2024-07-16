import { Ports } from "../../Vars/Ports";
import { WikiService } from "../../Modules/ServiceModule";

export default async function service(): Promise<WikiService> {
  return await WikiService.create({
    name: "PrayerTimes",
    api: {
      name: "PrayerTimesAPI",
      description: "Get live prayer times for any part in the world",
      port: Ports.PrayerTimesAPI,
      endpoints: "INFER",
    },
  });
}
