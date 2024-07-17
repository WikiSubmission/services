import { APIError } from "./APIError";

/**
 * @interface APIJSONResponseParams
 * A basic JSON response structure which all outgoing responses must conform to
 */
export interface APIJSONResponseParams<T> {
  success: boolean;
  http_status_code: number;
  results?: T;
  error?: APIError;
  metadata?:
    | { [key: string]: string | number }
    | { [key: string]: string | number }[];
}

/**
 * @interface APIFileResponseParams
 * An internal file information object which file endpoints must return for the API module to process and send over to the client
 */
export interface APIFileResponseParams {
  name: string;
  type: string;
  body: any;
  extension: string;
  size: number;
  forceDownload?: boolean;
}

/**
 * @interface APIRedirectResponseParams
 * An internal redirect object which redirect endpoints must return for the API module to redirect the client to
 */
export interface APIRedirectResponseParams {
  url: string;
}

/**
 * @class APIJSONResponse
 * Initializer class for a JSON response
 */
export class APIJSONResponse<T = any> implements APIJSONResponseParams<T> {
  success: boolean;
  http_status_code: number;
  results?: T | undefined;
  error?: APIError | undefined;
  metadata?:
    | { [key: string]: string | number }
    | { [key: string]: string | number }[]
    | undefined;

  constructor(data: APIJSONResponseParams<T>) {
    this.success = data.success;
    this.http_status_code = data.http_status_code;
    this.results = data.results;
    this.error = data.error;
    this.metadata = {
      timestamp: Date.now(),
    };
  }
}

/**
 * @class APIFileResponse
 * Initializer class for a file response
 */
export class APIFileResponse implements APIFileResponseParams {
  name: string;
  type: string;
  body: any;
  extension: string;
  size: number;
  forceDownload?: boolean;

  constructor(data: APIFileResponseParams) {
    this.name = data.name;
    this.type = data.type;
    this.body = data.body;
    this.extension = data.extension;
    this.size = data.size;
    this.forceDownload = data.forceDownload;
  }
}

/**
 * @class APIRedirectResponse
 * Initializer class for a redirect response
 */
export class APIRedirectResponse implements APIRedirectResponseParams {
  url: string;

  constructor(data: APIRedirectResponseParams) {
    this.url = data.url;
  }
}
