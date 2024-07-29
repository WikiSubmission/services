import Express, { Request, Response } from "express";
import {
  APIFileResponse,
  APIJSONResponse,
  APIRedirectResponse,
} from "./Types/APIResponse";
import { APIRequestEvent, APIResponseEvent } from "./Types/APIEmittedEvents";
import { WikiService } from "../ServiceModule";
import { WikiEvents } from "../LogsModule";
import { WikiCache } from "../CachingModule";
import { APIEndpoint } from "./Types/APIEndpoint";
import { APIError } from "./Types/APIError";
import { SystemUtilities } from "../../Utilities/SystemUtils";
import { MemoryCache } from "cache-manager";
import { FileUtils } from "../../Utilities/FileUtils";
import { HostAddress } from "../../Vars/Host";
import { Readable } from "stream";
import helmet from "helmet";
import * as http from "http";

/**
 * @class WikiAPI
 * @description Configures and runs an associated API for a service
 */
export class WikiAPI {
  service: WikiService;
  server: Express.Application;
  httpServer: http.Server;
  caches = new Map<string, MemoryCache>();

  private constructor(config: WikiService) {
    this.service = config;
    const _server = Express();
    this.server = _server;
    this.httpServer = http.createServer(_server);
  }

  /**
   * @method initialize
   * @description Creates a new instance of WikiAPI from a given service object
   */
  static async initialize(config: WikiService): Promise<WikiAPI> {
    return await new WikiAPI(config).init();
  }

  /**
   * @method init
   * @description Private method to initialize the API based on the service configuration
   */
  private async init(): Promise<WikiAPI> {
    if (!this.service.config || !this.service.config.api)
      throw new Error("Missing API configuration");
    await this.middleware();
    await this.setupAlternateRoutes();
    await this.endpoints();
    await this.startServer(
      this.service.config.api.port,
      this.service.config.api.name,
    );
    return this;
  }

  /**
   * @method middleware
   * @description Attaches essential middleware to the express server
   */
  private async middleware() {
    this.server.use(Express.json());
    this.server.use(Express.urlencoded({ extended: true }));
    this.server.use(helmet());
    this.server.set("json spaces", 2);
  }

  /**
   * @method endpoints
   * @description Extracts associated endpoints for the service and registers them to the Express server
   */
  private async endpoints() {
    if (this.service.config.api) {
      const endpoints = await this.getEndpoints();

      this.service.config = {
        ...this.service.config,
        api: {
          ...this.service.config.api,
          endpoints,
        },
      };

      /**
       * Setting the endpoint method handlers.
       * Adds logging & error handling to provided handler function.
       */
      for (const endpoint of endpoints) {
        this.server[endpoint.method](endpoint.route, async (req, res) => {
          const now = Date.now();
          const id = SystemUtilities.generateUUID(4);

          // Error placeholder.
          let errorThrown: APIError | null = null;

          // Emit request.
          WikiEvents.emit("api:request", this.parseRequest(req, id));

          // Emit response, when finished.
          res.on("finish", async () => {
            const duration = Date.now() - now;
            WikiEvents.emit(
              "api:response",
              this.parseResponse(res, id, duration, errorThrown),
            );
          });

          // Get the response.
          // Any errors thrown onwards will be caught in the try catch and immediately returned to client.
          try {
            const response = await this.grabResponse(req, res, endpoint);

            // Return the response.
            try {
              await this.returnResponse(req, res, response);
            } catch (error) {
              console.error(error);
              errorThrown = new APIError({
                name: "Internal Server Error",
                description: "Failed to process the request",
                fault: "server",
                severity: "high",
              });
              res.status(500).json(
                new APIJSONResponse({
                  success: false,
                  http_status_code: 500,
                  results: [],
                  error: errorThrown,
                }),
              );
            }
          } catch (error: any) {
            errorThrown = new APIError({
              fault: "server",
              name: "API Error",
              description: error?.message || "Something went wrong",
              severity: "high",
            });
            res.status(500).json(
              new APIJSONResponse({
                success: false,
                http_status_code: 500,
                results: [],
                error: errorThrown,
              }),
            );
          }
        });
      }
    }
  }

