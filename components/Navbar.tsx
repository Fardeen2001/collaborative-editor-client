"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth, getStoredUser } from "@/lib/auth";
import { CreateDocumentButton } from "@/components/CreateDocumentButton";
import { LogOut, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = getStoredUser();
  const initial = user?.name?.charAt(0).toUpperCase() ?? "?";

  function logout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <nav className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 px-6 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-semibold text-zinc-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <FileText className="h-4 w-4" />
            </span>
            <span>Collab Editor</span>
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              "hidden text-sm font-medium transition sm:inline",
              pathname === "/dashboard"
                ? "text-indigo-600"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            Documents
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <CreateDocumentButton />
          {user && (
            <div className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 py-1 pl-1 pr-3 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                {initial}
              </span>
              <span className="text-sm font-medium text-zinc-700">{user.name}</span>
            </div>
          )}
          <button type="button" onClick={logout} className="btn btn-secondary">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
