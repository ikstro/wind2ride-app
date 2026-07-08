# Wind2Ride Architecture

This document reflects the current code as the source of truth.

> For full services list see: `docs/SERVICES.md`
> For troubleshooting see: `docs/TROUBLESHOOTING.md`
> For user guide see: `docs/USER_GUIDE.md`

---

## App Startup

### Entry Points
- `index.ts` → loads `expo-router/entry` and configures console warnings
- `app/_layout.tsx` → boots app, shows splash, calls `AppInitializationService.initialize()`

### Initialization Sequence (Priority Order)

| Priority | Service | Action | Delay |
|----------|---------|--------|-------|
| 1 | SharedStateService | Load persisted state & defaults | 0ms |
| 2 | GPSManager | Get GPS (cached, Odessa fallback) | 0ms |
| 3 | CentralizedWeatherService | Preload weather for location | 0ms |
| 4 | SharedStateService | Update current location | 0ms |
| 5 | RouteCloudSyncService | Background sync (if authenticated) | 4000ms |

### GPS Fallback Strategy
```
1. Try cached GPS (7-day validity)
2. Try fresh GPS (30s timeout)
3. Try last known location
4. Fallback to Odessa, Ukraine (default)
```

## Navigation

- Expo Router
  - Tabs: `app/(tabs)/_layout.tsx`
  - Routes: `app/(tabs)/index.tsx`
  - Plan: `app/(tabs)/plan.tsx`
  - Planned: `app/(tabs)/planned.tsx`
  - Profile: `app/(tabs)/profile.tsx`
  - Modals: `app/route/[id].tsx`, `app/map/[id].tsx`

## Services layer (`services/`)

- `sharedStateService.ts`: single source for planning prefs, weather cache, and location; notifies listeners.
- `windIndexUnifiedService.ts` and `utils/wind*`: wind impact calculations, categories, and ratings.
- `geocodingService.ts`: Nominatim search with TTL caches and rate limiting (HTTP goes through `nominatimClient.ts` — no module outside `services/` performs network I/O directly).
- `config.ts`: reads `API_KEYS` from `apiKeys.ts`, URLs, TTLs, limits, and user agent.
- Other helpers: error handling, performance metrics, storage.

### Service layers (do not merge)

Several service families are deliberate **layers**, not duplicates — each layer
has its own consumers. The files carry `LAYER (do not merge)` header comments
(refactor 2026-06, step 2.2). Full table: `docs/SERVICES.md`.

**Weather stack** (bottom → top):
```
WeatherAPILayer / WeatherCacheManager (services/weather/)
  → WeatherService            (API/data layer)
  → CentralizedWeatherService (session-level orchestrator)
  → SharedStateService        (cross-tab cache + listeners)
```

**Location:**
- `locationManager.ts` — canonical location state for UI (GPS, start/finish, history, listeners). New code uses this.
- `locationDisplayLegacy.ts` — legacy GPS + display-name surface kept ONLY for SharedStateService (extracted as-is from the deleted `locationService.ts`). Formatting differs from `locationDisplayService.ts` — do not merge.

**Route stack:**
```
routingService        (route CALCULATION engine: OSRM/Valhalla/BRouter, fallbacks)
routeService          (route CRUD/persistence)
routeCloudSyncService (Firestore sync via NativeRouteSeed — stable contract: seed interface and storage keys must not change)
```

All requests to FOSSGIS-hosted routing services (routing.openstreetmap.de,
valhalla1.openstreetmap.de, brouter.de) send `CONFIG.FOSSGIS_HEADERS` —
`User-Agent` + `X-Client-Id: wind2ride.app` (their guidelines for published
apps, B2). Registration thread: FOSSGIS routing GitHub Discussions (manual
step, text drafted in the B2 commit).

**Cache:** `advancedCacheService.ts` is generic cache infrastructure; specialized caches (`geocoderCache`, `regionalPlacesCache`, `elevationCacheService`, `smartRegionalCacheManager`) are domain-specific clients/peers.

