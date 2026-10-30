/* -------------------------------------------------------------------------- */
/*  Fire mission: pure game logic (no React, no React Native).                */
/*  All positions are normalized map coordinates (0..1) unless a name says    */
/*  "Units". "Units" are the 1200 x 896 drawing space of the street artwork,  */
/*  where 1 unit is the same distance horizontally and vertically.            */
/* -------------------------------------------------------------------------- */

export interface FireLocation {
  id: string;
  /** Horizontal position as a fraction of the background width (0 to 1). */
  x: number;
  /** Vertical position as a fraction of the background height (0 to 1). */
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

// Placeholder positions only; replace these with coordinates matched to the
// final background artwork. Ids must stay "<block>-<floor>" because the spread
// rule groups locations by block and orders them by floor.
export const FIRE_LOCATIONS: FireLocation[] = [
  { id: 'block1-1', x: 0.015, y: 0.41, width: 0.045, height: 0.085 },
  { id: 'block1-2', x: 0.015, y: 0.525, width: 0.045, height: 0.085 },
  { id: 'block1-3', x: 0.015, y: 0.635, width: 0.045, height: 0.085 },

  { id: 'block2-1', x: 0.14, y: 0.18, width: 0.11, height: 0.075 },
  { id: 'block2-2', x: 0.14, y: 0.275, width: 0.11, height: 0.1 },
  { id: 'block2-3', x: 0.14, y: 0.4, width: 0.11, height: 0.1 },
  { id: 'block2-4', x: 0.14, y: 0.525, width: 0.11, height: 0.1 },
  { id: 'block2-5', x: 0.14, y: 0.64, width: 0.11, height: 0.1 },

  { id: 'block3-1', x: 0.29, y: 0.375, width: 0.11, height: 0.105 },
  { id: 'block3-2', x: 0.29, y: 0.5, width: 0.11, height: 0.105 },
  { id: 'block3-3', x: 0.29, y: 0.625, width: 0.11, height: 0.105 },

  { id: 'block4-1', x: 0.45, y: 0.5, width: 0.11, height: 0.105 },
  { id: 'block4-2', x: 0.45, y: 0.625, width: 0.11, height: 0.105 },
  { id: 'block4-3', x: 0.45, y: 0.74, width: 0.11, height: 0.105 },

  { id: 'block5-1', x: 0.6, y: 0.43, width: 0.13, height: 0.11 },
  { id: 'block5-2', x: 0.6, y: 0.55, width: 0.13, height: 0.12 },
  { id: 'block5-3', x: 0.6, y: 0.675, width: 0.13, height: 0.12 },

  { id: 'block6-1', x: 0.85, y: 0.225, width: 0.14, height: 0.08 },
  { id: 'block6-2', x: 0.84, y: 0.32, width: 0.15, height: 0.09 },
  { id: 'block6-3', x: 0.8, y: 0.425, width: 0.2, height: 0.12 },
  { id: 'block6-4', x: 0.8, y: 0.55, width: 0.2, height: 0.12 },
  { id: 'block6-5', x: 0.8, y: 0.675, width: 0.2, height: 0.12 },
];

/* ------------------------------- Tunables --------------------------------- */

export const GAME_CONFIG = {
  /** Duration of the full mission. */
  durationMs: 90_000,
  /** Simulation step used by the view model. */
  tickMs: 33,
  /** Fires burning when the mission starts (each one in a different block). */
  initialFires: 3,
  /** Lose immediately at or above this fraction of burning windows. */
  loseAtBurningFraction: 0.4,
  /** Win at the deadline only when the burning fraction is below this value. */
  winBelowBurningFraction: 0.15,
  /** How often one burning fire tries to spread to another floor. */
  spreadIntervalMs: 7_000,
  /** A fire must have grown past this intensity before it can spread. */
  spreadMinIntensity: 0.6,
  /** Intensity of a freshly ignited fire; it then grows up to 1. */
  igniteIntensity: 0.4,
  growthPerSec: 0.12,
  /** Intensity removed per second while water lands on a fire. */
  extinguishPerSec: 0.5,
  /** Extra forgiveness around a fire's box when testing a water hit. */
  hitMargin: 0.02,
  /**
   * Fixed distance the water travels past the nozzle, in map units (the map is
   * 896 units tall). Keep it small: the nozzle can only be dragged up to the
   * engine, so a fire can only be hit if it is at least this far from the engine.
   */
  sprayReachUnits: 100,
  /** A nearly out fire never shrinks below this fraction of its size. */
  fireMinScale: 0.15,
  fireMinOpacity: 0.35,
} as const;

/* ------------------------------- Geometry --------------------------------- */

export const MAP_UNITS = { width: 1200, height: 896 } as const;

/**
 * Size of the fire engine drawing (its own viewBox) and the spot on it where
 * the hose is attached. The screen draws the engine with exactly these numbers
 * so the artwork and the physics always agree.
 */
export const ENGINE_ART = { width: 240, height: 120, hoseX: 112, hoseY: 28 } as const;

const ENGINE_WIDTH_NORM = 0.22;
const ENGINE_BOTTOM_NORM = 0.99;
const ENGINE_HEIGHT_NORM =
  (ENGINE_WIDTH_NORM * MAP_UNITS.width * (ENGINE_ART.height / ENGINE_ART.width)) / MAP_UNITS.height;

/** Fire engine placement on the map, parked on the road at the bottom-right. */
export const ENGINE_LAYOUT = {
  x: 1 - ENGINE_WIDTH_NORM - 0.01,
  y: ENGINE_BOTTOM_NORM - ENGINE_HEIGHT_NORM,
  width: ENGINE_WIDTH_NORM,
  height: ENGINE_HEIGHT_NORM,
} as const;

/** Where the hose leaves the fire engine. */
export const HOSE_ANCHOR: Point = {
  x: ENGINE_LAYOUT.x + (ENGINE_LAYOUT.width * ENGINE_ART.hoseX) / ENGINE_ART.width,
  y: ENGINE_LAYOUT.y + (ENGINE_LAYOUT.height * ENGINE_ART.hoseY) / ENGINE_ART.height,
};

export const DEFAULT_NOZZLE: Point = { x: 0.7, y: 0.78 };

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function clampPoint(point: Point): Point {
  return { x: clamp01(point.x), y: clamp01(point.y) };
}

export function toUnits(point: Point): Point {
  return { x: point.x * MAP_UNITS.width, y: point.y * MAP_UNITS.height };
}

/** Unit vector (in map units) pointing from the engine through the nozzle. */
export function getAimDirection(nozzle: Point): Point {
  const anchor = toUnits(HOSE_ANCHOR);
  const tip = toUnits(nozzle);
  const dx = tip.x - anchor.x;
  const dy = tip.y - anchor.y;
  const length = Math.hypot(dx, dy);
  if (length < 1) {
    return { x: -0.92, y: -0.39 }; // nozzle sits on the anchor: aim up and left
  }
  return { x: dx / length, y: dy / length };
}

/**
 * Where the water lands: from the nozzle, continuing the engine -> nozzle
 * line, a fixed distance. Clamped to the map.
 */
export function computeLanding(nozzle: Point): Point {
  const dir = getAimDirection(nozzle);
  const reach = GAME_CONFIG.sprayReachUnits;
  return clampPoint({
    x: nozzle.x + (dir.x * reach) / MAP_UNITS.width,
    y: nozzle.y + (dir.y * reach) / MAP_UNITS.height,
  });
}

/* ---------------------------- Buildings / floors --------------------------- */

interface LocationMeta {
  block: string;
  floor: number;
}

export const LOCATIONS_BY_ID: Record<string, FireLocation> = {};
const LOCATION_META: Record<string, LocationMeta> = {};
/** Fire ids grouped by apartment block. Fires only spread inside one block. */
export const BLOCKS: Record<string, string[]> = {};

for (const location of FIRE_LOCATIONS) {
  const [block, floor] = location.id.split('-');
  LOCATIONS_BY_ID[location.id] = location;
  LOCATION_META[location.id] = { block, floor: Number(floor) };
  (BLOCKS[block] ??= []).push(location.id);
}

/* --------------------------------- State ---------------------------------- */

export type GameStatus = 'ready' | 'playing' | 'won' | 'lost';

export interface FireGameState {
  status: GameStatus;
  timeLeftMs: number;
  /** Playing time so far; drives purely visual animation. */
  elapsedMs: number;
  /** Per fire id: 0 = not burning, up to 1 = fully grown fire. */
  intensities: Record<string, number>;
  /** Where the hose ends and the water leaves it. */
  nozzle: Point;
  spraying: boolean;
  msUntilSpread: number;
  /** The fire currently being hit by water, if any. */
  hitFireId: string | null;
}

export type Rng = () => number;

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandom<T>(items: readonly T[], rng: Rng): T {
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))];
}

