import Astronomical from "./astronomical";
import { Rounding } from "./rounding";
import { ValueOf } from "./typeUtils";
import { DateString, HourString } from "./timesData";

export function dateByAddingDays(date: Date, days: number) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate() + days;
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return new Date(year, month, day, hours, minutes, seconds);
}

export function dateByAddingMinutes(date: Date, minutes: number) {
  return dateByAddingSeconds(date, minutes * 60);
}

export function dateByAddingSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000);
}

export function roundedMinute(
  date: Date,
  rounding: ValueOf<typeof Rounding> = Rounding.Nearest,
) {
  const seconds = date.getUTCSeconds();
  let offset = seconds >= 30 ? 60 - seconds : -1 * seconds;
  if (rounding === Rounding.Up) {
    offset = 60 - seconds;
  } else if (rounding === Rounding.None) {
    offset = 0;
  }

  return dateByAddingSeconds(date, offset);
}

export function dayOfYear(date: Date) {
  let returnedDayOfYear = 0;
  const feb = Astronomical.isLeapYear(date.getFullYear()) ? 29 : 28;
  const months = [31, feb, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (let i = 0; i < date.getMonth(); i++) {
    returnedDayOfYear += months[i];
  }

  returnedDayOfYear += date.getDate();

  return returnedDayOfYear;
}

export function isValidDate(date: Date) {
  return date instanceof Date && !isNaN(date.valueOf());
}

export function isValidDateFromString(str: string | null | undefined): boolean {
  if (isNil(str)) return false;
  str = str as string;
  const regexMatch = str.match(/^\d{4}-\d{2}-\d{2}$/) !== null;
  if (!regexMatch) return false;
  const [y, m, d] = str.split("-").map((x) => Number(x));
  if (y < 1000 || y > 3000 || m < 1 || m > 12 || d < 1 || d > 31) return false;

  return true;
}

export default class TimeComponents {
  hours: number;
  minutes: number;
  seconds: number;

  constructor(num: number) {
    this.hours = Math.floor(num);
    this.minutes = Math.floor((num - this.hours) * 60);
    this.seconds = Math.floor(
      (num - (this.hours + this.minutes / 60)) * 60 * 60,
    );
    return this;
  }

  utcDate(year: number, month: number, date: number): Date {
    return new Date(
      Date.UTC(year, month, date, this.hours, this.minutes, this.seconds),
    );
  }
}

export function prefix0(n: number) {
  if (n > 99 || n < -99) throw new Error("Can only process 2 digits integers!");
  return (n + "").padStart(2, "0");
}

export function extractTimeFromDate(
  d: Date,
  timezoneOffset: number,
): HourString {
  d.setMinutes(d.getMinutes() + timezoneOffset);
  const hour = d.getUTCHours();
  const minute = d.getUTCMinutes();
  return (prefix0(hour) + ":" + prefix0(minute)) as HourString;
}

export function dateToString(date: Date): DateString {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}-${prefix0(month)}-${prefix0(day)}` as DateString;
}

export function isNil(value: string | null | undefined) {
  return value === null || value === undefined;
}

export function isInRange(a: number, min: number, max: number) {
  return a >= min && a <= max;
}

export function isHourStringsClose(
  s1: HourString,
  s2: HourString,
  minuteDiff = 5,
): boolean {
  const [hour1, min1] = s1.split(":").map((x) => Number(x));
  const [hour2, min2] = s2.split(":").map((x) => Number(x));

  return Math.abs(hour1 * 60 + min1 - hour2 * 60 - min2) <= minuteDiff;
}
