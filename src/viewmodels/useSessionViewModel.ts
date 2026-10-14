import { useEffect, useRef, useState } from 'react';
import { useGameSocket } from '../lib/useGameSocket';
import type { Player, Mission } from '../lib/protocol';

function findOwnMission(missions: Mission[], playerId: string | null): Mission | null {
  if (!playerId) return null;
  return missions.find((m) => m.playerId === playerId && m.status === 'active') ?? null;
}

function adoptMissionIfFound(current: Mission | null, missions: Mission[], playerId: string | null): Mission | null {
  const found = findOwnMission(missions, playerId);
  if (!found) return current;
  return current?.id === found.id ? current : found;
}

export type SessionPhase =
  | 'entering'
  | 'joining'
  | 'selecting'
  | 'waiting'
  | 'intro'
  | 'standby'
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
        const missions = lastMessage.state.missions;
        setMission((current) => adoptMissionIfFound(current, missions, playerIdRef.current));
      }
    }
    if (lastMessage.type === 'reconnect_error') {
      playerIdRef.current = null;
      setPhase('error');
      setErrorText(lastMessage.reason);
    }
    if (lastMessage.type === 'assign_mission') {
      setMission(lastMessage.mission);
    }
    if (lastMessage.type === 'state_update') {
      const started = lastMessage.state.status !== 'lobby';
      if (started && !startedRef.current) {
        startedRef.current = true;
        setPhase('intro');
      } else if (!started) {
        startedRef.current = false;
        setPlayers(lastMessage.state.players);
      }
      if (started) {
        const missions = lastMessage.state.missions;
        setMission((current) => adoptMissionIfFound(current, missions, playerIdRef.current));
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    if (isConnected && playerIdRef.current) {
      socket?.send({ type: 'reconnect_session', code, role: 'child', playerId: playerIdRef.current });
    }
  }, [isConnected, code, socket]);

  function join() {
    if (code.length !== 4 || !name.trim()) return;
    setPhase('joining');
    socket?.send({ type: 'join_session', code, playerName: name.trim() });
  }

  function selectCharacter(characterId: string) {
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

  function returnToStandby() {
    setMission(null);
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
    selectCharacter,
    finishIntro,
    mission,
    reportMissionResult,
    returnToStandby,
  };
}
