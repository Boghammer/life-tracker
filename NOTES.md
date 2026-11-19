# Bog Life: project notes

Working notes for picking this project up in a fresh session. Last updated at v1.28.0 (2026-11-19).

## What it is
A no-build PWA life tracker for Magic: The Gathering (Commander-focused), installed to iPhone / iPad / Android home screens
from GitHub Pages. Everything is in one file, `index.html`. The owner pushes to GitHub themselves; Claude never pushes.

## Files
| File | Purpose |
|---|---|
| `index.html` | The whole app (HTML, CSS, JS). `APP_VERSION` near the top of the script. |
| `sw.js` | Service worker, network-first, cache name `life-v2`, FILES list includes `./qrcode.min.js` |
| `qrcode.min.js` | Vendored qrcode-generator 1.4.4 (MIT), used for the "Share the app" QR code |
| `manifest.webmanifest`, `icon.svg` | PWA install info (name "Bog Life") |
| `sheet-script/Code.gs` | Google Apps Script web app that receives shared results and feedback. See `sheet-script/README.txt` |
| `README.md` | One-paragraph readme |
| `.git/hooks/pre-commit` | Stamps `APP_BUILD` with the date and re-adds `index.html` |

## Run and test locally
```
cd C:\Users\chgle\Documents\Magic\life-tracker
python -m http.server 8765
```
Open http://localhost:8765/index.html (the Claude browser pane works; the server often stops between sessions, so restart it).
- Phone-size testing: resize the pane to 390 wide. Reset to desktop when done. `?angle=90` forces the rotated layout.
- **Service worker caches old copies.** If the pane shows an old version, unregister it and clear caches, then reload:
  `navigator.serviceWorker.getRegistrations()` then `unregister()`, and `caches.keys()` then `caches.delete()`. Check `APP_VERSION` in the pane.
- Clear `localStorage` after tests so test games don't pile up.
- Most behaviour is tested by calling app functions from the console: `S=fresh(n,mode); startedNewGame();`, `openCmdr(i)`,
  `openSheet(i)`, `openHistory()`, `update()`, `undo()`. `S` is the current game, `HIST` the saved games, `panels[i].P` the panel elements.
- Windows: Python is `C:/Users/chgle/anaconda3/python.exe`. Large edits are easiest as a small Python script (raw strings) that does
  exact `str.replace` with an assert that each target appears once. The Edit tool only works on a file that was Read first.

## Release routine (every change)
1. Bump `APP_VERSION` (e.g. 1.24.3 to 1.24.4; a new feature bumps the minor).
2. Test in the browser pane.
3. Commit with this trailer, and tell the owner the version shown in the ⚙️ menu:
   `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`
4. The owner pushes to GitHub Pages, then reopens the app on the phone, often twice, to get the new version.

## Owner preferences
- Any text on a light background must be black.
- Test in the built-in browser pane. Keep answers short and say plainly what was and wasn't tested (nothing here has been run on a real iPhone by Claude).
- Don't push; don't change anything outside the app without asking.
- No passwords or credentials: the owner once pasted a password in chat; it was not used.

## How the app is built (landmarks in `index.html`)
- **State** `S` (see `fresh()`): players (name, life, poison, energy, exp, `cmdr[]` and `cmdrB[]` damage from each source, `cmds[]`
  commanders `{name, oracle, art, artist, ill}`, `log`, `defeat`, `out`, `cantLose`, `safeSpans`, ...), monarch, initiative, round/rounds, first,
  bracket, `altWin`, `opps` (solo opponents), gameId, elapsed. Saved to `localStorage` key `mtg-life-v1`.
- **Layout:** `#stage` > `#app` (top and bottom rows of `.panel`s, each with a `.pc` content wrapper) plus `#bar`. The board is counter-rotated by
  `ROT` so panels stay fixed to the phone; `layoutPC` turns each panel's text toward its nearest outer edge. `body.tablet` and `body.solo` enlarge corner buttons (44px phone, 60 tablet, 76 solo). A panel wider than tall gets `data-wide` (ResizeObserver on `.pc`),
which puts the ⚔️ button left of the ☰ button instead of above it.
- **Rules:** `dead(p)`, `defeatCauses`, `placeOf`/`placeIcon`, ties (`tieInfo`/`openTie`), alternate win/lose by Scryfall card
  (`openCardPicker`), concede, empty library, can't-lose token (`holdPop`, hold 2 s to remove), speed token, bracket 1 to 5.
