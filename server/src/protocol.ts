// Shared WebSocket message types for Gothem Cité.
//
// NOTE: this file is intentionally duplicated at app/src/lib/protocol.ts.
// The server and the Expo app are separate npm projects, so for now we keep
// them manually in sync. If the protocol grows, consider an npm workspace
// so both sides import from one real shared package instead.

export type MissionType = 'fire' | 'chase' | 'bomb';
export type GameStatus = 'lobby' | 'tutorial' | 'playing' | 'won' | 'lost';

export interface Player {
  id: string;
  name: string;
  connected: boolean;
  mission?: MissionType;
  character?: string;
}

export interface Mission {
  id: string;
  type: MissionType;
  playerId: string;
  status: 'active' | 'success' | 'failed';
}

export interface GameState {
  code: string;
  status: GameStatus;
  cityHealth: number; // 0-100
  players: Player[];
  missions: Mission[];
}

// ---- Client -> Server ----
export type ClientMessage =
  | { type: 'create_session' }
  | { type: 'join_session'; code: string; playerName: string }
  | { type: 'start_tutorial' }
  | { type: 'tutorial_complete' } 
  | { type: 'mission_result'; missionId: string; success: boolean }
  | { type: 'reconnect_session'; code: string; role: 'parent' | 'child'; playerId?: string }
  | { type: 'select_character'; characterId: string };

// ---- Server -> Client ----
export type ServerMessage =
  | { type: 'session_created'; code: string; state: GameState }
  | { type: 'join_ack'; playerId: string; state: GameState }
  | { type: 'join_error'; reason: string }
  | { type: 'state_update'; state: GameState }
  | { type: 'assign_mission'; mission: Mission }
  | { type: 'game_over'; result: 'won' | 'lost' }
  | { type: 'reconnect_ack'; role: 'parent' | 'child'; playerId?: string; state: GameState }
  | { type: 'reconnect_error'; reason: string }
  | { type: 'action_error'; reason: string };

