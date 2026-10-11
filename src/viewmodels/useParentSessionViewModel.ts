import { useEffect, useState, useRef } from 'react';
import { useGameSocket } from '../lib/useGameSocket';
import type { GameState, Player } from '../lib/protocol';

export type ParentSessionPhase =
  | 'connecting'
  | 'creating'
  | 'lobby'
  | 'tutorial'
  | 'playing'
  | 'won'
  | 'lost';

interface Options {
  // Called once the tutorial completes and the live game starts.
  onGameStart?: () => void;
}

export function useParentSessionViewModel({ onGameStart }: Options = {}) {
  const { socket, lastMessage, isConnected } = useGameSocket();

  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionCodeRef = useRef('');

  const onGameStartRef = useRef(onGameStart);
  useEffect(() => {
    onGameStartRef.current = onGameStart;
  });

  // Prevent duplicate navigation when state_update and reconnect_ack agree.
  const startedRef = useRef(false);

  useEffect(() => {
    if (isConnected) {
      if (sessionCodeRef.current) {
        socket?.send({ type: 'reconnect_session', code: sessionCodeRef.current, role: 'parent' });
      } else {
        socket?.send({ type: 'create_session' });
      }
    }
  }, [isConnected, socket]);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'session_created') {
      sessionCodeRef.current = lastMessage.code;
      setState(lastMessage.state);
      setError(null);
    }
    if (lastMessage.type === 'state_update') {
      setState(lastMessage.state);
      if (lastMessage.state.status === 'playing' && !startedRef.current) {
        startedRef.current = true;
        onGameStartRef.current?.();
      }
      if (lastMessage.state.status !== 'playing') {
        startedRef.current = false;
      }
    }

    if (lastMessage.type === 'reconnect_ack' && lastMessage.role === 'parent') {
      setState(lastMessage.state);
      if (lastMessage.state.status === 'playing' && !startedRef.current) {
        startedRef.current = true;
        onGameStartRef.current?.();
      }
      if (lastMessage.state.status !== 'playing') {
        startedRef.current = false;
      }
    }
    if (lastMessage.type === 'reconnect_error') {
      sessionCodeRef.current = '';
      setState(null);
      setError(lastMessage.reason);
      startedRef.current = false;
      socket?.send({ type: 'create_session' });
    }
    if (lastMessage.type === 'action_error') {
      setError(lastMessage.reason);
    }
  }, [lastMessage, socket]);

  function startTutorial() {
    if (state?.status !== 'lobby' || state.players.length === 0) return;
    setError(null);
    socket?.send({ type: 'start_tutorial' });
  }

  function completeTutorial() {
    if (state?.status !== 'tutorial') return;
    setError(null);
    socket?.send({ type: 'tutorial_complete' });
  }

  const code = state?.code ?? '';
  const players: Player[] = state?.players ?? [];
  const phase: ParentSessionPhase = state?.status ?? (isConnected ? 'creating' : 'connecting');
  const isRunning = state?.status === 'playing' || state?.status === 'won' || state?.status === 'lost';

  return {
    state,
    error,
    phase,
    code,
    players,
    isConnected,
    isRunning,
    startTutorial,
    completeTutorial,
    startGame: startTutorial,
    canStart: state?.status === 'lobby' && players.length > 0,
  };
}