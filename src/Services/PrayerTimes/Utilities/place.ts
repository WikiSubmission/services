export type Place = {
  countryCode: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
};

export type CountryData = {
  code: string;
  regions: Record<string, Record<string, [number, number]>>;
};
