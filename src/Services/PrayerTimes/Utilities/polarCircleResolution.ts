import Coordinates from "./coordinates";
import SolarTime from "./solarTime";
import { dateByAddingDays } from "./dateUtils";
import { ValueOf } from "./typeUtils";

export const PolarCircleResolution = {
  AqrabBalad: "AqrabBalad",
  AqrabYaum: "AqrabYaum",
  Unresolved: "Unresolved",
} as const;

const LATITUDE_VARIATION_STEP = 0.5; // Degrees to add/remove at each resolution step
const UNSAFE_LATITUDE = 65; // Based on https://en.wikipedia.org/wiki/Midnight_sun

const isValidSolarTime = (solarTime: SolarTime) =>
  !isNaN(solarTime.sunrise) && !isNaN(solarTime.sunset);

const aqrabYaumResolver = (
  coordinates: Coordinates,
  date: Date,
  daysAdded = 1,
  direction = 1,
): {
  date: Date;
  tomorrow: Date;
  coordinates: Coordinates;
  solarTime: SolarTime;
  tomorrowSolarTime: SolarTime;
} | null => {
  if (daysAdded > Math.ceil(365 / 2)) {
    return null;
  }
  const testDate = new Date(date.getTime());
  testDate.setDate(testDate.getDate() + direction * daysAdded);
  const tomorrow = dateByAddingDays(testDate, 1);
  const solarTime = new SolarTime(testDate, coordinates);
  const tomorrowSolarTime = new SolarTime(tomorrow, coordinates);

  if (!isValidSolarTime(solarTime) || !isValidSolarTime(tomorrowSolarTime)) {
    return aqrabYaumResolver(
      coordinates,
      date,
      daysAdded + (direction > 0 ? 0 : 1),
      -direction,
    );
  }

  return {
    date,
    tomorrow,
    coordinates,
    solarTime,
    tomorrowSolarTime,
  };
};

const aqrabBaladResolver = (
  coordinates: Coordinates,
  date: Date,
  latitude: number,
): {
  date: Date;
  tomorrow: Date;
  coordinates: Coordinates;
  solarTime: SolarTime;
  tomorrowSolarTime: SolarTime;
} | null => {
  const solarTime = new SolarTime(date, { ...coordinates, latitude });
  const tomorrow = dateByAddingDays(date, 1);
  const tomorrowSolarTime = new SolarTime(tomorrow, {
    ...coordinates,
    latitude,
  });
  if (!isValidSolarTime(solarTime) || !isValidSolarTime(tomorrowSolarTime)) {
    return Math.abs(latitude) >= UNSAFE_LATITUDE
      ? aqrabBaladResolver(
          coordinates,
          date,
          latitude - Math.sign(latitude) * LATITUDE_VARIATION_STEP,
        )
      : null;
  }

  return {
    date,
    tomorrow,
    coordinates: new Coordinates(latitude, coordinates.longitude),
    solarTime,
    tomorrowSolarTime,
  };
};

export const polarCircleResolvedValues = (
  resolver: ValueOf<typeof PolarCircleResolution>,
  date: Date,
  coordinates: Coordinates,
) => {
  const defaultReturn = {
    date,
    tomorrow: dateByAddingDays(date, 1),
    coordinates,
    solarTime: new SolarTime(date, coordinates),
    tomorrowSolarTime: new SolarTime(dateByAddingDays(date, 1), coordinates),
  };

  switch (resolver) {
    case PolarCircleResolution.AqrabYaum: {
      return aqrabYaumResolver(coordinates, date) || defaultReturn;
    }
    case PolarCircleResolution.AqrabBalad: {
      const { latitude } = coordinates;
      return (
        aqrabBaladResolver(
          coordinates,
          date,
          latitude - Math.sign(latitude) * LATITUDE_VARIATION_STEP,
        ) || defaultReturn
      );
    }
    default: {
      return defaultReturn;
    }
  }
};
