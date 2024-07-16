import { APIEndpoint } from "./APIEndpoint";

/**
 * @interface APIConfig
 * Complete API configuration set to specify in WikiService object
 */
export interface APIConfig {
  name: string;
  description: string;
  port: number;
  endpoints: APIEndpoint[] | "INFER";
}
