// Pure game rules — no framework, no I/O, no socket knowledge.
// Kept separate from application/infrastructure so mission/health logic can
// be unit-tested on its own, and so it's obvious where "the rules of Gothem
// Cité" live as the project grows (e.g. mission dependencies will be added
// here rather than mixed into the session/connection plumbing).

import type { Mission, MissionType } from '../protocol';

export const STARTING_CITY_HEALTH = 50;
export const WIN_CITY_HEALTH = 75;
export const MISSIONS_PER_PLAYER = 3;
export const MAX_PLAYERS = 3;

const MISSION_TYPES: MissionType[] = ['fire', 'chase', 'bomb'];

export function missionTypeForIndex(index: number): MissionType {
  return MISSION_TYPES[index % MISSION_TYPES.length];
}

// Every game moves the city by the same amount
// The final health is the % of games won
export function healthStep(totalMissions: number): number {
  return (100 - STARTING_CITY_HEALTH) / totalMissions;
}

export function applyMissionResult(current: number, success: boolean, totalMissions: number): number {
  const delta = success ? healthStep(totalMissions) : -healthStep(totalMissions);
  return Math.min(100, Math.max(0, current + delta));
}

// Returns the game's outcome or null while it can still be won. 
// Lost as soon as WIN_CITY_HEALTH is out of reach even if every remaining game is won
// Won once every game has been played (health is then above it).
export function evaluateOutcome(
  missions: Mission[],
  cityHealth: number,
  totalMissions: number
): 'won' | 'lost' | null {
  const played = missions.filter((m) => m.status !== 'active').length;
  const remaining = totalMissions - played;
  const bestPossible = cityHealth + remaining * healthStep(totalMissions);
  if (bestPossible < WIN_CITY_HEALTH) return 'lost';
  if (remaining === 0) return 'won';
  return null;
}

export function generateSessionCode(isTaken: (code: string) => boolean): string {
  let code: string;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit, Kahoot-style
  } while (isTaken(code));
  return code;
}

export function generatePlayerId(): string {
  return `p_${Math.random().toString(36).slice(2, 9)}`;
}

export function generateMissionId(): string {
  return `m_${Math.random().toString(36).slice(2, 9)}`;
}
