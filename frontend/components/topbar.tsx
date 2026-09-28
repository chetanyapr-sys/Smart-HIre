"use client";
import { SidebarToggle } from "./sidebar-toggle";

export function Topbar() {
  return (
    <header className="h-14 shrink-0 sticky top-0 z-40 flex items-center px-4 border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-md">
      <SidebarToggle />
    </header>
  );
}