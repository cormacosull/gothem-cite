WE GOTTHEM


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