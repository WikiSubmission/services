import dotenv from "dotenv";
import { WikiLog } from "../Modules/LogsModule";

/**
 * @function loadEnvironment
 * @description Sets the environment variables. Only Supabase credentials are required upfront. All others are fetched on-demand.
 */
export async function loadEnvironment() {
  dotenv.config();
  if (process.env.SUPABASE_URL && process.env.SUPABASE_API_KEY) {
    WikiLog.system(
      `NODE_ENV: ${process.env.NODE_ENV || "development (default)"}`,
    );
    WikiLog.system(`Environment variables loaded\n`);
  } else {
    WikiLog.systemError(
      `Missing environment variables: SUPABASE_URL, SUPABASE_API_KEY`,
      "Entrypoint",
      true,
    );
  }
}
