import type Coordinates from "./coordinates";

const HighLatitudeRule = {
  MiddleOfTheNight: "middleofthenight",
  SeventhOfTheNight: "seventhofthenight",
  TwilightAngle: "twilightangle",

  recommended(coordinates: Coordinates) {
    if (coordinates.latitude > 48) {
      return HighLatitudeRule.SeventhOfTheNight;
    } else {
      return HighLatitudeRule.MiddleOfTheNight;
    }
  },
} as const;

export default HighLatitudeRule;
