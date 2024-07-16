import { WikiTables } from "..";

export interface DatabaseConfig {
  tableName: WikiTables;
  sync?: {
    method: "MEMORY" | "FILE-SYSTEM";
    options?: {
      waitMinutesBeforeOnChangeSync?: number;
      dataSortKey?: string;
    };
  };
}
