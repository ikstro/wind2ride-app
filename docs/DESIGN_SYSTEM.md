# Design System - Wind2Ride

> Design tokens and visual guidelines for Wind2Ride app.
> Source: `constants/theme.ts`
> Theme Provider: `contexts/ThemeContext.tsx`

---

## Theme Support

The app supports **dark** and **light** themes via `ThemeProvider`.

```typescript
// Using theme in components
import { useTheme } from '../contexts';

function MyComponent() {
  const { colors, spacing, isDark } = useTheme();
  return <View style={{ backgroundColor: colors.background }} />;
}
```

---

## Table of Contents
- [Colors](#colors)
- [Overlay Colors](#overlay-colors) *(new)*
- [Snackbar Colors](#snackbar-colors) *(new)*
- [Brand Colors](#brand-colors) *(new)*
- [Wind Colors](#wind-colors-domain-specific)
- [Elevation Colors](#elevation-colors)
- [Weather Colors](#weather-colors)
- [Spacing](#spacing)
- [Typography](#typography)
- [Line Height](#line-height) *(new)*
- [Border Radius](#border-radius)
- [Shadows](#shadows)
- [Hit Slop](#hit-slop)

---

## Colors

### Background Colors
| Token | Value | Usage |
|-------|-------|-------|
| `colors.background` | `#1A1A1A` | App background |
| `colors.surface` | `#262626` | Cards, elevated surfaces |
| `colors.surfaceHover` | `#333333` | Hover states |
| `colors.surfaceElevated` | `#2A2A2A` | Higher elevation surfaces |
| `colors.surfaceDisabled` | `#1F1F1F` | Disabled surface state |
| `colors.surfaceVariant` | `#333333` | Progress bars, variants |
| `colors.cardBackground` | `#262626` | Card backgrounds (alias for surface) |
| `colors.backgroundSecondary` | `#1F1F1F` | Alternative background |

### Primary & Accent
| Token | Value | Usage |
|-------|-------|-------|
| `colors.primary` | `#9FE870` | Primary actions, accents, CTA buttons |
| `colors.primaryDark` | `#8FD860` | Pressed primary state |
| `colors.accent` | `#9FE870` | Accent color (alias for primary) |
| `colors.secondary` | `#8B5CF6` | Secondary info (purple) |
| `colors.tertiary` | `#FFA500` | Tertiary accent (orange) |

### Text Colors
| Token | Value | Usage |
|-------|-------|-------|
| `colors.textPrimary` | `#FFFFFF` | Primary text, headings |
| `colors.textSecondary` | `#999999` | Secondary text, labels |
| `colors.textTertiary` | `#666666` | Tertiary text, hints |
| `colors.textDisabled` | `#555555` | Disabled text |
| `colors.text` | `#FFFFFF` | Alias for textPrimary |

### Status Colors
| Token | Value | Usage |
|-------|-------|-------|
| `colors.success` | `#9FE870` | Success states |
| `colors.warning` | `#FACC15` | Warning states |
| `colors.error` | `#EF4444` | Error states |
| `colors.info` | `#3B82F6` | Information states |

### Border Colors
| Token | Value | Usage |
|-------|-------|-------|
| `colors.border` | `#3A3A3A` | Default borders (`#333333` moved to `borderSubtle`) |
| `colors.borderLight` | `#444444` | Light borders |
| `colors.outline` | `#444444` | Outline/border color |

---

## Overlay Colors

For modal backgrounds, bottom sheets, and dimming layers.

| Token | Value | Usage |
|-------|-------|-------|
| `colors.overlay` | `rgba(0,0,0,0.5)` | Standard modal overlay |
| `colors.overlayDark` | `rgba(0,0,0,0.7)` | Dark overlay (alerts) |
| `colors.overlayLight` | `rgba(0,0,0,0.3)` | Light overlay |

---

## Snackbar Colors

Notification toast backgrounds and text.

| Token | Value | Usage |
|-------|-------|-------|
| `colors.snackbarWarning` | `#FF9800` | GPS unavailable |
| `colors.snackbarWeather` | `#FFA500` | Weather unavailable |
| `colors.snackbarError` | `#FF6B35` | No connection |
| `colors.snackbarRetrying` | `#FFD700` | Retrying connection |
| `colors.snackbarSuccess` | `#4CAF50` | Social notifications |
| `colors.snackbarText` | `#000000` | Dark text on light bg |
| `colors.snackbarTextLight` | `#FFFFFF` | Light text on dark bg |

---

## Brand Colors

Third-party brand colors.

| Token | Value | Usage |
|-------|-------|-------|
| `colors.stravaBrand` | `#FC4C02` | Strava orange |
| `colors.sunny` | `#FFD700` | Sunny weather icon |

---

## Wind Colors (Domain-specific)

5-category wind direction system based on angle relative to travel direction.

| Category | Angle Range | Token | Value | Meaning |
|----------|-------------|-------|-------|---------|
| Tailwind | 0-30° | `colors.windGreen` | `#9FE870` | Pure assistance (easiest) |
| Cross-tailwind | 30-75° | `colors.windYellowGreen` | `#84CC16` | Partial assistance |
| Crosswind | 75-105° | `colors.windYellow` | `#FACC15` | Neutral |
| Cross-headwind | 105-150° | `colors.windOrange` | `#FB923C` | Partial resistance |
| Headwind | 150-180° | `colors.windRed` | `#EF5443` | Full resistance (hardest) |

> **Palette v3 (2026-07, UX overhaul).** A muted "brick" pass was tried and rejected on real
> cards (read as dull); vividness is restored. `windRed #EF5443` is `#EF4444` hue-shifted
> +6° warm, so wind alarm still differs from `colors.error`/`temperatureHot`, which keep
> `#EF4444` — wind ≠ error. Light-theme text variants: `windRedText #DA3A1E`,
> `windOrangeText #EE6C0A`. Invariant: bright wind fills are identical in both themes
> (readable-text mapping matches baked segment colors against the dark palette).

### Wind SPEED scale (one scale app-wide)

`getWindSpeedColor()` in `utils/windCalculations.ts` — the only speed→color mapper.
Bands are locked to verdict `SPEED_CAPS` (jest-guarded), so color and verdict text never disagree:

| Speed | Color | Verdict cap |
|-------|-------|-------------|
| < 6 m/s | `windGreen` | — |
| 6–8 m/s | `windYellow` | ok |
| 8–10 m/s | `windOrange` | hard |
| ≥ 10 m/s | `windRed` | brutal |

Rules: direction arrows/labels are **neutral** (`textSecondary`) — only the speed value and
bar fills carry color. Text renders through `getReadableTextColor(...)`.

**Additional wind color:**
| Token | Value | Usage |
|-------|-------|-------|
| `colors.windYellowOrange` | `#FFA500` | Legacy token (no live consumers since 2026-07) |

---

## Elevation Colors

Climb-focused system for Mixed Mode display.

| Token | Value | Usage |
|-------|-------|-------|
| `colors.elevationGreen` | `#00FFC3` | Downhill/Descent (cyan) |
| `colors.elevationFlat` | `transparent` | Flat terrain (hidden in Mixed Mode) |
| `colors.elevationBlue` | `#6B8AFF` | Moderate climb (3-5% gradient) |
| `colors.elevationPurple` | `#9D4EDD` | Steep climb (5%+ gradient) |
| `colors.elevationRed` | `#FF6881` | Legacy uphill (compatibility) |

### Legacy Elevation Colors (backward compatibility)
| Token | Value | Usage |
|-------|-------|-------|
| `colors.elevationLegacyBlue` | `#3B82F6` | Steep descent (-5% and steeper) |
| `colors.elevationLightBlue` | `#60A5FA` | Moderate descent (-2% to -5%) |
| `colors.elevationNeutral` | `#94A3B8` | Flat terrain (-2% to +2%) |
| `colors.elevationPink` | `#F472B6` | Moderate climb (+2% to +5%) |
| `colors.elevationHotPink` | `#EC4899` | Steep climb (+5% and steeper) |

---

## Weather Colors

### Weather Quality
| Token | Value | Condition | Accuracy |
|-------|-------|-----------|----------|
| `colors.weatherExcellent` | `#9FE870` | Excellent | >80% exact forecasts |
| `colors.weatherGood` | `#84CC16` | Good | 60-80% exact forecasts |
| `colors.weatherFair` | `#FACC15` | Fair | 40-60% exact forecasts |
| `colors.weatherPoor` | `#FB923C` | Poor | <40% exact forecasts |

### Temperature
| Token | Value | Range |
|-------|-------|-------|
| `colors.temperatureHot` | `#EF4444` | >=25°C |
| `colors.temperatureWarm` | `#FB923C` | 15-25°C |
| `colors.temperatureCool` | `#3B82F6` | 5-15°C |
| `colors.temperatureCold` | `#8B5CF6` | <5°C |

### Precipitation
| Token | Value | Usage |
|-------|-------|-------|
| `colors.precipitationBlue` | `#3B82F6` | Rain/precipitation display |

---

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `spacing.xs` | `4px` | Minimal gaps, icon margins |
| `spacing.sm` | `8px` | Tight spacing, small gaps |
| `spacing.base` / `spacing.md` | `12px` | Default spacing |
| `spacing.lg` | `16px` | Section gaps, card padding |
| `spacing.xl` / `spacing.large` | `20px` | Large sections |
| `spacing.xxl` | `32px` | Major sections |
| `spacing.xxxl` | `48px` | Screen-level spacing |

**Aliases:**
- `spacing.medium` = `spacing.md` = `12px`
- `spacing.large` = `spacing.xl` = `20px`

---

## Typography

### Font Sizes
| Token | Value | Usage |
|-------|-------|-------|
| `fontSize.xs` | `12px` | Captions, timestamps |
| `fontSize.sm` | `14px` | Secondary text, labels |
| `fontSize.base` / `fontSize.md` | `16px` | Body text |
| `fontSize.lg` | `18px` | Subtitles, emphasized text |
| `fontSize.xl` | `20px` | Section headers |
| `fontSize.xxl` | `24px` | Page titles |
| `fontSize.xxxl` | `32px` | Large headings |

### Font Weights
| Token | Value | Usage |
|-------|-------|-------|
| `fontWeight.normal` | `400` | Body text |
| `fontWeight.medium` | `500` | Emphasized text, section labels |
| `fontWeight.semibold` | `600` | **In-card titles**, buttons, card row titles |
| `fontWeight.bold` | `700` | Screen/modal titles, metric VALUES (data emphasis) |

**Rule (rail restyle 2026-07):** titles inside cards are `semibold`; `bold` is reserved
for screen-level headings and data values (wind speed, distances, selected cell text).

---

## Border Radius

**Semantic roles (rail restyle 2026-07) — prefer these in new code:**

| Token | Value | Usage |
|-------|-------|-------|
| `borderRadius.card` | `16px` | **Any card surface sitting on the page canvas** (BaseCard default) |
| `borderRadius.control` | `12px` | **Interactive elements**: buttons, inputs, chips, weather cells, option rows, segmented controls |

Rule of thumb: on the canvas → `card`; an interactive row ON a surface → `control`.

Size scale (for everything else):

| Token | Value | Usage |
|-------|-------|-------|
| `borderRadius.sm` | `8px` | Small elements, badges, inner segments |
| `borderRadius.md` | `12px` | = `control` (legacy alias in old code) |
| `borderRadius.lg` | `16px` | = `card` (legacy alias in old code) |
| `borderRadius.xl` | `24px` | Bottom sheets top corners |

**Aliases:**
- `borderRadius.small` = `borderRadius.sm`
- `borderRadius.medium` = `borderRadius.md`
- `borderRadius.large` = `borderRadius.lg`

---

## Selected State (one spec)

`getSelectedSurface(colors, isDark)` in `constants/theme.ts` — the ONE selected style
(ring width `SELECTED_RING_WIDTH` = 1.5):

| Theme | Ring | Fill |
|-------|------|------|
| Light | `windGreen` 1.5px | `primaryContainer` |
| Dark | `accent` 1.5px | `surfaceHover` |

Used by `BaseCard variant="selected"`, weather cells, option rows, presets. Reserve the
same `borderWidth` on the unselected state (transparent) so selection never shifts layout.
Segmented controls (TabSelector/SortSelector/DifficultySwitch) are a different family —
fill-swap, no ring.

---

## Shadows

### Small Shadow (`shadows.sm`)
```typescript
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.22,
  shadowRadius: 2.22,
  elevation: 3,
}
```
**Usage:** Subtle elevation, chips, small cards

### Medium Shadow (`shadows.md`)
```typescript
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
}
```
**Usage:** Cards, buttons, floating elements

---

## Hit Slop

Touch target extensions for accessibility (minimum 48px recommended).

| Token | Value | Usage |
|-------|-------|-------|
| `hitSlop.sm` | `8px` all sides | Small icons |
| `hitSlop.md` | `12px` all sides | Default touchable |
| `hitSlop.lg` | `16px` all sides | Important actions |

---

## Default Values

### Wind Defaults (`defaultWind`)
| Property | Value | Description |
|----------|-------|-------------|
| `direction` | `220°` | Default SW wind direction |
| `speed` | `8.0 m/s` | Default moderate wind speed |
| `fallbackSpeed` | `15 m/s` | Legacy routing fallback |

---

## Usage Examples

### Importing Tokens
```typescript
import { colors, spacing, fontSize, borderRadius, shadows } from '../constants/theme';
```

### StyleSheet Example
```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.card, // card surface on canvas; controls use .control
    ...shadows.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold, // in-card titles are semibold; bold = screen titles / values
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});
```

### Wind Color Selection
```typescript
function getWindColor(angle: number): string {
  if (angle <= 30) return colors.windGreen;
  if (angle <= 75) return colors.windYellowGreen;
  if (angle <= 105) return colors.windYellow;
  if (angle <= 150) return colors.windOrange;
  return colors.windRed;
}
```

---

## Related Documentation

- [Components Catalog](./COMPONENTS.md)
- [Design Debt Tracking](./DESIGN_DEBT.md)
- [Wind Index System](../WIND_INDEX.md)
