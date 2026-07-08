# Wind2Ride Services Map

> 100 services in 14 categories | Updated: 2026-07-08 (line counts of the 13 services added 2026-07 measured that day; the rest 2026-06-11)

---

## Overview

| Metric | Value |
|--------|-------|
| **Total Services** | 100 top-level (+ `index.ts` barrel + 9 files in `weather/` and `providers/` subfolders) |
| **Categories** | 14 |
| **Large Files (>500 lines)** | 37 |
| **Critical Services** | 5 |

> Line counts measured 2026-06-11. Six services were deleted in the 2026-06
> refactor (marked DELETED below); two were created (`nominatimClient.ts`,
> `locationDisplayLegacy.ts`).

---

## Service Layers (do not merge)

Several service families look like duplicates but are deliberate **layers** —
each has its own consumers. The files carry `LAYER (do not merge)` header
comments (added in refactor step 2.2). Layer names below quote those headers.

| Family | Service | Layer (from file header) |
|--------|---------|--------------------------|
| Weather | `weatherService.ts` | API/data layer of the weather stack (WeatherAPILayer/WeatherCacheManager → WeatherService → CentralizedWeatherService → SharedStateService) |
| Weather | `centralizedWeatherService.ts` | Session-level orchestrator of the weather stack; sits ABOVE WeatherService, feeds SharedStateService |
| Location | `locationManager.ts` | Canonical location state for UI (GPS, start/finish, history, listeners) |
| Location | `locationDisplayLegacy.ts` | Legacy GPS + display-name surface kept for SharedStateService (extracted from old locationService.ts; different formatting than LocationDisplayService) |
| Route | `routingService.ts` | Route CALCULATION engine (OSRM/Valhalla, fallbacks) |
| Route | `routeService.ts` | Route CRUD/persistence |
| Route | `routeCloudSyncService.ts` | Firestore sync via NativeRouteSeed (stable contract: seed interface and storage keys must not change) |
| Cache | `advancedCacheService.ts` | Generic cache INFRASTRUCTURE; specialized caches (geocoderCache, regionalPlacesCache, elevationCacheService, smartRegionalCacheManager) are domain-specific clients/peers |

---

## Services by Category

### 1. Core System (10 services)

| Service | Lines | Purpose |
|---------|-------|---------|
| **sharedStateService.ts** | 2283 | CRITICAL - Single source of truth, Observer pattern, cross-tab sync |
| **centralizedWeatherService.ts** | 635 | LAYER: session-level orchestrator of the weather stack |
| **weatherService.ts** | 1262 | LAYER: API/data layer of the weather stack (OpenWeatherMap) |
| **appInitializationService.ts** | 1048 | App startup, GPS fallback strategies |
| **storageService.ts** | 2478 | AsyncStorage + Cloud Sync integration |
| **authService.ts** | 367 | Firebase auth, Google Sign-In |
| **firebaseClient.ts** | 290 | Centralized Firebase App/Auth/Firestore singleton |
| **config.ts** | 436 | API keys, rate limiting configuration |
| **errorHandlingService.ts** | 684 | Centralized error handling |
| **accountDeletionService.ts** | 194 | Account deletion (Google Play compliance) |

> Plus `services/index.ts` — barrel re-exports (not counted as a service).

**Key Dependencies:**
```
sharedStateService → AsyncStorage, EventEmitter, weatherService
centralizedWeatherService → weatherService, sharedStateService
storageService → AsyncStorage, Firebase, routeCloudSyncService
```

---

### 2. Location & Geocoding (17 services)

