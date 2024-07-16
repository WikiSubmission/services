import { Place } from "./place";
import { ALL_PLACES } from "./GeoData";

export function getPlace(country: string, region: string, city: string) {
  if (
    ALL_PLACES[country] &&
    ALL_PLACES[country].regions[region] &&
    ALL_PLACES[country].regions[region][city]
  ) {
    const p: Place = {
      country,
      countryCode: ALL_PLACES[country].code,
      city,
      region,
      latitude: ALL_PLACES[country].regions[region][city][0],
      longitude: ALL_PLACES[country].regions[region][city][1],
    };
    return p;
  }
  return null;
}
