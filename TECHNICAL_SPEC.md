# Gothem Cité — Technical Spec

This document tracks the build order for Gothem Cité and what's already done. It's meant to
be updated as we go — check off tasks, add new ones, revise phases — rather than treated as
fixed upfront.

**Build order:** base architecture → game logic → device connection/sync → (all with
placeholder UI) → UI polish (pixel art, custom buttons) last. This lets us prove the hard,
multi-device part of the project works before spending time on visuals.

## 0. Stack (as actually configured in the repo)

- **Client**: React Native + Expo (SDK 57), Expo Router for navigation, TypeScript.
- **Server**: Node.js + TypeScript, `ws` for WebSockets, run as a separate npm project in
  `/server`.
- **State**: Zustand is installed but not yet wired up on the client — screens currently use
  local `useState`. Decide in Phase 1/2 whether Zustand replaces this or whether local state is
  enough for the MVP.
- **Tooling**: ESLint + Prettier configured at the root.
- **Communication protocol**: a small typed message set (`ClientMessage` / `ServerMessage`)
  defined in `src/lib/protocol.ts`, currently **hand-duplicated** in `server/src/protocol.ts`
  because client and server are separate npm projects. Flagged in-code as a candidate for an
  npm workspace later — not urgent, but don't let the two drift silently.

## 1. Architecture (current state)

```
                    GAME SERVER (server/src)
                    ── sessionManager.ts ──
                 Session / Mission / City state
                              │
                    NETWORK (WebSocket, ws://)
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                    ▼
       PARENT CLIENT                       CHILD CLIENT(S)
     (app/parent, placeholder)         (app/child → JoinScreen)
```

- The server (`server/src/sessionManager.ts`) is **authoritative**: it owns `GameState`
  (code, status, cityHealth, players, missions) and is the only thing that decides mission
  success/failure and win/loss. Clients report *what happened*; the server decides *what it
  means*. This matches the brief's "server as referee" requirement.
- Communication is event-based (`create_session`, `join_session`, `start_game`,
  `mission_result` from client → server; `session_created`, `join_ack`, `join_error`,
  `state_update`, `assign_mission`, `game_over` from server → client), not full-state polling.

## 2. Design Principles: Clean Architecture (server) + MVVM (client)

This is where the "separation between model, look-and-feel, and interaction components" and
"well-structured code" grading criteria live. We're adopting two complementary patterns, one
per side of the system, rather than inventing our own layering ad hoc.

### 2.1 Server: Clean Architecture

The server should be organized in concentric layers, with dependencies pointing **inward**
only (outer layers know about inner ones, never the reverse):

```
server/src/
├── domain/            # pure game rules, zero framework/IO knowledge
│   ├── entities/         GameSession, Player, Mission, CityState
│   └── rules/            e.g. health math, win/loss evaluation, mission graph resolution
├── application/       # use cases — orchestrate domain entities for one action
│   ├── createSession.ts
│   ├── joinSession.ts
│   ├── startGame.ts
│   └── reportMissionResult.ts
├── infrastructure/    # framework/IO adapters — the only layer that knows about `ws`
│   ├── websocketServer.ts   (today's index.ts)
│   └── connectionRegistry.ts (today's socketInfo Map)
└── protocol.ts        # shared wire types (the contract with the client)
```

- **Domain** never imports from `ws` or knows a socket exists — it's plain TypeScript,
  trivially unit-testable without spinning up a server.
- **Application** (use cases) is what today's `sessionManager.ts` mostly *is* already, just not
  yet split from the transport concerns living in `index.ts` (socket bookkeeping, `send()`,
  `broadcastState()`). Splitting these out means the mission-graph/dependency logic (Phase 3)
  can be unit-tested without a live WebSocket connection.
- **Infrastructure** is the thin `ws`-specific glue: it translates raw socket events into calls
  to the application layer, and application results into outgoing `ServerMessage`s.
- This isn't a rewrite from scratch — `sessionManager.ts`'s functions map almost 1:1 onto
  "use cases," and `protocol.ts` already plays the shared-contract role. The work is mostly
  *extracting* the domain rules (health math, win/loss check, and the new mission-dependency
  logic) into their own pure, socket-free module.

### 2.2 Client: MVVM

The client should follow **Model–View–ViewModel**, so a screen's *visual* code never contains
game/network logic and vice versa:

- **Model** — the shared types (`src/lib/protocol.ts`) plus any pure client-side domain logic
  (e.g. "is this code valid to submit," "how do we describe city health as a status word").
  No React, no UI.
- **ViewModel** — Zustand stores (currently installed but unused) or custom hooks that hold
  view state and expose intent-named actions to the View: e.g. a `useSessionViewModel()` that
  wraps `useGameSocket`, tracks phase (`entering` / `joining` / `waiting` / `error`), and
  exposes `join(code, name)` — instead of a screen component managing five `useState` calls
  and reading `lastMessage` itself, as `JoinScreen.tsx` does today.
