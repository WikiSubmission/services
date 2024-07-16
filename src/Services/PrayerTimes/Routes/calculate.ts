import { APIEndpoint } from "../../../Modules/APIModule/Types/APIEndpoint";
import { APIJSONResponse } from "../../../Modules/APIModule/Types/APIResponse";
import { DataPrayerTimesLocalResponseElement } from "../../../Modules/DatabaseModule/Types/DataPrayerTimes";
import { isInRange, isValidDateFromString } from "../Utilities/dateUtils";
import { findPlace } from "../Utilities/findPlace";
import { getTimes } from "../Utilities/getTimes";

export default function route(): APIEndpoint {
  return {
    method: "get",
    route: "/prayer-times/precise",
    alternateRoutes: ["/prayertimes/precise"],
    caching: {
      duration: "45s",
    },
    handler: async (req, res) => {
      const lat = Number(req.query.lat as string);
      const lng = Number(req.query.lng as string);
      const dateStr = req.query.date as string;
      const date = isValidDateFromString(dateStr)
        ? new Date(dateStr)
        : new Date(); // use today if invalid
      const daysParam = Number(req.query.days as string);
      const days = isNaN(daysParam) || daysParam < 1 ? 100 : daysParam; // 50 is default
      const tzParam = Number(req.query.timezoneOffset as string);
      const tzOffset = isNaN(tzParam) ? 0 : tzParam; // 0 is default

      if (
        isNaN(lat) ||
        isNaN(lng) ||
        !isInRange(lat, -90, 90) ||
        !isInRange(lng, -180, 180)
      ) {
        return new APIJSONResponse({
          success: false,
          http_status_code: 400,
          error: {
            name: "Invalid Coordinates",
            description: `Invalid latitude/longitude values: "${lat}, ${lng}"`,
            fault: "client",
            severity: "low",
          },
        });
      } else {
        const place = findPlace(lat, lng);
        const times = getTimes(lat, lng, date, days, tzOffset);
        const response: DataPrayerTimesLocalResponseElement = {
          place,
          times,
        };
        return new APIJSONResponse({
          success: true,
          http_status_code: 200,
          results: response,
        });
      }
    },
  };
}
