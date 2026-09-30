import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
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

    // A backgrounded app socket tends to die quietly; retry as soon as the app is active again 
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') socket.reconnectNow();
    });

    return () => {
      unsubMessage();
      unsubStatus();
      appStateSub.remove();
      socket.disconnect();
    };
  }, []);

  return { socket: socketRef.current, lastMessage, isConnected };
}
