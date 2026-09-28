// Infrastructure layer — the only place in the server that knows about `ws`.
// Translates raw socket connect/message/close events into calls on the
// application layer (sessionService), and application results into outgoing
// ServerMessages. This used to be the bulk of index.ts; index.ts is now just
// the process entry point that starts this.

import { WebSocketServer, WebSocket } from 'ws';
import type { ClientMessage, ServerMessage } from '../protocol';
import * as sessions from '../application/sessionService';

// Track which session/role each socket belongs to, so we can clean up on disconnect.
const socketInfo = new Map<WebSocket, { code: string; role: 'parent' | 'child'; playerId?: string }>();

function send(ws: WebSocket, message: ServerMessage) {
  ws.send(JSON.stringify(message));
}

function handleMessage(ws: WebSocket, message: ClientMessage) {
  switch (message.type) {
    case 'create_session': {
      const state = sessions.createSession(ws);
      socketInfo.set(ws, { code: state.code, role: 'parent' });
      send(ws, { type: 'session_created', code: state.code, state });
      break;
    }
    case 'join_session': {
      const result = sessions.joinSession(message.code, message.playerName, ws);
      if ('error' in result) {
        send(ws, { type: 'join_error', reason: result.error });
        return;
      }
      socketInfo.set(ws, { code: message.code, role: 'child', playerId: result.playerId });
      send(ws, { type: 'join_ack', playerId: result.playerId, state: result.state });
      break;
    }
    case 'start_game': {
      const info = socketInfo.get(ws);
      if (info) sessions.startGame(info.code);
      break;
    }
    case 'mission_result': {
      const info = socketInfo.get(ws);
      if (info) sessions.reportMissionResult(info.code, message.missionId, message.success);
      break;
    }
  }
}

export function startWebSocketServer(port: number): WebSocketServer {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      let message: ClientMessage;
      try {
        message = JSON.parse(raw.toString());
      } catch {
        return; // ignore malformed messages
      }
      handleMessage(ws, message);
    });

    ws.on('close', () => {
      const info = socketInfo.get(ws);
      if (!info) return;
      if (info.role === 'parent') sessions.removeParent(info.code);
      if (info.role === 'child' && info.playerId) sessions.removeChild(info.code, info.playerId);
      socketInfo.delete(ws);
    });
  });

  console.log(`Gothem Cité server listening on ws://localhost:${port}`);
  return wss;
}
