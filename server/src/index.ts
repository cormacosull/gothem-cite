//starts the server, the wiring is in infrastructure/websocketServer.ts

import { startWebSocketServer } from './infrastructure/websocketServer';

const PORT = Number(process.env.PORT) || 8080;

startWebSocketServer(PORT);
