import type { RuntimeConfig } from "@/types";

/** Static refs so Next.js inlines NEXT_PUBLIC_* at build time (dynamic keys are not). */
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;
const NEXT_PUBLIC_WS_URL = process.env.NEXT_PUBLIC_WS_URL;
const NEXT_PUBLIC_WS_PATH = process.env.NEXT_PUBLIC_WS_PATH;

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function envInt(name: string, fallback: number): number {
  const raw = env(name);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/** Ensure API URL has a scheme and no trailing slash. */
export function normalizeApiUrl(raw?: string): string {
  const value = raw?.trim() || "http://localhost:8000";
  if (/^https?:\/\//i.test(value)) {
    return value.replace(/\/$/, "");
  }
  return `http://${value.replace(/\/$/, "")}`;
}

/** Resolve an absolute ws:// or wss:// URL from env, server config, or API base. */
export function normalizeWsUrl(apiUrl: string, wsUrlOrPath?: string): string {
  const base = normalizeApiUrl(apiUrl).replace(/^http/i, "ws");
  const raw = wsUrlOrPath?.trim();

  if (!raw) {
    const path = NEXT_PUBLIC_WS_PATH?.trim() || "/ws";
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
  }

  if (/^wss?:\/\//i.test(raw)) return raw;

  if (raw.startsWith("/")) {
    return `${base.replace(/\/$/, "")}${raw}`;
  }

  return `ws://${raw.replace(/^\/+/, "")}`;
}

/** Client-side API URL — always prefer NEXT_PUBLIC_API_URL from .env.local */
export function getClientApiUrl(): string {
  return normalizeApiUrl(NEXT_PUBLIC_API_URL);
}

export function getClientWsUrl(apiUrl?: string): string {
  const base = normalizeApiUrl(apiUrl || NEXT_PUBLIC_API_URL);
  if (NEXT_PUBLIC_WS_URL?.trim()) {
    return normalizeWsUrl(base, NEXT_PUBLIC_WS_URL);
  }
  return normalizeWsUrl(base);
}

export const staticStorage = {
  tokenKey: env("NEXT_PUBLIC_TOKEN_STORAGE_KEY") || "collab_editor_token",
  userKey: env("NEXT_PUBLIC_USER_STORAGE_KEY") || "collab_editor_user",
};

export const staticLocale = env("NEXT_PUBLIC_LOCALE") || "en-US";

export function buildFallbackConfig(): RuntimeConfig {
  const apiUrl = getClientApiUrl();
  const wsUrl = getClientWsUrl(apiUrl);

  return {
    apiUrl,
    wsUrl,
    wsPath: env("NEXT_PUBLIC_WS_PATH") || "/ws",
    yjsField: env("NEXT_PUBLIC_YJS_FIELD") || "prosemirror",
    protocol: {
      messageSync: envInt("NEXT_PUBLIC_YJS_MESSAGE_SYNC", 0),
      messageAwareness: envInt("NEXT_PUBLIC_YJS_MESSAGE_AWARENESS", 1),
    },
    wsQueryParams: {
      token: env("NEXT_PUBLIC_WS_TOKEN_PARAM") || "token",
      documentId: env("NEXT_PUBLIC_WS_DOCUMENT_ID_PARAM") || "documentId",
    },
    limits: {
      maxMessageSize: envInt("NEXT_PUBLIC_MAX_MESSAGE_SIZE", 256 * 1024),
      passwordMinLength: envInt("NEXT_PUBLIC_PASSWORD_MIN_LENGTH", 8),
      passwordMaxLength: envInt("NEXT_PUBLIC_PASSWORD_MAX_LENGTH", 128),
      titleMaxLength: envInt("NEXT_PUBLIC_TITLE_MAX_LENGTH", 200),
      snapshotLabelMaxLength: envInt("NEXT_PUBLIC_SNAPSHOT_LABEL_MAX_LENGTH", 120),
    },
    sync: {
      heartbeatMs: envInt("NEXT_PUBLIC_WS_HEARTBEAT_MS", 10_000),
      reconnectMs: envInt("NEXT_PUBLIC_WS_RECONNECT_MS", 2_000),
    },
    defaults: {
      snapshotLabel: env("NEXT_PUBLIC_DEFAULT_SNAPSHOT_LABEL") || "Manual snapshot",
    },
    roles: ["owner", "editor", "viewer"],
    storage: {
      indexedDbDocPrefix: env("NEXT_PUBLIC_IDB_DOC_PREFIX") || "doc-",
      outboxDbName: env("NEXT_PUBLIC_OUTBOX_DB_NAME") || "collab-editor-outbox",
      outboxStoreName: env("NEXT_PUBLIC_OUTBOX_STORE_NAME") || "outbox",
      outboxDbVersion: envInt("NEXT_PUBLIC_OUTBOX_DB_VERSION", 1),
    },
    features: { ai: false },
  };
}

export function mergeRuntimeConfig(
  server: Partial<RuntimeConfig>,
  fallback: RuntimeConfig
): RuntimeConfig {
  const apiUrl = getClientApiUrl();
  const wsUrl = normalizeWsUrl(
    apiUrl,
    NEXT_PUBLIC_WS_URL || server.wsUrl || fallback.wsUrl || server.wsPath
  );

  return {
    ...fallback,
    ...server,
    apiUrl,
    wsUrl,
    protocol: { ...fallback.protocol, ...server.protocol },
    wsQueryParams: { ...fallback.wsQueryParams, ...server.wsQueryParams },
    limits: { ...fallback.limits, ...server.limits },
    sync: { ...fallback.sync, ...server.sync },
    defaults: { ...fallback.defaults, ...server.defaults },
    storage: { ...fallback.storage, ...server.storage },
    features: { ...fallback.features, ...server.features },
  };
}
