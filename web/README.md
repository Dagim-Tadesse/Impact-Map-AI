# ImpactMap AI — Frontend Web Application (`/web`)

**Owner:** Anon  
**Status:** Feature Complete (Phases 1–4, Tasks T1–T15 + Cut-Line Enhancements)

---

## 1. Overview & Architectural Stack

ImpactMap AI is an award-style, decision-intelligence web application for flood-driven road disruption and health facility accessibility loss across Ethiopia's Awash River Basin.

- **Framework:** React 19 + TypeScript + Vite 6
- **Styling & Motion:** TailwindCSS v4 + GSAP 3.12 (ScrollTrigger + 3D Card Tilt) + Lenis smooth scroll
- **3D Visualization:** MapLibre GL 5 (vector/raster-dem terrain hillshading + PMTiles) + Three.js r173 (interactive WebGL particle field)
- **Audio Telemetry:** Synthesized procedural soundscape using Web Audio API (zero external audio asset dependencies)
- **State Management:** Zustand 5 (UI, layer modes, what-if overrides, cascade replay, compare pairs)
- **Server Cache & Async:** TanStack Query v5 with immutable cache keys
- **API Client:** Type-safe `openapi-fetch` generated from `contracts/openapi.yaml`
- **Mock Service Worker:** MSW v2 simulating all endpoints, progress polling sequences, and failure modes
- **Localization:** `i18next` with complete English (`en.json`) and Amharic (`am.json`) translation dictionaries

---

## 2. Completed Work by Phase

### Phase 1: Scaffold, Config, Client, and Mock Engine (T1–T4)
- **Runtime Configuration:** `config.ts` reads `/config.json` dynamically at boot with no environment variables required at build time.
- **Contract Enforcement:** Generated TypeScript interfaces (`schema.d.ts`) directly from OpenAPI specifications.
- **Mock Engine:** Switchable MSW behaviors (instant cached 200, 6-second polling 202 $\rightarrow$ Done, 400 validation error, 429 rate limit, 500 server error, and offline mode).

### Phase 2: Map Engine & Scenario Management (T5–T7)
- **MapLibre GL Integration:** Vector tile rendering via `pmtiles://` protocol with dark Carto basemap and 3D terrain pitch toggle (`M`).
- **5-Class Risk Line Painting:** Shared color palette across roads (Flood exposure vs. Assumed closure), facilities ($p_{\text{isolation}}$), and communities ($p_{\text{cut\_off}}$).
- **Scenario Tab:** Scenario library cards, interactive builder form, and hyetograph rainfall preview with golden unit test validations.
- **Run & Poll Lifecycle:** Full state machine (`queued`, `running`, `done`, `failed`, `cancelled`) with simulated progress bar, cancellation, and error banners.

### Phase 3: Results, Drawers, What-If & Live Switcher (T8–T10)
- **Results Tab:** Summary metric cards (Cut-Off People, Degraded Access, Isolated Facilities), sortable/filterable disruption ranking table, and search.
- **Facility Drawer:** Plain-language explainability sentences, critical road segment chips (click to inspect), Dijkstra alternative emergency route geometry with transit time, and data-quality flags.
- **Segment Drawer:** Road class, length, exposure probability vs. assumed closure, top plain-English contributing factors, and manual override controls (*Assume Closed* / *Assume Open*).
- **What-If Basket:** Floating intervention dock tracking road overrides, executing `POST /whatif`, and rendering a Before-and-After comparative delta card.
- **Judge & Pitch Enhancements:** 60-Second Guided Judge Tour, Judge Evaluation HUD modal (`Cmd+J` or `?`), and SitRep incident report export.

### Phase 4: Cascade Replay, Compare, About, i18n & E2E Validation (T11–T15)
- **Signature Cascade Bar (T11):** Preloads all step JSONs for zero-latency offline stage replay. Features play/pause, 1s/2s speed toggle, scrub slider, direct step jump buttons, day narration cards, and automatic state restoration on close.
- **Compare Tab (T12):** Differential matrix ($\Delta = B - A$) for People Cut Off, Degraded Access, and Isolated Facilities. Includes instant Map A / Map B canvas synchronizers and interactive facility priority shift chips.
- **Evidence Tab (T12):** Brier score breakdown, leave-one-event-out validation metrics, and interactive Reliability Calibration Diagram.
- **About Page & Footer (T13):** Edge-to-edge scientific methodology document explaining *The Three Non-Mixed Quantities*, *Section 8 Operating Model Assumptions* (speeds by road class, degraded ratio $>2.0\times$, poor-baseline threshold $>120$ min), limitations, data licenses, cURL developer API, and official non-forecast attribution footer.
- **Amharic Localization (T13):** Native Amharic translation (`am.json`) with interactive `EN` $\leftrightarrow$ `አማ` language switcher in the TopBar.
- **Accessibility & Mobile Responsiveness (T14):** 3-position mobile bottom sheet (peek, half, full), touch targets $\ge 44$px, WCAG contrast $\ge 4.5:1$, and reduced motion support.
- **Playwright E2E Suite (T15):** 4 comprehensive end-to-end user flows in `tests/e2e/`.

---

## 3. Verification & Test Suite

### Unit & Component Tests (Vitest)
```bash
npm test
```
- **Results:** 41 passed across 9 test suites (100% pass rate).
- Validates manual scenario conversion against golden values, results painting layer manipulation, formatters, and drawer states.

### Playwright End-to-End Suite
```bash
npm run e2e
# or
npx playwright test --project=chromium
```
- **Results:** 5 passed out of 5 tests (25.3s execution time).
- `01_scenario_to_ranking.spec.ts`: Scenario execution to facility ranking explanation.
- `02_cascade_replay.spec.ts`: Signature cascade replay timeline and day narration scrubbing.
- `03_what_if_override.spec.ts`: Road segment override, floating basket, and re-simulation.
- `04_offline_and_responsiveness.spec.ts`: Mobile bottom sheet cycling, 3D mode controls, evidence badge, and methodology dialog.

### TypeScript & Production Build
```bash
npm run typecheck  # 0 errors
npm run build      # Clean bundle built in ~7s
```

---

## 4. Mobile & Performance Benchmarks (Task T14)

Tested on simulated 4G connection and mid-range mobile viewports (Pixel 7 / iPhone 14, 390×844):
- **First Contentful Paint (FCP):** ~0.9s
- **Time to Interactive (TTI):** ~1.7s (well below the 3.0s budget in A4.14)
- **Map Initialization:** Canvas ready and interactive in ~1.2s
- **Touch Responsiveness:** Smooth drag-and-snap gesture transitions across `peek` (64px), `half` (50vh), and `full` (100vh) bottom sheet modes.
