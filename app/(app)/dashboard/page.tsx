"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { requireAuthOrRedirect } from "@/lib/auth";
import { useDocuments } from "@/contexts/DocumentsContext";
import { CreateDocumentForm } from "@/components/CreateDocumentForm";
import { RoleBadge } from "@/components/RoleBadge";
import { formatDate } from "@/lib/utils";
import { ChevronRight, FileText, Plus } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { documents, loading, error, refreshDocuments } = useDocuments();

  useEffect(() => {
    if (!requireAuthOrRedirect(router)) return;
    refreshDocuments();
  }, [router, refreshDocuments]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Your documents
        </h1>
        <p className="mt-2 text-zinc-500">
          Collaborate in real time with offline support.
        </p>
      </div>

      <div className="card mb-8 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-indigo-600" />
          <p className="text-sm font-semibold text-zinc-900">New document</p>
        </div>
        <CreateDocumentForm submitLabel="Create" layout="inline" />
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-20 animate-pulse bg-zinc-100" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <FileText className="mb-4 h-10 w-10 text-zinc-300" />
          <p className="font-medium text-zinc-700">No documents yet</p>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            Create your first document using the form above or the{" "}
            <span className="font-medium text-indigo-600">Create new</span> button in
            the header.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {documents.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/documents/${doc.id}`}
                className="card group flex items-center justify-between gap-4 p-5 transition hover:border-indigo-200 hover:shadow-md"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-medium text-zinc-900 group-hover:text-indigo-700">
                      {doc.title}
                    </h2>
                    <RoleBadge role={doc.role} />
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">
                    Updated {formatDate(doc.updatedAt)}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300 transition group-hover:text-indigo-500" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
