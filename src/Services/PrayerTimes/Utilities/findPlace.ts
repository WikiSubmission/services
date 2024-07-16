import { Place } from "./place";
import { ALL_PLACES } from "./GeoData";

export function findPlace(lat: number, lng: number): Place {
  let minDiff = Number.MAX_SAFE_INTEGER;
  let place: Place = {
    countryCode: "",
    country: "",
    region: "",
    city: "null",
    latitude: 0,
    longitude: 0,
  };
  for (const country in ALL_PLACES) {
    for (const region in ALL_PLACES[country].regions) {
      for (const city in ALL_PLACES[country].regions[region]) {
        const [lat1, lng1] = ALL_PLACES[country].regions[region][city];
        const diff = Math.abs(lat1 - lat) + Math.abs(lng1 - lng);
        if (diff < minDiff) {
          place = {
            countryCode: ALL_PLACES[country].code,
            country,
            region,
            city,
            latitude: lat1,
            longitude: lng1,
          };
          minDiff = diff;
        }
      }
    }
  }
  return place;
}
