import { MemoryCache, caching } from "cache-manager";
import { WikiService } from "../WikiServiceModule";
import { TimeStrings } from "../../Vars/TimeStrings";
import { SystemUtils } from "../../Utilities/SystemUtils";

const WikiMemoryCaches = new Map<string, MemoryCache>();

export class WikiCache {
  private static async create(
    service: WikiService,
    maxItems?: number,
  ): Promise<MemoryCache> {
    const cache = await caching("memory", {
      max: maxItems || 64000,
      ttl: 72 * 60 * 60 * 1000,
    });
    WikiMemoryCaches.set(service.config.name, cache);
    return cache;
  }

  static async getStore(
    service: WikiService | "PublicCache",
  ): Promise<MemoryCache> {
    if (service instanceof WikiService) {
      if (WikiMemoryCaches.has(service.config.name)) {
        return WikiMemoryCaches.get(service.config.name)!;
      } else {
        return await this.create(service);
      }
    } else {
      if (WikiMemoryCaches.has("_system")) {
        return WikiMemoryCaches.get("_system")!;
      } else {
        return await this.create(await WikiService.create({ name: "_system" }));
      }
    }
  }

  static async get<T>(
    service: WikiService | "PublicCache",
    key: string,
  ): Promise<T | null> {
    const store = await this.getStore(service);
    return (await store.get<T>(key)) || null;
  }

  static async set<T>(
    service: WikiService | "PublicCache",
    key: string,
    data: T,
    ttl: TimeStrings,
  ): Promise<void> {
    const store = await this.getStore(service);
    return await store.set(key, data, SystemUtils.timeToMs(ttl));
  }

  static async delete(
    service: WikiService | "PublicCache",
    key: string,
  ): Promise<void> {
    const store = await this.getStore(service);
    await store.del(key);
  }
}
