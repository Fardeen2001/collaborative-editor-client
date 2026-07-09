export type DocumentRole = "owner" | "editor" | "viewer";

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "syncing"
  | "synced";

export type User = {
  id: string;
  email: string;
  name: string;
};

export type DocumentSummary = {
  id: string;
  title: string;
  role: DocumentRole;
  updatedAt: string;
  createdAt: string;
};

export type Snapshot = {
  id: string;
  label: string;
  createdAt: string;
  createdBy: { id: string; name: string; email: string } | null;
};

export type RuntimeConfig = {
  apiUrl: string;
  wsUrl: string;
  wsPath: string;
  yjsField: string;
  protocol: {
    messageSync: number;
    messageAwareness: number;
  };
  wsQueryParams: {
    token: string;
    documentId: string;
  };
  limits: {
    maxMessageSize: number;
    passwordMinLength: number;
    passwordMaxLength: number;
    titleMaxLength: number;
    snapshotLabelMaxLength: number;
  };
  sync: {
    heartbeatMs: number;
    reconnectMs: number;
  };
  defaults: {
    snapshotLabel: string;
  };
  roles: DocumentRole[];
  storage: {
    indexedDbDocPrefix: string;
    outboxDbName: string;
    outboxStoreName: string;
    outboxDbVersion: number;
  };
  features: {
    ai: boolean;
  };
};
