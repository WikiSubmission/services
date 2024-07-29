import dotenv from "dotenv";
import { WikiEvents } from "../Modules/LogsModule";

/**
 * @function loadEnvironment
 * @description Sets the environment variables. Only Supabase credentials are required upfront. All others are fetched on-demand.
 */
export async function loadEnvironment() {
  dotenv.config();
  if (process.env.SUPABASE_URL && process.env.SUPABASE_API_KEY) {
    WikiEvents.emit("system:launch", `NODE_ENV: ${process.env.NODE_ENV || "development (default)"}`);
    WikiEvents.emit("system:launch", `Environment variables loaded\n`);
  } else {
    throw new Error(
      `Missing environment variables: SUPABASE_URL, SUPABASE_API_KEY`,
    );
  }
}
