"use client";

import { useState } from "react";
import { useAppConfig } from "@/lib/config";
import { useDocuments } from "@/contexts/DocumentsContext";

type Props = {
  onSuccess?: () => void;
  submitLabel?: string;
  className?: string;
  layout?: "stacked" | "inline";
};

export function CreateDocumentForm({
  onSuccess,
  submitLabel = "Create document",
  className,
  layout = "stacked",
}: Props) {
  const config = useAppConfig();
  const { createDocument, creating, error, clearError } = useDocuments();
  const [title, setTitle] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    const doc = await createDocument(title);
    if (doc) {
      setTitle("");
      onSuccess?.();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        className ??
        (layout === "inline" ? "flex flex-col gap-3 sm:flex-row sm:items-start" : undefined)
      }
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Document title"
        maxLength={config.limits.titleMaxLength}
        required
        className={layout === "inline" ? "input flex-1" : "input mb-3"}
      />
      <button
        type="submit"
        disabled={creating || !title.trim()}
        className={
          layout === "inline"
            ? "btn btn-primary shrink-0 px-4 py-2"
            : "btn btn-primary w-full"
        }
      >
        {creating ? "Creating…" : submitLabel}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </form>
  );
}
