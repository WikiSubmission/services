import { WikiService } from "../../Modules/ServiceModule";
import { Ports } from "../../Vars/Ports";

export default async function service(): Promise<WikiService> {
  return await WikiService.create({
    name: "Library",
    library: {
      bucket: "wikisubmission",
      apiBasePath: "/library",
      foldersToExpose: [
        "books",
        "sp",
        "research",
        "media",
        "misc",
        "recitations",
        "tmp",
      ],
      port: Ports.LibraryAPI,
      provider: {
        identifier: "DIGITALOCEAN_SPACES",
        primaryCDN: "https://wikisubmission.sfo2.cdn.digitaloceanspaces.com",
        backupCDN: "https://wikisubmission.sfo2.digitaloceanspaces.com",
      },
    },
  });
}
