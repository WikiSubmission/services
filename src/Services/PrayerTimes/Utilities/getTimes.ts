import { HourString, TimesData } from "./timesData";
import Coordinates from "./coordinates";
import CalculationMethod from "./calculationMethod";
import { Madhab } from "./madhab";
import PrayerTimes from "./prayerTimes";
import { dateToString, extractTimeFromDate } from "./dateUtils";

export function getTimes(
  lat: number,
  lng: number,
  date: Date,
  days: number,
  timezoneOffset: number,
): TimesData {
  const coordinates = new Coordinates(lat, lng);
  const params = CalculationMethod.Karachi();
  params.madhab = Madhab.Shafi;
  const r: TimesData = {};
  for (let i = 0; i < days; i++) {
    const times = new PrayerTimes(coordinates, date, params);
    const arr: HourString[] = [];
    arr.push(extractTimeFromDate(times.fajr, timezoneOffset));
    arr.push(extractTimeFromDate(times.sunrise, timezoneOffset));
    arr.push(extractTimeFromDate(times.dhuhr, timezoneOffset));
    arr.push(extractTimeFromDate(times.asr, timezoneOffset));
    arr.push(extractTimeFromDate(times.maghrib, timezoneOffset));
    arr.push(extractTimeFromDate(times.isha, timezoneOffset));
    r[dateToString(date)] = arr;
    date.setDate(date.getDate() + 1);
  }
  return r;
}
