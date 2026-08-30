# Blood on the Clocktower — Information Board

A lightweight, browser-based companion app for tracking players, characters, and information during a game of Blood on the Clocktower. It's built as a static, dependency-free web app — no build step, no backend, no account. All game state lives in the browser's `localStorage` on the device it runs on.

The UI is fully bilingual (German/English) and optimized for mobile use during a live session.

## Features

### Player roster & board
- Add, rename, and remove players; each gets an automatically assigned color from a fixed palette.
- Toggle any player onto/off a circular seating board with a single switch.
- Drag tokens freely around the board (pointer-based, works on touch and mouse).
- "Arrange in circle" auto-distributes all seated players evenly around the board, preserving their current clockwise seating order, with your own token fixed at the bottom (first-person view of the table).
- "Clear board" removes all seated players and their in-game state in one step, without touching the player list itself.
- A **lock** toggle switches the board between two modes:
  - **Unlocked** (setup phase): drag players onto the board and arrange seating.
  - **Locked** (playing phase): tapping a token opens that player's detail panel instead of moving it.

### Player details (in the locked/playing phase)
- **Roles**: tag any player with one or more character names (autocomplete against the loaded edition's role list, works in both languages), with the official role description shown on tap. Roles claimed by more than one player are visually flagged as possible bluffs/mix-ups ("double claims").
- **Trustworthiness**: a 5-step scale from Evil to Good (plus Suspicious / Unknown / Possibly trustworthy) for every player except yourself.
- **Life status**: Alive, Murdered, Executed, or Exiled (Exiled only applies to Travellers).
- **Notes**: a free-text field per player for anything else worth remembering.
- **Pings**: log who claimed information about whom.
  - Each ping records a source player, a source role/claim, an optional day, and a comment.
  - Pings can target multiple players at once via a quick-add dialog reachable from the toolbar.
  - A ping filter lets you highlight, per active filter, which players were named as a target of a given claim — shown as small colored dots on their board tokens.
  - A "double claims" filter highlights all players who share a claimed role.

### Grimoire / game setup
- **Edition selector**: Trouble Brewing, Bad Moon Rising, Sects & Violets, Travellers, or Experimental (all roles, no fixed script).
- **Fabled & Lorics**: add/remove official Fabled characters and Loric storyteller rules, each with name and description, kept separate from per-player state so clearing the board doesn't reset your setup.
- **Team distribution badge**: shows the current vs. expected number of Townsfolk/Outsiders, current Traveller count, and the expected Minion/Demon count for the seated player count, per the official rules — including automatic adjustment for modifier roles like the Baron.
- **Day counter**: increment/decrement the current in-game day; used as the default day for newly logged pings.

### Interface
- Full German/English localization with an instant language switch (no reload, cookie-persisted).
- Responsive, mobile-first layout with a collapsible sidebar for the player list / detail panel.
- Installable as a Progressive Web App (standalone display, app icons, manifest).
- Works fully offline after the first load — only the initial role catalog (`data/roles.json`) is fetched, everything else runs client-side.

## Persistence

All game state is stored in the browser's `localStorage` — nothing is sent to a server. Data is kept in separate slots so that resetting one doesn't affect the others:

| Key             | Contents                                   |
|-----------------|---------------------------------------------|
| `botc.roster`   | Player list (names, colors)                  |
| `botc.board`    | Seated players, positions, roles, trust, life status, notes, pings, day, lock state |
| `botc.edition`  | Selected edition                             |
| `botc.fabled`   | Active Fabled                                 |
| `botc.lorics`   | Active Lorics                                 |

Clearing the board (toolbar) only resets `botc.board`; the roster, edition, Fabled, and Lorics are untouched.

## Tech stack

Plain HTML, CSS, and vanilla JavaScript (ES modules) — no framework, no bundler, no build step, no dependencies. State management is a small custom pub/sub store ([src/state.js](src/state.js)) that persists to `localStorage` and notifies subscribed UI modules on change.

## License

MIT — see [LICENSE](LICENSE).
