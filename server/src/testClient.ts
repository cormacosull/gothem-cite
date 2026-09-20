// Manual smoke test for the server, no Expo app required.
//
// Run:
//   Terminal 1:  npm run dev
//   Terminal 2:  npm run test-client
//
// Simulates a parent creating a session, a child joining, the game starting,
// and the child reporting a successful mission — logging every message so
// you can see the whole pairing working end to end.

import WebSocket from 'ws';
import type { ClientMessage, ServerMessage } from './protocol';

const URL = 'ws://localhost:8080';

function connect(
  label: string,
  onMessage: (message: ServerMessage) => void,
  onOpen?: (send: (message: ClientMessage) => void) => void
) {
  const ws = new WebSocket(URL);
  const send = (message: ClientMessage) => ws.send(JSON.stringify(message));

  ws.on('open', () => {
    console.log(`[${label}] connected`);
    onOpen?.(send);
  });
  ws.on('message', (raw) => {
    const message: ServerMessage = JSON.parse(raw.toString());
    console.log(`[${label}] received`, message);
    onMessage(message);
  });

  return { send };
}

let child: ReturnType<typeof connect>;

const parent = connect(
  'parent',
  (message) => {
    if (message.type === 'session_created') {
      console.log(`\nJoin code: ${message.code}\n`);
      setTimeout(() => {
        child.send({ type: 'join_session', code: message.code, playerName: 'Fatoumata' });
      }, 300);
    }
  },
  (send) => send({ type: 'create_session' })
);

child = connect('child', (message) => {
  if (message.type === 'join_ack') {
    setTimeout(() => parent.send({ type: 'start_game' }), 300);
  }
  if (message.type === 'assign_mission') {
    console.log(`\n[child] assigned mission: ${message.mission.type}\n`);
    setTimeout(() => {
      child.send({ type: 'mission_result', missionId: message.mission.id, success: true });
    }, 500);
  }
  if (message.type === 'game_over') {
    console.log(`\nGame over — result: ${message.result}\n`);
  }
});
