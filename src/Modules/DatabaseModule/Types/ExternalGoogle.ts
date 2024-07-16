/**
 * @interface GoogleMapsResponse
 * @description The response object from Google's Geolocation API
 */
export interface GoogleMapsResponse {
  results: {
    formatted_address: string;
    address_components: {
      long_name: string;
      short_name: string;
      types: string[];
    }[];
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      location_type: string;
      viewport: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    };
    place_id: string;
    types: string[];
  }[];
  status: string;
}

export interface GoogleAPITimezoneResponse {
  status:
    | "OK"
    | "INVALID_REQUEST"
    | "OVER_DAILY_LIMIT"
    | "OVER_QUERY_LIMIT"
    | "REQUEST_DENIED"
    | "UNKNOWN_ERROR"
    | "ZERO_RESULTS";
  // The offset for daylight-savings time in seconds. This will be zero if the time zone is not in Daylight Savings Time during the specified timestamp.
  dstOffset?: number;
  // The offset from UTC (in seconds) for the given location. This does not take into effect daylight savings.
  rawOffset?: number;
  // A string containing the ID of the time zone, such as "America/Los_Angeles" or "Australia/Sydney". These IDs are defined by Unicode Common Locale Data Repository (CLDR) project, and currently available in file timezone.xml. When a timezone has several IDs, the canonical one is returned. In xml responses, this is the first alias of each timezone. For example, "Asia/Calcutta" is returned, not "Asia/Kolkata".
  timeZoneId: string;
  // The long form name of the time zone. This field will be localized if the language parameter is set. eg. Pacific Daylight Time or Australian Eastern Daylight Time.
  timeZoneName: string;
}