- **View** — the React Native components/screens (`app/*`, `src/screens/*`,
  `src/components/*|*). Purely presentational: renders whatever the ViewModel gives it, calls
  the ViewModel's action functions on user input, never touches `GameSocket` or `protocol.ts`
  types directly.

Target folder shape:

```
src/
├── lib/                 # Model — protocol types, pure helpers
├── viewmodels/           # ViewModel — Zustand stores / hooks per screen or feature
│   ├── useSessionViewModel.ts
│   ├── useDashboardViewModel.ts
│   └── useMissionViewModel.ts
├── screens/              # View — screen-level components (today's src/screens)
├── components/           # View — presentational, reusable (today's src/components)
└── theme/                # look-and-feel tokens (already separated correctly)
```

`JoinScreen.tsx` today mixes all three: it holds state (`useState`), talks to the socket
directly, and renders. Migrating it to pull its phase/state/actions from a
`useSessionViewModel()` hook is a good first concrete step, and a template the parent
dashboard and each minigame can follow from the start rather than needing a later refactor.

## 3. Phase 1 — Base Architecture

Goal: project skeleton, navigation, shared types, and a design-token system in place, so every
later phase has somewhere to plug in.

- [x] Expo Router project scaffolded (`app/_layout.tsx`, `app/index.tsx`)
- [x] Role-select screen (Mission control vs I'm a hero) with routing to `/parent` and `/child`
- [x] Shared design tokens (`src/theme/tokens.ts`) — colors, spacing, radii, shadow helper
- [x] Reusable placeholder UI components: `PrimaryButton`, `CodeInput`
- [x] Shared protocol types defined (`GameState`, `Player`, `Mission`, `ClientMessage`,
      `ServerMessage`)
- [x] Server project scaffolded (`server/`), builds and runs independently (`npm run dev`)
- [x] Decide on and set up a shared-types solution (npm workspace, or accept manual sync for
      MVP and document it clearly in the README) — **decided: manual sync for MVP.** An npm
      workspace would need to fold the Expo app and the `ws` server into one workspace root,
      which risks Metro-bundler resolution issues for little payoff at this scale (one file,
      `protocol.ts`). Documented the duplication and the rule for keeping both copies in sync
      in the README instead; revisit as a workspace only if the protocol grows significantly.
- [x] Server: split `sessionManager.ts` / `index.ts` into `domain/rules.ts` (pure rules),
      `application/sessionService.ts` (use cases), and `infrastructure/websocketServer.ts`
      (WebSocket glue) per §2.1 — `index.ts` is now a 3-line entry point
- [x] Client: introduced the `viewmodels/` layer and migrated `JoinScreen.tsx` to use a
      `useSessionViewModel()` hook instead of managing socket + state directly, per §2.2
      (this becomes the template every later screen/minigame follows)
- [x] Add Zustand store(s) as the ViewModel layer's state mechanism, or explicitly decide to
      keep hook-based state and remove the unused dependency — either way, be consistent
      across all screens — **decided: dropped Zustand.** Each ViewModel today owns state
      that's local to one screen/hook (`useSessionViewModel`'s `useState`s aren't read
      anywhere else), so a shared store adds indirection without solving a real problem yet.
      Removed the unused dependency (`npm uninstall zustand`) so the dependency list matches
      what's actually used. Reconsider if a later phase needs state shared *across* independent
      components (e.g. the parent dashboard reading state that other components also mutate).

## 4. Phase 2 — Connection Between Devices

Goal: parent and child devices can find each other and stay in sync, independent of any game
logic beyond "who's in the lobby."

- [x] Server: `create_session` generates a unique 4-digit join code
- [x] Server: `join_session` validates code, session status, and the 3-player cap; assigns a
      player id
- [x] Server: broadcasts `state_update` to parent + all children on every roster change
- [x] Server: disconnect handling (`removeParent`, `removeChild` — marks player disconnected,
      re-broadcasts)
- [x] Client: `GameSocket` wrapper + `useGameSocket` hook (connect, message/status listeners,
      clean teardown)
- [x] Client: Join screen — code entry, name entry, connecting/error states, live roster while
      waiting
- [x] Parent: session-create screen that actually calls `create_session` and displays the
      returned code + live roster (currently a static placeholder)
- [ ] Reconnect handling: what happens if a child's app backgrounds/reconnects mid-game
      (currently a disconnect is terminal for that player)
- [ ] Config: confirm `EXPO_PUBLIC_SERVER_URL` usage and document how phones on the same
      Wi-Fi reach the laptop running the server (`.env.example` exists — verify README covers
      it)
- [x] Parent's session-create screen built as a View driven by a `useSessionViewModel()` (or
      equivalent parent-side ViewModel), not a component that calls the socket directly —
      keeps Phase 1's MVVM split real instead of it only applying to the child — added
      `useParentSessionViewModel()` (`src/viewmodels/useParentSessionViewModel.ts`) mirroring
      the child's ViewModel: it opens the socket, fires `create_session` once connected, tracks
      `phase`/`code`/`players` from `session_created`/`state_update`, and exposes `startGame()`.
      `SessionCreateScreen` (`src/screens/parent/SessionCreateScreen.tsx`) only renders that
      state — same split as `JoinScreen`/`useSessionViewModel`.

## 5. Phase 3 — Game Logic (with placeholder UI)

Goal: the full mission loop runs end-to-end — assignment, play, reporting, city-health update,
win/loss — using placeholder screens for the actual minigames (a button that immediately
reports success/failure is enough at this stage).

- [x] Server: round-robin mission assignment (fire/chase/bomb) on `start_game`
- [x] Server: city-health tick loop (drains over time, triggers loss at 0)
- [x] Server: `mission_result` handling — updates mission status, adjusts city health
      (+15 success / -10 failure), detects when all missions are resolved, ends the game
- [x] Server: manual smoke test (`testClient.ts`) proving the full loop works headlessly
- [ ] Character selection screen + message type (client picks a hero before missions are
      assigned; currently missions are assigned round-robin with no player choice)
- [ ] Mission **dependencies**: replace "assign all missions at once" with a small mission
      graph (even a simple chain — Mission A → Mission B → Mission C is enough for MVP) so
      clearing one mission triggers/unlocks the next, per the brief. This is domain logic
      (§2.1) — belongs in `domain/rules/`, testable without a socket.
- [ ] Three placeholder minigame screens (fire/chase/bomb) that are functionally correct but
      visually plain — each just needs a way to trigger a `mission_result` (success/fail) so the
      full loop can be tested by real people, not just the smoke-test script. Each gets its own
      ViewModel (e.g. `useFireMissionViewModel()`) so the eventual pixel-art pass in Phase 4
      only touches the View, never the mission logic.
- [ ] Parent: live dashboard screen — City Integrity meter, active emergencies with
      countdowns, per-hero status (replacing the current static placeholder), driven by a
      `useDashboardViewModel()`
- [ ] End-game screen (parent): win/loss banner + podium ranking
- [ ] End-game screen (child): simple "mission's over" screen reflecting win/loss
- [ ] Difficulty balancing pass: tune `HEALTH_DRAIN_PER_TICK`, `TICK_MS`,
      `MISSION_SUCCESS_RESTORE`, `MISSION_FAIL_PENALTY` against actual playtests, once the
      loop is playable

## 6. Phase 4 — UI Polish (last)

Goal: replace the placeholder comic-panel theme with the real visual identity, without
touching the screen structure or logic built in Phases 1–3. If the MVVM split from §2.2 held,
this phase should only ever touch files in `screens/` and `components/` — never
`viewmodels/` or `lib/`. Treat any polish task that forces a ViewModel change as a signal the
split leaked somewhere earlier.

- [ ] Pixel-art villains (The Jester, The Pidgeon, The Puzzler) and hero sprites
- [ ] City backdrop / dashboard illustration reflecting City Integrity level (matches the "city
      gets more damaged as health drops" idea from the concept doc)
- [ ] Custom buttons/iconography replacing `PrimaryButton`'s current flat style
- [ ] Minigame-specific art and juice (fire spread animation, chase movement, wire-cutting
      feedback)
- [ ] Sound effects / music (stretch)
- [ ] Transition/intro animations (stretch)

## 7. Testing & Verification

- Server has a standalone smoke test (`server/src/testClient.ts`) simulating a full
  parent+child session without the Expo app — keep this updated as the protocol grows; it's
  the fastest way to verify server logic changes.
- Once the domain layer (§2.1) is extracted, add small unit tests directly against it (health
  math, mission-dependency resolution, win/loss) — these don't need a socket or an Expo app
  at all, which is the whole point of pulling them out of `sessionManager.ts`.
- No automated tests on the client yet. At minimum, before each phase is considered "done,"
  do a manual run with the parent on one machine and 1–3 Expo Go clients on real phones on
  the same network, per the Hardware section of the project brief.

## 8. Known Gaps / Risks to Revisit

- Protocol types are duplicated by hand between client and server (accepted for MVP, see
  Phase 1) — a missed edit on one side will fail silently until runtime. README now documents
  the rule; still worth double-checking both files whenever `protocol.ts` changes.
- No mission-dependency logic yet, despite it being named in both the product brief and the
  "why it complies with the course" section — this is more than a nice-to-have, it's part of
  the pitched design.
- No reconnect story for a child that drops mid-mission.
- `server/tsconfig.json` had a stray `"ignoreDeprecations": "6.0"` that doesn't match the
  pinned TypeScript version (`^5.5.0`) and failed `tsc` outright (TS5103) — removed. If a
  future TS upgrade needs this flag, use whatever value matches the version actually
  installed.
