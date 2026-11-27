# Continental Rails

A browser railway board game. It follows the rules of Ticket to Ride: Europe, but the
name, map layout, routes, colours and artwork are all original.

## Standing rules
- **Keep the design original.** Never copy the original game's board, route network,
  artwork or name. Real city names are fine.
- **The editions share game logic.** When a gameplay change is asked for, apply it to
  every edition unless told otherwise.
- **Each edition is one self-contained `index.html`** (CSS + JS inline). The only
  external resource is Google Fonts, which has fallbacks. No build step, no libraries.
- **Test with the headless bot simulation before pushing:** `node test/sim.js 50`
  must end with `ALL CLEAN`.
- Ask before anything irreversible (force-push, deleting the repo or Pages, history rewrites).
- Commit only with the GitHub noreply address
  `355332325+akisbelibassakis@users.noreply.github.com` (set as this repo's local
  user.email). Never a work or personal address.
- Show before/after screenshots for visual changes.

## Layout
| Path | What |
|---|---|
| `index.html` | Start page linking the editions |
| `phone/index.html` | Upright phone edition (29 cities, compact map, Zoom toggle) |
| `pc/index.html` | PC / phone-sideways edition (29 cities, board-game look) |
| `*/manifest.webmanifest` | PWA manifest per edition (`display: fullscreen`, own orientation) |
| `*/sw.js` | Network-first service worker, so updates appear automatically |
| `icon-192.png`, `icon-512.png` | App icons (drawn by `test/make-icons.ps1`) |
| `.nojekyll` | GitHub Pages serves files as-is |
| `test/sim.js` | Headless bot simulation and rule checks |

Hosted on GitHub Pages from `main`, root: https://akisbelibassakis.github.io/continental-rails/

### Current state vs. the planned feature set
The repo was started (2026-11-27) from the two single-file versions that existed
locally. Compared with the later chat version, these do **not** yet have: the full
47-city edition (`full/`), double routes, 7- and 8-train routes (scoring 18/21),
long tickets, pinch/wheel zoom with + / − / fit buttons, or draggable/minimisable
floating windows. If the newer files turn up, replace `phone/` and `pc/` and add `full/`.

## How the game code works
- Constants at the top of the script: `CITIES` (name → [x, y] in the SVG viewBox),
  `ROUTES` (pipe-separated `CityA CityB length colour [T|F<n>]`; `X` = grey,
  `T` = tunnel, `F2` = ferry needing 2 Locos), `PTS` (score by length), `TUT` (tutorial steps).
- `G` holds the whole game state; `render()` redraws everything from it.
- Tickets are generated from city pairs whose shortest route costs 5–12.
- Rules implemented:
  - Draw 2 cards; a face-up Loco counts as the whole draw.
  - 3 face-up Locos reshuffle the face-up row.
  - Claim routes; scoring 1/2/4/7/10/15 for lengths 1–6.
  - Tunnels: reveal 3 cards, pay one extra for each match (colour or Loco).
  - Ferries need that many Locos.
  - Stations: cost 1/2/3 cards, borrow one rival route at the end, +4 each if unused.
  - Final round when anyone has ≤2 trains.
  - Longest continuous route: +10.
  - Tickets: keep ≥2 at start, ≥1 later.
- 1–3 computer opponents (`botTurn`). Their moves play out step by step, with a
  Speed up option. They build stations only when a ticket is blocked.
- UI: tutorial, Hint button, final-round pop-up and banner, full-screen button
  (hidden when installed as an app).

## Testing
- `window.__AUTO = true` makes every player a bot and plays a full game with no DOM
  rendering; `window.__NB` sets the number of opponents (1–3).
- `node test/sim.js [games]` runs that for each edition and each player count, then
  checks: no script errors, game finishes, trains = start − claimed lengths, route
  score matches `PTS`, 110 cards in total, ≤3 stations, no two stations in one city,
  ≥2 tickets kept. The local Node is v11, so the harness polyfills `Object.fromEntries`.
- For screenshots use the browser preview (or Playwright).

## Later (only when asked)
`android/`: Android WebView project with three product flavours (phone, pc, full) and a
GitHub Actions workflow that builds the APKs. Signing secrets: KEYSTORE_BASE64,
KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD (falls back to a debug key). When set up,
copy the latest edition HTML into `android/app/src/{phone,pc,full}/assets/index.html`
and bump `versionCode`. Not in this repo yet.
