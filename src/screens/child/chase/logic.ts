export const LANE_COUNT = 3;
export type Lane = 0 | 1 | 2;

export const SURVIVAL_MS = 20000; // how long the player must dodge to win
export const TICK_MS = 50; // game loop
export const OBSTACLE_TRAVEL_MS = 2000; // time an obstacle takes to reach the player
export const SPAWN_INTERVAL_MS = 850; // time between obstacle spawns
export const MAX_LIVES = 2; // hits the player can take before losing
// Both derived from ChaseScreen's board geometry (420px board, 340px wide,
// obstacle 46% width / 0.93 aspect ratio, player 34% width / 0.56 aspect
// ratio, player 10px off the bottom) so the hitbox matches what's drawn:
// progress where the player's own top edge sits, on the 0..1 scale an
// obstacle's top edge travels (which only covers the top 90% of the board).
export const COLLISION_WINDOW_START = 0.9;
// An obstacle's own length on that same scale, so a hit is judged by its
// leading edge (the one reaching the player first), not its trailing edge.
export const CAR_LENGTH_FRACTION = 0.15;

export interface Obstacle {
  id: string;
  lane: Lane;
  progress: number; // 0 = just spawned x 1 = reached the player
}

export type ChaseStatus = 'ready' | 'playing' | 'won' | 'lost';

function randomId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function randomLane(): Lane {
  return Math.floor(Math.random() * LANE_COUNT) as Lane;
}

export function spawnObstacle(): Obstacle {
  return { id: randomId(), lane: randomLane(), progress: 0 };
}

export function advanceObstacles(obstacles: Obstacle[], deltaMs: number): Obstacle[] {
  const step = deltaMs / OBSTACLE_TRAVEL_MS;
  return obstacles
    .map((o) => ({ ...o, progress: o.progress + step }))
    .filter((o) => o.progress <= 1.05); // drop once its past the player
}

/** Ids of obstacles touching the player right now, for the caller to turn
 * into lost lives (and remember, so one obstacle isn't counted twice while
 * it keeps overlapping across ticks). */
export function findCollidingObstacleIds(playerLane: Lane, obstacles: Obstacle[]): string[] {
  return obstacles
    .filter((o) => {
      if (o.lane !== playerLane) return false;
      const leadingEdge = o.progress + CAR_LENGTH_FRACTION;
      return leadingEdge >= COLLISION_WINDOW_START && o.progress <= 1;
    })
    .map((o) => o.id);
}

export function getStatus(elapsedMs: number, livesLeft: number): ChaseStatus {
  if (livesLeft <= 0) return 'lost';
  if (elapsedMs >= SURVIVAL_MS) return 'won';
  return 'playing';
}

export function clampLane(lane: number): Lane {
  return Math.max(0, Math.min(LANE_COUNT - 1, lane)) as Lane;
}