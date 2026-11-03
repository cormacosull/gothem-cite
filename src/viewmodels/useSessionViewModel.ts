import { useEffect, useRef, useState } from 'react';
import { useGameSocket } from '../lib/useGameSocket';
import type { Player, Mission } from '../lib/protocol';

// Pause between two missions in seconds
const INTERLUDE_SECONDS = 6;

function findOwnMission(missions: Mission[], playerId: string | null): Mission | null {
  if (!playerId) return null;
  return missions.find((m) => m.playerId === playerId && m.status === 'active') ?? null;
}

// The player's active mission on the server, unless it's the one already on screen
function findNextMission(missions: Mission[], playerId: string | null, currentId: string | null): Mission | null {
  const found = findOwnMission(missions, playerId);
  if (!found || found.id === currentId) return null;
  return found;
}

function findTakenCharacterIds(players: Player[], playerId: string | null): string[] {
  return players
    .filter((p) => p.id !== playerId && p.character)
    .map((p) => p.character!);
}

export type SessionPhase =
  | 'entering'
  | 'joining'
  | 'selecting'
  | 'waiting'
  | 'intro'
  | 'standby'
  | 'interlude'
  | 'gameOver'
  | 'error';

interface Options {
  // Called once the post-game-start intro sequence finishes (last slide's
  // timer ran out, or the player skipped it), so the screen can navigate on
  // to the assigned minigame.
  onGameStart?: () => void;
}

export function useSessionViewModel({ onGameStart }: Options = {}) {
  const { socket, lastMessage, isConnected } = useGameSocket();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phase, setPhase] = useState<SessionPhase>('entering');
  const [errorText, setErrorText] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [nextMission, setNextMission] = useState<Mission | null>(null);
  const [cityHealth, setCityHealth] = useState(0);
  const [healthBeforeMission, setHealthBeforeMission] = useState(0);
  const [interludeSecondsLeft, setInterludeSecondsLeft] = useState(0);
  const [gameResult, setGameResult] = useState<'won' | 'lost' | null>(null);
  const playerIdRef = useRef<string | null>(null);

  const onGameStartRef = useRef(onGameStart);
  useEffect(() => {
    onGameStartRef.current = onGameStart;
  });

  // A reconnect's state_update broadcast and its reconnect_ack carry the
  // same state — this dedupes onGameStart across the two instead of firing
  // it twice for one lobby->running transition.
  const startedRef = useRef(false);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'join_ack') {
      playerIdRef.current = lastMessage.playerId;
      setPhase('selecting');
      setPlayers(lastMessage.state.players);
    }
    if (lastMessage.type === 'join_error') {
      setPhase('error');
      setErrorText(lastMessage.reason);
    }
    if (lastMessage.type === 'reconnect_ack' && lastMessage.role === 'child') {
      setPlayers(lastMessage.state.players);
      setCityHealth(lastMessage.state.cityHealth);
      const started = lastMessage.state.status !== 'lobby';
      if (started && !startedRef.current) {
        startedRef.current = true;
        setPhase('intro');
      } else if (!started) {
        startedRef.current = false;
        // Reconnecting mid-selection shouldn't force a re-pick 
        const me = lastMessage.state.players.find((p) => p.id === playerIdRef.current);
        if (me?.character) {
          setSelectedCharacterId(me.character);
          setPhase('waiting');
        } else {
          setPhase('selecting');
        }
      }
      if (started) {
        const next = findNextMission(lastMessage.state.missions, playerIdRef.current, mission?.id ?? null);
        if (next) setNextMission(next);
      }
      // Starting the game should skip the intro on all devices
      if (lastMessage.state.status === 'playing') {
        setPhase((current) => (current === 'intro' ? 'standby' : current));
      }
      // Reconnecting after the game already ended
      if (lastMessage.state.status === 'won' || lastMessage.state.status === 'lost') {
        setGameResult(lastMessage.state.status);
        setPhase('gameOver');
      }
    }
    if (lastMessage.type === 'reconnect_error') {
      playerIdRef.current = null;
      setPhase('error');
      setErrorText(lastMessage.reason);
    }
    if (lastMessage.type === 'assign_mission') {
      setNextMission(lastMessage.mission);
    }
    if (lastMessage.type === 'state_update') {
      setCityHealth(lastMessage.state.cityHealth);
      const started = lastMessage.state.status !== 'lobby';
      if (started && !startedRef.current) {
        startedRef.current = true;
        setPhase('intro');
      } else if (!started) {
        startedRef.current = false;
        setPlayers(lastMessage.state.players);
      }
      if (started) {
        const next = findNextMission(lastMessage.state.missions, playerIdRef.current, mission?.id ?? null);
        if (next) setNextMission(next);
      }
      // Starting the game should skip the intro on all devices
      if (lastMessage.state.status === 'playing') {
        setPhase((current) => (current === 'intro' ? 'standby' : current));
      }
    }
    if (lastMessage.type === 'game_over') {
      setGameResult(lastMessage.result);
      setPhase('gameOver');
    }
  }, [lastMessage]);

  useEffect(() => {
    if (isConnected && playerIdRef.current) {
      socket?.send({ type: 'reconnect_session', code, role: 'child', playerId: playerIdRef.current });
    }
  }, [isConnected, code, socket]);

  // Brings in the next mission once the player is back on standby
  useEffect(() => {
    if (phase !== 'standby' || mission || !nextMission) return;
    setMission(nextMission);
    setNextMission(null);
    setHealthBeforeMission(cityHealth);
  }, [phase, mission, nextMission, cityHealth]);

  // Interlude countdown
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

  function selectCharacter(characterId: string) {
    if (findTakenCharacterIds(players, playerIdRef.current).includes(characterId)) return;
    setSelectedCharacterId(characterId);
    socket?.send({ type: 'select_character', characterId });
    setPhase('waiting');
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
    selectedCharacterId,
    takenCharacterIds: findTakenCharacterIds(players, playerIdRef.current),
    selectCharacter,
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
