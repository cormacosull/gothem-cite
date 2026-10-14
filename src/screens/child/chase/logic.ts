export const LANE_COUNT = 3;
export type Lane = 0 | 1 | 2;

export const SURVIVAL_MS = 20000; // how long the player must dodge to win
export const TICK_MS = 50; // game loop
export const OBSTACLE_TRAVEL_MS = 1700; // time an obstacle takes to reach the player
export const SPAWN_INTERVAL_MS = 850; // time between obstacle spawns
export const COLLISION_WINDOW_START = 0.85; // progress range counted as collision

export interface Obstacle {
  id: string;
  lane: Lane;
  progress: number; // 0 = just spawned x 1 = reached the player
}

export type ChaseStatus = 'playing' | 'won' | 'lost';

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

export function hasCollision(playerLane: Lane, obstacles: Obstacle[]): boolean {
  return obstacles.some(
    (o) => o.lane === playerLane && o.progress >= COLLISION_WINDOW_START && o.progress <= 1
  );
}

export function getStatus(elapsedMs: number, collided: boolean): ChaseStatus {
  if (collided) return 'lost';
  if (elapsedMs >= SURVIVAL_MS) return 'won';
  return 'playing';
}

export function clampLane(lane: number): Lane {
  return Math.max(0, Math.min(LANE_COUNT - 1, lane)) as Lane;
}
