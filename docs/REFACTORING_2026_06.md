# Refactoring Campaign 2026-06 — Final Report

**Branch**: `refactor` (baseline tag `pre-refactor-baseline` = 3d02f32)
**Dates**: 2026-06-10 → 2026-06-12
**Invariant**: zero functional or visual changes. Red list (Firestore collections,
AsyncStorage keys, deep links, env vars, NativeRouteSeed, config.ts endpoints)
untouched.
**Step-by-step log**: `docs/refactor-2026-06/PROGRESS.md`

---

## Results at a glance

| Metric | Before | After |
|--------|--------|-------|
| `app/route/[id].tsx` | 2950 lines | **909** (6 hooks + RouteDetailSheet component) |
| `app/(tabs)/plan.tsx` | 2336 lines | **1219** (3 hooks) |
| `app/(tabs)/index.tsx` | 1733 lines | **501** (2 hooks) |
| `console.*` in app code | ~3222 calls | **0** (→ `utils/logger.ts`, see docs/LOGGING.md) |
| Dead services | 6 | deleted (forecastSelection, mapConfigService, routeOptimizationService, locationSearch, mapTileService, locationService) |
| Direct `fetch()` outside services | 3 | 0 (→ services/nominatimClient.ts) |
| Hardcoded theme-identical colors | 17 | 0 (+2 new tokens windUnknown/windFallbackGreen) |
| tsc / jest | 0 errors / 167 passed | identical (every commit) |

## What was done (by phase)

- **Phase 0** — insurance: baseline tag, baseline tsc/jest record, junk cleanup,
  /privacy redirect on the landing site.
- **Phase 1** — dead code deletion; `utils/logger.ts` + codemod of all console
  calls; identical-hex colors → theme tokens; direct fetches → nominatimClient.
- **Phase 2** — locationService dissolved: used surface extracted verbatim to
  `locationDisplayLegacy.ts` (~640 lines), the remaining ~1800 lines deleted;
  LAYER header comments added to the weather/location/route service families.
- **Phase 3** — the three giant screens split into 11 domain hooks + 1 component,
  all code moved **verbatim** (no logic changes):
  - `hooks/route/` — useRouteSharing, useRouteElevation, useRouteWeather,
    useRouteSaving, useRouteMapEditing, useRouteLoader; plus
    `components/route/RouteDetailSheet.tsx` (bottom sheet JSX + styles).
  - `hooks/plan/` — usePlanWeather, useRouteCreation, usePlanLocations
    (call order matters: weather → creation → locations).
  - `hooks/myRoutes/` — useRouteShareActions, useMyRoutesData.
  - Pattern: shared data-state and refs stay in the screen and are passed in;
    each hook owns its domain state, effects and handlers.
- **Phase 4** — documentation refresh (SERVICES.md, ARCHITECTURE.md, LOGGING.md,
  this report, CLAUDE.md).

## Bugs found & fixed along the way (user-approved, outside the invariant)

- **save-as-update duplicate** (pre-existing): edit-mode recalculations minted a
  fresh `route_${Date.now()}` id, so "Save → update" created a duplicate.
  Fixed by passing `routeId` through 7 edit-mode calculateRoute call sites and
  respecting it on RoutingService cache hits (commit 1876820).
- **Unknown icon "triangle"** (pre-existing): climb-difficulty icon returned by
  elevationUtils was never registered in the icon registry; added
  MaterialCommunityIcons mapping.
- **UTF-8 mojibake incident** (refactor-inflicted, fixed same day): step 2.2
  initially edited files via PowerShell Get/Set-Content which read them as
  CP1251. Restored and re-applied. Rule since then: source edits only via
  Edit/Write tools or Node `fs` with explicit `utf8`.

## Known issues / backlog (pre-existing, NOT regressions)

See "Explicitly OUT of scope" in `docs/refactor-2026-06/PROGRESS.md`. Highlights:

1. **sharedStateService.ts decomposition** — CRITICAL file, needs more tests first;
   deliberately excluded (separate future campaign).
2. geocodingService / routingService / storageService decomposition — no test
   coverage on storage/geocoding; out of risk budget.
3. ~486 `any` types — fix opportunistically in touched files only.
4. Timezone-sensitive test in sharedStateService.test.ts fails depending on
   machine TZ.
5. Rename Route modal jitters on Android when keyboard opens
   (CenteredModal KeyboardAvoidingView behavior).
6. Corrupted route file `route_1781118690582` logs StorageService errors on every
   load; app recovers via seed regeneration (consider one-time cleanup).
7. `createReversedRoute` does not swap totalGain/totalLoss — reversed route
   statistics show the forward direction's elevation gain.
8. Dead-but-kept handlers: `handleWeatherRetry` exists in usePlanWeather and
   useMyRoutesData but is not wired to any UI (candidate for a retry button).
9. **Startup-sync micro-optimizations (deferred 2026-06-25, risk/reward unfavorable).**
   Considered after the cache/startup batch (fc2e205) but NOT done on close review:
   (a) dedup the regeneration skeleton-save — it's intentional UX
   (`syncStatus:'pending'` shows skeleton loaders so the route appears instantly);
   (b) dedup the double notification scheduling during regen — harmless (cancel +
   reschedule → one set, no duplicate notifications); (c) a local seed-manifest cache
   to skip the per-startup Firestore re-read + per-route timestamp checks — saves
   ~700ms but that check is exactly how cross-device changes propagate, so caching it
   risks sync correctness for marginal gain. Red-list-sensitive; revisit only with a
   dedicated cross-device test harness.

## Lessons / conventions established

- **Verbatim moves only** during structural refactors; one hook = one commit;
  tsc + jest after every commit; manual smoke at phase boundaries.
- **Never edit sources via PowerShell** (CP1251 mojibake); Node/Edit only; after
  mass edits grep for mojibake markers (`в†’|рџ|вњ`).
- **Atomic multi-step edits while Metro runs**: hot reload picks up intermediate
  broken states between "insert new" and "cut old" edits — combine them into a
  single Node read→transform→write when the dev server is running.
- TDZ-aware hook ordering: cross-hook cycles bridged via refs assigned after the
  hook call (see calculateAndCacheReversedRouteRef in route/[id].tsx).
