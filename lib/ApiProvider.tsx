"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createApi, type ApiClient } from "@/lib/api";
import { useAppConfig } from "@/lib/config";

const ApiContext = createContext<ApiClient | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
  const config = useAppConfig();
  const api = useMemo(() => createApi(config), [config]);
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useApi(): ApiClient {
  const api = useContext(ApiContext);
  if (!api) {
    throw new Error("useApi must be used within ApiProvider");
  }
  return api;
}
