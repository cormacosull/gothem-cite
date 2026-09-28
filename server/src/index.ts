// Process entry point. Wiring lives in infrastructure/websocketServer.ts;
// this file just reads config and starts it.

import { startWebSocketServer } from './infrastructure/websocketServer';

const PORT = Number(process.env.PORT) || 8080;

startWebSocketServer(PORT);
