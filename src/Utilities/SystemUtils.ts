import { v4 as uuidv4 } from "uuid";
import { PromiseWithChild, exec } from "child_process";
import { WikiEvents } from "../Modules/LogsModule";
import { EnvironmentVariables } from "../Vars/EnvironmentVariables";
import {
  DynamoDBClient,
  GetItemCommand,
  DynamoDBServiceException,
} from "@aws-sdk/client-dynamodb";
import { WikiCache } from "../Modules/CachingModule";
import util from "util";
import { TimeStrings } from "../Vars/TimeStrings";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { WikiDatabase } from "../Modules/DatabaseModule";

export class SystemUtilities {
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

  // To avoid having a long list of environment variables provided upfront, we will fetch it from a DynamoDB table when actually needed. Function is cached to avoid excess calls.
  static async getEnvFromAWS(secret: EnvironmentVariables): Promise<string> {
    return await SystemUtilities.cachedFunction(
      `cloudEnv:${secret}`,
      "5m",
      async () => {
        try {
          const data = await new DynamoDBClient({
            region: "us-west-2",
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY!,
              secretAccessKey: process.env.AWS_SECRET_KEY!,
            },
          }).send(
            new GetItemCommand({
              TableName: "wikisubmission-services-secrets",
              Key: {
                key: {
                  S: secret,
                },
              },
            }),
          );

          if (data && data.Item && data.Item.value?.S) {
            return `${data.Item.value.S}`;
          } else {
            throw new Error(`Could not find secret "${secret}" from AWS`);
          }
        } catch (error: any) {
          if (error instanceof DynamoDBServiceException) {
            throw new Error(
              `${error.$metadata.httpStatusCode} ${error.name} - ${error.message}`,
            );
          } else {
            throw new Error(
              `Error retrieving secret ${secret}: ${error?.message || "--"}`,
            );
          }
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
      SystemUtilities.timeToMs(duration),
    );
  }

  static async getSupabaseClient(): Promise<SupabaseClient> {
    return await SystemUtilities.cachedFunction(
      `SupabaseClient`,
      "30m",
      async () => {
        const url = await SystemUtilities.getEnvFromAWS("SUPABASE_URL");
        const key = await SystemUtilities.getEnvFromAWS("SUPABASE_API_KEY");
        return createClient(url, key);
      },
    );
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
