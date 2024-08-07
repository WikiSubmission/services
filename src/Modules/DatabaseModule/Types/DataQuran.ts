export interface DataQuranItem {
  /** Verse identifiers */
  chapter_number: number;
  verse_number: number;
  verse_id: string;
  verse_id_arabic: string;
  verse_index: number;
  verse_index_numbered?: number | null;
  verse_index_initialed?: number | null;

  /** Verse subtitles */
  verse_subtitle_english?: string | null;
  verse_subtitle_turkish?: string | null;

  /** Verse text */
  verse_text_english: string;
  verse_text_arabic: string;
  verse_text_turkish: string;
  verse_text_persian: string;
  verse_text_russian: string;
  verse_text_swedish: string;
  verse_text_bahasa: string;
  verse_text_french: string;
  verse_text_arabic_clean: string;
  verse_text_arabic_transliteration: string;

  /** Verse footnotes */
  verse_footnote_english?: string | null;
  verse_footnote_turkish?: string | null;

  /** Chapter metrics */
  chapter_verses: number;
  chapter_revelation_order: number;
  chapter_initials: string;
  chapter_god_total: string;

  /** Chapter titles */
  chapter_title_english: string;
  chapter_title_arabic: string;
  chapter_title_turkish: string;
  chapter_title_persian: string;
  chapter_title_russian: string;
  chapter_title_swedish: string;
  chapter_title_bahasa: string;
  chapter_title_french: string;
  chapter_title_arabic_transliteration: string;

  /** Verse metrics */
  verse_word_count: number;
  verse_letter_count: number;
  verse_god_count: number;
  verse_gematrical_value: bigint;

  /** Verse recitation audios */
  verse_audio_arabic_mishary: string;
  verse_audio_arabic_basit: string;
  verse_audio_arabic_minshawi: string;

  /** Verse images */
  verse_raw_image_arabic: string;
}

export interface DataQuranLanguageSpecificStrings {
  english: string;
  arabic?: string;
  arabic_transliteration?: string;
  turkish?: string;
  french?: string;
  swedish?: string;
  russian?: string;
  persian?: string;
  bahasa?: string;
  arabic_clean?: string;
}

export interface DataQuranDiscordLanguageSpecificStrings {
  english: string;
  arabic: string;
  englishAndArabic: string;
  turkish: string;
  french: string;
  swedish: string;
  russian: string;
  persian: string;
  bahasa: string;
}

export type DataQuranLanguageSpecificStringsKeys =
  keyof DataQuranLanguageSpecificStrings;

export const DataQuranLanguageKeys: DataQuranLanguageSpecificStringsKeys[] = [
  "english",
  "arabic",
  "arabic_transliteration",
  "turkish",
  "french",
  "swedish",
  "russian",
  "persian",
  "bahasa",
  "arabic_clean",
];
