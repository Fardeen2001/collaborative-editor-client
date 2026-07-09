"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { useAppConfig, buildWsUrl, buildDocStorageKey } from "@/lib/config";
import { getToken } from "@/lib/auth";
import { SyncProvider } from "@/lib/sync/SyncProvider";
import type { ConnectionState } from "@/types";

type ContextValue = {
  ydoc: Y.Doc;
  localReady: boolean;
  connectionState: ConnectionState;
};

const CollaborativeDocumentContext = createContext<ContextValue | null>(null);

type ProviderProps = {
  documentId: string;
  canEdit: boolean;
  children: ReactNode;
};

export function CollaborativeDocumentProvider({
  documentId,
  canEdit,
  children,
}: ProviderProps) {
  const config = useAppConfig();
  const ydoc = useMemo(() => new Y.Doc(), [documentId]);
  const [localReady, setLocalReady] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const providerRef = useRef<SyncProvider | null>(null);

  useEffect(() => {
    setLocalReady(false);
    setConnectionState("disconnected");

    const persistence = new IndexeddbPersistence(
      buildDocStorageKey(config, documentId),
      ydoc
    );

    const token = getToken() || "";
    const provider = new SyncProvider({
      doc: ydoc,
      documentId,
      wsUrl: buildWsUrl(config, documentId, token),
      canEdit,
      config,
    });
    providerRef.current = provider;

    const unsub = provider.onStatusChange(setConnectionState);
    const markReady = () => setLocalReady(true);

    persistence.on("synced", markReady);
    const readyTimer = setTimeout(markReady, 1000);

    return () => {
      clearTimeout(readyTimer);
      unsub();
      provider.destroy();
      persistence.destroy();
      ydoc.destroy();
      providerRef.current = null;
      setLocalReady(false);
      setConnectionState("disconnected");
    };
  }, [
    documentId,
    canEdit,
    ydoc,
    config.apiUrl,
    config.wsUrl,
    config.yjsField,
    config.limits.maxMessageSize,
    config.protocol.messageSync,
    config.sync.heartbeatMs,
    config.sync.reconnectMs,
    config.storage.indexedDbDocPrefix,
    config.storage.outboxDbName,
    config.storage.outboxStoreName,
    config.storage.outboxDbVersion,
    config.wsQueryParams.token,
    config.wsQueryParams.documentId,
  ]);

  const value = useMemo(
    () => ({ ydoc, localReady, connectionState }),
    [ydoc, localReady, connectionState]
  );

  return (
    <CollaborativeDocumentContext.Provider value={value}>
      {children}
    </CollaborativeDocumentContext.Provider>
  );
}

export function useCollaborativeDocument() {
  const ctx = useContext(CollaborativeDocumentContext);
  if (!ctx) {
    throw new Error(
      "useCollaborativeDocument must be used within CollaborativeDocumentProvider"
    );
  }
  return ctx;
}
