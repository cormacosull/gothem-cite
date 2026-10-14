import { useEffect, useState, useRef } from 'react';
import { useGameSocket } from '../lib/useGameSocket';
import type { Player } from '../lib/protocol';

export type ParentSessionPhase = 'connecting' | 'creating' | 'lobby' | 'intro';

interface Options {
  // Called once the post-game-start intro sequence finishes (last slide's
  // timer ran out, or mission control skipped it), to navigate to the live
  // dashboard.
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
      const started = lastMessage.state.status !== 'lobby';
      setIsRunning(started);

      if (started && !startedRef.current) {
        startedRef.current = true;
        setPhase('intro');
      }
      if (!started) {
        startedRef.current = false;
      }
    }

    if (lastMessage.type === 'reconnect_ack' && lastMessage.role === 'parent') {
      setPlayers(lastMessage.state.players);
      const started = lastMessage.state.status !== 'lobby';
      setIsRunning(started);

      // A reconnect's state_update broadcast and its reconnect_ack carry the
      // same state — startedRef (shared with the state_update branch above)
      // keeps this from firing onGameStart a second time for one transition.
      if (started && !startedRef.current) {
        startedRef.current = true;
        setPhase('intro');
      } else if (!started) {
        startedRef.current = false;
        setPhase('lobby');
      }
    }
    if (lastMessage.type === 'reconnect_error') {
      // The session this device was running is gone (e.g. the server
      // restarted) — fall back to opening a fresh one.
      setCode('');
      setPlayers([]);
      setIsRunning(false);
      startedRef.current = false;
      setPhase('connecting');
    }
  }, [lastMessage]);

  useEffect(() => {
    if (isConnected && code) {
      socket?.send({ type: 'reconnect_session', code, role: 'parent' });
    }
  }, [isConnected, code, socket]);

  function startGame() {
    if (isRunning) {
      onGameStartRef.current?.();
      return;
    }
    socket?.send({ type: 'start_game' });
  }

  function finishIntro() {
    onGameStartRef.current?.();
  }

  return {
    phase,
    code,
    players,
    isConnected,
    isRunning,
    startGame,
    finishIntro,
    canStart: phase === 'lobby' && players.length > 0,
  };
}