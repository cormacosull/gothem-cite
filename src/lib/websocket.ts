import type { ClientMessage, ServerMessage } from './protocol';

type Listener = (message: ServerMessage) => void;

// Thin wrapper around React Native's built-in WebSocket global — no extra
// package needed on the client side, unlike the server.
export class GameSocket {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();

  constructor(private url: string) {}

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        this.listeners.forEach((listener) => listener(message));
      } catch (err) {
        console.warn('Received malformed message from server', err);
      }
    };

    this.ws.onopen = () => console.log('Connected to game server');
    this.ws.onclose = () => console.log('Disconnected from game server');
    this.ws.onerror = (err) => console.warn('WebSocket error', err);
  }

  send(message: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Tried to send while socket was not open:', message);
    }
  }

  // Returns an unsubscribe function.
  onMessage(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}
