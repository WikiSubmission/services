import {
  ActionRowBuilder,
  ButtonBuilder,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";
import {
  DataQuranDiscordLanguageSpecificStrings,
  DataQuranItem,
} from "../../DatabaseModule/Types/DataQuran";
import { NetworkUtilities } from "../../../Utilities/NetworkUtilities";
import { HostAddress } from "../../../Vars/Host";
import { Ports } from "../../../Vars/Ports";
import { SystemUtilities } from "../../../Utilities/SystemUtils";
import { DataMocMediaItem } from "../../DatabaseModule/Types/DataMocMedia";
import { DataNewslettersItem } from "../../DatabaseModule/Types/DataNewsletters";
import { DiscordCachedInteraction } from "../Types/DiscordCachedInteraction";
import { WikiEvents } from "../../LogsModule";

export class DiscordRequest {
  interaction: CommandInteraction | DiscordCachedInteraction;
  page: number;

  constructor(
    interaction: CommandInteraction | DiscordCachedInteraction,
    page?: number,
  ) {
    this.interaction = interaction;
    this.page = page || 1;
  }

  getStringInput(queryKey = "query"): string | null {
    const q =
      this.interaction instanceof DiscordCachedInteraction
        ? this.interaction.getStringOption(queryKey)
        : this.interaction.options?.get(queryKey)?.value?.toString();

    return q || null;
  }

  targetLanguage(): keyof DataQuranDiscordLanguageSpecificStrings {
    if (this.getStringInput("language")) {
      const forceLanguage = this.getStringInput("language");

      switch (forceLanguage) {
        case "english":
          return "english";
        case "arabic":
          return "arabic";
        case "bahasa":
          return "bahasa";
        case "russian":
          return "russian";
        case "persian":
          return "persian";
        case "swedish":
          return "swedish";
        case "turkish":
          return "turkish";
        case "french":
          return "french";
        default:
          return "english";
      }
    }

    switch (this.interaction.commandName) {
      case "quran":
        return "english";
      case "aquran":
        return "arabic";
      case "equran":
        return "englishAndArabic";
      case "bquran":
        return "bahasa";
      case "rquran":
        return "russian";
      case "pquran":
        return "persian";
      case "squran":
        return "swedish";
      case "tquran":
        return "turkish";
      case "fquran":
        return "french";
      default:
        return "english";
    }
  }

  _safeMarkdown(s?: string | null): string {
    if (!s) return s || "";
    if (this.interaction.commandName.startsWith("search")) {
      return s;
    } else return s.replace(/(?<!\*)\*{1,2}(?!\*)/g, "±") ?? "";
  }

  _codify(s?: string | null, dismiss?: boolean): string {
    if (!s) return "";
    if (dismiss) return s;
    return `\`${s}\``;
  }

  _splitToChunks(inputString: string, maxChunkLength: number = 3000): string[] {
    const chunks: string[] = [];
    let currentChunk = "";

    const lines = inputString.split("\n");

    for (const line of lines) {
      const currentChunkLength = currentChunk.length + line.length + 1;

      if (currentChunkLength > maxChunkLength) {
        chunks.push(currentChunk.trim());
        currentChunk = line.trim();
      } else {
        currentChunk += "\n" + line;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}

export class DiscordQuranRequest extends DiscordRequest {
  constructor(
    interaction: CommandInteraction | DiscordCachedInteraction,
    page?: number,
  ) {
    super(interaction);
  }

  async verseRequest() {
    if (!(this.interaction instanceof DiscordCachedInteraction)) {
      try {
        const { embeds, components } = await this.resolveVerseRequest();
        await this.interaction.reply({
          embeds,
          components,
        });
      } catch (error: any) {
        await this.interaction.reply({
          content: `\`${error.message || "Error"}\``,
          ephemeral: true,
        });
        WikiEvents.emit("discord:error", error);
      }
    }
  }

  async searchRequest() {
    if (!(this.interaction instanceof DiscordCachedInteraction)) {
      try {
        const { content, embeds, components } =
          await this.resolveSearchRequest();
        await this.interaction.reply({
          content,
          embeds,
          components,
        });
      } catch (error: any) {
        await this.interaction.reply({
          content: `\`${error.message || "Error"}\``,
          ephemeral: true,
        });
        WikiEvents.emit("discord:error", error);
      }
    }
  }

  async resolveVerseRequest(): Promise<{
    embeds: EmbedBuilder[];
    components: ActionRowBuilder<any>[];
  }> {
    const query =
      this.getStringInput("verse") || this.getStringInput("chapter");

    if (!query) {
      throw new Error(`Missing query`);
    }

    const request = await NetworkUtilities.GET_INTERNAL<DataQuranItem[]>(
      `http://${HostAddress}:${Ports.QuranAPI}`,
      `/quran/${query}`,
      {
        backupEndpoint: "https://api.wikisubmission.org",
      },
    );

    if (request?.results && !request.error) {
      const title = this.title(request.results);
      const description = this.description(request.results);
      const footer = this.footer();

      if (description.length < this.page || this.page > description.length) {
        throw new Error(`Page "${this.page}" does not exist`);
      }

      if (description.length > 1) {
        const db = await SystemUtilities.getSupabaseClient();

        await db.from("GlobalCache").insert({
          key: this.interaction.id,
          value: JSON.stringify(new DiscordCachedInteraction(this.interaction)),
        });
      }

      return {
        embeds: [
          new EmbedBuilder()
            .setTitle(title)
            .setDescription(description[this.page - 1])
            .setFooter({
              text: `${footer}${description.length > 1 ? ` • Page 1/${description.length}` : ``}`,
            })
            .setColor("DarkButNotBlack"),
        ],
        components:
          description.length > 1
            ? [
                new ActionRowBuilder<any>().setComponents(
                  new ButtonBuilder()
                    .setLabel("Next page")
                    .setCustomId(
                      `page:next*${this.page + 1}/${description.length}`,
                    )
                    .setStyle(1),

                  ...(this.page > 1
                    ? [
                        new ButtonBuilder()
                          .setLabel("Previous Page")
                          .setCustomId(
                            `page:previous*${this.page - 1}/${description.length}`,
                          )
                          .setStyle(2),
                      ]
                    : []),
                ),
              ]
            : [],
      };
    } else {
      throw new Error(
        `${request?.error?.description || `Verse "${query}" not found`}`,
      );
    }
  }

  async resolveSearchRequest(): Promise<{
    content: string | undefined;
    embeds: EmbedBuilder[];
    components: ActionRowBuilder<any>[];
  }> {
    const query = this.getStringInput("query");

    console.log(`Going to use index description at #: ${this.page - 1}`);

    if (!query) {
      throw new Error(`Missing query`);
    }

    const request = await NetworkUtilities.GET_INTERNAL<DataQuranItem[]>(
      `http://${HostAddress}:${Ports.QuranAPI}`,
      `/quran/search?q=${query}&highlight=true&ignore_word_order=true`,
      {
        backupEndpoint: "https://api.wikisubmission.org",
      },
    );

    if (request?.results && !request.error) {
      const title = `${query} – Quran Search`;
      const description = this.description(request.results);
      const footer = this.footer();

      if (description.length > 1) {
        const db = await SystemUtilities.getSupabaseClient();

        await db.from("GlobalCache").insert({
          key: this.interaction.id,
          value: JSON.stringify(new DiscordCachedInteraction(this.interaction)),
        });
      }

      return {
        content: `Found **${request.results.length}** verses with \`${query}\``,
        embeds: [
          new EmbedBuilder()
            .setTitle(title)
            .setDescription(description[this.page - 1])
            .setFooter({
              text: `${footer}${description.length > 1 ? ` • Page 1/${description.length}` : ``}`,
            })
            .setColor("DarkButNotBlack"),
        ],
        components:
          description.length > 1
            ? [
                new ActionRowBuilder<any>().setComponents(
                  new ButtonBuilder()
                    .setLabel("Next page")
                    .setCustomId(
                      `page:next*${this.page + 1}/${description.length}`,
                    )
                    .setStyle(1),

                  ...(this.page > 1
                    ? [
                        new ButtonBuilder()
                          .setLabel("Previous Page")
                          .setCustomId(
                            `page:previous*${this.page - 1}/${description.length}`,
                          )
                          .setStyle(2),
                      ]
                    : []),
                ),
              ]
            : [],
      };
    } else {
      throw new Error(
        `${request?.error?.description || `No verses with "${query}" found`}`,
      );
    }
  }

  private title(data: DataQuranItem[]): string {
    const language = this.targetLanguage();
    if (!data || data.length === 0) return "--";

    if (this.interaction.commandName.startsWith("search")) {
      return `${this.getStringInput("query") || "*"} - Quran Search`;
    } else {
      const baseChapter = data[0].chapter_number;
      for (const verse of data) {
        if (verse.chapter_number !== baseChapter) return "Multiple Chapters";
      }
      return `Sura ${data[0].chapter_number}, ${data[0][_resolveLanguageToChapterKey()]} (${data[0].chapter_title_arabic_transliteration})`;
    }

    function _resolveLanguageToChapterKey(): keyof DataQuranItem {
      switch (language) {
        case "englishAndArabic":
          return "chapter_title_english";
        default:
          return `chapter_title_${language}`;
      }
    }
  }

  private description(data: DataQuranItem[]): string[] {
    const noCommentary = this.getStringInput("ignore-commentary") === "yes";
    const arabic = this.getStringInput("with-arabic") === "yes";
    const transliteration =
      this.getStringInput("with-transliteration") === "yes";

    let description = "";

    let [iteration, maxVerses, reachedLimit] = [0, 300, false];

    for (const i of data || []) {
      if (iteration < maxVerses) {
        if (!noCommentary && i.verse_subtitle_english) {
          description += this.descriptionSubtitleComponent(i);
        }

        if (this.interaction.commandName !== "aquran") {
          description += this.descriptionTextComponent(i);
          if (this.interaction.guildId === "911268076933230662") {
            description.replace(/GOD/g, "God");
          }
        }

        if (
          arabic ||
          this.interaction.commandName === "equran" ||
          this.interaction.commandName === "aquran"
        ) {
          description += `(${i.verse_id_arabic}) ${i.verse_text_arabic}\n\n`;
        }

        if (transliteration) {
          description += `${i.verse_text_arabic_transliteration}\n\n`;
        }

        if (!noCommentary) {
          description += this.descriptionFootnoteComponent(i);
        }
      } else {
        if (!reachedLimit) {
          description += `----- You have reached the maximum verse limit per single request (300) -----`;
          reachedLimit = true;
        }
      }
      iteration++;
    }

    return this._splitToChunks(description);
  }

  private footer() {
    switch (this.interaction.commandName) {
      case "quran":
        return "Quran: The Final Testament";
      case "aquran":
        return "Quran: The Final Testament";
      case "equran":
        return "Quran: The Final Testament";
      case "bquran":
        return "Quran: The Final Testament • Bahasa";
      case "rquran":
        return "Коран: Последний Завет • Russian";
      case "pquran":
        return "Quran: The Final Testament • Persian";
      case "squran":
        return "Koranen: Det Sista Testamentet • Swedish";
      case "tquran":
        return "Kuran: Son Ahit • Turkish";
      case "fquran":
        return "Quran: Le Testament Final • French";
      default:
        return "Quran: The Final Testament";
    }
  }

  private descriptionSubtitleComponent(i: DataQuranItem) {
    const language = this.targetLanguage();

    if (!i.verse_subtitle_english || !i.verse_subtitle_turkish) return "";

    switch (language) {
      case "english":
        return this._safeMarkdown(
          `${this._codify(i.verse_subtitle_english, this.interaction.commandName === "search-quran")}\n\n`,
        );
      case "turkish":
        return this._safeMarkdown(
          `${this._codify(i.verse_subtitle_turkish, this.interaction.commandName === "search-quran")}\n\n`,
        );
      default:
        return this._safeMarkdown(
          `${this._codify(i.verse_subtitle_english, this.interaction.commandName === "search-quran")}\n\n`,
        );
    }
  }

  private descriptionTextComponent(i: DataQuranItem) {
    let descriptionKey: keyof DataQuranItem = "verse_text_english";

    switch (this.targetLanguage()) {
      case "english":
        descriptionKey = `verse_text_english`;
        break;
      case "turkish":
        descriptionKey = `verse_text_turkish`;
        break;
      case "arabic":
        descriptionKey = `verse_text_arabic`;
        break;
      case "bahasa":
        descriptionKey = `verse_text_bahasa`;
        break;
      case "french":
        descriptionKey = `verse_text_french`;
        break;
      case "persian":
        descriptionKey = `verse_text_persian`;
        break;
      case "russian":
        descriptionKey = `verse_text_russian`;
        break;
      case "swedish":
        descriptionKey = `verse_text_swedish`;
        break;
      default:
        descriptionKey = `verse_text_english`;
        break;
    }

    return (
      `**[${this.descriptionTextVerseIdComponent(i)}]** ` +
      this._safeMarkdown(`${i[descriptionKey]}\n\n`)
    );
  }

  private descriptionTextVerseIdComponent(i: DataQuranItem) {
    {
      switch (this.targetLanguage()) {
        case "arabic":
          return i.verse_id_arabic;

        case "persian":
          return i.verse_id_arabic;

        default:
          return i.verse_id;
      }
    }
  }

  private descriptionFootnoteComponent(i: DataQuranItem) {
    if (!i.verse_footnote_english || !i.verse_footnote_turkish) return "";

    switch (this.targetLanguage()) {
      case "english":
        return (
          "*" + this._safeMarkdown(`${i.verse_footnote_english}\``) + "*\n\n"
        );
      case "turkish":
        return (
          "*" + this._safeMarkdown(`*${i.verse_footnote_turkish}\`*`) + "*\n\n"
        );
      default:
        return (
          "*" + this._safeMarkdown(`*${i.verse_footnote_english}*`) + "*\n\n"
        );
    }
  }
}

export class DiscordMediaRequest extends DiscordRequest {
  constructor(interaction: CommandInteraction | DiscordCachedInteraction) {
    super(interaction);
  }

  async resolveSearchRequest(): Promise<{
    content: string | undefined;
    embeds: EmbedBuilder[];
    components: ActionRowBuilder<any>[];
  }> {
    const query = this.getStringInput("query");

    if (!query) {
      throw new Error(`Missing query`);
    }

    const request = await NetworkUtilities.GET_INTERNAL<DataMocMediaItem[]>(
      `http://${HostAddress}:${Ports.QuranAPI}`,
      `/moc/media/search?q=${query}&highlight=true&ignore_word_order=true`,
      {
        backupEndpoint: "https://api.wikisubmission.org",
      },
    );

    if (request?.results && !request.error) {
      const title = `${query} - Media Search`;
      const description = this._splitToChunks(
        request.results
          .map((i) => `${i.media_markdown || "*"} - ${i.media_transcript}`)
          .join("\n\n"),
      );
      const footer =
        "Media • Search 🔎 • Disclaimer: Verify all information. Transcripts are AI generated.";

      if (description.length > 1) {
        const db = await SystemUtilities.getSupabaseClient();

        await db.from("GlobalCache").insert({
          key: this.interaction.id,
          value: JSON.stringify(new DiscordCachedInteraction(this.interaction)),
        });
      }

      return {
        content: `Found **${request.results.length}** media instances with \`${query}\``,
        embeds: [
          new EmbedBuilder()
            .setTitle(title)
            .setDescription(description[0])
            .setFooter({
              text: `${footer}${description.length > 1 ? ` • Page 1/${description.length}` : ``}`,
            })
            .setColor("DarkButNotBlack"),
        ],
        components:
          description.length > 1
            ? [
                new ActionRowBuilder<any>().setComponents(
                  new ButtonBuilder()
                    .setLabel("Next page")
                    .setCustomId(`page:next*1/${description.length}`)
                    .setStyle(1),

                  ...(this.page > 1
                    ? [
                        new ButtonBuilder()
                          .setLabel("Previous Page")
                          .setCustomId(
                            `page:previous*${this.page - 1}/${description.length}`,
                          )
                          .setStyle(2),
                      ]
                    : []),
                ),
              ]
            : [],
      };
    } else {
      throw new Error(
        `${request?.error?.description || `No media instances with "${query}" found`}`,
      );
    }
  }

  async searchRequest() {
    if (!(this.interaction instanceof DiscordCachedInteraction)) {
      try {
        const { content, embeds, components } =
          await this.resolveSearchRequest();
        await this.interaction.reply({
          content,
          embeds,
          components,
        });
      } catch (error: any) {
        await this.interaction.reply({
          content: `\`${error.message || "Error"}\``,
          ephemeral: true,
        });
        WikiEvents.emit("discord:error", error);
      }
    }
  }
}

export class DiscordNewsletterRequest extends DiscordRequest {
  constructor(interaction: CommandInteraction | DiscordCachedInteraction) {
    super(interaction);
  }

  async resolveSearchRequest(): Promise<{
    content: string | undefined;
    embeds: EmbedBuilder[];
    components: ActionRowBuilder<any>[];
  }> {
    const query = this.getStringInput("query");

    if (!query) {
      throw new Error(`Missing query`);
    }

    const request = await NetworkUtilities.GET_INTERNAL<DataNewslettersItem[]>(
      `http://${HostAddress}:${Ports.QuranAPI}`,
      `/moc/newsletters/search?q=${query}&highlight=true&ignore_word_order=true`,
      {
        backupEndpoint: "https://api.wikisubmission.org",
      },
    );

    if (request?.results && !request.error) {
      const title = `${query} - Media Search`;
      const description = this._splitToChunks(
        request.results
          .map(
            (i) =>
              `[${i.sp_year} ${i.sp_month}, pg ${i.sp_page}](https://www.masjidtucson.org/publications/books/sp/${i.sp_year}/${i.sp_month}/page${i.sp_page}.html) - ${i.sp_content}`,
          )
          .join("\n\n"),
      );
      const footer = "Newsletters • Search 🔎";

      if (description.length > 1) {
        const db = await SystemUtilities.getSupabaseClient();

        await db.from("GlobalCache").insert({
          key: this.interaction.id,
          value: JSON.stringify(new DiscordCachedInteraction(this.interaction)),
        });
      }

      return {
        content: `Found **${request.results.length}** newsletter instances with \`${query}\``,
        embeds: [
          new EmbedBuilder()
            .setTitle(title)
            .setDescription(description[0])
            .setFooter({
              text: `${footer}${description.length > 1 ? ` • Page 1/${description.length}` : ``}`,
            })
            .setColor("DarkButNotBlack"),
        ],
        components:
          description.length > 1
            ? [
                new ActionRowBuilder<any>().setComponents(
                  new ButtonBuilder()
                    .setLabel("Next page")
                    .setCustomId(`page:next*1/${description.length}`)
                    .setStyle(1),

                  ...(this.page > 1
                    ? [
                        new ButtonBuilder()
                          .setLabel("Previous Page")
                          .setCustomId(
                            `page:previous*${this.page - 1}/${description.length}`,
                          )
                          .setStyle(2),
                      ]
                    : []),
                ),
              ]
            : [],
      };
    } else {
      throw new Error(
        `${request?.error?.description || `No newsletter instances with "${query}" found`}`,
      );
    }
  }

  async searchRequest() {
    if (!(this.interaction instanceof DiscordCachedInteraction)) {
      try {
        const { content, embeds, components } =
          await this.resolveSearchRequest();
        await this.interaction.reply({
          content,
          embeds,
          components,
        });
      } catch (error: any) {
        await this.interaction.reply({
          content: `\`${error.message || "Error"}\``,
          ephemeral: true,
        });
        WikiEvents.emit("discord:error", error);
      }
    }
  }
}
