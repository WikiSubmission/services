import { APIEndpoint } from "../../../Modules/APIModule/Types/APIEndpoint";
import { APIJSONResponse } from "../../../Modules/APIModule/Types/APIResponse";
import {
  DataPrayerTimes,
  DataPrayerTimesLocalResponseElement,
  DataPrayerTimesNames,
} from "../../../Modules/DatabaseModule/Types/DataPrayerTimes";
import {
  GoogleMapsResponse,
  GoogleAPITimezoneResponse,
} from "../../../Modules/DatabaseModule/Types/ExternalGoogle";
import { Ports } from "../../../Vars/Ports";
import { NetworkUtilities } from "../../../Utilities/NetworkUtilities";
import { SystemUtilities } from "../../../Utilities/SystemUtils";

export default function route(): APIEndpoint {
  return {
    method: "get",
    route: "/prayer-times",
    alternateRoutes: ["/prayertimes"],
    caching: {
      duration: "45s",
    },
    handler: async (req, res) => {
      const ENV_GOOGLE_API_KEY =
        await SystemUtilities.getEnvFromAWS("GOOGLE_API_KEY");

      const requestQuery = req.query?.q?.toString();

      if (!requestQuery) {
        return new APIJSONResponse({
          success: false,
          http_status_code: 400,
          error: {
            name: "Missing Query",
            description: "Specify a query parameter in the URL",
            fault: "client",
            severity: "low",
          },
        });
      }

      // Initialize response object
      let Response: DataPrayerTimes = {
        status_string: "--",
        location_string: "--",
        country: "--",
        country_code: "--",
        region: "--",
        local_time: "--",
        local_time_in_24h: "--",
        local_timezone: "--",
        local_timezone_id: "--",
        coordinates: {
          latitude: 0,
          longitude: 0,
        },
        times: {
          fajr: "--",
          dhuhr: "--",
          asr: "--",
          maghrib: "--",
          isha: "--",
          sunrise: "--",
        },
        times_in_24h: {
          fajr: "--",
          dhuhr: "--",
          asr: "--",
          maghrib: "--",
          isha: "--",
          sunrise: "--",
        },
        times_in_utc: {
          fajr: "--",
          dhuhr: "--",
          asr: "--",
          maghrib: "--",
          isha: "--",
          sunrise: "--",
        },
        times_left: {
          fajr: "--",
          dhuhr: "--",
          asr: "--",
          maghrib: "--",
          isha: "--",
          sunrise: "--",
        },
        current_prayer: "--",
        current_prayer_time_elapsed: "--",
        upcoming_prayer: "--",
        upcoming_prayer_time_left: "--",
        utc_offset_in_seconds: 0,
      };

      try {
        // 1. Feed query into Google Maps Geocode API to match a location
        // Provides:
        // --> locationString
        // --> country
        // --> countryCode
        // --> region
        // --> latitude, longitude

        const CityData = await NetworkUtilities.GET<GoogleMapsResponse>(
          `https://maps.googleapis.com`,
          `/maps/api/geocode/json?address=${requestQuery}&key=${ENV_GOOGLE_API_KEY}`,
        );

        if (!CityData || CityData?.status !== "OK") {
          return new APIJSONResponse({
            success: false,
            http_status_code: 400,
            error: {
              name: "Google Maps API Error",
              description: `Unable to find location data for "${requestQuery}": ${CityData?.status || "--"} (Google Geocoding API)`,
              fault: "server",
              severity: "high",
            },
          });
        }

        // assign locationString
        Response.location_string =
          CityData.results[0].formatted_address || "--";

        // assign coordinates
        Response.coordinates.latitude =
          CityData.results[0].geometry?.location?.lat || 0;
        Response.coordinates.longitude =
          CityData.results[0].geometry?.location?.lng || 0;

        // assign country, countryCode, region
        if (CityData.results[0].address_components) {
          const countryComponent =
            CityData.results[0].address_components.filter((a) =>
              a.types.includes("country"),
            );
          const regionComponent = CityData.results[0].address_components.filter(
            (a) => a.types.includes("administrative_area_level_1"),
          );
          Response.country = countryComponent[0]?.long_name || "--";
          Response.country_code = countryComponent[0]?.short_name || "--";
          Response.region = regionComponent[0]?.long_name || "--";
        }

        // return if no coordinates
        if (!Response.coordinates.latitude || !Response.coordinates.latitude) {
          return new APIJSONResponse({
            success: false,
            http_status_code: 500,
            error: {
              name: "Unable to Determine Coordinates",
              description: `Could not resolve valid coordinates for the searched location "${requestQuery}"`,
              fault: "server",
              severity: "high",
            },
          });
        }

        // 2. Get live timezone information
        // Provides:
        // --> timezone
        // --> timezone ID
        // --> utc offset in seconds

        const latitude = encodeURIComponent(Response.coordinates.latitude);
        const longitude = encodeURIComponent(Response.coordinates.longitude);

        const TimezoneData =
          await NetworkUtilities.GET<GoogleAPITimezoneResponse>(
            `https://maps.googleapis.com/maps/api/timezone`,
            `/json?language=en&location=${latitude},${longitude}&timestamp=${Math.floor(Date.now() / 1000)}&key=${ENV_GOOGLE_API_KEY}`,
          );

        if (!TimezoneData || TimezoneData.status !== "OK") {
          return new APIJSONResponse({
            success: false,
            http_status_code: 500,
            error: {
              name: "Google Timezone API Error",
              description: `Unable to find timezone data for "${requestQuery}" (${latitude}, ${longitude}): ${CityData?.status || "--"} (Google Timezone API)`,
              fault: "server",
              severity: "high",
            },
          });
        }

        // assign timezone, timezoneId
        Response.local_timezone = TimezoneData.timeZoneName;
        Response.local_timezone_id = TimezoneData.timeZoneId;

        // assign utcOffsetInSeconds
        const TotalUTCOffset =
          (TimezoneData.dstOffset || 0) + (TimezoneData.rawOffset || 0);
        Response.utc_offset_in_seconds = TotalUTCOffset;

        // 3. locally compute prayer times (UTC)
        const UTCTimesRequest =
          await NetworkUtilities.GET_INTERNAL<DataPrayerTimesLocalResponseElement>(
            `http://0.0.0.0:${Ports.PrayerTimesAPI}/prayer-times/precise`,
            `?lat=${latitude}&lng=${longitude}`,
          );

        // 4. locally compute prayer times (LOCAL TIMEZONE)
        const LocalTimesRequest =
          await NetworkUtilities.GET_INTERNAL<DataPrayerTimesLocalResponseElement>(
            `http://0.0.0.0:${Ports.PrayerTimesAPI}/prayer-times/precise`,
            `?lat=${latitude}&lng=${longitude}&timezoneOffset=${
              TotalUTCOffset / 60
            }`,
          );

        // UTC times
        const UTCScheduleData = UTCTimesRequest?.results;

        // Local times
        const LocalScheduleData = LocalTimesRequest?.results;

        if (!UTCScheduleData || !LocalScheduleData) {
          return new APIJSONResponse({
            success: false,
            http_status_code: 500,
            error: {
              name: "Calculation Error",
              description: `Unable to calculate prayer times for "${requestQuery}" using resolved coordinates of "${latitude}, ${longitude}"`,
              fault: "server",
              severity: "high",
            },
          });
        }

        // update coordinates to those resolved from the computation
        Response.coordinates.latitude = UTCScheduleData.place.latitude;
        Response.coordinates.longitude = UTCScheduleData.place.longitude;

        // compute the city's local time using its timezoneId
        const LocalTimeString =
          new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: TimezoneData.timeZoneId,
          }).format(new Date()) || "Unknown";

        // assign localTime
        Response.local_time = LocalTimeString;
        Response.local_time_in_24h = twelveToTwentyFourHour(LocalTimeString);

        // assign times24h (fajr, sunrise, dhuhr, asr, maghrib, isha)
        const TodayScheduleLocal24h =
          LocalScheduleData.times[
            Object.keys(
              LocalScheduleData.times,
            )[0] as keyof typeof LocalScheduleData.times
          ];
        for (let i = 0; i < TodayScheduleLocal24h.length; i++) {
          switch (i) {
            case 0: // fajr
              Response.times_in_24h.fajr = TodayScheduleLocal24h[0];
              break;
            case 1: // sunrise
              Response.times_in_24h.sunrise = TodayScheduleLocal24h[1];
              break;
            case 2: // dhuhr
              Response.times_in_24h.dhuhr = TodayScheduleLocal24h[2];
              break;
            case 3: // asr
              Response.times_in_24h.asr = TodayScheduleLocal24h[3];
              break;
            case 4: // maghrib
              Response.times_in_24h.maghrib = TodayScheduleLocal24h[4];
              break;
            case 5: // isha
              Response.times_in_24h.isha = TodayScheduleLocal24h[5];
              break;
          }
        }

        // assign utc times (fajr, sunrise, dhuhr, asr, maghrib, isha)
        const TodayScheduleUTC24h =
          UTCScheduleData.times[
            Object.keys(
              LocalScheduleData.times,
            )[0] as keyof typeof LocalScheduleData.times
          ];
        for (let i = 0; i < TodayScheduleUTC24h.length; i++) {
          switch (i) {
            case 0: // fajr
              Response.times_in_utc.fajr = TodayScheduleUTC24h[0];
              break;
            case 1: // sunrise
              Response.times_in_utc.sunrise = TodayScheduleUTC24h[1];
              break;
            case 2: // dhuhr
              Response.times_in_utc.dhuhr = TodayScheduleUTC24h[2];
              break;
            case 3: // asr
              Response.times_in_utc.asr = TodayScheduleUTC24h[3];
              break;
            case 4: // maghrib
              Response.times_in_utc.maghrib = TodayScheduleUTC24h[4];
              break;
            case 5: // isha
              Response.times_in_utc.isha = TodayScheduleUTC24h[5];
              break;
          }
        }

        // assign local times (fajr, sunrise, dhuhr, asr, maghrib, isha)
        // *convert 24h to 12h first
        for (let i = 0; i < TodayScheduleLocal24h.length; i++) {
          switch (i) {
            case 0: // fajr
              Response.times.fajr = twentyFourToTwelveHour(
                TodayScheduleLocal24h[0],
              );
              break;
            case 1: // sunrise
              Response.times.sunrise = twentyFourToTwelveHour(
                TodayScheduleLocal24h[1],
              );
              break;
            case 2: // dhuhr
              Response.times.dhuhr = twentyFourToTwelveHour(
                TodayScheduleLocal24h[2],
              );
              break;
            case 3: // asr
              Response.times.asr = twentyFourToTwelveHour(
                TodayScheduleLocal24h[3],
              );
              break;
            case 4: // maghrib
              Response.times.maghrib = twentyFourToTwelveHour(
                TodayScheduleLocal24h[4],
              );
              break;
            case 5: // isha
              Response.times.isha = twentyFourToTwelveHour(
                TodayScheduleLocal24h[5],
              );
              break;
          }
        }

        // set times left
        const timeToFajr = diffTime(
          Response.local_time_in_24h,
          Response.times_in_24h.fajr,
        );
        const timeToSunrise = diffTime(
          Response.local_time_in_24h,
          Response.times_in_24h.sunrise,
        );
        const timeToDhuhr = diffTime(
          Response.local_time_in_24h,
          Response.times_in_24h.dhuhr,
        );
        const timeToAsr = diffTime(
          Response.local_time_in_24h,
          Response.times_in_24h.asr,
        );
        const timeToMaghrib = diffTime(
          Response.local_time_in_24h,
          Response.times_in_24h.maghrib,
        );
        const timeToIsha = diffTime(
          Response.local_time_in_24h,
          Response.times_in_24h.isha,
        );

        // assign times left
        Response.times_left.fajr = `${timeToFajr[0]}h ${timeToFajr[1]}m`;
        Response.times_left.sunrise = `${timeToSunrise[0]}h ${timeToSunrise[1]}m`;
        Response.times_left.dhuhr = `${timeToDhuhr[0]}h ${timeToDhuhr[1]}m`;
        Response.times_left.asr = `${timeToAsr[0]}h ${timeToAsr[1]}m`;
        Response.times_left.maghrib = `${timeToMaghrib[0]}h ${timeToMaghrib[1]}m`;
        Response.times_left.isha = `${timeToIsha[0]}h ${timeToIsha[1]}m`;

        // calculate current prayer
        const [currentPrayer, upcomingPrayer] = getCurrentPrayer();

        // assign current prayer
        Response.current_prayer = currentPrayer;

        // assign current prayer time elapsed
        const [hPassed, mPassed] = diffTime(
          Response.times_in_24h[currentPrayer],
          Response.local_time_in_24h,
        );
        Response.current_prayer_time_elapsed = `${hPassed}h ${mPassed}m`;

        // assign next prayer
        Response.upcoming_prayer = upcomingPrayer;

        // assign next prayer time left
        Response.upcoming_prayer_time_left =
          Response.times_left[upcomingPrayer];

        // set statusString
        Response.status_string =
          req.query?.highlight === "true"
            ? `It's currently **${SystemUtilities.capitalize(Response.current_prayer)}** (began ${
                Response.current_prayer_time_elapsed
              } ago). **${SystemUtilities.capitalize(Response.upcoming_prayer)}** starts in ${Response.upcoming_prayer_time_left}.`
            : `It's currently ${SystemUtilities.capitalize(Response.current_prayer)} (began ${
                Response.current_prayer_time_elapsed
              } ago). ${SystemUtilities.capitalize(Response.upcoming_prayer)} starts in ${Response.upcoming_prayer_time_left}.`;

        return new APIJSONResponse({
          success: true,
          http_status_code: 200,
          results: Response,
        });

        // fn to convert 12h to 24h e.g. 3:31 AM --> 15:31
        function twelveToTwentyFourHour(time: string): string {
          try {
            // check if the time format is correct
            const isPm = /PM/i.test(time);
            const timeComponents = time.match(/^(\d{1,2}):(\d{2})/);

            if (timeComponents && timeComponents.length === 3) {
              let hours = parseInt(timeComponents[1], 10);
              const minutes = timeComponents[2];

              if (isPm && hours !== 12) {
                hours += 12;
              } else if (!isPm && hours === 12) {
                hours = 0;
              }

              const formattedHours = hours.toString().padStart(2, "0");
              return `${formattedHours}:${minutes}`;
            }
          } catch (error) {
            console.error("Failed to parse 12-hour time from source: ", time);
          }
          return "00:00";
        }

        // fn to convert 24h to 12h e.g. 15:31 --> 3:31 AM
        function twentyFourToTwelveHour(time: any): string {
          try {
            // check correct time format and split into components
            time = time
              .toString()
              .match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

            if (time.length > 1) {
              // if time format correct
              time = time.slice(1); // remove full string match value
              time[5] = +time[0] < 12 ? " AM" : " PM"; // set AM/PM
              time[0] = +time[0] % 12 || 12; // adjust hours
            }
            return time.join("") || "00:00 AM"; // return adjusted time or original string
          } catch (error) {
            console.error("Failed to parse local time from source: ", time);
            return "00:00 AM";
          }
        }

        // function to get time difference between two 24h strings
        function diffTime(time1: string, time2: string): number[] {
          const [hour1, min1] = time1.split(":").map(Number);
          const [hour2, min2] = time2.split(":").map(Number);

          let diff_hour = hour2 - hour1;
          let diff_min = min2 - min1;

          if (diff_hour < 0) {
            diff_hour += 24; // Add 24 hours to handle negative difference
          }

          if (diff_min < 0) {
            diff_min += 60;
            diff_hour--; // Subtract 1 hour when minutes are negative
          } else if (diff_min >= 60) {
            diff_min -= 60;
            diff_hour++; // Add 1 hour when minutes exceed 60
          }

          return [diff_hour, diff_min];
        }

        // fn to resolve current prayer (leveraging diffTime values)
        function getCurrentPrayer(): [
          keyof typeof DataPrayerTimesNames,
          keyof typeof DataPrayerTimesNames,
        ] {
          const fajrSum = sum(timeToFajr);
          const sunriseSum = sum(timeToSunrise);
          const dhuhrSum = sum(timeToDhuhr);
          const asrSum = sum(timeToAsr);
          const maghribSum = sum(timeToMaghrib);
          const ishaSum = sum(timeToIsha);

          function sum(p: number[]) {
            return p.reduce((acc, curr, index) => {
              if (index === 0) {
                return acc + curr * 60;
              }
              const sum = acc + curr;
              return sum >= 0 ? sum : 1000; // if - then passed so stimulate higher sum
            }, 0);
          }

          // create array of sums and their corresponding prayer names
          const sums = [
            { name: "fajr", sum: fajrSum },
            { name: "sunrise", sum: sunriseSum },
            { name: "dhuhr", sum: dhuhrSum },
            { name: "asr", sum: asrSum },
            { name: "maghrib", sum: maghribSum },
            { name: "isha", sum: ishaSum },
          ];

          // find prayer with the lowest minute sum
          let lowestSumPrayer = sums[0];
          for (const sumItem of sums) {
            if (sumItem.sum < lowestSumPrayer.sum) {
              lowestSumPrayer = sumItem;
            }
          }

          const nextPrayer =
            lowestSumPrayer.name as keyof typeof DataPrayerTimesNames;

          switch (nextPrayer) {
            case "fajr":
              return ["isha", nextPrayer];
            case "sunrise":
              return ["fajr", nextPrayer];
            case "dhuhr":
              return ["sunrise", nextPrayer];
            case "asr":
              return ["dhuhr", nextPrayer];
            case "maghrib":
              return ["asr", nextPrayer];
            case "isha":
              return ["maghrib", nextPrayer];
            default:
              return ["fajr", nextPrayer];
          }
        }
      } catch (error) {
        console.error(error);
        return new APIJSONResponse({
          success: false,
          http_status_code: 500,
          error: {
            name: "Internal Server Error",
            description: `Something went wrong while searching prayer times for "${requestQuery}". Please try again later.`,
            fault: "server",
            severity: "high",
          },
        });
      }
    },
  };
}