| Service | Lines | Purpose |
|---------|-------|---------|
| **locationManager.ts** | 2426 | LAYER: canonical location state for UI (GPS, start/finish, history, listeners) |
| **locationDisplayLegacy.ts** | 735 | LAYER: legacy GPS + display-name surface kept for SharedStateService (new in refactor 2026-06, extracted from old locationService) |
| **geocodingService.ts** | 2610 | Nominatim API, multi-TTL caches |
| **nominatimClient.ts** | 28 | Thin Nominatim HTTP client (new in refactor 2026-06; keeps all network I/O inside services/) |
| **localGazetteerService.ts** | 1512 | Offline index (50km radius) |
| **fastLocalIndex.ts** | 595 | High-performance local search engine (H3 tiles + prefix/trigram indices) |
| **hedgedSearchManager.ts** | 1277 | Parallel search with fallbacks |
| **photonFallbackService.ts** | 408 | Photon API geocoding fallback (free, OSM-based) |
| **regionalPlacesCache.ts** | 965 | Regional cache (100km radius) |
| **gpsManager.ts** | 715 | Low-level GPS, 7-day cache |
| **gpsPermissionPreferenceService.ts** | 157 | GPS permission 24h cooldown |
| **gpsQualityValidator.ts** | 259 | GPS signal quality validation |
| **ipGeolocationService.ts** | 66 | IP-based last-resort location fallback (ipapi.co) |
| **localeService.ts** | 249 | Multi-language place names |
| **locationDisplayService.ts** | 389 | Location formatting |
| **locationHistoryService.ts** | 362 | Search history |
| **locationEventEmitter.ts** | 93 | Location event bus |
| ~~locationService.ts~~ | — | DELETED — removed in refactor 2026-06 (used surface extracted to locationDisplayLegacy.ts) |
| ~~locationSearch.ts~~ | — | DELETED — removed in refactor 2026-06 (dead code) |

**Hedged Search Strategy:**
```
1. LocalGazetteer (SQLite, 50km, instant)
2. RegionalPlacesCache (SQLite, 100km, instant)
3. GeocodingService (Nominatim API, global, 1s)
4. PhotonFallback (Photon API, global, 2s)
```

---

### 3. Routing & Routes (17 services)

| Service | Lines | Purpose |
|---------|-------|---------|
| **routingService.ts** | 2496 | LAYER: route CALCULATION engine (OSRM/Valhalla, fallbacks) |
| **routeService.ts** | 900 | LAYER: route CRUD/persistence (saved routes) |
| **routeCloudSyncService.ts** | 818 | LAYER: Firestore sync via NativeRouteSeed (1-2KB seeds) |
| **keyWaypointService.ts** | 1154 | Auto-detect key waypoints |
| **autoWaypointService.ts** | 477 | Waypoint generation |
| **intelligentWaypointService.ts** | 660 | Smart waypoint selection |
| **waypointNamingService.ts** | 325 | Auto-naming waypoints |
| **routeConversionService.ts** | 371 | Format conversion |
| **routeImportConversionService.ts** | 313 | Import conversion |
| **backgroundRouteRegenerationService.ts** | 302 | Background regeneration |
| **roadGraphService.ts** | 161 | Road network graph |
| **osrmFallbackService.ts** | 215 | OSRM fallback handling |
| **valhallaService.ts** | 427 | Valhalla routing ("All Roads" mode, allows trunk roads) |
| **valhallaAdapter.ts** | 300 | Valhalla API adapter |
| **brouterAdapter.ts** | 248 | BRouter API adapter (primary road/gravel/mtb engine) |
| **brouterProfiles.ts** | 387 | Custom BRouter profiles uploaded at runtime (w2r-road) |
| **routeShapeMatchService.ts** | 175 | Imported GPS track → minimal waypoint set (shape matching) |
| ~~routeOptimizationService.ts~~ | — | DELETED — removed in refactor 2026-06 (dead code) |

**Naming Clarification:**
- `routingService` = Route calculation (OSRM API)
- `routeService` = Saved routes management (CRUD)

---

### 4. Wind Analysis (2 services)

| Service | Lines | Purpose |
|---------|-------|---------|
| **windIndexUnifiedService.ts** | 773 | Single source of truth, QuickWI <20ms |
| **windService.ts** | 385 | 5-category wind system |

**5-Category Wind System:**
```
0-30°:    TAILWIND         (green)
30-75°:   CROSS_TAILWIND   (yellow-green)
75-105°:  CROSSWIND        (yellow)
105-150°: CROSS_HEADWIND   (orange)
150-180°: HEADWIND         (red)
```

---

### 5. Elevation (6 services)

