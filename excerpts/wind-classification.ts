/**
 * Wind2Ride — excerpt: 5-category wind classification
 * Source: utils/windCalculations.ts (full source is private)
 * © ikstro. All rights reserved. Published for demonstration only.
 *
 * The single source of truth for how the app decides whether a route segment
 * fights the wind or rides it. Every color on the map, every verdict, every
 * "flip your route" suggestion starts here.
 */

export type WindType =
  | 'tailwind'
  | 'cross-tailwind'
  | 'crosswind'
  | 'cross-headwind'
  | 'headwind';

/**
 * STANDARDIZED 5-CATEGORY WIND CATEGORIZATION
 * Angle = difference between the wind vector and the direction of travel.
 */
export const categorizeWind = (angle: number): WindType => {
  const normalizedAngle = Math.min(Math.abs(angle), 180);

  if (normalizedAngle <= 30) {
    return 'tailwind';       // 0-30° = Green (pure tailwind assistance)
  } else if (normalizedAngle <= 75) {
    return 'cross-tailwind'; // 30-75° = Yellow-Green (partial tailwind)
  } else if (normalizedAngle <= 105) {
    return 'crosswind';      // 75-105° = Yellow (pure crosswind, minimal impact)
  } else if (normalizedAngle <= 150) {
    return 'cross-headwind'; // 105-150° = Orange (partial headwind resistance)
  } else {
    return 'headwind';       // 150-180° = Red (pure headwind resistance)
  }
};

/**
 * Wind direction is where wind COMES FROM (meteorological convention).
 * Convert to where it is GOING (add 180°), then take the smaller angle
 * between the wind vector and the route bearing.
 */
export const calculateWindAngle = (windDirection: number, routeBearing: number): number => {
  const effectiveWindDir = (windDirection + 180) % 360;

  let angle = Math.abs(effectiveWindDir - routeBearing);
  if (angle > 180) {
    angle = 360 - angle;
  }

  return angle;
};

/**
 * The ONE wind-speed → color scale for the whole app (weather cells, strength
 * bars, map tooltips). Bands are locked to the verdict engine's speed caps so
 * the color a rider sees and the verdict text never disagree:
 * <6 green · 6-8 yellow · 8-10 orange · ≥10 red (m/s).
 */
export const WIND_SPEED_COLOR_THRESHOLDS = { yellow: 6, orange: 8, red: 10 } as const;

export const getWindSpeedColor = (windSpeed: number, colors: Record<string, string>): string => {
  if (!Number.isFinite(windSpeed)) return colors.windUnknown;
  if (windSpeed < WIND_SPEED_COLOR_THRESHOLDS.yellow) return colors.windGreen;
  if (windSpeed < WIND_SPEED_COLOR_THRESHOLDS.orange) return colors.windYellow;
  if (windSpeed < WIND_SPEED_COLOR_THRESHOLDS.red) return colors.windOrange;
  return colors.windRed;
};
