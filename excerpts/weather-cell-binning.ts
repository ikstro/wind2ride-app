/**
 * Wind2Ride — excerpt: weather-cell coordinate binning
 * Source: services/sharedStateService.ts + services/config.ts (full source is private)
 * © ikstro. All rights reserved. Published for demonstration only.
 *
 * Why it exists: the app runs entirely on free-tier APIs, so every weather
 * call counts. Weather barely changes across ~35 km, so coordinates are
 * snapped to 0.315° bins ("weather cells") before they become cache keys.
 * Two nearby route points land in the same cell → one API call serves both.
 * Result: ~80% better cache hit rate on multi-point routes.
 */

interface Coordinates {
  latitude: number;
  longitude: number;
}

/** ~35 km at mid-latitudes. Tuned constant, shared app-wide via config. */
const ROUTE_WEATHER_GROUPING_DEGREES = 0.315;

/** Round a single coordinate to the nearest bin edge. */
export const roundCoordinateToBin = (coordinate: number, binSize: number): number =>
  Math.round(coordinate / binSize) * binSize;

/**
 * Snap a coordinate pair to its weather cell. Two locations that map to the
 * same bin are treated as the same weather cell everywhere in the app.
 */
export const binCoordinate = (coordinates: Coordinates): Coordinates => ({
  latitude: roundCoordinateToBin(coordinates.latitude, ROUTE_WEATHER_GROUPING_DEGREES),
  longitude: roundCoordinateToBin(coordinates.longitude, ROUTE_WEATHER_GROUPING_DEGREES),
});

/**
 * Cache key for location-specific weather. The bin size baked into the key is
 * the ACTUAL grouping constant — an earlier hardcoded 0.05° in a log statement
 * once sent a cache investigation chasing a phantom bin the key never used.
 * Lesson kept as a comment in the real source.
 */
export const generateLocationCacheKey = (
  coordinates: Coordinates,
  date: number,
  time: number,
): string => {
  const { latitude, longitude } = binCoordinate(coordinates);
  return `weather_${latitude}_${longitude}_${date}_${time}`;
};

/**
 * Guard against serving the wrong city's forecast: the global forecast cache
 * is only valid for a location if both map to the SAME weather cell (e.g. a
 * fallback-city cache must not answer for the user's real GPS position).
 */
export const cachedForecastMatchesCell = (
  cachedLocation: Coordinates | undefined,
  userLocation: Coordinates,
): boolean => {
  if (!cachedLocation) return true; // nothing to compare — don't block
  const a = binCoordinate(cachedLocation);
  const b = binCoordinate(userLocation);
  return a.latitude === b.latitude && a.longitude === b.longitude;
};