  /**
   * @method grabResponse
   * @description Returns the `result` value from the handler, or existing cache, based on the incoming request
   */
  private async grabResponse(
    req: Request,
    res: Response,
    endpoint: APIEndpoint,
  ): Promise<APIJSONResponse | APIFileResponse | APIRedirectResponse> {
    try {
      // Check cache and quick return, if required.
      if (endpoint.caching?.duration) {
        const entry = await WikiCache.get(this.service, req.originalUrl);
        if (
          entry &&
          (entry instanceof APIJSONResponse ||
            entry instanceof APIFileResponse ||
            entry instanceof APIRedirectResponse)
        ) {
          return entry;
        }
      }

      // Execute the handler.
      const result = await endpoint.handler(req, res);

      // Cache, if required.
      if (endpoint.caching?.duration) {
        // Regular JSON in-memory cache.
        if (result instanceof APIJSONResponse) {
          await WikiCache.set(
            this.service,
            req.originalUrl,
            result,
            endpoint.caching.duration,
          );
        }
        // If it's a file.
        if (result instanceof APIFileResponse) {
          // TODO
        }
      }

      return result;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to handle the request");
    }
  }

  /**
   * @method returnResponse
   * @description Given a `APIResponse` object, this method identifies the type (JSON/File/Redirect) and accordingly responds back to the client
   */
  private async returnResponse(
    req: Request,
    res: Response,
    response: APIJSONResponse | APIFileResponse | APIRedirectResponse,
  ): Promise<Express.Response | void> {
    try {
      if (response instanceof APIJSONResponse) {
        const jsonResponse = response;
        return res.status(jsonResponse.http_status_code).json({
          ...jsonResponse,
          results: this.filterObjectForCustomFields(req, jsonResponse.results),
        });
      } else if (response instanceof APIRedirectResponse) {
        const redirectResponse = response;
        // If rewrite is true, fetch the resource and pipe stream to response (maintaining the same URL)
        if (redirectResponse.rewrite) {
          try {
            const cdnResponse = await fetch(redirectResponse.url);

            if (!cdnResponse.ok) {
              throw new Error(`Error fetching resource: ${cdnResponse.statusText}`);
            }

            res.status(cdnResponse.status);

            cdnResponse.headers.forEach((value, key) => {
              res.setHeader(key, value);
            });

            const body = cdnResponse.body;
            if (body) {
              const reader = body.getReader();
              const stream = new Readable({
                read() {
                  reader.read().then(({ done, value }) => {
                    if (done) {
                      this.push(null);
                    } else {
                      this.push(value);
                    }
                  }).catch(err => this.destroy(err));
                }
              });

              // @ts-ignore
              stream.pipe(res);
            } else {
              const text = await cdnResponse.text();
              res.send(text);
            }
            return;
          } catch (err) {
            console.error(err);
          }
        }
        return res.status(301).redirect(redirectResponse.url);
      } else if (response instanceof APIFileResponse) {
        const fileResponse = response;

        res.setHeader(
          "Content-Disposition",
          `${req.query.dl === "true" ? "attachment" : fileResponse.forceDownload === true ? "attachment" : "inline"}; filename=${fileResponse.name}.${fileResponse.extension}`,
        );

        res.setHeader("Cache-Control", "public, max-age=3600");

        res.type(fileResponse.type);

        if (fileResponse.body instanceof Readable) {
          // @ts-ignore
          fileResponse.body.pipe(res);
        } else if (typeof fileResponse.body === "string") {
          res.status(200).send(response.body);
        } else {
          throw new Error(`Unsupported file type`);
        }
      } else {
        throw new Error(`Unable to classify response type`);
      }
    } catch (error: any) {
      throw new Error(error?.message || "Failed to process the request");
    }
  }

