import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (isConnected && (phase === 'connecting' || phase === 'creating')) {
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
      if (lastMessage.state.status !== 'lobby') onGameStart?.();
    }
    if (lastMessage.type === 'reconnect_ack' && lastMessage.role === 'parent') {
      setPlayers(lastMessage.state.players);
      setPhase('lobby');
      if (lastMessage.state.status !== 'lobby') onGameStart?.();
    }
    if (lastMessage.type === 'reconnect_error') {
      setCode('');
      setPlayers([]);
      setPhase('connecting');
    }
  }, [lastMessage, onGameStart]);

  useEffect(() => {
    if (isConnected && code) {
      socket?.send({ type: 'reconnect_session', code, role: 'parent' });
    }
  }, [isConnected, code, socket]);

  function startGame() {
    socket?.send({ type: 'start_game' });
  }

  return {
    phase,
    code,
    players,
    isConnected,
    startGame,
    canStart: phase === 'lobby' && players.length > 0,
  };
}
