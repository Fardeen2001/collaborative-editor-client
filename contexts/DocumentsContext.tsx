"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/ApiProvider";
import { ApiError } from "@/lib/api";
import type { DocumentSummary } from "@/types";

type DocumentsContextValue = {
  documents: DocumentSummary[];
  loading: boolean;
  creating: boolean;
  error: string | null;
  refreshDocuments: () => Promise<void>;
  createDocument: (title: string) => Promise<DocumentSummary | null>;
  clearError: () => void;
};

const DocumentsContext = createContext<DocumentsContextValue | null>(null);

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const refreshDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listDocuments();
      setDocuments(res.documents);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [api]);

  const createDocument = useCallback(
    async (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return null;

      setCreating(true);
      setError(null);
      try {
        const res = await api.createDocument(trimmed);
        setDocuments((prev) => [res.document, ...prev]);
        router.push(`/documents/${res.document.id}`);
        return res.document;
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Failed to create document"
        );
        return null;
      } finally {
        setCreating(false);
      }
    },
    [api, router]
  );

  return (
    <DocumentsContext.Provider
      value={{
        documents,
        loading,
        creating,
        error,
        refreshDocuments,
        createDocument,
        clearError,
      }}
    >
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments() {
  const ctx = useContext(DocumentsContext);
  if (!ctx) {
    throw new Error("useDocuments must be used within DocumentsProvider");
  }
  return ctx;
}