| Service | Lines | Purpose |
|---------|-------|---------|
| **elevationService.ts** | 1049 | Open-Elevation + Open-Meteo API |
| **elevationCacheService.ts** | 562 | Elevation cache (60-day TTL) |
| **adaptiveElevationSampler.ts** | 425 | Adaptive point sampling |
| **terrainPreScreener.ts** | 371 | Terrain pre-screening |
| **elevationTileCache.ts** | 149 | Durable per-point elevation cache ("terrain cells") |
| **terrariumElevationProvider.ts** | 170 | Free rate-limit-free elevation fallback (Terrarium tiles) |

> `elevationBackgroundService.ts` was removed before this refactor (earlier
> elevation cleanup). `valhallaAdapter.ts` is listed under Routing & Routes.

---

### 6. Import/Export (5 services)

| Service | Lines | Purpose |
|---------|-------|---------|
| **importService.ts** | 1409 | GPX/Strava import/export |
| **stravaAuthService.ts** | 795 | Strava OAuth |
| **stravaApiService.ts** | 842 | Strava API client |
| **stravaAuthModalService.ts** | 346 | Strava auth UI |
| **stravaRevoke.ts** | 33 | Strava token revocation (shared by both auth services) |

---

### 7. Cache Services (5 services)

| Service | Lines | Purpose |
|---------|-------|---------|
| **advancedCacheService.ts** | 778 | LAYER: generic cache infrastructure, LRU/LFU |
| **geocoderCache.ts** | 248 | Geocoding cache (6h default TTL) |
| **smartRegionalCacheManager.ts** | 510 | Regional cache management |
| **apiBatchingService.ts** | 582 | API request batching |
| **h3TileSystem.ts** | 584 | H3 tile system |

---

### 8. Map Services (4 services)

| Service | Lines | Purpose |
|---------|-------|---------|
| **mapService.ts** | 124 | Distance calculations (Haversine) |
| **mapMatchingService.ts** | 409 | GPS track map matching |
| **tilePreloader.ts** | 503 | Tile preloading |
| **osrmMonkeyPatch.ts** | 88 | OSRM library fixes |
| ~~mapTileService.ts~~ | — | DELETED — removed in refactor 2026-06 (TILE_SERVERS moved to utils/mapTileManager) |
| ~~mapConfigService.ts~~ | — | DELETED — removed in refactor 2026-06 (dead code) |

---

### 9. Notifications (8 services)

| Service | Lines | Purpose |
|---------|-------|---------|
| **notificationService.ts** | 701 | Push notification management |
| **pushNotificationService.ts** | 464 | Firebase Cloud Messaging (FCM), token management, deep linking |
| **notificationBackgroundService.ts** | 205 | Background notifications |
| **notificationSettingsService.ts** | 215 | Notification preferences |
| **notificationPermissionService.ts** | 110 | Permission handling |
| **rideWindowDigestService.ts** | 200 | Client-side "planning digest" engine |
| **weatherDropService.ts** | 227 | "Ride weather degraded" alerts for planned routes (A2) |
| **winBackService.ts** | 85 | Gentle "come back and ride" nudge after inactivity (D1) |

---

### 10. Social & Sharing (7 services)

| Service | Lines | Purpose |
|---------|-------|---------|
| **canonicalRouteHashService.ts** | 246 | Unique route identifiers |
| **plannedRidesService.ts** | 509 | Social ride visibility |
| **plannedRidesEventEmitter.ts** | 92 | Event bus for planned-rides changes |
| **sharedRouteService.ts** | 508 | Web route sharing links |
| **userProfileService.ts** | 357 | User profiles (nicknames) |
| **userRouteIndexService.ts** | 310 | Firestore index: which routes belong to which users (notification targeting) |
| **moderationService.ts** | 270 | Reports + user blocks (block cache, isBlocked) |

---

### 11. Logging & Monitoring (3 services)

| Service | Lines | Purpose |
|---------|-------|---------|
| **crashlyticsService.ts** | 243 | Firebase Crashlytics |
| **productionLogService.ts** | 327 | Memory-efficient ring buffer logging |
| **analyticsService.ts** | 275 | Firebase Analytics event tracking (production only) |

