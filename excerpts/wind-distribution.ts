/**
 * Wind2Ride — excerpt: per-segment wind distribution
 * Source: utils/windIndexCalculator.ts (full source is private)
 * © ikstro. All rights reserved. Published for demonstration only.
 *
 * The heart of the wind index: walk every segment of a route, classify it
 * against the current wind, and produce a distance-weighted difficulty
 * rating (1 = spin easy, 5 = suffer). Difficulty per category scales with
 * wind speed — a 3 m/s headwind and a 12 m/s headwind are different sports.
 */

interface QuickWindData {
  averageBearing: number;
  totalDistance: number;
  segmentBearings: number[];
  segmentDistances: number[];
}

interface WindSegment {
  distance: number;
  windType: 'tailwind' | 'cross-tailwind' | 'crosswind' | 'cross-headwind' | 'headwind';
  angle: number;      // wind angle relative to movement
  difficulty: number; // 1-5
  windSpeed: number;
}

interface WindDistribution {
  tailwindDistance: number;
  crossTailwindDistance: number;
  crosswindDistance: number;
  crossHeadwindDistance: number;
  headwindDistance: number;
  overallRating: number; // 1-5, distance-weighted
  totalDistance: number;
  segmentDetails: WindSegment[];
}

export const calculateWindDistribution = (
  routeData: QuickWindData,
  currentWind: { direction: number; speed: number },
): WindDistribution => {
  let tailwindDistance = 0;
  let crossTailwindDistance = 0;
  let crosswindDistance = 0;
  let crossHeadwindDistance = 0;
  let headwindDistance = 0;
  const segmentDetails: WindSegment[] = [];
  let totalDifficultyScore = 0;

  routeData.segmentBearings.forEach((bearing, index) => {
    const segmentDistance = routeData.segmentDistances[index];

    // Wind blows FROM its direction; convert to the vector pushing the cyclist.
    const effectiveWindDir = (currentWind.direction + 180) % 360;
    let angle = Math.abs(effectiveWindDir - bearing);
    if (angle > 180) angle = 360 - angle;

    let windType: WindSegment['windType'];
    let difficulty: number;

    if (angle <= 30) {
      windType = 'tailwind';
      difficulty = Math.max(1, 2 - currentWind.speed / 20);   // easier with stronger tailwind
      tailwindDistance += segmentDistance;
    } else if (angle <= 75) {
      windType = 'cross-tailwind';
      difficulty = Math.max(1, 2.2 - currentWind.speed / 25); // slightly less benefit
      crossTailwindDistance += segmentDistance;
    } else if (angle <= 105) {
      windType = 'crosswind';
      difficulty = 2.5 + currentWind.speed / 30;              // crosswind bites at speed
      crosswindDistance += segmentDistance;
    } else if (angle <= 150) {
      windType = 'cross-headwind';
      difficulty = 2.8 + currentWind.speed / 20;
      crossHeadwindDistance += segmentDistance;
    } else {
      windType = 'headwind';
      difficulty = 3 + currentWind.speed / 15;                // much harder as speed climbs
      headwindDistance += segmentDistance;
    }

    difficulty = Math.min(Math.max(difficulty, 1), 5);

    segmentDetails.push({
      distance: segmentDistance,
      windType,
      angle,
      difficulty,
      windSpeed: currentWind.speed,
    });

    // Long segments dominate the verdict; a 200 m headwind kick doesn't.
    totalDifficultyScore += difficulty * (segmentDistance / routeData.totalDistance);
  });

  const overallRating = Math.round(totalDifficultyScore * 10) / 10;

  return {
    tailwindDistance,
    crossTailwindDistance,
    crosswindDistance,
    crossHeadwindDistance,
    headwindDistance,
    overallRating,
    totalDistance: routeData.totalDistance,
    segmentDetails,
  };
};
