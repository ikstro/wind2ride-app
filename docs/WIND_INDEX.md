# Wind2Ride Wind Index System

This document explains Wind2Ride's comprehensive wind analysis model, including calculation methods, thresholds, UI mapping, and usage examples.

## Table of Contents

- [Overview](#overview)
- [Wind Direction Categories](#wind-direction-categories)  
- [Wind Strength Rating](#wind-strength-rating)
- [Speed Impact Calculation](#speed-impact-calculation)
- [Visual Representation](#visual-representation)
- [Implementation Architecture](#implementation-architecture)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Migration Guide](#migration-guide)

## Overview

Wind2Ride uses a sophisticated dual-metric wind analysis system that separates **wind strength** (how strong the wind is) from **direction bias** (whether it helps or hinders cycling). This approach provides cyclists with clear, actionable information for route planning.

### Key Principles

- **Stars represent wind strength only** (1-5 stars based on wind speed)
- **Color represents direction bias only** (red=challenging, yellow=neutral, green=favorable)
- **Percentage shows speed impact** (expected change in cycling speed)
- **Global timezone awareness** for accurate local time calculations
- **Sub-20ms performance** for real-time route analysis

## Wind Direction Categories

Wind2Ride uses a **5-category classification system** based on the angle between wind direction and cycling direction:

### Category Definitions

| Category | Angle Range | Description | Impact |
|----------|-------------|-------------|--------|
| **Tailwind** | 0° - 30° | Wind pushing from behind | Very positive |
| **Cross-tailwind** | 30° - 75° | Diagonal wind assistance | Positive |
| **Crosswind** | 75° - 105° | Side wind (minimal impact) | Neutral |
| **Cross-headwind** | 105° - 150° | Diagonal wind resistance | Negative |
| **Headwind** | 150° - 180° | Wind pushing against cyclist | Very negative |

### Angle Calculation

```typescript
// Calculate angle difference between wind and route direction
let windAngle = Math.abs(routeBearing - windDirection);
if (windAngle > 180) windAngle = 360 - windAngle;

// Categorize based on thresholds
if (windAngle <= 30) return 'tailwind';
else if (windAngle <= 75) return 'cross-tailwind';
else if (windAngle <= 105) return 'crosswind';
else if (windAngle <= 150) return 'cross-headwind';
else return 'headwind';
```

### Real-World Examples

- **Tailwind**: Cycling east with 15 mph wind from the west
- **Cross-tailwind**: Cycling northeast with wind from the southwest  
- **Crosswind**: Cycling north with wind from the east or west
- **Cross-headwind**: Cycling northeast with wind from the southeast
- **Headwind**: Cycling east with 15 mph wind from the east

## Wind Strength Rating

Wind strength is represented by **1-5 stars** based purely on wind speed, independent of direction:

### Star Mapping Thresholds

```typescript
function mapWindSpeedToStars(speedMps: number): number {
  if (speedMps < 3) return 1;   // 1★: < 3 m/s (light air)
  if (speedMps < 5) return 2;   // 2★: 3-5 m/s (light breeze)  
  if (speedMps < 7) return 3;   // 3★: 5-7 m/s (gentle breeze)
  if (speedMps < 10) return 4;  // 4★: 7-10 m/s (moderate breeze)
  return 5;                     // 5★: ≥ 10 m/s (fresh breeze+)
}
```

### Practical Interpretation

| Stars | Wind Speed | Conditions | Cycling Impact |
|-------|------------|------------|----------------|
| ⭐ | < 3 m/s (< 7 mph) | Light air, barely noticeable | Minimal effect on cycling |
| ⭐⭐ | 3-5 m/s (7-11 mph) | Light breeze, leaves rustling | Slight effect, barely noticeable |
| ⭐⭐⭐ | 5-7 m/s (11-16 mph) | Gentle breeze, small branches moving | Noticeable but manageable |
| ⭐⭐⭐⭐ | 7-10 m/s (16-22 mph) | Moderate breeze, dust and paper blowing | Significant effect on effort/speed |
| ⭐⭐⭐⭐⭐ | ≥ 10 m/s (≥ 22 mph) | Fresh breeze, small trees swaying | Strong effect, challenging conditions |

## Speed Impact Calculation

The speed impact percentage represents the expected change in cycling speed due to wind conditions:

### Calculation Method

```typescript
// Simplified formula (actual implementation is more complex)
function calculateSpeedImpact(segments: WindSegments): number {
  let totalImpact = 0;
  let totalDistance = 0;
  
  for (const segment of segments) {
    const segmentImpact = getImpactForCategory(segment.category, windSpeed);
    totalImpact += segmentImpact * segment.distance;
    totalDistance += segment.distance;
  }
  
  return totalDistance > 0 ? totalImpact / totalDistance : 0;
}
```

### Impact Ranges

- **+15% to +25%**: Strong tailwind conditions
- **+5% to +15%**: Favorable mixed conditions  
- **-5% to +5%**: Neutral/crosswind conditions
- **-15% to -5%**: Challenging mixed conditions
- **-25% to -15%**: Strong headwind conditions

## Visual Representation

### Color System

Wind2Ride uses **HSL color space** to represent direction bias:

```typescript
function directionColorFromDistribution(segments): string {
  const bias = calculateDirectionBias(segments);
  
  // Map bias (-1 to +1) to hue (0° to 120°)
  let hue: number;
  if (bias >= 0) {
    hue = 60 + (bias * 60);  // Yellow (60°) to Green (120°)
  } else {
    hue = 60 + (bias * 60);  // Red (0°) to Yellow (60°)
  }
  
  const saturation = Math.min(85, 60 + Math.abs(bias) * 25);
  return `hsl(${Math.round(hue)}, ${saturation}%, 50%)`;
}
```

### UI Components

1. **Wind Strength Bar** (`components/wind/WindStrengthProgressBar.tsx`)
   - Displays wind strength on the 1-5 scale (mapped from speed)
   - Replaced the earlier `WindStars` star component

2. **Wind Distribution Bar** (`components/wind/WindDistributionBar.tsx`)
   - Visual breakdown of route by wind categories
   - Color-coded segments showing distance proportions

3. **Wind Legend** (`components/wind/WindLegend.tsx`)
   - Explains star/color/percentage meanings
   - Available in compact and full modes

### Example UI States

```
5★ +18%  [████████████▓▓▓▓▓▓▓▓] Strong tailwind route
3★  -8%  [▓▓▓▓████▓▓▓▓▓▓▓▓▓▓▓▓] Mixed conditions, slight headwind bias  
2★  +2%  [▓▓▓▓▓▓▓▓████▓▓▓▓▓▓▓▓] Light crosswind conditions
```

## Implementation Architecture

### Core Services

1. **`WindIndexUnifiedService`** - Single source of truth for wind calculations
2. **`CentralizedWeatherService`** - Weather data management with timezone handling  
3. **`SharedStateService`** - Cross-tab state synchronization
4. **`RoutingService`** - Route calculation with wind analysis integration

### Calculation Paths

The system supports **dual calculation paths** for optimal performance:

#### Path 1: Detailed Segments (Full Accuracy)
```typescript
// Uses route.segments with full geometry
const result = calculateStandardWindAnalysis(segments, windSpeed, windDirection);
```

#### Path 2: QuickWindData (Ultra-Fast)
```typescript  
// Uses pre-computed bearing/distance arrays for <20ms calculation
const result = fastWindIndexFromQuickData(quickData, weather);
```

### Performance Optimizations

- **QuickWI System**: Sub-20ms calculations with zero object allocations
- **Route Caching**: calculated-route distance cache, 1 h TTL (`routingService.ts`)
- **Polyline Downsampling**: ≤1000 points using Douglas-Peucker algorithm
- **Coordinate Binning**: 0.315° bins (~35 km) for better cache hit rates (`config.ts: ROUTE_WEATHER_GROUPING_DEGREES`)

## Usage Examples

### Basic Wind Index Calculation

```typescript
import { WindIndexUnifiedService } from '../services/windIndexUnifiedService';
import { CentralizedWeatherService } from '../services/centralizedWeatherService';

// Get weather data for selected time
const weather = await CentralizedWeatherService.getUnifiedWeatherData(
  coordinates, selectedDate, selectedTime
);

// Calculate unified wind index
const result = WindIndexUnifiedService.calculateUnifiedWindIndex(route, weather);

console.log('Wind Index:', result.windIndex);           // 1-5 rating
console.log('Speed Impact:', result.speedImpact);       // Percentage
console.log('Strength Stars:', result.display.strengthStars); // 1-5 stars  
console.log('Direction Color:', result.display.directionColor); // HSL color
```

### Using in UI Components

> Historical examples: the `WindStars` component was later replaced by
> `WindStrengthProgressBar`; the data fields (`strengthStars`, `directionColor`) are unchanged.

```typescript
// In RouteCard component
<WindStars 
  strengthStars={windDistribution?.display?.strengthStars}
  directionColor={windDistribution?.display?.directionColor}
  size="small"
/>

// Speed impact display
<Text style={{ color: getImpactColor(windDistribution.speedImpact) }}>
  {windDistribution.speedImpact >= 0 ? '+' : ''}{windDistribution.speedImpact.toFixed(0)}%
</Text>
```

### Batch Processing Multiple Routes

```typescript
// Efficient batch processing with shared weather data
const results = WindIndexUnifiedService.calculateUnifiedWindIndexBatch(
  routes, weather, { enableDebug: false }
);

routes.forEach(route => {
  const windIndex = results.get(route.id);
  console.log(`${route.name}: ${windIndex.windIndex}★ ${windIndex.speedImpact}%`);
});
```

### Location-Specific Weather Updates

```typescript
// Update routes with location-specific weather (different locations)
const updatedRoutes = await WindIndexUnifiedService.updateRoutesWithLocationSpecificWeather(
  routes, selectedDate, selectedTime, { enableDebug: true }
);
```

## Testing

### Unit Test Coverage

The wind index system includes comprehensive unit tests covering:

- **Direction Binning**: All 5 categories with edge cases
- **Speed Thresholds**: Star mapping accuracy
- **Color Calculation**: HSL color generation  
- **Performance**: Sub-20ms execution for 1000 segments
- **Integration**: Consistency between calculation paths

### Running Tests

```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode for development  
npm run test:coverage      # Generate coverage report
```

### Example Test Cases

```typescript
// Test wind direction categorization
test('should correctly categorize wind angles', () => {
  expect(categorizeWind(0, 15)).toBe('tailwind');      // 15° difference
  expect(categorizeWind(90, 45)).toBe('cross-tailwind'); // 45° difference
  expect(categorizeWind(180, 90)).toBe('crosswind');     // 90° difference  
});

// Test speed impact calculation
test('should calculate realistic speed impacts', () => {
  const result = calculateWindAnalysis(pureHeadwindRoute, 8.0, 270);
  expect(result.speedImpact).toBeLessThan(0);           // Negative impact
  expect(result.speedImpact).toBeGreaterThan(-50);      // Reasonable bound
});
```

## Migration Guide

### From Legacy Rating System

If upgrading from the old rating-based system:

#### Before (Legacy)
```typescript
<WindStars rating={route.windAnalysis.directionScore} />
```

#### After (New System)  
```typescript
<WindStars 
  strengthStars={windDistribution?.display?.strengthStars}
  directionColor={windDistribution?.display?.directionColor}
/>
```

### Calculating Wind Distribution

Replace direct wind service calls with unified service:

#### Before
```typescript
const analysis = WindService.calculateWindAnalysisV2(segments, windSpeed, windDir);
```

#### After
```typescript
const weather = { direction: windDir, speed: windSpeed, timestamp: Date.now() };
const result = WindIndexUnifiedService.calculateUnifiedWindIndex(route, weather);
```

### Timezone Handling

Replace device timezone with location timezone:

#### Before
```typescript
const eta = new Date(startTimestamp + hours * 3600 * 1000);
const timeStr = eta.toLocaleTimeString();
```

#### After  
```typescript
const eta = new Date(startTimestamp + hours * 3600 * 1000);
const localEta = TimeUtils.utcToLocal(eta.getTime(), timezone);
const timeStr = localEta.toLocaleTimeString();
```

## API Reference

### Core Types

```typescript
interface UnifiedWindResult {
  windIndex: number;           // 1-5 star rating
  speedImpact: number;         // Percentage impact
  segments: {
    tailwind: number;
    'cross-tailwind': number;
    crosswind: number;
    'cross-headwind': number;  
    headwind: number;
  };
  display?: {
    strengthStars: number;     // 1-5 stars from wind speed
    directionColor: string;    // HSL color string
  };
}

interface UnifiedWeatherData {
  direction: number;           // Wind direction (0-360°)
  speed: number;              // Wind speed (m/s)
  timestamp: number;          // UTC timestamp
}

// UI-ready wind data (used by RouteCard, route details)
interface WindDistribution {
  rating: number;              // 1-5 stars
  speedImpact: number;         // Percentage impact
  segments: Array<{
    type: string;              // Category name
    distance: number;          // Kilometers
    percentage: number;        // 0-100
  }>;
  display?: {
    strengthStars: number;     // 1-5 stars from wind speed
    directionColor: string;    // HSL color string
  };
  avgWindSpeed: number;        // m/s - used for display
}
```

### Key Methods

```typescript
// Primary calculation method
WindIndexUnifiedService.calculateUnifiedWindIndex(
  route: Route, 
  weather: UnifiedWeatherData
): UnifiedWindResult

// Wind speed to stars mapping
WindIndexUnifiedService.mapWindSpeedToStars(speedMps: number): number

// Direction bias to color mapping  
WindIndexUnifiedService.directionColorFromDistribution(segments): string

// Timezone-aware time formatting
TimeUtils.utcToLocal(utcTimestamp: number, timezoneOffset: number): Date

// Utility methods
WindIndexUnifiedService.createUnifiedWeatherData(direction, speed, timestamp?): UnifiedWeatherData
WindIndexUnifiedService.updateRouteWithUnifiedWindIndex(route, weather, options?): Route
WindIndexUnifiedService.cleanStaleWindData(route): Route
WindIndexUnifiedService.ensureFreshWindData(route, weather, options?): Route
```

---

**Version**: 2025-12-31
**Last Updated**: Documentation verification & WindDistribution interface
**Performance Target**: <20ms route calculation, <800ms route preview