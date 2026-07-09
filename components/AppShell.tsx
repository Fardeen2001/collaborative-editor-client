"use client";

import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      {children}
    </div>
  );
}
