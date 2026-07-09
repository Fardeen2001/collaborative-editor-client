"use client";

import type { ConnectionState } from "@/types";
import { cn } from "@/lib/utils";

const labels: Record<ConnectionState, string> = {
  disconnected: "Offline",
  connecting: "Connecting…",
  syncing: "Syncing…",
  synced: "Synced",
};

const dotColors: Record<ConnectionState, string> = {
  disconnected: "bg-amber-500",
  connecting: "bg-blue-400 animate-pulse",
  syncing: "bg-indigo-500 animate-pulse",
  synced: "bg-emerald-500",
};

const badgeStyles: Record<ConnectionState, string> = {
  disconnected: "border-amber-200 bg-amber-50 text-amber-800",
  connecting: "border-blue-200 bg-blue-50 text-blue-800",
  syncing: "border-indigo-200 bg-indigo-50 text-indigo-800",
  synced: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export function ConnectionStatus({ state }: { state: ConnectionState }) {
  return (
    <div
      className={cn(
        "badge border",
        badgeStyles[state]
      )}
      role="status"
      aria-live="polite"
    >
      <span className={cn("h-2 w-2 rounded-full", dotColors[state])} />
      {labels[state]}
    </div>
  );
}
