import { WikiService } from "../../Modules/ServiceModule";
import { Ports } from "../../Vars/Ports";

export default async function service(): Promise<WikiService> {
  return await WikiService.create({
    name: "Library",
    library: {
      bucket: "wikisubmission",
      keyFolders: [
        "books",
        "sp",
        "research",
        "media",
        "misc",
        "recitations",
        "tmp",
      ],
      port: Ports.LibraryAPI,
      provider: "DIGITALOCEAN_SPACES",
    },
  });
}
