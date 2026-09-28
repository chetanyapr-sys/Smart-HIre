"use client";
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";

export function DashboardTopbar() {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(localStorage.getItem("name") || "User");
  }, []);

  return (
    <header className="h-16 shrink-0 flex items-center justify-end gap-4 px-6 border-b border-black/10 dark:border-white/10">
      <button
        aria-label="Notifications"
        className="relative w-9 h-9 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <Bell size={18} />
        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-violet-500" />
      </button>

      <div className="flex items-center gap-2.5 pl-3 border-l border-black/10 dark:border-white/10">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium hidden sm:block">{name}</span>
      </div>
    </header>
  );
}