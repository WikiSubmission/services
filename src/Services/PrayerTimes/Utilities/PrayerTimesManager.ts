import moment from "moment";

interface TimesObject {
  [key: string]: string;
}

class PrayerTimesManagerClass {
  applyUTCOffset(
    times: Record<string, string>,
    offset: string,
  ): Record<string, string> {
    const [hours, minutes] = offset.split(":").map(Number);
    const offsetInMilliseconds = (hours * 60 + minutes) * 60000;

    const revisedTimes: Record<string, string> = {};
    for (const key in times) {
      const utcTime = times[key];
      const [utcHours, utcMinutes] = utcTime.split(":").map(Number);

      const date = new Date();
      const utcTimeMilliseconds = date.setUTCHours(utcHours, utcMinutes, 0, 0);
      const revisedTimeMilliseconds =
        utcTimeMilliseconds + offsetInMilliseconds;

      const revisedDate = new Date(revisedTimeMilliseconds);
      const revisedHours = revisedDate
        .getUTCHours()
        .toString()
        .padStart(2, "0");
      const revisedMinutes = revisedDate
        .getUTCMinutes()
        .toString()
        .padStart(2, "0");
      const revisedTime = `${revisedHours}:${revisedMinutes}`;

      revisedTimes[key] = revisedTime;
    }

    return revisedTimes;
  }

  getLocalTime(utcOffset: string): string {
    const [hours, minutes] = utcOffset.split(":").map(Number);

    const date = new Date();
    const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;

    const offsetInMilliseconds = (hours * 60 + minutes) * 60000;
    const localTime = new Date(utcTime + offsetInMilliseconds);

    const options: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    const time = localTime.toLocaleString("en-US", options);

    return time;
  }

  getTimeGap(times: TimesObject): TimesObject {
    const currentUTC = moment.utc();
    const timeGap: TimesObject = {};

    for (const key in times) {
      const utcTime = times[key];
      const [hours, minutes] = utcTime.split(":");
      const targetTime = moment
        .utc()
        .set({ hours: Number(hours), minutes: Number(minutes) });

      // If the target time has already passed for today, add one day to ensure forward-looking comparison
      if (targetTime.isBefore(currentUTC)) {
        targetTime.add(1, "day");
      }

      const duration = moment.duration(targetTime.diff(currentUTC));
      const hoursGap = duration.hours();
      const minutesGap = duration.minutes();

      let formattedGap = "";
      if (hoursGap > 0) {
        formattedGap += `${hoursGap}h `;
      }
      formattedGap += `${minutesGap}m`;

      timeGap[key] = formattedGap;
    }

    return timeGap;
  }

  getCurrentPrayer(times: TimesObject): [string, string, string] {
    const currentUTC = moment.utc();
    let previousPrayer: string = "";
    let upcomingPrayer: string = "";
    let currentPrayer: string = "";
    let shortestTimeDiff: moment.Duration | undefined;

    for (const key in times) {
      const utcTime = times[key];
      const [hours, minutes] = utcTime.split(":");
      const targetTime = moment
        .utc()
        .set({ hours: Number(hours), minutes: Number(minutes) });

      // If the target time has already passed for today, add one day to ensure forward-looking comparison
      if (targetTime.isBefore(currentUTC)) {
        targetTime.add(1, "day");
      }

      const timeDiff = moment.duration(targetTime.diff(currentUTC));

      if (
        timeDiff.asMilliseconds() > 0 &&
        (!shortestTimeDiff ||
          timeDiff.asMilliseconds() < shortestTimeDiff.asMilliseconds())
      ) {
        shortestTimeDiff = timeDiff;
        upcomingPrayer = key;
        switch (upcomingPrayer) {
          case "fajr":
            currentPrayer = "isha";
          case "dhuhr":
            currentPrayer = "sunrise";
          case "asr":
            currentPrayer = "dhuhr";
          case "maghrib":
            currentPrayer = "asr";
          case "isha":
            currentPrayer = "maghrib";
          case "sunrise":
            currentPrayer = "fajr";
        }
      } else {
        previousPrayer = key;
      }
    }

    return [previousPrayer, upcomingPrayer, currentPrayer];
  }
}

export const PrayerTimesManager = new PrayerTimesManagerClass();
