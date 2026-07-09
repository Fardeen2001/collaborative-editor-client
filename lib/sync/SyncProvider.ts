import * as Y from "yjs";
import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import * as syncProtocol from "y-protocols/sync";
import type { ConnectionState, RuntimeConfig } from "@/types";
import { enqueueUpdate, listOutbox, clearOutbox } from "./outbox";

type Listener = (state: ConnectionState) => void;

export type SyncProviderOptions = {
  doc: Y.Doc;
  documentId: string;
  wsUrl: string;
  canEdit: boolean;
  config: RuntimeConfig;
};

export class SyncProvider {
  doc: Y.Doc;
  documentId: string;
  wsUrl: string;
  canEdit: boolean;
  config: RuntimeConfig;
  ws: WebSocket | null = null;
  private seq = 0;
  private state: ConnectionState = "disconnected";
  private listeners = new Set<Listener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private syncTimeout: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private initialSyncDone = false;
  private outboxDrained = false;

  constructor(options: SyncProviderOptions) {
    this.doc = options.doc;
    this.documentId = options.documentId;
    this.wsUrl = options.wsUrl;
    this.canEdit = options.canEdit;
    this.config = options.config;

    this.doc.on("update", this.handleLocalUpdate);
    this.connect();

    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }
  }

  private setState(next: ConnectionState) {
    this.state = next;
    this.listeners.forEach((l) => l(next));
  }

  onStatusChange(listener: Listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private handleOnline = () => this.connect();
  private handleOffline = () => {
    this.setState("disconnected");
    this.ws?.close();
  };

  private handleLocalUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin === this || !this.canEdit) return;

    if (update.byteLength > this.config.limits.maxMessageSize) {
      console.error("Local update exceeds max message size; not queued.");
      return;
    }

    this.seq += 1;
    enqueueUpdate(this.config, this.documentId, update, this.seq).catch(console.error);

    if (this.ws?.readyState === WebSocket.OPEN && this.initialSyncDone) {
      this.sendUpdate(update);
    }
  };

  private sendUpdate(update: Uint8Array) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (update.byteLength > this.config.limits.maxMessageSize) return;

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, this.config.protocol.messageSync);
    syncProtocol.writeUpdate(encoder, update);
    this.ws.send(encoding.toUint8Array(encoder));
  }

  private async drainOutbox() {
    if (this.outboxDrained) return;
    const entries = await listOutbox(this.config, this.documentId);
    for (const entry of entries) {
      this.sendUpdate(entry.update);
    }
    await clearOutbox(this.config, this.documentId);
    this.outboxDrained = true;
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        this.setState("disconnected");
        this.connect();
      }
    }, this.config.sync.heartbeatMs);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  connect() {
    if (this.destroyed) return;
    if (this.ws?.readyState === WebSocket.OPEN) return;

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      try {
        this.ws.close();
      } catch {
        /* ignore */
      }
      this.ws = null;
    }

    this.setState("connecting");
    this.initialSyncDone = false;
    this.outboxDrained = false;

    const ws = new WebSocket(this.wsUrl);
    ws.binaryType = "arraybuffer";
    this.ws = ws;

    ws.onopen = () => {
      this.setState("syncing");
      this.startHeartbeat();
      this.clearSyncTimeout();
      this.syncTimeout = setTimeout(() => {
        if (!this.initialSyncDone && !this.destroyed) {
          console.warn("WebSocket sync timeout — continuing in offline mode");
          this.setState("disconnected");
        }
      }, 8000);
    };

    ws.onmessage = async (event) => {
      const data = new Uint8Array(event.data as ArrayBuffer);
      if (data.byteLength > this.config.limits.maxMessageSize) {
        ws.close();
        return;
      }

      const decoder = decoding.createDecoder(data);
      const messageType = decoding.readVarUint(decoder);

      if (messageType === this.config.protocol.messageSync) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, this.config.protocol.messageSync);
        syncProtocol.readSyncMessage(decoder, encoder, this.doc, this);
        if (encoding.length(encoder) > 1) {
          ws.send(encoding.toUint8Array(encoder));
        }

        if (!this.initialSyncDone) {
          this.initialSyncDone = true;
          this.clearSyncTimeout();
          await this.drainOutbox();
        }
        this.setState("synced");
      }
    };

    ws.onclose = () => {
      this.stopHeartbeat();
      this.initialSyncDone = false;
      if (!this.destroyed) {
        this.setState("disconnected");
        this.scheduleReconnect();
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  private clearSyncTimeout() {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (navigator.onLine) this.connect();
    }, this.config.sync.reconnectMs);
  }

  destroy() {
    this.destroyed = true;
    this.clearSyncTimeout();
    this.doc.off("update", this.handleLocalUpdate);
    this.stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
    this.ws?.close();
    this.ws = null;
  }
}
