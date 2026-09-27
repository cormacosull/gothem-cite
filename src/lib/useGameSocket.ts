import { useEffect, useRef, useState } from 'react';
import { GameSocket } from './websocket';
import type { ServerMessage } from './protocol';

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL ?? 'ws://localhost:8080'

export function useGameSocket() {
  const socketRef = useRef<GameSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = new GameSocket(SERVER_URL);
    socketRef.current = socket;
    socket.connect();
    const unsubMessage = socket.onMessage(setLastMessage);
    const unsubStatus = socket.onStatusChange(setIsConnected);

    return () => {
      unsubMessage();
      unsubStatus();
      socket.disconnect();
    };
  }, []);

  return { socket: socketRef.current, lastMessage, isConnected };
}
