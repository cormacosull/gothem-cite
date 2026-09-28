// ViewModel for the "join a session" flow. Owns the join/lobby state and the
// socket interaction; the View (JoinScreen) just renders whatever this
// returns and calls `join()` on user input. Keeping this separate from the
// screen means the same logic could back a different-looking screen later
// without being rewritten, and the screen has no idea a WebSocket exists.

import { useEffect, useState } from 'react';
import { useGameSocket } from '../lib/useGameSocket';
import type { Player } from '../lib/protocol';

export type SessionPhase = 'entering' | 'joining' | 'waiting' | 'error';

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

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'join_ack') {
      setPhase('waiting');
      setPlayers(lastMessage.state.players);
    }
    if (lastMessage.type === 'join_error') {
      setPhase('error');
      setErrorText(lastMessage.reason);
    }
    if (lastMessage.type === 'state_update' && lastMessage.state.status !== 'lobby') {
      onGameStart?.();
    }
    if (lastMessage.type === 'state_update' && lastMessage.state.status === 'lobby') {
      setPlayers(lastMessage.state.players);
    }
  }, [lastMessage, onGameStart]);

  function join() {
    if (code.length !== 4 || !name.trim()) return;
    setPhase('joining');
    socket?.send({ type: 'join_session', code, playerName: name.trim() });
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
  };
}
