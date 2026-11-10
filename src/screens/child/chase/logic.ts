export type Lane = 0 | 1 | 2;
export type ChaseStatus = 'ready' | 'playing' | 'won' | 'lost';

export interface Obstacle {
  id: string;
  lane: Lane;
  progress: number; // 0 = just spawned, 1 = reached the player
}

export const LANE_COUNT = 3;

export const SURVIVAL_MS = 20000; //how long you need to survive to win
export const TICK_MS = 50; //game loop interval
export const OBSTACLE_TRAVEL_MS = 2000; //time for a car to cross the whole lane
export const SPAWN_INTERVAL_MS = 850; //gap between new cars
export const MAX_LIVES = 2; //how many hits before it's over

//these two match ChaseScreen's actual board (420px tall, player sits 10px from
//the bottom): COLLISION_WINDOW_START is where the player's top edge lands on
//the 0..1 scale a car travels, CAR_LENGTH_FRACTION is roughly how tall a car
//is on that same scale, so we're checking its front bumper, not its back one
export const COLLISION_WINDOW_START = 0.9;
export const CAR_LENGTH_FRACTION = 0.15;

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
  const next: Obstacle[] = [];
  for (const car of obstacles) {
    const progress = car.progress + step;
    if (progress <= 1.05) next.push({ ...car, progress }); //past 1.05 it's off screen, drop it
  }
  return next;
}

//which cars are currently touching the player's lane (front bumper past the
//collision line), so the caller can dock a life for each new one
export function findCollidingObstacleIds(playerLane: Lane, obstacles: Obstacle[]): string[] {
  const hits: string[] = [];
  for (const car of obstacles) {
    if (car.lane !== playerLane) continue;
    const front = car.progress + CAR_LENGTH_FRACTION;
    if (front >= COLLISION_WINDOW_START && car.progress <= 1) hits.push(car.id);
  }
  return hits;
}

export function getStatus(elapsedMs: number, livesLeft: number): ChaseStatus {
  if (livesLeft <= 0) return 'lost';
  if (elapsedMs >= SURVIVAL_MS) return 'won';
  return 'playing';
}

export function clampLane(lane: number): Lane {
  return Math.max(0, Math.min(LANE_COUNT - 1, lane)) as Lane;
}
