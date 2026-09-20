import { useEffect, useRef, useState } from 'react';
import { GameSocket } from './websocket';
import type { ServerMessage } from './protocol';

// "localhost" only works when the server and the client are on the same
// machine (e.g. web export, or a simulator). Testing on a physical phone via
// Expo Go needs your computer's LAN IP instead, e.g. "ws://192.168.1.23:8080".
const SERVER_URL = 'ws://localhost:8080';

export function useGameSocket() {
  const socketRef = useRef<GameSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);

  useEffect(() => {
    const socket = new GameSocket(SERVER_URL);
    socketRef.current = socket;
    socket.connect();
    const unsubscribe = socket.onMessage(setLastMessage);

    return () => {
      unsubscribe();
      socket.disconnect();
    };
  }, []);

  return { socket: socketRef.current, lastMessage };
}
