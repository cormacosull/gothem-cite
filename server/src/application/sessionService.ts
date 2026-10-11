// Application layer — orchestrates domain rules and in-memory session state
// for each of the game's use cases (create a session, join a session, start
// the game, report a mission result, handle disconnects). This is what used
// to be sessionManager.ts; the health/mission math it relied on inline now
// lives in domain/rules.ts, and the WebSocket wiring that called it lives in
// infrastructure/websocketServer.ts. This layer knows about sockets only
// enough to send messages to them — it never touches `ws` server setup.

import type { WebSocket } from 'ws';
import type { GameState, Player, Mission, ServerMessage } from '../protocol';
import {
  STARTING_CITY_HEALTH,
  MAX_PLAYERS,
  TICK_MS,
  missionTypeForIndex,
  drainHealth,
  applyMissionResult,
  evaluateOutcome,
  generateSessionCode,
  generatePlayerId,
  generateMissionId,
} from '../domain/rules';

interface Session {
  state: GameState;
  parent: WebSocket | null;
  children: Map<string, WebSocket>; // playerId -> socket
  tickHandle: ReturnType<typeof setInterval> | null;
}

const sessions = new Map<string, Session>();

function send(ws: WebSocket, message: ServerMessage) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message));
}

function broadcastState(session: Session) {
  const message: ServerMessage = { type: 'state_update', state: session.state };
  if (session.parent) send(session.parent, message);
  for (const child of session.children.values()) send(child, message);
}

export function createSession(parentSocket: WebSocket): GameState {
  const code = generateSessionCode((c) => sessions.has(c));
  const state: GameState = {
    code,
    status: 'lobby',
    cityHealth: STARTING_CITY_HEALTH,
    players: [],
    missions: [],
  };
  sessions.set(code, { state, parent: parentSocket, children: new Map(), tickHandle: null });
  return state;
}

export function joinSession(
  code: string,
  playerName: string,
  childSocket: WebSocket
): { error: string } | { playerId: string; state: GameState } {
  const session = sessions.get(code);
  if (!session) return { error: 'No session with that code.' };
  if (session.state.status !== 'lobby') return { error: 'Game already in progress.' };
  if (session.state.players.length >= MAX_PLAYERS) {
    return { error: `Session is full (${MAX_PLAYERS} players max).` };
  }

  const playerId = generatePlayerId();
  const player: Player = { id: playerId, name: playerName, connected: true };
  session.state.players.push(player);
  session.children.set(playerId, childSocket);

  broadcastState(session);
  return { playerId, state: session.state };
}

export function startTutorial(code: string, socket: WebSocket): { error: string } | { ok: true } {
  const session = sessions.get(code);
  if (!session) return { error: 'No session with that code.' };
  if (session.parent !== socket) return { error: 'Only mission control can do that.' };
  if (session.state.status !== 'lobby') return { error: 'The mission has already started.' };
  if (session.state.players.length === 0) return { error: 'Wait for at least one hero to join.' };

  session.state.status = 'tutorial';
  broadcastState(session); // children see status 'tutorial' and keep waiting
  return { ok: true };
}
export function completeTutorial(code: string, socket: WebSocket): { error: string } | { ok: true } {
  const session = sessions.get(code);
  if (!session) return { error: 'No session with that code.' };
  if (session.parent !== socket) return { error: 'Only mission control can do that.' };

  if (session.state.status !== 'tutorial') return { ok: true };

  session.state.status = 'playing';
  assignMissions(session);
  broadcastState(session);

  // Referee tick: city health drains over time until missions restore it.
  session.tickHandle = setInterval(() => {
    session.state.cityHealth = drainHealth(session.state.cityHealth);
    if (session.state.cityHealth <= 0) {
      endGame(session, 'lost');
      return;
    }
    broadcastState(session);
  }, TICK_MS);

  return { ok: true };
}

function assignMissions(session: Session) {
  session.state.missions = session.state.players.map((player, i) => {
    const type = missionTypeForIndex(i);
    player.mission = type;
    const mission: Mission = {
      id: generateMissionId(),
      type,
      playerId: player.id,
      status: 'active',
    };
    const socket = session.children.get(player.id);
    if (socket) send(socket, { type: 'assign_mission', mission });
    return mission;
  });
}

export function reportMissionResult(code: string, missionId: string, success: boolean) {
  const session = sessions.get(code);
  if (!session) return;

  const mission = session.state.missions.find((m) => m.id === missionId);
  if (!mission || mission.status !== 'active') return;

  mission.status = success ? 'success' : 'failed';
  session.state.cityHealth = applyMissionResult(session.state.cityHealth, success);

  const outcome = evaluateOutcome(session.state.missions, session.state.cityHealth);
  if (outcome) {
    endGame(session, outcome);
    return;
  }

  broadcastState(session);
}

function endGame(session: Session, result: 'won' | 'lost') {
  session.state.status = result;
  if (session.tickHandle) clearInterval(session.tickHandle);
  const message: ServerMessage = { type: 'game_over', result };
  if (session.parent) send(session.parent, message);
  for (const child of session.children.values()) send(child, message);
}

export function reconnectParent(
  code: string,
  parentSocket: WebSocket
): { error: string } | { state: GameState } {
  const session = sessions.get(code);
  if (!session) return { error: 'Session no longer exists.' };

  session.parent = parentSocket;
  broadcastState(session);
  return { state: session.state };
}

export function reconnectChild(
  code: string,
  playerId: string,
  childSocket: WebSocket
): { error: string } | { state: GameState; mission: Mission | null } {
  const session = sessions.get(code);
  if (!session) return { error: 'Session no longer exists.' };

  const player = session.state.players.find((p) => p.id === playerId);
  if (!player) return { error: 'You are not part of this session.' };

  session.children.set(playerId, childSocket);
  player.connected = true;
  broadcastState(session);

  const mission = session.state.missions.find((m) => m.playerId === playerId && m.status === 'active') ?? null;
  return { state: session.state, mission };
}

export function removeParent(code: string, socket: WebSocket) {
  const session = sessions.get(code);
  // A reconnect may already have replaced this socket by the time its
  // 'close' event fires (events can arrive out of order) — only clear the
  // parent if it's still the one that disconnected.
  if (session && session.parent === socket) session.parent = null;
}

export function removeChild(code: string, playerId: string, socket: WebSocket) {
  const session = sessions.get(code);
  if (!session) return;
  // Same race as removeParent: don't undo a reconnect that already
  // replaced this socket for the player.
  if (session.children.get(playerId) !== socket) return;

  session.children.delete(playerId);
  const player = session.state.players.find((p) => p.id === playerId);
  if (player) player.connected = false;
  broadcastState(session);
}
