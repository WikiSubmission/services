// TODO: implement file caching

import { WikiService } from "../ServiceModule";
import { APIEndpoint } from "../APIModule/Types/APIEndpoint";
import {
  APIFileResponse,
  APIJSONResponse,
} from "../APIModule/Types/APIResponse";
import { S3Utils } from "../../Utilities/S3Utils";
import { SystemUtilities } from "../../Utilities/SystemUtils";
import { WikiAPI } from "../APIModule";

/**
 * @interface LibraryConfig
 * @description A simple interface to define a 'library' service that expose media/files from a storage provider, using folder paths (e.g. /folder/subfolder/file.pdf) as endpoints
 */
export interface LibraryConfig {
  provider: "AWS_S3"; // TODO: add other file-storage providers to serve as a backup (gcloud, azure)
  bucket: "wikisubmission" | string;
  keyFolders: string[];
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
      if (this.service.config.library.provider === "AWS_S3") {
        for (const folder of this.service.config.library.keyFolders) {
          endpoints.push({
            method: "get",
            route: `/library/${folder}/:query`,
            alternateRoutes: [`/${folder}/:query`],
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

              const request = await S3Utils.lookupObject(`${folder}/${query}`);

              if (!request) {
                return new APIJSONResponse({
                  success: false,
                  http_status_code: 400,
                  error: {
                    name: "Bad Request",
                    description: `Could not find a file named '${query}' in '${this.service?.config.library?.bucket}/${folder}'. Please double check the URL.`,
                    fault: "client",
                  },
                });
              }

              const { key, extension } = SystemUtilities.getKeyAndExtension(
                request?.Key,
              );

              return new APIFileResponse({
                name: key || "404",
                type: request?.ContentType || "application/octet-stream",
                body: request?.Body,
                extension: request?.Extension || extension,
                size: request?.ContentLength || 0,
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
