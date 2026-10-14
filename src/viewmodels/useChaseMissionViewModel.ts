import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import {
  LANE_COUNT,
  SURVIVAL_MS,
  TICK_MS,
  SPAWN_INTERVAL_MS,
  spawnObstacle,
  advanceObstacles,
  hasCollision,
  getStatus,
  clampLane,
  type Lane,
  type Obstacle,
} from '../screens/child/chase/logic';

// Tilt is iOS/Android only (expo-sensors' Accelerometer has no web)
const TILT_ENABLED = Platform.OS !== 'web';
const TILT_THRESHOLD = 0.35; 
const TILT_COOLDOWN_MS = 350; 

interface Options {
  onFinish?: (success: boolean) => void;
}

export function useChaseMissionViewModel({ onFinish }: Options = {}) {
  const [playerLane, setPlayerLane] = useState<Lane>(1);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [collided, setCollided] = useState(false);

  const status = getStatus(elapsedMs, collided);

  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  const finishedRef = useRef(false);
  useEffect(() => {
    if (status !== 'playing' && !finishedRef.current) {
      finishedRef.current = true;
      onFinishRef.current?.(status === 'won');
    }
  }, [status]);

  // Game loop: advance the clock, advance obstacles, spawn new ones
  useEffect(() => {
    if (status !== 'playing') return;
    let msSinceSpawn = 0;
    const interval = setInterval(() => {
      setElapsedMs((t) => t + TICK_MS);
      setObstacles((obs) => advanceObstacles(obs, TICK_MS));
      msSinceSpawn += TICK_MS;
      if (msSinceSpawn >= SPAWN_INTERVAL_MS) {
        msSinceSpawn = 0;
        setObstacles((obs) => [...obs, spawnObstacle()]);
      }
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [status]);

  // Collision check:  runs whenever the board actually changes
  useEffect(() => {
    if (status !== 'playing') return;
    if (hasCollision(playerLane, obstacles)) {
      setCollided(true);
    }
  }, [obstacles, playerLane, status]);

  function moveLeft() {
    if (status !== 'playing') return;
    setPlayerLane((lane) => clampLane(lane - 1));
  }

  function moveRight() {
    if (status !== 'playing') return;
    setPlayerLane((lane) => clampLane(lane + 1));
  }

  // Tilt controls: lean device left/right to change lanes
  useEffect(() => {
    if (!TILT_ENABLED || status !== 'playing') return;

    let lastMoveAt = 0;
    Accelerometer.setUpdateInterval(100);
    const subscription = Accelerometer.addListener(({ x }) => {
      const now = Date.now();
      if (now - lastMoveAt < TILT_COOLDOWN_MS) return;
      if (x < -TILT_THRESHOLD) {
        lastMoveAt = now;
        setPlayerLane((lane) => clampLane(lane - 1));
      } else if (x > TILT_THRESHOLD) {
        lastMoveAt = now;
        setPlayerLane((lane) => clampLane(lane + 1));
      }
    });

    return () => subscription.remove();
  }, [status]);

  return {
    laneCount: LANE_COUNT,
    playerLane,
    obstacles,
    elapsedMs,
    survivalMs: SURVIVAL_MS,
    status,
    moveLeft,
    moveRight,
  };
}