> App code never calls `console.*` directly — use `utils/logger.ts`
> (`log.debug/info/warn/error`). See `docs/LOGGING.md`.

---

### 12. Utility Services (12 services)

| Service | Lines | Purpose |
|---------|-------|---------|
| **settingsService.ts** | 125 | App settings management |
| **firstLaunchService.ts** | 87 | First launch detection |
| **debugExportService.ts** | 580 | Debug data export |
| **performanceMetricsService.ts** | 603 | Performance monitoring |
| **performanceMonitor.ts** | 42 | Additional perf monitor |
| **dataValidationService.ts** | 712 | Data validation |
| **timeCalculationService.ts** | 271 | Route time calculations |
| **backgroundRefreshService.ts** | 290 | Background cache preloading/refresh |
| **searchTelemetryService.ts** | 272 | Search telemetry |
| **onboardingHintService.ts** | 454 | Onboarding hints |
| **consentService.ts** | 40 | User consent state (privacy) |
| **reviewPromptService.ts** | 148 | In-app review rating-gate (D2 + D3) |
| ~~forecastSelection.ts~~ | — | DELETED — removed in refactor 2026-06 (dead code) |

---

### 13. UI Services (3 services)

| Service | Lines | Purpose |
|---------|-------|---------|
| **snackbarService.ts** | 142 | Global snackbar |
| **alertService.ts** | 47 | System alerts |
| **issueReportingService.ts** | 535 | Bug reporting |

---

### 14. Business (1 service)

| Service | Lines | Purpose |
|---------|-------|---------|
| **subscriptionService.ts** | 147 | Premium features placeholder |

---

## Subfolders

### services/weather/ (5 files)

| File | Purpose |
|------|---------|
| WeatherAPILayer.ts | Low-level OpenWeatherMap API |
| WeatherCacheManager.ts | Weather cache management |
| WeatherOptimizer.ts | Request optimization |
| WeatherServiceError.ts | Custom error types |
| openMeteoService.ts | Open-Meteo fog/visibility detection (WMO weather codes) |

### services/providers/ (4 files)

| File | Purpose |
|------|---------|
| osrmProvider.ts | OSRM routing provider |
| graphhopperProvider.ts | GraphHopper alternative |
| routingProvider.ts | Provider interface |
| index.ts | Exports |

---

## Deleted in Refactor 2026-06

| Service | Replacement / Reason |
|---------|----------------------|
| locationService.ts (2449 lines) | Used surface (~640 lines) extracted to `locationDisplayLegacy.ts`; rest was dead search-strategy code |
| locationSearch.ts | Dead code (with `LocationSearch.tsx` component) |
| mapTileService.ts | `TILE_SERVERS` moved to `utils/mapTileManager`; rest dead |
| mapConfigService.ts | Dead code, 0 consumers |
| routeOptimizationService.ts | Dead code, 0 consumers |
| forecastSelection.ts | Dead code, 0 consumers |

---

## Must-Read Services (Top 5)

1. **sharedStateService.ts** (2283 lines) — Cross-tab sync, weather cache
2. **centralizedWeatherService.ts** (635 lines) — Weather coordination
3. **locationManager.ts** (2426 lines) — GPS management
4. **routingService.ts** (2496 lines) — Route calculation
5. **windIndexUnifiedService.ts** (773 lines) — Wind analysis

---

## Rate Limiting (config.ts)

| API | Limit |
|-----|-------|
| OpenWeatherMap | 30 calls/min |
| OSRM | 2000ms interval |
| Nominatim | 100ms interval |
| Elevation | 50-200ms interval |
| Strava | 600 calls/15 min |

---

## Architecture Patterns

| Pattern | Services |
|---------|----------|
| **Singleton** | Most services (~80) |
| **Observer/PubSub** | sharedStateService, locationEventEmitter, plannedRidesEventEmitter, authService |
| **Cache Layer** | advancedCache, geocoderCache, elevationCache |
| **Strategy** | hedgedSearchManager (4 strategies), appInitialization (4 fallbacks) |
| **Facade** | centralizedWeatherService, storageService |

---

*Last updated: 2026-07-08 (added 13 services created after the 2026-06 refactor; base audit 2026-06-11)*
