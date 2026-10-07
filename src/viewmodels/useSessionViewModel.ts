// ViewModel for the "join a session" flow. Owns the join/lobby state and the
// socket interaction; the View (JoinScreen) just renders whatever this
// returns and calls `join()` on user input. Keeping this separate from the
// screen means the same logic could back a different-looking screen later
// without being rewritten, and the screen has no idea a WebSocket exists.

import { useEffect, useRef, useState } from 'react';
import { useGameSocket } from '../lib/useGameSocket';
import type { Player } from '../lib/protocol';

export type SessionPhase = 'entering' | 'joining' | 'selecting' | 'waiting' | 'error';

interface Options {
  // Called once mission control starts the game, so the screen can navigate
  // on to character select / the assigned minigame.
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
        onGameStartRef.current?.();
      } else if (!started) {
        startedRef.current = false;
        // Reconnecting mid-selection shouldn't force a re-pick — resume
        // wherever this player already was.
        const me = lastMessage.state.players.find((p) => p.id === playerIdRef.current);
        if (me?.character) {
          setSelectedCharacterId(me.character);
          setPhase('waiting');
        } else {
          setPhase('selecting');
        }
      }
    }
    if (lastMessage.type === 'reconnect_error') {
      playerIdRef.current = null;
      setPhase('error');
      setErrorText(lastMessage.reason);
    }
    if (lastMessage.type === 'state_update') {
      const started = lastMessage.state.status !== 'lobby';
      if (started && !startedRef.current) {
        startedRef.current = true;
        onGameStartRef.current?.();
      } else if (!started) {
        startedRef.current = false;
        setPlayers(lastMessage.state.players);
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
  };
}
