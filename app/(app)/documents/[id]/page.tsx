"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useApi } from "@/lib/ApiProvider";
import { useAppConfig } from "@/lib/config";
import { requireAuthOrRedirect } from "@/lib/auth";
import { CollaborativeEditor } from "@/components/CollaborativeEditor";
import { CollaborativeDocumentProvider } from "@/contexts/CollaborativeDocumentContext";
import type { DocumentRole } from "@/types";

export default function DocumentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const api = useApi();
  const config = useAppConfig();
  const documentId = params.id;
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<DocumentRole>("viewer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDocument = useCallback(async () => {
    if (!documentId) return;
    if (!requireAuthOrRedirect(router)) return;

    setLoading(true);
    setError("");
    try {
      const res = await api.getDocument(documentId);
      setTitle(res.document.title);
      setRole(res.document.role);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Failed to load document");
      setTitle("");
    } finally {
      setLoading(false);
    }
  }, [api, documentId, router]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  if (loading) {
    return <p className="p-8 text-zinc-500">Loading document…</p>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <p className="text-red-600">{error}</p>
        <p className="mt-2 text-sm text-zinc-500">API: {config.apiUrl}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={loadDocument}
            className="btn btn-primary px-4 py-2"
          >
            Retry
          </button>
          <Link href="/dashboard" className="btn btn-secondary px-4 py-2">
            Back to documents
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = role === "owner" || role === "editor";

  return (
    <div className="bg-white">
      <CollaborativeDocumentProvider documentId={documentId} canEdit={canEdit}>
        <CollaborativeEditor
          documentId={documentId}
          title={title}
          role={role}
        />
      </CollaborativeDocumentProvider>
    </div>
  );
}
