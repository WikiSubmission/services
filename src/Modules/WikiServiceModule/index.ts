import { WikiAPI } from "../APIModule";
import { APIConfig } from "../APIModule/Types/APIConfig";
import { WikiDatabase } from "../DatabaseModule";
import { DatabaseConfig } from "../DatabaseModule/Types/Database";
import { WikiLibrary, LibraryConfig } from "../LibraryModule";
import { WikiLog } from "../LogsModule";

export interface ServiceConfig {
  // NOTE: `name` must be the same as the folder name created for the service.
  name: string;
  api?: APIConfig;
  databases?: DatabaseConfig[];
  library?: LibraryConfig;
  customService?: () => Promise<void>;
}

export class WikiService {
  config: ServiceConfig;

  private constructor(config: WikiService["config"]) {
    this.config = config;
  }

  static async create(config: WikiService["config"]): Promise<WikiService> {
    return await new WikiService(config).init();
  }

  private async init(): Promise<WikiService> {
    if (this.config.name === "_system") return this;

    WikiLog.system(`[Service: ${this.config.name}]`);

    await this.databases();

    await this.apis();

    await this.libraries();

    await this.customService();

    if (
      !this.config.api &&
      !this.config.databases &&
      !this.config.library &&
      !this.customService
    ) {
      WikiLog.system("Nothing to launch...");
    }

    return this;
  }

  private async databases() {
    if (this.config.databases) {
      WikiLog.system(`Setting up databases`);

      await WikiDatabase.initialize(this);
    }
  }

  private async apis() {
    if (this.config.api) {
      WikiLog.system(`Setting up API`);

      await WikiAPI.initialize(this);
    }
  }

  private async libraries() {
    if (this.config.library) {
      WikiLog.system(`Setting up library`);

      await WikiLibrary.initialize(this);
    }
  }

  private async customService() {
    if (this.config.customService) {
      WikiLog.system(`Setting up custom service`);
      await this.config.customService();
    }
  }
}
