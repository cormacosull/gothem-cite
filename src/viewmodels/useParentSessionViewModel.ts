import { useEffect, useState, useRef } from 'react';
import { useGameSocket } from '../lib/useGameSocket';
import type { Player } from '../lib/protocol';

export type ParentSessionPhase = 'connecting' | 'creating' | 'lobby';

interface Options {
  // Called once mission control starts the game, to navigate to the live dashboard
  onGameStart?: () => void;
}

export function useParentSessionViewModel({ onGameStart }: Options = {}) {
  const { socket, lastMessage, isConnected } = useGameSocket();

  const [phase, setPhase] = useState<ParentSessionPhase>('connecting');
  const [code, setCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const onGameStartRef = useRef(onGameStart);
  useEffect(() => {
    onGameStartRef.current = onGameStart;
  });

  // Ensures navigation fires once per lobby, not after router.back()
  const startedRef = useRef(false);

  useEffect(() => {
    if (isConnected && phase === 'connecting') {
      setPhase('creating');
      socket?.send({ type: 'create_session' });
    }
  }, [isConnected, phase, socket]);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'session_created') {
      setCode(lastMessage.code);
      setPlayers(lastMessage.state.players);
      setPhase('lobby');
    }
    if (lastMessage.type === 'state_update') {
      setPlayers(lastMessage.state.players);
      const started = lastMessage.state.status !== 'lobby';
      setIsRunning(started);

      if (started && !startedRef.current) {
        startedRef.current = true;
        onGameStartRef.current?.();
      }
      if (!started) {
        startedRef.current = false;
      }
    }
  }, [lastMessage]);

  function startGame() {
    if (isRunning) {
      onGameStartRef.current?.();
      return;
    }
    socket?.send({ type: 'start_game' });
  }

  return {
    phase,
    code,
    players,
    isConnected,
    isRunning,
    startGame,
    canStart: phase === 'lobby' && players.length > 0,
  };
}