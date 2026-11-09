//session state and the game use cases (create, join, start, mission result, disconnects)
//game math is in domain/rules.ts, ws setup is in infrastructure/websocketServer.ts

import type { WebSocket } from 'ws';
import type { GameState, Player, Mission, ServerMessage } from '../protocol';
import {
  STARTING_CITY_HEALTH,
  MAX_PLAYERS,
  MISSIONS_PER_PLAYER,
  missionTypeForIndex,
  applyMissionResult,
  evaluateOutcome,
  generateSessionCode,
  generatePlayerId,
  generateMissionId,
} from '../domain/rules';

interface Session {
  state: GameState;
  parent: WebSocket | null;
  children: Map<string, WebSocket>; //playerId -> socket
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

//every player plays every mission once
function totalMissions(session: Session): number {
  return session.state.players.length * MISSIONS_PER_PLAYER;
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
  sessions.set(code, { state, parent: parentSocket, children: new Map() });
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
  broadcastState(session); //children see 'tutorial' and keep waiting
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

  return { ok: true };
}

function assignMissions(session: Session) {
  session.state.missions = [];
  for (const player of session.state.players) assignNextMission(session, player);
}

//everyone plays every mission, different start so the team isn't all on the same game
function assignNextMission(session: Session, player: Player) {
  const playerIndex = session.state.players.indexOf(player);
  const played = session.state.missions.filter((m) => m.playerId === player.id).length;
  if (played >= MISSIONS_PER_PLAYER) return;

  const type = missionTypeForIndex(playerIndex + played);
  player.mission = type;
  const mission: Mission = {
    id: generateMissionId(),
    type,
    playerId: player.id,
    status: 'active',
  };
  session.state.missions.push(mission);
  const socket = session.children.get(player.id);
  if (socket) send(socket, { type: 'assign_mission', mission });
}

export function reportMissionResult(code: string, missionId: string, success: boolean) {
  const session = sessions.get(code);
  if (!session) return;

  const mission = session.state.missions.find((m) => m.id === missionId);
  if (!mission || mission.status !== 'active') return;

  mission.status = success ? 'success' : 'failed';
  const total = totalMissions(session);
  session.state.cityHealth = applyMissionResult(session.state.cityHealth, success, total);

  const outcome = evaluateOutcome(session.state.missions, session.state.cityHealth, total);
  if (outcome) {
    endGame(session, outcome);
    return;
  }

  const player = session.state.players.find((p) => p.id === mission.playerId);
  if (player) assignNextMission(session, player);

  broadcastState(session);
}

function endGame(session: Session, result: 'won' | 'lost') {
  session.state.status = result;
  broadcastState(session);
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
  //a reconnect can replace this socket before its close event fires
  //only clear the parent if it's still the same socket
  if (session && session.parent === socket) session.parent = null;
}

export function removeChild(code: string, playerId: string, socket: WebSocket) {
  const session = sessions.get(code);
  if (!session) return;
  //same race as removeParent, don't undo a reconnect
  if (session.children.get(playerId) !== socket) return;

  session.children.delete(playerId);
  const player = session.state.players.find((p) => p.id === playerId);
  if (player) player.connected = false;
  broadcastState(session);
}
