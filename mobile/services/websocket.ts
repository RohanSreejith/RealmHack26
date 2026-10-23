import { Incident } from '../types';

type WebSocketListener = (event: any) => void;
type ConnectionStateListener = (state: 'CONNECTED' | 'RECONNECTING' | 'OFFLINE') => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Set<WebSocketListener> = new Set();
  private stateListeners: Set<ConnectionStateListener> = new Set();
  private reconnectTimer: any = null;
  private isIntentionalClose: boolean = false;
  private connectionState: 'CONNECTED' | 'RECONNECTING' | 'OFFLINE' = 'OFFLINE';

  private getWsUrl(): string {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
    return apiUrl.replace(/^http/, 'ws') + '/ws/alerts';
  }

  public connect() {
    this.isIntentionalClose = false;
    const wsUrl = this.getWsUrl();

    try {
      this.setConnectionState('RECONNECTING');
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.setConnectionState('CONNECTED');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners(data);
        } catch {
          this.notifyListeners(event.data);
        }
      };

      this.socket.onerror = () => {
        // Disconnected or backend offline
        this.setConnectionState('RECONNECTING');
      };

      this.socket.onclose = () => {
        this.setConnectionState('RECONNECTING');
        if (!this.isIntentionalClose) {
          this.scheduleReconnect();
        }
      };
    } catch {
      this.setConnectionState('RECONNECTING');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  private setConnectionState(state: 'CONNECTED' | 'RECONNECTING' | 'OFFLINE') {
    this.connectionState = state;
    this.stateListeners.forEach(listener => listener(state));
  }

  public getConnectionState() {
    return this.connectionState;
  }

  public subscribe(listener: WebSocketListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public subscribeConnectionState(listener: ConnectionStateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.connectionState);
    return () => this.stateListeners.delete(listener);
  }

  private notifyListeners(data: any) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (err) {
        console.error("Error in websocket listener", err);
      }
    });
  }

  public disconnect() {
    this.isIntentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setConnectionState('OFFLINE');
  }

  /**
   * For the 1-Minute Safety Demo: Emits a synthetic high-priority safety alert
   * exactly as if sent across the wire by the backend.
   */
  public simulateSafetyEvent(incident: Incident) {
    this.notifyListeners({
      type: 'CRITICAL_SAFETY_ALERT',
      timestamp: new Date().toLocaleTimeString(),
      incident: incident
    });
  }
}

export const webSocketService = new WebSocketService();
