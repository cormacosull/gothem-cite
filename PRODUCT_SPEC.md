# Gothem Cité — Product Spec

## 1. Concept

Gothem Cité is a cooperative multiplayer party game. A group of friends play as Gothem's
protectors, fighting off a wave of crimes before the city collapses. One device — the **parent**
(a PC/laptop on a shared screen) — is mission control: it shows the city's status, active
emergencies, and a shared **City Integrity** meter. Each player has their own **child** device
(phone/tablet) and, when an emergency hits, is assigned a task tied to one of Gothem's
villains:

| Villain | Mission | Type |
|---|---|---|
| The Jester | Put out fires | `fire` |
| The Pidgeon | Police chase | `chase` |
| The Puzzler | Bomb defusal | `bomb` |

Players solve their own mission independently on their own device and report the result back
to mission control, which updates the shared city state. Missions can unlock one another, so
the team's *combined* performance — not any one player's — decides Gothem's fate.

- **Lose condition:** City Integrity reaches 0 before the missions are cleared.
- **Win condition:** the team clears all missions while City Integrity is above 0. Players are
  then ranked on a podium showing who was the best crime fighter.

> *Ratman, Bobin, Gothem. At the end of the game: WE GOTHEM!!!*

## 2. Roles

### Parent (mission control)
- Runs on a laptop/PC connected to a shared display.
- Creates the session and displays the join code.
- Never plays a minigame directly — it's a status/monitoring surface, not an input surface.
- Shows: join code, roster, city map/status, active emergencies with countdowns, City
  Integrity meter, and the end-of-game podium.

### Child (hero)
- Runs on a phone/tablet via Expo Go.
- Joins a session with the code, picks a hero, and waits in the lobby.
- When mission control starts the game, receives an assigned mission and plays exactly one
  minigame at a time.
- Reports success/failure back; the **server**, not the child, decides what that means for the
  city (see Technical Spec — server is authoritative).

## 3. Core Game Loop

1. **Session creation** — Parent opens the app, chooses "Mission control," server generates a
   4-digit join code, parent displays it.
2. **Join** — Each child opens the app, chooses "I'm a hero," enters the code and a name/alias,
   and lands in a waiting lobby. The parent's roster updates live as heroes join.
3. **Character select** — Each joined hero picks a character/hero identity before the game
   starts. *(Not yet implemented — see Technical Spec Phase 3.)*
4. **Intro/lore** — A short, skippable intro explains the setup and the villains, shown once the
   host starts the game. *(Not yet implemented.)*
5. **Dashboard live** — The parent switches from lobby to the live city dashboard: City
   Integrity meter, active emergencies with countdowns, and which hero is on which mission.
6. **Mission assignment** — The server assigns each connected hero a mission. Each child
   switches from "waiting" to its assigned minigame.
7. **Minigame play** — The hero plays their minigame (fire, chase, or bomb — each with a
   distinct input/interaction style). On completion, the child reports success or failure.
8. **City state update** — The server updates City Integrity and mission status, then broadcasts
   the new state to everyone. The parent's meter and alert list update immediately.
9. **Repeat / unlock** — If missions have dependencies, clearing one can reveal the next
   emergency. This repeats until either City Integrity hits 0 (loss) or all missions are cleared
   (win).
10. **End screen / podium** — Parent shows win or loss, and on a win, ranks players on a
    podium (e.g., by missions completed, speed, or a simple score). *(Not yet implemented.)*

## 4. Screen-by-Screen UX Flow

All screens below currently exist as functional-but-placeholder UI (comic-panel color theme,
no illustration/pixel art yet) unless marked "not yet implemented."

### Parent device
| Screen | Purpose | Status |
|---|---|---|
| Role select | Choose "Mission control" vs "I'm a hero" | Implemented |
| Session create / code display | Shows the 4-digit join code, live roster as heroes join | Not yet implemented (currently a static placeholder) |
| Live dashboard | City Integrity meter, active emergencies + countdowns, per-hero mission status | Not yet implemented |
| End screen / podium | Win/loss banner, hero ranking | Not yet implemented |

### Child device
| Screen | Purpose | Status |
|---|---|---|
| Role select | Choose "Mission control" vs "I'm a hero" | Implemented |
| Join screen | Enter code + alias, see connection/error states | Implemented |
| Lobby / waiting room | Roster of joined heroes, waiting for host to start | Implemented (as part of Join screen) |
| Character select | Pick a hero identity | Implemented (placeholder art — 4 colored rectangles, no real hero identities yet) |
| Intro/lore | Scenario, villains, the team, the City Integrity meter, and the mission types — auto-advancing slides, skippable | Implemented (placeholder art — rectangle per slide, real illustrations pending Phase 4) |
| Standby | Holding screen after the intro, before a supported mission is available | Implemented (placeholder for Fire assignments) |
| Minigame: Fire | Put out fires (The Jester) | Implemented and dispatched to players assigned a fire mission |
| Minigame: Chase | Police chase (The Pidgeon) — 3-lane dodger, swipe or tilt, survive the timer | Implemented (placeholder art — colored rectangles, real sprites pending Phase 4) |
| Minigame: Bomb | Bomb defusal puzzle (The Puzzler) | Implemented; dispatched to players assigned a bomb mission |
| Mission result screen | Confirms success/failure, waits for next assignment | Not yet implemented |

## 5. Design Direction (deferred to final phase)

The current UI uses a functional "comic panel" placeholder theme (ink/gold palette, hard
outlines, no illustration) defined in `src/theme/tokens.ts`. This is deliberate: architecture,
game logic, and device sync are built and proven first, with placeholder UI throughout. Once
the full loop works end to end, the last development phase replaces this placeholder look with
hand-drawn pixel art (villains, hero sprites, city backdrop) and custom buttons/iconography,
without changing the underlying screen structure or logic.

## 6. Open Product Questions

These aren't blocking, but should be decided before or during Phase 3:
- How many missions make up one full playthrough, and what's the dependency shape (a
  simple chain vs. a small branching graph)?
- What exactly determines "best crime fighter" for the podium (speed, number of successes,
  or something else)?
- Does a mission ever require more than one hero at once (a "team mission"), or is every
  mission always solved by exactly one hero? (The written brief's example server design
  treats missions as independent per-player; confirm this is still the intended MVP scope.)
