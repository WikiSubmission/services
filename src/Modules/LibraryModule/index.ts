// TODO: implement file caching

import { WikiService } from "../ServiceModule";
import { APIEndpoint } from "../APIModule/Types/APIEndpoint";
import {
  APIJSONResponse,
  APIRedirectResponse,
} from "../APIModule/Types/APIResponse";
import { S3Utils } from "../../Utilities/S3Utils";
import { WikiAPI } from "../APIModule";
import { WikiEvents } from "../LogsModule";

/**
 * @interface LibraryConfig
 * @description A simple interface to define a 'library' service that expose media/files from a storage provider, using folder paths (e.g. /folder/subfolder/file.pdf) as endpoints
 */
export interface LibraryConfig {
  provider: {
    identifier: 'DIGITALOCEAN_SPACES' // TODO: add other file-storage providers
    primaryCDN: string;
    backupCDN?: string;
  };
  bucket: "wikisubmission" | string;
  apiBasePath: `/${string}`;
  foldersToExpose: string[];
  port: number;
}

/**
 * @class WikiLibrary
 * @description Automatically configures an API for a service based on the LibraryConfig
 */
export class WikiLibrary {
  service: WikiService | null = null;

  private constructor(service: WikiService) {
    this.service = service;
  }

  /**
   * @method initialize
   * @description Starts the initialization process
   */
  static async initialize(service: WikiService): Promise<WikiLibrary | null> {
    return await new WikiLibrary(service).init();
  }

  /**
   * @method init
   * @description Performs initialization
   */
  private async init(): Promise<WikiLibrary | null> {
    if (!this.service) return null; // Assert access.

    // Initialize an API endpoint array.
    const endpoints: APIEndpoint[] = [];

    // Go through each folder and create a corresponding endpoint.
    if (this.service.config.library) {
      if (this.service.config.library.provider.identifier === "DIGITALOCEAN_SPACES") {
        for (const folder of this.service.config.library.foldersToExpose) {
          endpoints.push({
            method: "get",
            route: `${this.service.config.library.apiBasePath}/${folder}/:query`,
            handler: async (req, res) => {
              const query = req.params.query?.toString();
              
              if (!query) {
                return new APIJSONResponse({
                  success: false,
                  http_status_code: 400,
                  error: {
                    name: "Bad Request",
                    description: "Missing query",
                    fault: "client",
                  },
                });
              }

              // Resolve the key of the object (exact file path).
              const objectKey = await S3Utils.lookupObjectKey(`${folder}/${query}`);

              if (!objectKey) {
                return new APIJSONResponse({
                  success: false,
                  http_status_code: 400,
                  error: {
                    name: "Bad Request",
                    description: `Could not find a file named '${query}' in '${this.service?.config.library?.bucket}/${folder}'. Please double check the URL.`,
                  },
                });
              }

              const primaryUrl = `${this.service!.config.library!.provider.primaryCDN}/${objectKey}`;
              const backupUrl = `${this.service!.config.library!.provider.backupCDN}/${objectKey}`;

              try {
                const primaryCDNReachable = await fetch(primaryUrl, { method: 'HEAD' });
                if (primaryCDNReachable.ok) {
                  return new APIRedirectResponse({
                    url: primaryUrl,
                    rewrite: true
                  });
                }
              } catch (error) {
                WikiEvents.emit("api:error", `Primary CDN unreachable (${backupUrl})`);
                if (this.service!.config.library!.provider.backupCDN) {
                  const backupCDNReachable = await fetch(backupUrl, { method: 'HEAD' });
                  if (backupCDNReachable) {
                    return new APIRedirectResponse({
                      url: backupUrl,
                      rewrite: true
                    });
                  } else {
                    WikiEvents.emit("api:error", `Backup CDN unreachable (${backupUrl})`);
                  }
                }
              }

              return new APIRedirectResponse({
                url: "https://wikisubmission.org/resources"
              });
            },
          });
        }
      }
    }

    // Create a new API with the registered endpoints.
    if (this.service.config.library) {
      // Attach API to the existing service.
      this.service.config.api = {
        name: "LibraryAPI",
        description: `Library API`,
        port: this.service.config.library.port,
        endpoints,
      };

      // Initialize API with service object.
      await WikiAPI.initialize(this.service);
    }

    return this;
  }
}
