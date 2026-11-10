import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import {
  LANE_COUNT,
  SURVIVAL_MS,
  TICK_MS,
  SPAWN_INTERVAL_MS,
  MAX_LIVES,
  spawnObstacle,
  advanceObstacles,
  findCollidingObstacleIds,
  getStatus,
  clampLane,
  type Lane,
  type Obstacle,
  type ChaseStatus,
} from '../screens/child/chase/logic';

//tilt is ios/android only, expo-sensors has no web version
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
  const [lives, setLives] = useState(MAX_LIVES);
  const [started, setStarted] = useState(false);

  //obstacles already counted as a hit don't cost another life while still overlapping
  const hitIdsRef = useRef<Set<string>>(new Set());

  //ready until start is pressed, same as the fire game
  const status: ChaseStatus = started ? getStatus(elapsedMs, lives) : 'ready';

  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  const finishedRef = useRef(false);
  useEffect(() => {
    if ((status === 'won' || status === 'lost') && !finishedRef.current) {
      finishedRef.current = true;
      onFinishRef.current?.(status === 'won');
    }
  }, [status]);

  //game loop: advance the clock, move obstacles, spawn new ones
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

  //collision check, runs whenever the board changes
  useEffect(() => {
    if (status !== 'playing') return;
    const collidingIds = findCollidingObstacleIds(playerLane, obstacles);
    const newHits = collidingIds.filter((id) => !hitIdsRef.current.has(id));
    if (newHits.length === 0) return;
    newHits.forEach((id) => hitIdsRef.current.add(id));
    setLives((current) => Math.max(0, current - newHits.length));
  }, [obstacles, playerLane, status]);

  //starts the chase, or restarts it after a win or a loss
  function start() {
    if (status === 'playing') return;
    finishedRef.current = false;
    hitIdsRef.current = new Set();
    setPlayerLane(1);
    setObstacles([]);
    setElapsedMs(0);
    setLives(MAX_LIVES);
    setStarted(true);
  }

  function moveLeft() {
    if (status !== 'playing') return;
    setPlayerLane((lane) => clampLane(lane - 1));
  }

  function moveRight() {
    if (status !== 'playing') return;
    setPlayerLane((lane) => clampLane(lane + 1));
  }

  //tilt controls, lean the phone left or right to change lanes
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
    lives,
    maxLives: MAX_LIVES,
    status,
    start,
    moveLeft,
    moveRight,
  };
}