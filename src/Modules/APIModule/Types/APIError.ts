/**
 * @interface APIError
 * @description Basic error object structure for bad requests
 */
export interface APIError {
  name: string;
  description: string;
  fault?: "client" | "server";
  severity?: "low" | "medium" | "high";
}

/**
 * @class APIError
 * @description Initializer class for APIError
 */
export class APIError implements APIError {
  name: string;
  description: string;
  fault?: "client" | "server" = "client";
  severity?: "low" | "medium" | "high" = "low";

  constructor(errorData: APIError) {
    this.fault = errorData.fault;
    this.name = errorData.name;
    this.description = errorData.description;
    this.severity = errorData.severity;
  }
}
