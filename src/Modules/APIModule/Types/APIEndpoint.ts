import { Request, Response } from "express";
import {
  APIFileResponse,
  APIJSONResponse,
  APIRedirectResponse,
} from "./APIResponse";
import { TimeStrings } from "../../../Vars/TimeStrings";

/**
 * @interface APIEndpoint
 * Endpoint definition structure
 */
export interface APIEndpoint {
  route: `/${string}` | `*${string}`;
  method: "get" | "post" | "put" | "patch";
  handler: (
    req: Request,
    res: Response,
  ) => Promise<APIJSONResponse | APIFileResponse | APIRedirectResponse>;
  alternateRoutes?: `/${string}`[];
  caching?: {
    duration: TimeStrings;
  };
}
