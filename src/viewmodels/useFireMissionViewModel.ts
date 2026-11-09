import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  FIRE_LOCATIONS,
  GAME_CONFIG,
  LOCATIONS_BY_ID,
  clampPoint,
  computeLanding,
  countBurning,
  createInitialState,
  stepGame,
  type FireGameState,
  type Point,
} from '../screens/child/fire/logic';

interface Options {
  onFinish?: (success: boolean) => void;
}

export function useFireMissionViewModel({ onFinish }: Options = {}) {
  const [state, setState] = useState<FireGameState>(() => createInitialState());
  const { status } = state;
  const onFinishRef = useRef(onFinish);
  const reportedResultRef = useRef(false);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    if ((status !== 'won' && status !== 'lost') || reportedResultRef.current) return;
    reportedResultRef.current = true;
    onFinishRef.current?.(status === 'won');
  }, [status]);

  // Fixed-rate game loop; it only runs while the mission is being played.
  useEffect(() => {
    if (status !== 'playing') return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const dt = now - last;
      last = now;
      setState((prev) => stepGame(prev, dt));
    }, GAME_CONFIG.tickMs);
    return () => clearInterval(timer);
  }, [status]);

  /** Starts the mission, or restarts it after a win or a loss. */
  const start = useCallback(() => {
    setState((prev) => {
      if (prev.status === 'playing') return prev;
      reportedResultRef.current = false;
      if (prev.status === 'ready') return { ...prev, status: 'playing' };
      return { ...createInitialState(), nozzle: prev.nozzle, status: 'playing' };
    });
  }, []);

  /** Moves the hose nozzle to a normalized map position. */
  const setNozzle = useCallback((point: Point) => {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    const next = clampPoint(point);
    setState((prev) =>
      prev.nozzle.x === next.x && prev.nozzle.y === next.y ? prev : { ...prev, nozzle: next }
    );
  }, []);

  /** Press-and-hold SPRAY control. Only has an effect while playing. */
  const setSpraying = useCallback((spraying: boolean) => {
    setState((prev) => {
      const next = spraying && prev.status === 'playing';
      return prev.spraying === next ? prev : { ...prev, spraying: next };
    });
  }, []);

  const landing = useMemo(() => computeLanding(state.nozzle), [state.nozzle]);
  const burningCount = useMemo(() => countBurning(state.intensities), [state.intensities]);
  const hitLocation = state.hitFireId ? LOCATIONS_BY_ID[state.hitFireId] ?? null : null;

  return {
    locations: FIRE_LOCATIONS,
    status: state.status,
    timeLeftMs: state.timeLeftMs,
    elapsedMs: state.elapsedMs,
    intensities: state.intensities,
    burningCount,
    nozzle: state.nozzle,
    landing,
    spraying: state.spraying,
    hitLocation,
    start,
    setNozzle,
    setSpraying,
  };
}