export interface DataMocMediaItem {
  media_index: number;
  media_youtube_title: string;
  media_type: string;
  media_version: string;
  media_episode: number;
  media_start_timestamp: string;
  media_end_timestamp: string;
  media_start_seconds: number;
  media_end_seconds: number;
  media_length: number;
  media_youtube_id: string;
  media_youtube_timestamp: string;
  media_youtube_thumbnail: string;
  media_transcript: string;
  media_markdown?: string | null;
  media_title?: string | null;
}