## Cache map

Verified against code 2026-06-11 (refactor step 4.2):

| Cache | TTL | Where (source of truth) |
|-------|-----|-------------------------|
| Weather (hourly/daily) | 60 min (`CACHE_DURATION`) | `sharedStateService.ts` |
| Weather provider fallback | OpenWeatherMap primary → Open-Meteo on 429/failure (OWM-shaped) | `services/weather/WeatherAPILayer.ts` + `openMeteoService.ts` |
| Routing distance cache (in-memory) | 1 h (5 min for fallback/straight-line results) | `routingService.ts` |
| Saved routes list (in-memory) | 30 s (routes themselves persist in AsyncStorage indefinitely) | `routeService.ts` |
| GPS position | 7-day stored cache; accepted age: 24 h at startup / 1 h at runtime / 2 min on explicit refresh | `gpsManager.ts` |
| Geocoding (reverse) | 6 h | `geocodingService.ts` |
| Geocoding (prefix search) | 48 h | `geocodingService.ts` |
| Geocoding (geographic) | 30 days | `geocodingService.ts` |
| Geocoder cache (default) | 6 h | `geocoderCache.ts` |
| Elevation | 60 days TTL. RAM (`AdvancedCacheService`, priority `high`) + **durable AsyncStorage for route-level keys** (`route_id_<id>`) so saved routes survive restart without re-fetching; coordinate-based keys stay RAM-only | `elevationCacheService.ts` |
| config.ts defaults | weather 1 h, route 24 h, location 30 min | `services/config.ts` (`*_CACHE_TTL`) |

> Note: older docs quoted "weather 15 min / routes 7 days / geocoding 7 days" —
> the values above are what the code actually uses.

## Screen hooks (refactor 2026-06, phase 3)

The three biggest screens were decomposed into custom hooks. Pattern: the code
was moved **verbatim** — hooks own their domain state, effects and handlers;
shared data-state and refs stay in the screen and are passed in.

### `hooks/route/` — for `app/route/[id].tsx` (909 lines as of 2026-06)

| Hook | Owns |
|------|------|
| `useRouteLoader` | loadRoute, reversed-route calculation, toggle reverse |
| `useRouteWeather` | forecast data, wind distribution, prefs listener |
| `useRouteElevation` | elevation loading state, Climb loader |
| `useRouteSaving` | save/update handlers, back-handler |
| `useRouteMapEditing` | edit-mode map interactions (long-press, drag, delete waypoints) |
| `useRouteSharing` | share dialogs, GPX/text/link share handlers |

The bottom-sheet UI (compact/fullscreen headers, snap/animation logic) was
extracted to `components/route/RouteDetailSheet.tsx`; all state stays in the
screen.

### `hooks/plan/` — for `app/(tabs)/plan.tsx` (1219 lines as of 2026-06)

| Hook | Owns |
|------|------|
| `usePlanWeather` | weather/daily/hourly state, refresh, date/time change |
| `useRouteCreation` | distance calculation (debounced OSRM), edit-route loading, create-route handlers |
| `usePlanLocations` | location init (4-priority), subscriptions, start/end selection |

**Call order matters**: weather → creation → locations (location handlers use
editing setters from creation; usePlanWeather reads gpsUnavailable owned by the
screen).

### `hooks/myRoutes/` — for `app/(tabs)/index.tsx` (501 lines as of 2026-06)

| Hook | Owns |
|------|------|
| `useMyRoutesData` | routes/weather/wind state, all data effects, sort/date handlers, pull-to-refresh |
| `useRouteShareActions` | share dialog state, GPX/text/link handlers |

## Logging

`console.*` is **banned in app code** (services/, components/, utils/, app/,
hooks/). Use `utils/logger.ts` instead:

- `log.debug` / `log.info` — console in DEV, ring buffer in production
- `log.warn` / `log.error` — always console (+ ring buffer)

