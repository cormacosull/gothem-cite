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
  onGameStart?: () => void;
}

export function useParentSessionViewModel({ onGameStart }: Options = {}) {
  const { socket, messages, isConnected } = useGameSocket();

  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionCodeRef = useRef('');
  const processedMessageCountRef = useRef(0);

  const onGameStartRef = useRef(onGameStart);
  useEffect(() => {
    onGameStartRef.current = onGameStart;
  });

  // Prevent duplicate navigations
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
    const newMessages = messages.slice(processedMessageCountRef.current);
    processedMessageCountRef.current = messages.length;

    for (const message of newMessages) {
      if (message.type === 'session_created') {
        sessionCodeRef.current = message.code;
        setState(message.state);
        setError(null);
      }
      if (message.type === 'state_update') {
        setState(message.state);
        if (message.state.status === 'playing' && !startedRef.current) {
          startedRef.current = true;
          onGameStartRef.current?.();
        }
        if (message.state.status !== 'playing') {
          startedRef.current = false;
        }
      }

      if (message.type === 'reconnect_ack' && message.role === 'parent') {
        setState(message.state);
        if (message.state.status === 'playing' && !startedRef.current) {
          startedRef.current = true;
          onGameStartRef.current?.();
        }
        if (message.state.status !== 'playing') {
          startedRef.current = false;
        }
      }
      if (message.type === 'reconnect_error') {
        sessionCodeRef.current = '';
        setState(null);
        setError(message.reason);
        startedRef.current = false;
        socket?.send({ type: 'create_session' });
      }
      if (message.type === 'action_error') {
        setError(message.reason);
      }
    }
  }, [messages, socket]);

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
  function startNewSession() {
    sessionCodeRef.current = '';
    setState(null);
    setError(null);
    startedRef.current = false;
    socket?.send({ type: 'create_session' });
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
    startNewSession,
    startGame: startTutorial,
    canStart: state?.status === 'lobby' && players.length > 0,
  };
}
