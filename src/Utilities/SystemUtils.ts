import { v4 as uuidv4 } from "uuid";
import { PromiseWithChild, exec } from "child_process";
import { WikiEvents } from "../Modules/LogsModule";
import { EnvironmentVariables } from "../Vars/EnvironmentVariables";
import { WikiCache } from "../Modules/CachingModule";
import { TimeStrings } from "../Vars/TimeStrings";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { S3Client } from "@aws-sdk/client-s3";
import util from "util";

export class SystemUtils {
  static getEnv(
    key: EnvironmentVariables,
    doNotCrashIfNotFound?: boolean,
  ): string | null {
    let result = process.env[key];
    if (!result && doNotCrashIfNotFound !== true) {
      WikiEvents.emit(
        "system:critical-error",
        `Failed to access environment variable "${key}"`,
      );
    }
    return result ? result : null;
  }

  static async getEnvFromSupabase(
    secret: EnvironmentVariables,
    throwErrorOnFail?: boolean,
  ): Promise<string> {
    return await SystemUtils.cachedFunction(
      `Env:${secret}`,
      "5m",
      async () => {
        try {
          const client = await this.getSupabaseClient();

          const request = await client
            .from("Secrets")
            .select("*")
            .eq("key", secret)
            .single();

          if (request && request.status === 200 && request.data?.value) {
            return request.data.value as string;
          } else {
            if (throwErrorOnFail) {
              throw new Error(`Failed to get environment variable: ${secret}`);
            } else {
              console.warn(`Failed to get environment variable: ${secret}`);
              return "";
            }
          }
        } catch (error: any) {
          throw new Error(`Supabase client error: ${error?.message || "--"}`);
        }
      },
    );
  }

  static async cachedFunction<T>(
    key: string,
    duration: TimeStrings,
    func: () => Promise<T>,
  ): Promise<T> {
    const memoryCache = await WikiCache.getStore("PublicCache");

    return await memoryCache.wrap(
      key,
      async () => {
        return await func();
      },
      SystemUtils.timeToMs(duration),
    );
  }

  static async getSupabaseClient(): Promise<SupabaseClient> {
    return await SystemUtils.cachedFunction(
      `SupabaseClient`,
      "30m",
      async () => {
        return createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_API_KEY!,
        );
      },
    );
  }

  static async getS3Client(): Promise<S3Client> {
    return await SystemUtils.cachedFunction(`S3Client`, "30m", async () => {
      const accessKeyId = await this.getEnvFromSupabase(
        "DIGITALOCEAN_SPACES_ACCESS_KEY_ID",
      );
      const secretAccessKey = await this.getEnvFromSupabase(
        "DIGITALOCEAN_SPACES_SECRET_ACCESS_KEY",
      );
      return new S3Client({
        endpoint: "https://sfo2.digitaloceanspaces.com",
        region: "sfo2",
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    });
  }

  static async stimulateDelay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static generateUUID(length: number = 6): string {
    const fullUUID = uuidv4();
    return fullUUID.split("-")[0].substring(0, length).toUpperCase();
  }

  static async executeProcess(script: string): Promise<
    PromiseWithChild<{
      stdout: string;
      stderr: string;
    }>
  > {
    const execPromise = util.promisify(exec);
    return await execPromise(script);
  }

  static getKeyAndExtension(fullKey: string | undefined): {
    key: string;
    extension: string;
  } {
    if (!fullKey) return { key: "", extension: "" };
    const query = this.getLastPathComponent(fullKey);
    const [a, b] = this.splitByLastDot(query);
    return {
      key: a,
      extension: b,
    };
  }

  static getLastPathComponent(url: string): string {
    if (typeof url !== "string" || url.length === 0) {
      return "";
    }

    const parts = url.split("/");

    if (parts.length === 0) {
      return "";
    }

    const lastPart = parts[parts.length - 1];

    return lastPart;
  }

  static splitByLastDot(str: string): [string, string] {
    const lastDotIndex = str.lastIndexOf(".");

    if (lastDotIndex === -1) {
      return [str, ""];
    }

    const prefix = str.substring(0, lastDotIndex);
    const suffix = str.substring(lastDotIndex + 1);

    return [prefix, suffix];
  }

  static getFileExtension(fileName: string): string {
    const dotIndex = fileName.lastIndexOf(".");

    if (dotIndex === -1 || dotIndex === fileName.length - 1) {
      return "";
    }

    const extension = fileName.slice(dotIndex + 1);

    return extension;
  }

  static areObjectsEqual(obj1: any, obj2: any): boolean {
    const filteredObj1 = Object.fromEntries(
      Object.entries(obj1).filter(
        ([_, value]) => value !== null && value !== undefined,
      ),
    );
    const filteredObj2 = Object.fromEntries(
      Object.entries(obj2).filter(
        ([_, value]) => value !== null && value !== undefined,
      ),
    );

    const keys1 = Object.keys(filteredObj1);
    const keys2 = Object.keys(filteredObj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (filteredObj1[key] !== filteredObj2[key]) return false;
    }

    return true;
  }

  static shortenString(str: string, maxLength = 99): string {
    return str.length > maxLength ? str.slice(0, maxLength - 3) + "..." : str;
  }

  static capitalize(input: string | undefined | null): string {
    if (!input) return "";
    if (input.length === 0) return "";
    return input.charAt(0).toUpperCase() + input.slice(1);
  }

  static timeToMs(time: string): number {
    const timePattern = /^(\d+)(s|m|h)$/;

    const match = time.match(timePattern);
    if (!match) {
      throw new Error("Invalid time format");
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value * 1000;
      case "m":
        return value * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      default:
        throw new Error("Unsupported time unit");
    }
  }
}
