import {
  DateString,
  HourString,
} from "../../../Services/PrayerTimes/Utilities/timesData";

export const DataPrayerTimesNames = {
  fajr: "fajr",
  dhuhr: "dhuhr",
  asr: "asr",
  maghrib: "maghrib",
  isha: "isha",
  sunrise: "sunrise",
};

export interface DataPrayerTimes {
  status_string: string;
  location_string: string;
  country: string;
  country_code: string;
  region: string;
  local_time: string;
  local_time_in_24h: string;
  local_timezone: string;
  local_timezone_id: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  times: {
    [T in keyof typeof DataPrayerTimesNames]: string;
  };
  times_in_24h: {
    [T in keyof typeof DataPrayerTimesNames]: string;
  };
  times_in_utc: {
    [T in keyof typeof DataPrayerTimesNames]: string;
  };
  times_left: {
    [T in keyof typeof DataPrayerTimesNames]: string;
  };
  current_prayer: string;
  current_prayer_time_elapsed: string;
  upcoming_prayer: string;
  upcoming_prayer_time_left: string;
  utc_offset_in_seconds: number;
  schedule?: Record<DateString, HourString[]>;
}

export interface DataPrayerTimesLocalResponseElement {
  place: {
    countryCode: string;
    country: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  times: Record<DateString, HourString[]>;
  /** example -->
   * "2023-09-23": [ "11:44", "13:16", "19:21", "22:44", "01:23", "02:55" ],
   * "...": [...],
   * "...": [...], ...
   */
}
