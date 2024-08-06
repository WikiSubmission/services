import Bottleneck from "bottleneck";
import { WikiCache } from "../Modules/CachingModule";
import { TimeStrings } from "../Vars/TimeStrings";
import { APIJSONResponse } from "../Modules/APIModule/Types/APIResponse";

interface RequestOptions {
  headers?: { [key: string]: string };
  backupEndpoint?: string;
  cacheResult?: { duration: TimeStrings };
  rateLimit?: {
    maxRequestsPerSecond: number;
  };
}

export class NetworkUtils {
  static async GET<T>(
    baseEndpoint: string,
    path: string,
    options?: RequestOptions,
  ): Promise<T | null> {
    return this.request<T>("GET", baseEndpoint, path, undefined, options);
  }

  static async GET_INTERNAL<T>(
    baseEndpoint: string,
    path: string,
    options?: RequestOptions,
  ): Promise<APIJSONResponse<T> | null> {
    return this.request<APIJSONResponse<T>>(
      "GET",
      baseEndpoint,
      path,
      undefined,
      options,
      true
    );
  }

  private static async request<T>(
    method: string,
    baseEndpoint: string,
    path: string,
    body?: Object,
    options?: RequestOptions,
    isInternal?: boolean
  ): Promise<T | null> {
    const requestURL = `${baseEndpoint}${path}`;

    let limiter: Bottleneck | null = null;
    if (options?.rateLimit) {
      limiter = new Bottleneck({
        maxConcurrent: 1,
        minTime: 1000 / options.rateLimit.maxRequestsPerSecond,
      });
    }

    try {
      if (options?.cacheResult) {
        const cachedResponse = await this.getCachedResult<T>(requestURL);
        if (cachedResponse) {
          return cachedResponse as T;
        }
      }

      const fetchFunction = async () =>
        await this.__fetch<T>(method, requestURL, body, options?.headers);
      const data = limiter
        ? await limiter.schedule(fetchFunction)
        : await fetchFunction();

      if (options?.cacheResult) {
        this.setCachedResult(requestURL, data, options?.cacheResult.duration);
      }

      return data;
    } catch (error: any) {
      if (options?.backupEndpoint) {
        console.warn(
          `Main endpoint "${requestURL}" failed ("${error?.message || "--"}") --> attempting with backup URL "${options.backupEndpoint}"`,
        );
        try {
          const backupURL = `${options.backupEndpoint}${path}`;
          const fetchFunction = async () =>
            await this.__fetch<T>(method, backupURL, body, options?.headers, isInternal);
          const data = limiter
            ? await limiter.schedule(fetchFunction)
            : await fetchFunction();

          if (options?.cacheResult) {
            this.setCachedResult(
              backupURL,
              data,
              options?.cacheResult.duration,
            );
          }

          return data;
        } catch (backupError: any) {
          console.error(
            `Backup endpoint failed ("${backupError?.message}")`,
            backupError?.message || "--",
          );
          return isInternal ? backupError : null;
        }
      } else {
        console.error(`Network Error -->`, error);
        return isInternal ? error : null;
      }
    }
  }

  private static async __fetch<T>(
    method: string,
    url: string,
    body?: { [string: string]: any },
    headers?: { [key: string]: string },
    isInternal?: boolean
  ): Promise<T> {
    headers = { "Content-Type": "application/json", ...headers };

    const request = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!request.ok && !isInternal) {
      throw new Error(
        `Request (${method} "${url}") failed with status ${request.status}${request.statusText ? ` ${request.statusText}` : ""}`,
      );
    }

    const data = (await request.json()) as T;
    return data;
  }

  private static async getCachedResult<T>(key: string): Promise<T | null> {
    return await WikiCache.get<T>("PublicCache", key);
  }

  private static async setCachedResult(
    key: string,
    data: any,
    duration?: TimeStrings,
  ): Promise<void> {
    await WikiCache.set("PublicCache", key, data, duration ? duration : "5s");
  }
}
