# Continental Rails

A browser railway board game. It follows the rules of Ticket to Ride: Europe, but the
name, map layout, routes, colours and artwork are all original.

## Standing rules
- **Keep the design original.** Never copy the original game's board, route network,
  artwork or name. Real city names are fine.
- **One game for every screen.** `index.html` at the root is the whole game (CSS + JS
  inline). Its layout follows the orientation: upright = map on top, tray below;
  sideways/desktop = map on the left, side panel on the right. The only external
  resource is Google Fonts, which has fallbacks. No build step, no libraries.
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
| `index.html` | The game. Upright: ☰ menu + score strip, map (drag to pan, pinch or Ctrl+wheel to zoom the map only, from whole map to 2.5× fill; Zoom button presets fill / all / close), news ticker, tray with face-up cards, hand and buttons. Sideways: map left, side panel right with the same parts plus the ticket list. Light and dark mode. |
| `manifest.webmanifest`, `sw.js` | Installable app (fullscreen, any orientation) and network-first service worker, so updates appear automatically |
| `phone/`, `pc/` | Old addresses: `index.html` redirects to the root; `sw.js` kept for already-installed copies |
| `icon-192.png`, `icon-512.png` | App icons (drawn by `test/make-icons.ps1`) |
| `.nojekyll` | GitHub Pages serves files as-is |
| `test/sim.js` | Headless bot simulation and rule checks |

Hosted on GitHub Pages from `main`, root: https://akisbelibassakis.github.io/continental-rails/

### Current state vs. the planned feature set
Two maps, chosen on the start screen (remembered in localStorage `cr-map`):
- **Classic**: 29 cities, routes 1–6, 30/27/24 trains for 2/3/4 players, no long tickets.
- **Grand Europe**: 45 cities, an original route network (108 routes, double routes,
  routes up to 8), 45 trains each, 40 normal tickets plus 6 long tickets (★); each player
  is dealt 1 long + 3 normal and keeps ≥2. Rules follow the board game's rules; the map
  and route network must stay our own design (see the first standing rule).
Not yet: minimisable floating windows.

## How the game code works
- The background map (`LANDP` coastline, `BORD` borders) is Natural Earth 1:50m data
  (public domain), warped once so each city sits at its real place: an affine fit plus
  a Gaussian RBF (σ = 4°) on the city positions, then simplified. If cities move or new
  ones are added, the paths must be regenerated with the same method.
- `MAP_SRC` holds both maps: `cities` (name → [x, y] in the map's `vb` viewBox), `routes`
  (pipe-separated `CityA CityB length colour [T|F<n>]`; `X` = grey,
  `T` = tunnel, `F2` = ferry needing 2 Locos; two entries between the same cities = a double
  route), `trains`, ticket cost range `tix`, `deck` size and number of `longs`. `useMap(k)`
  parses a map once (pairs doubles, builds the ticket pool and long tickets = costliest
  trips with no shared city) and sets `MAP`, `CITIES`, `ROUTES`, `VB`. `PTS` (score by
  length 1–8), `TUT` (tutorial steps).
- Grand Europe's city positions are the real coordinates projected (equirectangular,
  cos 48°, 19.5 units/degree) with a few nudges; route lengths = round((distance − 15)/18).
- `G` holds the whole game state; `render()` redraws everything from it.
- Tickets are generated from city pairs whose shortest route costs 5–12.
- Rules implemented:
  - Draw 2 cards; a face-up Loco counts as the whole draw.
  - 3 face-up Locos reshuffle the face-up row.
  - Claim routes; scoring 1/2/4/7/10/15/18/21 for lengths 1–8.
  - Double routes: with 2–3 players only one track can be used (`closed`); nobody may own
    both tracks. `free(r, pi)` is the single check used by players, bots and path finding.
  - Tunnels: reveal 3 cards, pay one extra for each match (colour or Loco).
  - Ferries need that many Locos.
  - Stations: cost 1/2/3 cards, borrow one rival route at the end, +4 each if unused.
  - Final round when anyone has ≤2 trains.
  - Longest continuous route: +10.
  - Tickets: keep ≥2 at start (Grand Europe deals one long ticket extra), ≥1 later.
- 1–3 computer opponents (`botTurn`). Their moves play out step by step, with a
  Speed up option. They build stations only when a ticket is blocked.
- UI: tutorial, Hint button, final-round pop-up, news ticker (rivals' moves, Final round
  tag), ☰ menu with How to play / Game log / Full screen (hidden when installed) / New game.
  While you choose tickets the map stays draggable and jumps to the tapped ticket; the
  window itself can be dragged out of the way. The page itself never zooms (viewport
  user-scalable=no); map gestures are handled with pointer events (`touch-action: none`).

## Testing
- `window.__AUTO = true` makes every player a bot and plays a full game with no DOM
  rendering; `window.__NB` sets the number of opponents (1–3), `window.__MAP` the map.
- `node test/sim.js [games]` runs that for both maps and each player count, then
  checks: no script errors, game finishes, trains = start − claimed lengths, route
  score matches `PTS`, 110 cards in total, ≤3 stations, no two stations in one city,
  ≥2 tickets kept, double-route rule respected. The harness polyfills `Object.fromEntries` for old Node versions.
- For screenshots use the browser preview (or Playwright).

## Later (only when asked)
`android/`: Android WebView project and a
GitHub Actions workflow that builds the APKs. Signing secrets: KEYSTORE_BASE64,
KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD (falls back to a debug key). When set up,
copy `index.html` into the app's assets
and bump `versionCode`. Not in this repo yet.
