"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { RuntimeConfig } from "@/types";
import { loadRuntimeConfig } from "./runtime";

const ConfigContext = createContext<RuntimeConfig | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<RuntimeConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRuntimeConfig()
      .then(setConfig)
      .catch((err) => setError(err instanceof Error ? err.message : "Config load failed"));
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-red-600">
        Failed to load application config: {error}
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-zinc-500">
        Loading configuration…
      </div>
    );
  }

  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
}

export function useAppConfig(): RuntimeConfig {
  const config = useContext(ConfigContext);
  if (!config) {
    throw new Error("useAppConfig must be used within ConfigProvider");
  }
  return config;
}