Production logs go to `productionLogService.ts` (ring buffer, exportable from
the Debug tab). Details: `docs/LOGGING.md`.

## Analytics events (Firebase Analytics, production build only)

`services/analyticsService.ts` — enabled only in the production Play Store build
(`isProductionBuild`); dev/preview builds are silent. All params are non-PII.
Funnel completed in B3 (2026-07-02).

| Event | Params | Fired from |
|---|---|---|
| `screen_view` | screen_name | `app/_layout.tsx` (every route change) |
| `onboarding_completed` | method: completed\|skipped | `WelcomeCarousel` |
| `route_created` | bike_type, distance_km, source_type | `storageService.saveSavedRoute` |
| `route_planned` | bike_type, distance_km | `storageService.savePlannedRoute` |
| `first_route_created` | source: created\|planned\|imported\|shared | auto, once per install (piggybacks on the three above) |
| `route_imported` | source (gpx\|strava\|shared_link) | import modals + `app/shared/[id]` |
| `share_opened` | — | `app/shared/[id]` (shared link opened) |
| `route_shared` | method | `ShareRouteButton` |
| `route_deleted` | — | `storageService.deleteRoute` |
| `limit_hit` | limit_type: sync; action: save\|plan\|share | SaveRouteButton / PlanRouteButton / useRouteSharing |
| `verdict_shown` | verdict_class: great\|ok\|hard\|brutal; reverse_better; has_better_hour | `DecisionBlock` (once per route+class) |
| `strava_connected` | — | `stravaAuthService` |
| `google_signin` | — | `authService` |

User properties: `auth_type` (authService), `bike_type` (settingsService.updateBikeType),
`route_count` (storageService on save/delete of saved routes).

- `common/`: base UI, alerts, selectors, tab icons, weather widget.
- `route/`: cards, headers, wind displays, progress bars, stats.
- `map/`: map view, polylines, segments, tooltips.
- `modals/`: settings and option pickers.
- `skeletons/`: loading placeholders.

## Configuration

- `apiKeys.ts`: set `OPENWEATHER_API_KEY`. For no key: `USE_DEMO_MODE = true`.
- `services/config.ts`: consumes `API_KEYS` and exposes endpoints/limits.
- `app.config.ts`: app metadata, splash, and Google Maps keys for native maps.

## Data flow (weather/wind)

1. Get user coordinates (`GPSManager` / `LocationManager`).
2. Fetch weather (`CentralizedWeatherService` → `SharedStateService.loadFreshWeatherData`).
3. Cache in `SharedStateService` (hourly/daily), keyed by location and time.
4. Compute wind indices via `windIndexUnifiedService` and `utils/windCalculations.ts`.
5. UI reads cached weather and derived wind to render bars/segments.

## Cloud Sync Architecture

### Seed-Based Sync
Routes are synced as lightweight "seeds" (1-2KB) instead of full routes (100KB+):
- **Seed contains**: waypoints, bike type, name, timestamps
- **Regenerated on sync**: full route via OSRM API

### Sync Flow
```
Save Route → Create Seed → Upload to Firestore → Device B downloads → Regenerate via OSRM
```

### Limits
- 10 native routes (Saved + Planned combined)
- Native routes only (excludes Strava/GPX imports with GPS tracks)
- Offline queue with 3 retry attempts
- Conflict resolution: latest `updatedAt` wins

### Key Services
- `firebaseClient.ts` — Firebase/Firestore singleton
- `routeCloudSyncService.ts` — CRUD, seed conversion, offline queues
- `storageService.ts` — Integrated save/delete hooks

---

## Notes

- Rate limiting via `RateLimiter` inside `services/config.ts`.
- Map tiles use CartoDB light theme per config to comply with OSM.
- All UI text and docs must be English.

---

*Last updated: 2026-06-11 (refactor 2026-06, step 4.2)*