- **Commander damage:** only edited in the ⚔️ window (the player menu has no commander damage rows). Sources come from `srcs()` (all players, plus `S.opps` in a solo game). `cmdrAdjust(i,key,d)`; keys `c<j>` and `d<j>` (partner).
  A defeated player's commander can't add damage. **Drag to assign:** tap ⚔️ opens the window; hold it (350 ms) or drag it onto another player's panel
  (`wireCmdrDrag`) and the commander damage window opens for that player showing only the held player's commander(s) (`openCmdr(victim, only)`, turned toward
  the attacker); nothing is added until + is pressed. The button captures the pointer
  and stops the event so the +/- halves never see it (no accidental +5). No drag in solo games or for a defeated attacker. Chip order on a panel is clockwise from its owner (`chipOrder`).
  `holdRepeat` gives hold-to-repeat on +/- buttons.
- **Each opponent loses life:** row in the player menu, right under the commander name(s) (`openSheet`, not in solo games or for a defeated player). Amount stepper (`drainX`, starts at 0 with only + lit; the choice and Apply stay disabled until it is 1 or more, then "You gain nothing" is selected in green and the Done button turns green and reads "Done · opponents lose X · you gain Y"; Done applies it and closes, the ✕ closes without applying) plus a gain choice
  (`drainMode`: none / same amount / total lost = amount × opponents still in the game, counted even if their life ends at 0 or below). One undo step; both reset when the menu closes.
- **Scryfall:** `searchCommanders()` searches all English prints and folds them to one result per card, so Universes Beyond printed names
  (e.g. "Rick, Steadfast Leader" is a print of "Greymond, Avacyn's Stalwart") are found. `fetchArtworks()` for "Change art".
- **Solo game** (Players: Solo): one panel, no turn roll, no bracket. Win needs no card (`confirmSoloWin`, `S.altWin.solo`). The graph button lives on
  the panel only after a win or defeat. Monarch and Initiative are removed by holding. Opponents are added in the ⚔️ window (name and commander search).
  Solo games are never shared.
- **History:** `HIST` in `localStorage` key `mtg-life-history`. Record: `{id, startedAt, finished, auto, solo, format, bracket, seconds, rounds, altWin, sn, players[]}`.
  Every finished game is saved automatically; an unfinished game asks first when a new one is started. `sn` is a compact timeline used to redraw the summary
  image (`compactSnapshot`/`restoreSnapshot`/`drawSummary`). On the graph a defeated player's line ends at 0 for a life-loss defeat, and also for a commander/poison
  defeat when their life is 0 or less (outside protected stretches); the "Defeated by X" label is unchanged. CSV export is `historyCsv()` (LF line endings, BOM). Game history has sort buttons and a
  collapsible Filters section (players, bracket).
- **Sharing results:** `SHEET_URL` and `SHEET_KEY` are constants in `index.html`; the key must match `KEY` in `sheet-script/Code.gs`. Opt-in (Settings > Share results),
  names included by default, queued and retried, never for solo games. Feedback uses the same endpoint (`openFeedback`).
- **Modals:** `modal(html, bind)` fills `#card`. The player menu (`openSheet`) and commander damage window (`openCmdr`) are full-screen overlays. Use `dvh` and
  `env(safe-area-inset-*)` so nothing hides under the iPhone status bar or toolbar. `overscroll-behavior:none` on popups.

## Google Sheet
Set up in the owner's Google account (tabs Players, Games, Feedback). The web app URL is `SHEET_URL` in `index.html`. To change the script: paste into Apps Script,
then Deploy > Manage deployments > edit > New version (the URL stays the same). Full steps are in `sheet-script/README.txt`.

## Not yet confirmed on a real device
- Windows CSV double-spacing fix (LF line endings), QR code scan, iPad button sizes.
- iPhone: Settings title clear of the status bar (safe-area padding on popups), no rubber-band bounce in popups, solo player name clear of the top, Done bars flush with the bottom.
- Solo game in real landscape orientation.
- Hold-and-drag on the ⚔️ button with a real finger (tested only with simulated and mouse pointer events in the pane): line follows the finger, no +5 life.
- Android: the bottom bar (⚙️ and ⏸) was clipped on narrow screens; v1.24.4 tightens the docked bar under 480px wide. Checked at 320, 360 and 390 in the pane only.

## Ideas not built
- Show commander art as a background on damage rows; order of rows in the ⚔️ window (still seat order).
- A cleaner way to rotate the shared key (per-player invite codes) if the endpoint is abused.
