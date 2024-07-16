import { APIError } from "./APIError";

/** Incoming request details summary object */
export interface APIRequestEvent {
  id: string;
  method: string;
  route: string;
  host: string;
  ip: string;
}

/** Outgoing response details summary object */
export interface APIResponseEvent {
  id: string;
  statusCode: number;
  ping: string;
  error?: APIError | null;
}
