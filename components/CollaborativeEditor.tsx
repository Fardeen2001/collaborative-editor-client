"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Collaboration from "@tiptap/extension-collaboration";
import Link from "next/link";
import { useAppConfig } from "@/lib/config";
import { useApi } from "@/lib/ApiProvider";
import { useCollaborativeDocument } from "@/contexts/CollaborativeDocumentContext";
import type { DocumentRole } from "@/types";
import { ConnectionStatus } from "./ConnectionStatus";
import { VersionHistory } from "./VersionHistory";
import { ShareDocument } from "./ShareDocument";
import { EditorToolbar } from "./EditorToolbar";
import { RoleBadge } from "./RoleBadge";
import { Sparkles, ChevronLeft } from "lucide-react";
import { useState } from "react";

type Props = {
  title: string;
  role: DocumentRole;
  documentId: string;
};

export function CollaborativeEditor({ title, role, documentId }: Props) {
  const config = useAppConfig();
  const api = useApi();
  const { ydoc, localReady, connectionState } = useCollaborativeDocument();
  const canEdit = role === "owner" || role === "editor";
  const [aiLoading, setAiLoading] = useState(false);

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable: canEdit,
      extensions: [
        StarterKit.configure({ undoRedo: false }),
        Placeholder.configure({ placeholder: "Start writing…" }),
        Collaboration.configure({
          document: ydoc,
          field: config.yjsField,
        }),
      ],
      editorProps: {
        attributes: {
          class: "prose prose-zinc max-w-none focus:outline-none",
        },
      },
    },
    [ydoc, config.yjsField, canEdit]
  );

  async function handleAiImprove() {
    if (!editor || !canEdit || !config.features.ai) return;
    const text = editor.getText();
    if (!text.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.improveText(text);
      editor.commands.setContent(res.improved);
    } catch (err) {
      alert(err instanceof Error ? err.message : "AI improve failed");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <header className="border-b border-zinc-200/80 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              href="/dashboard"
              className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition hover:text-indigo-600"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              All documents
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-xl font-semibold tracking-tight text-zinc-900">
                {title}
              </h1>
              <RoleBadge role={role} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {canEdit && config.features.ai && (
              <button
                type="button"
                onClick={handleAiImprove}
                disabled={aiLoading || !localReady}
                className="btn btn-secondary"
              >
                <Sparkles className="h-4 w-4 text-indigo-600" />
                {aiLoading ? "Improving…" : "AI improve"}
              </button>
            )}
            {role === "owner" && <ShareDocument documentId={documentId} />}
            <ConnectionStatus state={connectionState} />
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-3xl">
            {!localReady || !editor ? (
              <div className="card flex items-center justify-center p-12">
                <p className="text-sm text-zinc-500">Loading editor…</p>
              </div>
            ) : (
              <div className="editor-shell">
                {canEdit && <EditorToolbar editor={editor} />}
                <div className="editor-canvas">
                  <EditorContent editor={editor} />
                </div>
              </div>
            )}
            {!canEdit && localReady && (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                View-only mode — you cannot edit this document.
              </p>
            )}
          </div>
        </div>
        <VersionHistory documentId={documentId} canEdit={canEdit} />
      </div>
    </div>
  );
}
