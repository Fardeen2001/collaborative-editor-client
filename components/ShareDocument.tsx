"use client";

import { useState } from "react";
import { useApi } from "@/lib/ApiProvider";
import { useAppConfig } from "@/lib/config";
import { ApiError } from "@/lib/api";
import { Share2 } from "lucide-react";

type Props = {
  documentId: string;
};

export function ShareDocument({ documentId }: Props) {
  const api = useApi();
  const config = useAppConfig();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const shareableRoles = config.roles.filter(
    (r): r is "editor" | "viewer" => r === "editor" || r === "viewer"
  );

  async function handleShare(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await api.shareDocument(documentId, email.trim(), role);
      setMessage(`Shared with ${res.access.email} as ${res.access.role}`);
      setEmail("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Share failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-secondary"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>

      {open && (
        <form onSubmit={handleShare} className="popover">
          <p className="mb-3 text-sm font-medium text-zinc-800">Invite by email</p>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
            className="input mb-2"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
            className="input mb-3"
          >
            {shareableRoles.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? "Sending…" : "Send invite"}
          </button>
          {message && <p className="mt-2 text-xs text-emerald-600">{message}</p>}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </form>
      )}
    </div>
  );
}