  /**
   * @method parseRequest
   * @description Returns a summary object of an incoming request
   */
  private parseRequest(req: Request, id: string): APIRequestEvent {
    return {
      id,
      method: req.method,
      route: req.originalUrl,
      host: req.hostname,
      ip: require("get-client-ip")(req) || "Unknown",
    };
  }

  /**
   * @method parseResponse
   * @description Returns a summary object of an outgoing request
   */
  private parseResponse(
    res: Response,
    id: string,
    duration: number,
    error: APIError | null,
  ): APIResponseEvent {
    return {
      id,
      statusCode: res.statusCode,
      ping: `${duration.toFixed(0)}ms`,
      error: error || null,
    };
  }

  /**
   * @method getEndpoints
   * @description Returns the associated endpoints for a given service
   */
  private async getEndpoints(): Promise<APIEndpoint[]> {
    return await SystemUtilities.cachedFunction(
      `${this.service.config.name}:endpoints`,
      "1m",
      async () => {
        if (!this.service.config.api?.endpoints)
          throw new Error(`Missing API configuration for service`);

        // Either infer from routes folder or use provided object.
        const endpoints =
          typeof this.service.config.api.endpoints === "string"
            ? await FileUtils.getDefaultExportsFromDirectory<APIEndpoint>(
              `/${this.service.config.name}/Routes`,
            )
            : this.service.config.api.endpoints;

        // Ensure broader / catch-all endpoints are lined up last as Express relies on this order to route requests.
        const highPriority: APIEndpoint[] = [];
        const lowPriority: APIEndpoint[] = [];
        for (const endpoint of endpoints) {
          if (endpoint.route.includes(":") || endpoint.route.includes("?")) {
            lowPriority.push(endpoint);
          } else {
            highPriority.push(endpoint);
          }
        }

        return [...highPriority, ...lowPriority];
      },
    );
  }

  /**
   * @method setupAlternateRoutes
   * @description Configures the express server to route all recognized alternative paths (provided in APIConfig) to the original path
   */
  private async setupAlternateRoutes() {
    const endpoints = await this.getEndpoints();
    for (const endpoint of endpoints) {
      for (const altRoute of endpoint.alternateRoutes || []) {
        this.server[endpoint.method](altRoute, (req, res) => {
          const queryString =
            req.originalUrl.split("?")?.length > 1
              ? req.originalUrl.split("?")[1]
              : "";
  
          const redirectUrl = `${endpoint.route}${queryString ? "?" + queryString : ""}`;
          
          res.status(301).redirect(redirectUrl);
        });
      }
    }
  }

  /**
   * @method filterObjectsForCustomFields
   * @description Returns a modified version of the results object if the request contains a `custom_fields` query to only return the properties requested
   */
  private filterObjectForCustomFields(req: Request, results: any): any {
    const customProperties =
      req.query.custom_fields?.toString()?.split(",") ||
      req.query.customFields?.toString()?.split(",") ||
      [];

    if (!customProperties || customProperties.length === 0) return results;

    if (Array.isArray(results)) {
      return results.map((item: any) => {
        const filteredObject: any = {};
        customProperties.forEach((prop: string) => {
          if (item.hasOwnProperty(prop)) filteredObject[prop] = item[prop];
        });
        return filteredObject;
      });
    } else {
      const filteredObject: any = {};
      customProperties.forEach((prop: string) => {
        if (results.hasOwnProperty(prop)) filteredObject[prop] = results[prop];
      });
      return filteredObject;
    }
  }

  /**
   * @method startServer
   * @description Starts the express server
   */
  private async startServer(port: number, identifier: string) {
    const host = HostAddress;

    this.httpServer.listen(port, host);

    const endpoints = await this.getEndpoints();
    WikiEvents.emit(
      "service:launch",
      `>   "${identifier}" LIVE (http://${host}:${port}) (${endpoints.map((i) => `${i.route}`).join(", ")})`,
    );

    this.httpServer.on("error", (err: NodeJS.ErrnoException) => {
      console.error(err);
      WikiEvents.emit("system:critical-error", `Port "${port}" not accessible`);
    });
  }
}