export function createInitialState(rng: Rng = Math.random): FireGameState {
  const intensities: Record<string, number> = {};
  for (const location of FIRE_LOCATIONS) intensities[location.id] = 0;

  const startingBlocks = shuffle(Object.keys(BLOCKS), rng).slice(0, GAME_CONFIG.initialFires);
  for (const block of startingBlocks) {
    intensities[pickRandom(BLOCKS[block], rng)] = 1;
  }

  return {
    status: 'ready',
    timeLeftMs: GAME_CONFIG.durationMs,
    elapsedMs: 0,
    intensities,
    nozzle: DEFAULT_NOZZLE,
    spraying: false,
    msUntilSpread: GAME_CONFIG.spreadIntervalMs,
    hitFireId: null,
  };
}

export function countBurning(intensities: Record<string, number>): number {
  let count = 0;
  for (const id in intensities) if (intensities[id] > 0) count++;
  return count;
}

export function getGameOutcome(
  intensities: Record<string, number>,
  timeLeftMs: number
): 'won' | 'lost' | null {
  const burningFraction = countBurning(intensities) / FIRE_LOCATIONS.length;
  if (burningFraction >= GAME_CONFIG.loseAtBurningFraction) return 'lost';
  if (timeLeftMs <= 0) {
    return burningFraction < GAME_CONFIG.winBelowBurningFraction ? 'won' : 'lost';
  }
  return null;
}

