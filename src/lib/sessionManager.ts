import type { WebSocket } from 'ws';
import type { GameState, Player, Mission, MissionType, ServerMessage } from './protocol';

interface Session {
  state: GameState;
  parent: WebSocket | null;
  children: Map<string, WebSocket>; // playerId -> socket
  tickHandle: ReturnType<typeof setInterval> | null;
}

const MISSION_TYPES: MissionType[] = ['fire', 'chase', 'bomb'];
const STARTING_CITY_HEALTH = 100;
const HEALTH_DRAIN_PER_TICK = 2;
const TICK_MS = 5000;
const MISSION_SUCCESS_RESTORE = 15;
const MISSION_FAIL_PENALTY = 10;

const sessions = new Map<string, Session>();

function generateCode(): string {
  let code: string;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit, Kahoot-style
  } while (sessions.has(code));
  return code;
}

function send(ws: WebSocket, message: ServerMessage) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message));
}

function broadcastState(session: Session) {
  const message: ServerMessage = { type: 'state_update', state: session.state };
  if (session.parent) send(session.parent, message);
  for (const child of session.children.values()) send(child, message);
}

export function createSession(parentSocket: WebSocket): GameState {
  const code = generateCode();
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
  if (session.state.players.length >= 3) return { error: 'Session is full (3 players max).' };

  const playerId = `p_${Math.random().toString(36).slice(2, 9)}`;
  const player: Player = { id: playerId, name: playerName, connected: true };
  session.state.players.push(player);
  session.children.set(playerId, childSocket);

  broadcastState(session);
  return { playerId, state: session.state };
}

export function startGame(code: string) {
  const session = sessions.get(code);
  if (!session || session.state.players.length === 0) return;

  session.state.status = 'playing';
  assignMissions(session);
  broadcastState(session);

  // Referee tick: city health drains over time until missions restore it.
  session.tickHandle = setInterval(() => {
    session.state.cityHealth = Math.max(0, session.state.cityHealth - HEALTH_DRAIN_PER_TICK);
    if (session.state.cityHealth <= 0) {
      endGame(session, 'lost');
      return;
    }
    broadcastState(session);
  }, TICK_MS);
}

function assignMissions(session: Session) {
  session.state.missions = session.state.players.map((player, i) => {
    const type = MISSION_TYPES[i % MISSION_TYPES.length];
    player.mission = type;
    const mission: Mission = {
      id: `m_${Math.random().toString(36).slice(2, 9)}`,
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
  session.state.cityHealth = Math.min(
    100,
    Math.max(0, session.state.cityHealth + (success ? MISSION_SUCCESS_RESTORE : -MISSION_FAIL_PENALTY))
  );

  const stillActive = session.state.missions.some((m) => m.status === 'active');
  if (!stillActive) {
    const allSucceeded = session.state.missions.every((m) => m.status === 'success');
    endGame(session, allSucceeded && session.state.cityHealth > 0 ? 'won' : 'lost');
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

export function removeParent(code: string) {
  const session = sessions.get(code);
  if (session) session.parent = null;
}

export function removeChild(code: string, playerId: string) {
  const session = sessions.get(code);
  if (!session) return;
  session.children.delete(playerId);
  const player = session.state.players.find((p) => p.id === playerId);
  if (player) player.connected = false;
  broadcastState(session);
}
