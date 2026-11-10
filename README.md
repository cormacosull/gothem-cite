WE GOTTHEM


## Requirements

To play, you need:
- 1 computer with [Node.js](https://nodejs.org) and npm, for the server and the parent ("Mission control").
- 1 to 3 players, each on a phone or tablet  **or** in their own browser tab on the same computer.

## Running it

You need two terminal windows: one for the websocket server, one for the Expo app.

1. Install dependencies (first time only), from the root (i.e. `/gothem-cite`):
   ```
   npm i
   cd server && npm i && cd ..
   ```
2. **Terminal 1 — server.** Start this first, the client connects to it.
   ```
   cd server
   npm run dev
   ```
3. **Terminal 2 — client**, from the root:
   ```
   npx expo start
   ```
   This prints a QR code. Scan it in the Expo Go app on your phone, or press `w` in that
   terminal to open it in a browser tab.

### Testing on a real phone (not the web/simulator)

The app is hardcoded to fall back to `ws://localhost:8080` for the server address. On a real phone, "localhost" means the phone itself, not your laptop — so without extra config the app will fail to connect with a WebSocket error. 

Fix:
1. Make sure your phone and your laptop are on the **same network** (both on your home Wi-Fi, or both on your phone's Personal Hotspot).
2. Find your laptop's local IP on that network:
   ```
   ipconfig getifaddr en0
   ```
3. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_SERVER_URL` to that IP:
   ```
   EXPO_PUBLIC_SERVER_URL=ws://<your-laptop-ip>:8080
   ```
4. Restart `npx expo start` (env vars are baked in at bundle time, so a running server won't
   pick up a new `.env` on its own) and rescan the QR code.

You'll need to redo steps 2-4 whenever you switch networks, since your laptop's IP changes.


## Shared types (client <-> server)

The client (`src/lib/protocol.ts`) and the server (`server/src/protocol.ts`) are separate npm
projects, so the `ClientMessage` / `ServerMessage` / `GameState` types can't be imported from
one shared package today. For the MVP we're accepting **manual sync** instead of setting up an
npm workspace: whenever you change one `protocol.ts`, copy the same change to the other one.
Both files carry a comment pointing at this rule. If the protocol keeps growing, revisit this
as an npm workspace.

## Playing the game

1. On the computer, choose **Mission control** to get a pin code.
2. On each child device, choose **I'm a hero**, enter the code and a name, then press **Join the fight**.
3. On the parent, press **Start the briefing**, watch or skip the intro, then press **Begin the mission**.
4. On each child device, press **START** and play each mission using the controls shown on the screen:
   - **Fire:** aim by touching the street and hold **SPRAY!** (on the web, aim with the mouse and hold the spacebar).
   - **Puzzler:** type 5-letter words, and press the hint button if needed.
   - **Chase:** swipe or tilt (phone or iPad) to change lanes.
5. After each result, continue to the short break before the next mission. Follow the team's progress on the parent dashboard.
6. When the game ends, press **Play again** on the parent to open a new lobby.

## Code organization

| File / directory | Description |
|---|---|
| `app/` | Screens reachable by URL (Expo Router) |
| `app/_layout.tsx` | Root layout: loads the fonts and sets up navigation |
| `app/index.tsx` | Home screen: choose "Mission control" (parent) or "I'm a hero" (child) |
| `app/parent/index.tsx` | Parent flow: lobby, intro, briefing, dashboard, result |
| `app/parent/TutorialScreen.tsx` | Briefing screen shown before the missions start |
| `app/parent/dashboard.tsx` | Live dashboard: city health, player panels, mission board |
| `app/child/index.tsx` | Child flow: join, intro, missions, interlude, game over |
| `app/child/fire.tsx`, `chase.tsx`, `puzzler.tsx` | Open a single mini-game on its own (for testing) |
| `src/screens/` | Views used by the routes |
| `src/screens/IntroScreen.tsx` | Story intro slides, shared by parent and child |
| `src/screens/parent/SessionCreateScreen.tsx` | Lobby with the join code and the player roster |
| `src/screens/parent/ResultScreen.tsx` | End of game on the parent: final health and missions won |
| `src/screens/child/JoinScreen.tsx` | Enter the code and name, then shows the current game phase |
| `src/screens/child/StandbyScreen.tsx` | Waiting screen until a mission arrives |
| `src/screens/child/InterludeScreen.tsx` | Break between missions: city change and countdown |
| `src/screens/child/GameOverScreen.tsx` | End of game on the child devices |
| `src/screens/child/fire/` | The Jester fire game: `FireScreen.tsx` (view) and `logic.ts` (rules) |
| `src/screens/child/chase/` | The Pidgeon car chase: `ChaseScreen.tsx`, `ChaseArt.tsx` (road drawing) and `logic.ts` |
| `src/screens/child/puzzler/` | The Puzzler word game: `PuzzlerScreen.tsx`, `logic.ts`, and the word lists `wordles.json` and `nonwordles.json` |
| `src/viewmodels/` | ViewModels (MVVM): hooks that hold state, timers and server messages |
| `src/viewmodels/useParentSessionViewModel.ts` | Parent session: create, start, results, reconnect |
| `src/viewmodels/useSessionViewModel.ts` | Child session: join, missions, interlude, game over |
| `src/viewmodels/useIntroViewModel.ts` | Intro slides and their timer |
| `src/viewmodels/useFireMissionViewModel.ts`, `useChaseMissionViewModel.ts`, `usePuzzlerViewModel.ts` | Game loop and input for each mini-game |
| `src/components/` | Reusable UI: `PrimaryButton`, `CodeInput` (join code field), `IntroSlide` |
| `src/lib/protocol.ts` | WebSocket message and game state types (copy of the server's) |
| `src/lib/websocket.ts` | WebSocket client with automatic reconnection |
| `src/lib/useGameSocket.ts` | Hook that connects to the server and reconnects when the app returns to the foreground |
| `src/lib/villains.ts` | Villain names and crimes |
| `src/lib/scale.ts` | Size scaling for different screens, including web |
| `src/theme/tokens.ts` | Colours, spacing, fonts and shadow style |
| `src/types/assets.d.ts` | TypeScript declarations for image imports |
| `assets/` | Images: backgrounds, cars, fire, bomb, mission previews, app icons |
| `server/src/index.ts` | Server entry point: starts the WebSocket server on port 8080 |
| `server/src/infrastructure/websocketServer.ts` | Receives socket messages and sends replies |
| `server/src/application/sessionService.ts` | Sessions: create, join, start, assign missions, results, reconnect |
| `server/src/domain/rules.ts` | Game rules: city health, win/lose check, code generation |
| `server/src/protocol.ts` | Message types (keep in sync with `src/lib/protocol.ts`) |
| `server/src/testClient.ts` | Test script that simulates a parent and a child (`npm run test-client`) |
| `.env.example` | Template for the server address used on real phones |
| `app.json`, `package.json`, `tsconfig.json` | Expo app config, client dependencies and scripts, TypeScript config |
| `server/package.json`, `server/tsconfig.json` | Server dependencies, scripts and TypeScript config |
