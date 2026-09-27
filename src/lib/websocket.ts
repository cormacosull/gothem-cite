import type { ClientMessage, ServerMessage } from './protocol';

type MessageListener = (message: ServerMessage) => void;
type StatusListener = (connected: boolean) => void;

// Thin wrapper around React Native's built-in WebSocket global — no extra
// package needed on the client side, unlike the server.
export class GameSocket {
  private ws: WebSocket | null = null;
  private messageListeners = new Set<MessageListener>();
  private statusListeners = new Set<StatusListener>();

  constructor(private url: string) {}

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        this.messageListeners.forEach((listener) => listener(message));
      } catch (err) {
        console.warn('Received malformed message from server', err);
      }
    };

    this.ws.onopen = () => {
      console.log('Connected to game server');
      this.statusListeners.forEach((listener) => listener(true));
    };
    this.ws.onclose = () => {
      console.log('Disconnected from game server');
      this.statusListeners.forEach((listener) => listener(false));
    };
    this.ws.onerror = (err) => console.warn('WebSocket error', err);
  }

  send(message: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Tried to send while socket was not open:', message);
    }
  }

  // Both return an unsubscribe function.
  onMessage(listener: MessageListener) {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  onStatusChange(listener: StatusListener) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}
