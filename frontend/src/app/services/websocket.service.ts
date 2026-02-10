import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { apiUrl } from '../../environments/firebase.config';

export interface SyncMessage {
  type: 'update';
  userId: string;
  clientId?: string;
  scope?: string;
  payload?: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private readonly clientId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `client-${Math.random().toString(36).slice(2)}`;

  private updatesSubject = new Subject<SyncMessage>();
  updates$ = this.updatesSubject.asObservable();

  connect(userId: string) {
    if (!userId) return;
    this.userId = userId;
    this.shouldReconnect = true;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = this.buildWsUrl();
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.send({ type: 'hello', userId: this.userId, clientId: this.clientId } as any);
    };

    this.ws.onmessage = (event) => {
      let message: SyncMessage | null = null;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }

      if (!message || message.type !== 'update') return;
      if (message.clientId && message.clientId === this.clientId) return;
      this.updatesSubject.next(message);
    };

    this.ws.onclose = () => {
      this.ws = null;
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.userId = null;
  }

  sendUpdate(scope: string, payload?: any) {
    if (!this.userId) return;
    this.send({
      type: 'update',
      userId: this.userId,
      clientId: this.clientId,
      scope,
      payload
    });
  }

  private send(message: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(message));
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.userId) {
        this.connect(this.userId);
      }
    }, 3000);
  }

  private buildWsUrl(): string {
    // Use window.location for WebSocket URL since apiUrl is a relative path
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/ws`;
  }
}
