"use client";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { useSidebar } from "./sidebar-provider";

export function SidebarToggle() {
  const { isOpen, toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      aria-label="Toggle sidebar"
      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors"
    >
      {isOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
    </button>
  );
}