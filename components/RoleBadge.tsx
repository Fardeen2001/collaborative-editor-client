import type { DocumentRole } from "@/types";
import { cn } from "@/lib/utils";

const styles: Record<DocumentRole, string> = {
  owner: "badge-owner",
  editor: "badge-editor",
  viewer: "badge-viewer",
};

export function RoleBadge({ role }: { role: DocumentRole }) {
  return (
    <span className={cn("badge capitalize", styles[role])}>
      {role}
    </span>
  );
}
