# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A single-page Vue 3 + Vite trip planner for the 2026 Fukuoka Marathon. Mobile-first, Traditional Chinese UI, deployed on Vercel as a static SPA. No backend, no tests, no linter, no TypeScript.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # production build to dist/
npm run preview   # preview built bundle
```

There is no test runner, lint, or typecheck script. Do not invent one — run `npm run build` to verify changes compile.

## Architecture

### Data is the source of truth

All trip content lives in three static JSON files under `src/data/` (`itinerary.json`, `budget.json`, `phrases.json`). Components import them directly — there is no API, store, or fetcher. To change trip content, edit JSON; to change layout, edit Vue.

`itinerary.json` shape: `{ trip, days[], packingList, info }`. Each `day` has a flat `events[]` array. Events carry `category` (transport/food/culture/rest/shopping/marathon), an `icon` kebab-name resolved by `src/utils/iconMap.js`, optional `lat`/`lng`, and a `transitToNext` describing how to reach the next event.

### `locationGroup` is the central modeling concept

Events are stored flat but rendered as **location groups**: consecutive events sharing the same `locationGroup` value collapse into one card with a time range and a dominant category. The grouping logic lives in `src/composables/useLocationGroups.js` (`groupEventsByLocation`) and is consumed by both `DayView.vue` (timeline cards) and `MapView.vue` (numbered map markers). When adding events, set `locationGroup` so consecutive stops at the same place merge correctly; distinct visits to the same place get distinct group keys by being non-consecutive.

### URL is the state store

There is no Pinia/Vuex. Cross-tab state syncs through the Vue Router URL:

- `/day/:dayNum` — itinerary view for a given day
- `/map?day=N&group=I` — map view; `group` (optional) is the index into the day's `locationGroups`, which puts the map into "focus mode" with prev/current/next segment cards

`App.vue` reads `route.params.dayNum` and `route.query.day` to keep the bottom-nav `行程`/`地圖` links pointed at the same day across tabs. `MapView.vue` uses `router.replace` (not `push`) when navigating between groups so back-button behavior stays sane. When adding cross-tab features, follow the same pattern — encode state in the URL, not in a shared module.

### Map (Leaflet, hand-managed)

`MapView.vue` instantiates Leaflet imperatively in `onMounted`, holds `map` and `layerGroup` in module-scoped `let` bindings (not refs — Leaflet objects must not be made reactive), and re-renders via a `watch` on `[selectedDayNum, focusedGroupIndex, groupsWithCoords]` that calls `nextTick(renderMap)`. `layerGroup.clearLayers()` is the only teardown between renders. If you add map state, follow this pattern: keep Leaflet objects out of refs, clear and redraw on state change, and dispose in `onBeforeUnmount`.

Markers are `L.divIcon` HTML circles colored by `CATEGORY_COLORS` (duplicated locally in `MapView.vue` — kept in sync with the `--accent-*` CSS variables in `src/styles/global.css`). Focus mode dims non-adjacent markers and adds a pulsing ring on the current one.

### Design system

`src/styles/global.css` defines the entire token set as CSS custom properties: surfaces, category accents (`--accent-transport`, `--accent-food`, etc. plus matching `-soft` variants), spacing on an 8dp scale, radii, timing, and a dark-mode block under `prefers-color-scheme: dark`. Components use the tokens; do not hardcode colors or spacing. Category colors are mapped to CSS vars by `getCategoryColor` / `getCategorySoftColor` in `useItinerary.js` — use those rather than touching the variables directly from JS.

Three Google Fonts are preloaded in `index.html`: Shippori Mincho (display), Noto Sans JP (body), DM Mono (numerics, exposed as `font-mono` class and used for times/dates).

### Routing & deployment

`vercel.json` rewrites all paths to `index.html` so client-side routes survive refresh. All page components in `src/pages/` are lazy-loaded via dynamic `import()` in `src/main.js`. The `/` route redirects to `/day/6` (trip start day).

## Conventions

- Vue 3 `<script setup>` SFCs only. No Options API, no JSX.
- Path alias `@` → `/src` (configured in `vite.config.js`) — currently unused; relative imports are the norm.
- Icons come from `lucide-vue-next`. For icons referenced by string (in `itinerary.json`), add the component to `src/utils/iconMap.js` so `resolveIcon` can find it; unknown names fall back to `CircleDot`.
- UI copy is Traditional Chinese with Japanese place names. Keep this style when adding strings.
