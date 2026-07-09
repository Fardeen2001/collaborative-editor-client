"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CreateDocumentForm } from "@/components/CreateDocumentForm";

export function CreateDocumentButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-primary"
      >
        <Plus className="h-4 w-4" />
        Create new
      </button>

      {open && (
        <div className="popover">
          <p className="mb-3 text-sm font-medium text-zinc-800">New document</p>
          <CreateDocumentForm onSuccess={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
