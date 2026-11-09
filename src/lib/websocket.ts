import type { ClientMessage, ServerMessage } from './protocol';

type MessageListener = (message: ServerMessage) => void;
type StatusListener = (connected: boolean) => void;

const MAX_RECONNECT_DELAY_MS = 10000;

//small wrapper around react native's WebSocket, no extra package needed
export class GameSocket {
  private ws: WebSocket | null = null;
  private messageListeners = new Set<MessageListener>();
  private statusListeners = new Set<StatusListener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private manuallyClosed = false;

  constructor(private url: string) {}

  connect() {
    this.manuallyClosed = false;
    this.open();
  }

  //reconnect now and skip the backoff, used when the app comes back to the foreground
  reconnectNow() {
    if (this.manuallyClosed) return;
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectAttempt = 0;
    this.open();
  }

  private open() {
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
      this.reconnectAttempt = 0;
      console.log('Connected to game server');
      this.statusListeners.forEach((listener) => listener(true));
    };
    this.ws.onclose = () => {
      console.log('Disconnected from game server');
      this.statusListeners.forEach((listener) => listener(false));
      this.scheduleReconnect();
    };
    this.ws.onerror = (err) => console.warn('WebSocket error', err);
  }

  private scheduleReconnect() {
    if (this.manuallyClosed) return;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempt, MAX_RECONNECT_DELAY_MS);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      if (!this.manuallyClosed) this.open();
    }, delay);
  }

  send(message: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Tried to send while socket was not open:', message);
    }
  }

  //both return an unsubscribe function
  onMessage(listener: MessageListener) {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  onStatusChange(listener: StatusListener) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  disconnect() {
    this.manuallyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}
