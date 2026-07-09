import type { RuntimeConfig } from "@/types";
import {
  buildFallbackConfig,
  getClientApiUrl,
  mergeRuntimeConfig,
  normalizeWsUrl,
} from "./static";

let cached: RuntimeConfig | null = null;
let inflight: Promise<RuntimeConfig> | null = null;

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  const clientApiUrl = getClientApiUrl();

  if (cached && cached.apiUrl === clientApiUrl) return cached;
  if (cached && cached.apiUrl !== clientApiUrl) {
    cached = null;
    inflight = null;
  }

  if (inflight) return inflight;

  const fallback = buildFallbackConfig();

  inflight = fetch(`${clientApiUrl}/api/config`, { cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) return fallback;
      const server = (await res.json()) as Partial<RuntimeConfig>;
      return mergeRuntimeConfig(server, fallback);
    })
    .catch(() => fallback)
    .then((config) => {
      cached = config;
      inflight = null;
      return config;
    });

  return inflight;
}

export function getRuntimeConfig(): RuntimeConfig {
  if (!cached) {
    throw new Error("Runtime config not loaded. Call loadRuntimeConfig() first.");
  }
  return cached;
}

export function resetRuntimeConfig() {
  cached = null;
  inflight = null;
}

export function buildWsUrl(
  config: RuntimeConfig,
  documentId: string,
  token: string
): string {
  const wsBase = normalizeWsUrl(config.apiUrl, config.wsUrl || config.wsPath);
  const url = new URL(wsBase);
  url.searchParams.set(config.wsQueryParams.token, token);
  url.searchParams.set(config.wsQueryParams.documentId, documentId);
  return url.toString();
}

export function buildDocStorageKey(config: RuntimeConfig, documentId: string): string {
  return `${config.storage.indexedDbDocPrefix}${documentId}`;
}
