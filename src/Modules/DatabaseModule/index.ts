import { FileUtils } from "../../Utilities/FileUtils";
import { WikiCache } from "../CachingModule";
import { WikiService } from "../WikiServiceModule";
import {
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from "@supabase/supabase-js";
import { DatabaseConfig } from "./Types/Database";
import { DataQuranItem } from "./Types/DataQuran";
import { DataMocMediaItem } from "./Types/DataMocMedia";
import { DataNewslettersItem } from "./Types/DataNewsletters";
import { SystemUtils } from "../../Utilities/SystemUtils";
import { WikiLog } from "../LogsModule";

export type WikiTablesTypesMap = {
  DataQuran: DataQuranItem[];
  DataMocMedia: DataMocMediaItem[];
  DataNewsletters: DataNewslettersItem[];
};

export type WikiTables = keyof WikiTablesTypesMap;

/**
 * @class WikiDatabase
 * @description Initializes local instances of databases associated with a particular service
 */
export class WikiDatabase {
  service: WikiService | null = null;
  supabaseClient: SupabaseClient | null = null;

  private constructor(service: WikiService) {
    this.service = service;
  }

  /**
   * @method initialize
   * @description Starts the initialization process for all databases tied to the service
   */
  static async initialize(service: WikiService): Promise<WikiDatabase | null> {
    return await new WikiDatabase(service).init();
  }

  /**
   * @method init
   * @description Performs initialization
   */
  private async init(): Promise<WikiDatabase | null> {
    if (!this.service) return null; // Assert access.

    // Initialize Supabase client.
    this.supabaseClient = await SystemUtils.getSupabaseClient();

    // Loop over every table.
    for (const table of this.service.config.databases || []) {
      WikiLog.system(`${table.tableName}...`);

      // Impose default sync options (memory cache, 30s refresh time)
      if (!table.sync) {
        table.sync = {
          method: "MEMORY",
          options: {
            waitMinutesBeforeOnChangeSync: 0.5,
          },
        };
      }

      // Create local copies & setup auto synchronization.
      await this.syncTable(table);
    }
    return this;
  }

  /**
   * @method getTable
   * @description Returns a recognized table with type enforcement
   */
  static async getTable<T extends WikiTables>(
    table: T,
  ): Promise<WikiTablesTypesMap[T]> {
    const cachedData =
      (await WikiCache.get("PublicCache", `table:${table}`)) || [];

    if (cachedData) {
      return cachedData as WikiTablesTypesMap[T];
    } else {
      throw new Error(`Data for table "${table}" not found in cache.`);
    }
  }

  /**
   * @method syncTable
   * @description Called during initialization, this method fetches the table and sets up auto synchronization by subscribing to any database changes
   */
  private async syncTable(table: DatabaseConfig) {
    if (!this.service || !this.supabaseClient) return; // Assert access.

    if (table.sync) {
      await this.fetchAndStoreTable(table);

      // Subscribe to future changes to keep the local version in sync.
      await this.subscribeToDataChanges(table, async () => {
        const cache = await WikiCache.getStore("PublicCache");

        // if `waitMinutesBeforeOnChangeSync` is provided, we schedule a data refresh after X minutes. This is useful if we may make MANY changes to the table during a short interval.
        if (table.sync?.options?.waitMinutesBeforeOnChangeSync) {
          // Check if sync scheduled.
          const syncScheduled =
            (await WikiCache.get("PublicCache", `syncScheduled:${table}`)) ===
            true;

          // It's not.
          if (!syncScheduled) {
            // Set now to lock in the next minute.
            await cache.set(`syncScheduled:${table}`, true);

            WikiLog.system(
              `>   "${table.tableName}" will be re-synced in ${table.sync.options.waitMinutesBeforeOnChangeSync} minute...`,
            );

            // Schedule data refresh for 1 minute from now.
            setTimeout(
              async () => {
                await this.fetchAndStoreTable(table, true);
                // Open up to further changes.
                await cache.set(`syncScheduled:${table}`, false);
              },
              table.sync.options.waitMinutesBeforeOnChangeSync * 60 * 1000,
            );
          }
        } else {
          // Immediately refresh the data.
          await this.fetchAndStoreTable(table, true);
        }
      });
    }
  }

  /**
   * @method fetchAndStoreTable
   * @description Helper function to do the actual fetching from Supabase and store in memory / file system based on the associated TableConfig
   */
  private async fetchAndStoreTable(table: DatabaseConfig, isRefresh?: boolean) {
    if (!this.supabaseClient || !this.service) return; // Assert access.

    if (table.sync) {
      try {
        const request = await this.supabaseClient
          .from(table.tableName)
          .select("*");

        if (request?.data && request.status === 200) {
          // In memory.
          if (table.sync.method === "MEMORY") {
            // Sort data if a integer property key is provided to sort by.
            if (table.sync?.options?.dataSortKey !== undefined) {
              request.data = request.data.sort((a: any, b: any) =>
                Number(
                  a[table.sync?.options?.dataSortKey || "index"] -
                    Number(b[table.sync?.options?.dataSortKey || "index"]),
                ),
              );
            }

            WikiCache.set(
              "PublicCache",
              `table:${table.tableName}`,
              request.data,
              "168h",
            );
            if (!isRefresh) {
              WikiLog.system(`>   "${table.tableName}" stored`);
            } else {
              WikiLog.system(`>   "${table.tableName}" refreshed`);
            }
          }

          // Or, in file system.
          else if (table.sync.method === "FILE-SYSTEM") {
            await FileUtils.createFile(
              `table-${table.tableName}.json`,
              JSON.stringify(request.data, null, 2),
            );
            if (!isRefresh) {
              WikiLog.system(`>   "${table.tableName}" stored in file system`);
            } else {
              WikiLog.system(
                `>   "${table.tableName}" refreshed in file system`,
              );
            }
          }
        } else {
          console.log(request);
          throw new Error(
            `Table "${table.tableName}" could not be synced - does it exist?`,
          );
        }
      } catch (error) {
        console.error(error);
        throw new Error();
      }
    }
  }

  /**
   * @method subscribeToDataChanges
   * @description Helper function to subscribe to changes for a certain table and perform a certain action
   */
  private async subscribeToDataChanges(
    table: DatabaseConfig,
    onChange: (
      payload: RealtimePostgresChangesPayload<{ [key: string]: any }>,
    ) => Promise<void>,
  ) {
    if (!this.supabaseClient) return; // Assert access.
    this.supabaseClient
      .channel(`changes:${table.tableName}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table.tableName,
        },
        async (payload) => {
          await onChange(payload);
        },
      )
      .subscribe();
    WikiLog.system(`>   "${table.tableName}" auto sync ON`);
  }
}
