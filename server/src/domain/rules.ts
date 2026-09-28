// Pure game rules — no framework, no I/O, no socket knowledge.
// Kept separate from application/infrastructure so mission/health logic can
// be unit-tested on its own, and so it's obvious where "the rules of Gothem
// Cité" live as the project grows (e.g. mission dependencies will be added
// here rather than mixed into the session/connection plumbing).

import type { Mission, MissionType } from '../protocol';

export const STARTING_CITY_HEALTH = 100;
export const HEALTH_DRAIN_PER_TICK = 2;
export const TICK_MS = 5000;
export const MISSION_SUCCESS_RESTORE = 15;
export const MISSION_FAIL_PENALTY = 10;
export const MAX_PLAYERS = 3;

const MISSION_TYPES: MissionType[] = ['fire', 'chase', 'bomb'];

export function missionTypeForIndex(index: number): MissionType {
  return MISSION_TYPES[index % MISSION_TYPES.length];
}

export function drainHealth(current: number): number {
  return Math.max(0, current - HEALTH_DRAIN_PER_TICK);
}

export function applyMissionResult(current: number, success: boolean): number {
  const delta = success ? MISSION_SUCCESS_RESTORE : -MISSION_FAIL_PENALTY;
  return Math.min(100, Math.max(0, current + delta));
}

// Returns the game's outcome once every mission has been resolved, or null
// while missions are still active.
export function evaluateOutcome(missions: Mission[], cityHealth: number): 'won' | 'lost' | null {
  const stillActive = missions.some((m) => m.status === 'active');
  if (stillActive) return null;
  const allSucceeded = missions.every((m) => m.status === 'success');
  return allSucceeded && cityHealth > 0 ? 'won' : 'lost';
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
