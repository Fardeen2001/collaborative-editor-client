"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/ApiProvider";
import { useAppConfig } from "@/lib/config";
import { ApiError } from "@/lib/api";
import type { Snapshot } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import { History, RotateCcw, Save, Clock } from "lucide-react";

type Props = {
  documentId: string;
  canEdit: boolean;
};

export function VersionHistory({ documentId, canEdit }: Props) {
  const api = useApi();
  const config = useAppConfig();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await api.listSnapshots(documentId);
    setSnapshots(res.snapshots);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [documentId, api]);

  async function handleSave() {
    setLoading(true);
    setError("");
    try {
      await api.saveSnapshot(
        documentId,
        label.trim() || config.defaults.snapshotLabel
      );
      setLabel("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save snapshot");
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(snapshotId: string) {
    if (
      !confirm(
        "Restore this version? Other collaborators will receive the change as a merge."
      )
    ) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.restoreSnapshot(documentId, snapshotId);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to restore");
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-zinc-200/80 bg-zinc-50/80">
      <div className="border-b border-zinc-200/80 p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <History className="h-4 w-4 text-indigo-600" />
          Version history
        </div>
        {canEdit && (
          <div className="space-y-3">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Snapshot label"
              maxLength={config.limits.snapshotLabelMaxLength}
              className="input"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="btn btn-primary w-full"
            >
              <Save className="h-4 w-4" />
              Save version
            </button>
          </div>
        )}
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {snapshots.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-300 bg-white/60 px-4 py-10 text-center">
            <Clock className="mb-3 h-8 w-8 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-600">No versions yet</p>
            <p className="mt-1 text-xs text-zinc-400">
              Save a snapshot to track changes over time.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {snapshots.map((snapshot) => (
              <li key={snapshot.id} className="card p-4 transition hover:border-zinc-300">
                <p className="font-medium text-zinc-900">{snapshot.label}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatDate(snapshot.createdAt)}
                </p>
                {snapshot.createdBy && (
                  <p className="text-xs text-zinc-400">by {snapshot.createdBy.name}</p>
                )}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleRestore(snapshot.id)}
                    disabled={loading}
                    className={cn(
                      "mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700",
                      loading && "opacity-60"
                    )}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