/** How a fire should look for a given intensity. */
export function getFireVisual(intensity: number): { scale: number; opacity: number } {
  const t = clamp01(intensity);
  const { fireMinScale, fireMinOpacity } = GAME_CONFIG;
  return {
    scale: fireMinScale + (1 - fireMinScale) * t,
    opacity: fireMinOpacity + (1 - fireMinOpacity) * t,
  };
}

/* -------------------------------- Rules ----------------------------------- */

/** The burning fire whose box contains the landing point (closest centre wins). */
export function findHitFire(landing: Point, intensities: Record<string, number>): string | null {
  const margin = GAME_CONFIG.hitMargin;
  let bestId: string | null = null;
  let bestDistance = Infinity;

  for (const location of FIRE_LOCATIONS) {
    if (!(intensities[location.id] > 0)) continue;
    const inside =
      landing.x >= location.x - margin &&
      landing.x <= location.x + location.width + margin &&
      landing.y >= location.y - margin &&
      landing.y <= location.y + location.height + margin;
    if (!inside) continue;

    const distance = Math.hypot(
      (landing.x - (location.x + location.width / 2)) * MAP_UNITS.width,
      (landing.y - (location.y + location.height / 2)) * MAP_UNITS.height
    );
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = location.id;
    }
  }
  return bestId;
}

/**
 * Ignite one floor of a block that already has a grown fire. The nearest
 * floors are preferred, and fires never jump between different blocks.
 * Returns null when nothing can spread.
 */
export function spreadFire(
  intensities: Record<string, number>,
  rng: Rng = Math.random
): Record<string, number> | null {
  const sources = FIRE_LOCATIONS.filter(
    (location) => intensities[location.id] >= GAME_CONFIG.spreadMinIntensity
  );

  for (const source of shuffle(sources, rng)) {
    const { block, floor } = LOCATION_META[source.id];
    const candidates = BLOCKS[block].filter((id) => id !== source.id && !(intensities[id] > 0));
    if (candidates.length === 0) continue;

    const distanceOf = (id: string) => Math.abs(LOCATION_META[id].floor - floor);
    const nearest = Math.min(...candidates.map(distanceOf));
    const target = pickRandom(
      candidates.filter((id) => distanceOf(id) === nearest),
      rng
    );
    return { ...intensities, [target]: GAME_CONFIG.igniteIntensity };
  }
  return null;
}

function igniteRandomFire(intensities: Record<string, number>, rng: Rng): Record<string, number> {
  const availableLocations = FIRE_LOCATIONS.filter((location) => !(intensities[location.id] > 0));
  if (availableLocations.length === 0) return intensities;
  const location = pickRandom(availableLocations, rng);
  return { ...intensities, [location.id]: GAME_CONFIG.igniteIntensity };
}

/** Advance the mission by dtMs. Pure: returns a new state. */
export function stepGame(state: FireGameState, dtMs: number, rng: Rng = Math.random): FireGameState {
  if (state.status !== 'playing') return state;

  const cfg = GAME_CONFIG;
  const dt = Math.min(Math.max(dtMs, 0), state.timeLeftMs);
  const dtSec = dt / 1000;

  let intensities = { ...state.intensities };

  // Newly lit fires grow towards full strength.
  for (const id in intensities) {
    const value = intensities[id];
    if (value > 0 && value < 1) intensities[id] = Math.min(1, value + cfg.growthPerSec * dtSec);
  }

  // Water only affects the one fire it lands on.
  let hitFireId: string | null = null;
  if (state.spraying) {
    hitFireId = findHitFire(computeLanding(state.nozzle), intensities);
    if (hitFireId) {
      const reduced = intensities[hitFireId] - cfg.extinguishPerSec * dtSec;
      intensities[hitFireId] = reduced < 0.02 ? 0 : reduced;
    }
  }

  const elapsedMs = state.elapsedMs + dt;
  const timeLeftMs = Math.max(0, state.timeLeftMs - dt);

  let msUntilSpread = state.msUntilSpread - dt;
  while (msUntilSpread <= 0) {
    const spread = spreadFire(intensities, rng);
    if (spread) {
      intensities = spread;
      if (countBurning(intensities) / FIRE_LOCATIONS.length >= cfg.loseAtBurningFraction) {
        return {
          ...state,
          status: 'lost',
          elapsedMs,
          timeLeftMs,
          intensities,
          spraying: false,
          msUntilSpread: msUntilSpread + cfg.spreadIntervalMs,
          hitFireId: null,
        };
      }
    }
    msUntilSpread += cfg.spreadIntervalMs;
  }

  // Keep the mission active when the player extinguishes the last fire.
  if (countBurning(intensities) === 0) intensities = igniteRandomFire(intensities, rng);

  const outcome = getGameOutcome(intensities, timeLeftMs);
  return {
    ...state,
    status: outcome ?? 'playing',
    elapsedMs,
    timeLeftMs,
    intensities,
    spraying: outcome ? false : state.spraying,
    msUntilSpread,
    hitFireId: outcome ? null : hitFireId,
  };
}