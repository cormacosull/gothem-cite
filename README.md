WE GOTTHEM


To run the app, open one terminal window in root (i.e /gothem-cite).
Run 'npm i' to install all packages. 

run 'npx expo start' it should load a qr code alongside some other info. You can scan the qr code in the expo go app on your mobile device, or click w in the terminal to open it in a browser tab.

To launch the websocket server, open a second terminal window and cd to the server directory, (i.e. cd ./server if you are in the root)
then run 'npm run dev' to start up the server


## Shared types (client <-> server)

The client (`src/lib/protocol.ts`) and the server (`server/src/protocol.ts`) are separate npm
projects, so the `ClientMessage` / `ServerMessage` / `GameState` types can't be imported from
one shared package today. For the MVP we're accepting **manual sync** instead of setting up an
npm workspace: whenever you change one `protocol.ts`, copy the same change to the other one.
Both files carry a comment pointing at this rule. If the protocol keeps growing, revisit this
as an npm workspace (see `TECHNICAL_SPEC.md`, Phase 1).