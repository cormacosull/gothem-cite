import { useEffect, useRef, useState } from 'react';
import { useGameSocket } from '../lib/useGameSocket';
import type { Player, Mission } from '../lib/protocol';

//pause between missions in seconds
const INTERLUDE_SECONDS = 5;

function findOwnMission(missions: Mission[], playerId: string | null): Mission | null {
  if (!playerId) return null;
  return missions.find((m) => m.playerId === playerId && m.status === 'active') ?? null;
}

//player's active mission on the server, unless already on screen
function findNextMission(missions: Mission[], playerId: string | null, currentId: string | null): Mission | null {
  const found = findOwnMission(missions, playerId);
  if (!found || found.id === currentId) return null;
  return found;
}


export type SessionPhase =
  | 'entering'
  | 'joining'
  | 'waiting'
  | 'intro'
  | 'standby'
  | 'interlude'
  | 'gameOver'
  | 'error';

interface Options {
  //called when the intro finishes
  onGameStart?: () => void;
}

export function useSessionViewModel({ onGameStart }: Options = {}) {
  const { socket, messages, isConnected } = useGameSocket();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phase, setPhase] = useState<SessionPhase>('entering');
  const [errorText, setErrorText] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [mission, setMission] = useState<Mission | null>(null);
  const [nextMission, setNextMission] = useState<Mission | null>(null);
  const [cityHealth, setCityHealth] = useState(0);
  const [healthBeforeMission, setHealthBeforeMission] = useState(0);
  const [interludeSecondsLeft, setInterludeSecondsLeft] = useState(0);
  const [gameResult, setGameResult] = useState<'won' | 'lost' | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const processedMessageCountRef = useRef(0);

  const onGameStartRef = useRef(onGameStart);
  useEffect(() => {
    onGameStartRef.current = onGameStart;
  });

  const startedRef = useRef(false);

  useEffect(() => {
    const newMessages = messages.slice(processedMessageCountRef.current);
    processedMessageCountRef.current = messages.length;

    for (const message of newMessages) {
      if (message.type === 'join_ack') {
        playerIdRef.current = message.playerId;
        setPhase('waiting');
        setPlayers(message.state.players);
      }
      if (message.type === 'join_error') {
        setPhase('error');
        setErrorText(message.reason);
      }
      if (message.type === 'reconnect_ack' && message.role === 'child') {
        setPlayers(message.state.players);
        setCityHealth(message.state.cityHealth);
        const started = message.state.status !== 'lobby';
        if (started && !startedRef.current) {
          startedRef.current = true;
          setPhase('intro');
        } else if (!started) {
          startedRef.current = false;
          setPhase('waiting');
        }
        if (started) {
          const next = findNextMission(message.state.missions, playerIdRef.current, mission?.id ?? null);
          if (next) setNextMission(next);
        }
        //starting the game skips the intro on all devices
        if (message.state.status === 'playing') {
          setPhase((current) => (current === 'intro' ? 'standby' : current));
        }
        //reconnected after the game ended
        if (message.state.status === 'won' || message.state.status === 'lost') {
          setGameResult(message.state.status);
          setPhase('gameOver');
        }
      }
      if (message.type === 'reconnect_error') {
        playerIdRef.current = null;
        setPhase('error');
        setErrorText(message.reason);
      }
      if (message.type === 'assign_mission') {
        setNextMission(message.mission);
      }
      if (message.type === 'state_update') {
        setCityHealth(message.state.cityHealth);
        const started = message.state.status !== 'lobby';
        if (started && !startedRef.current) {
          startedRef.current = true;
          setPhase('intro');
        } else if (!started) {
          startedRef.current = false;
          setPlayers(message.state.players);
        }
        if (started) {
          const next = findNextMission(message.state.missions, playerIdRef.current, mission?.id ?? null);
          if (next) setNextMission(next);
        }
        //starting the game skips the intro on all devices
        if (message.state.status === 'playing') {
          setPhase((current) => (current === 'intro' ? 'standby' : current));
        }
      }
      if (message.type === 'game_over') {
        setGameResult(message.result);
        setPhase('gameOver');
      }
    }
  }, [messages, mission]);

  useEffect(() => {
    if (isConnected && playerIdRef.current) {
      socket?.send({ type: 'reconnect_session', code, role: 'child', playerId: playerIdRef.current });
    }
  }, [isConnected, code, socket]);

  //next mission once the player is back on standby
  useEffect(() => {
    if (phase !== 'standby' || mission || !nextMission) return;
    setMission(nextMission);
    setNextMission(null);
    setHealthBeforeMission(cityHealth);
  }, [phase, mission, nextMission, cityHealth]);

  //interlude countdown
  useEffect(() => {
    if (phase !== 'interlude' || !nextMission) return;
    if (interludeSecondsLeft <= 0) {
      setPhase('standby');
      return;
    }
    const timer = setTimeout(() => setInterludeSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, nextMission, interludeSecondsLeft]);

  function join() {
    if (code.length !== 4 || !name.trim()) return;
    setPhase('joining');
    socket?.send({ type: 'join_session', code, playerName: name.trim() });
  }


  function finishIntro() {
    setPhase('standby');
    onGameStartRef.current?.();
  }

  function reportMissionResult(success: boolean) {
    if (!mission) return;
    socket?.send({ type: 'mission_result', missionId: mission.id, success });
  }

  
  function continueAfterMission() {
    setMission(null);
    setInterludeSecondsLeft(INTERLUDE_SECONDS);
    setPhase('interlude');
  }

  return {
    code,
    setCode,
    name,
    setName,
    phase,
    errorText,
    players,
    isConnected,
    join,
    canJoin: isConnected && code.length === 4 && !!name.trim(),
    finishIntro,
    mission,
    nextMission,
    reportMissionResult,
    continueAfterMission,
    cityHealth,
    healthChange: cityHealth - healthBeforeMission,
    interludeSecondsLeft,
    gameResult,
  };
}
