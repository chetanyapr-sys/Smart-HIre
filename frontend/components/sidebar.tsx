"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "./theme-provider";
import { useSidebar } from "./sidebar-provider";
import { SidebarToggle } from "./sidebar-toggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { isOpen } = useSidebar();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    window.location.href = "/login";
  };

  return (
    <aside
      className={`shrink-0 h-screen sticky top-0 flex flex-col border-r border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0f] transition-all duration-300 ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      {/* Header: logo + toggle */}
      <div
        className={`flex items-center py-5 ${
          isOpen ? "justify-between px-5" : "flex-col gap-3 px-2"
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 shrink-0 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-violet-500/20">
            S
          </div>
          {isOpen && (
            <span className="text-lg font-bold bg-gradient-to-r from-violet-500 to-indigo-500 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent whitespace-nowrap">
              SmartHire
            </span>
          )}
        </Link>
        <SidebarToggle />
      </div>

      {/* Nav links */}
      <nav className={`flex-1 space-y-1 mt-2 ${isOpen ? "px-4" : "px-2"}`}>
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`relative flex items-center gap-3 py-2.5 rounded-xl text-sm transition-colors ${
                isOpen ? "px-3.5" : "px-0 justify-center"
              } ${
                active
                  ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold"
                  : "text-gray-500 dark:text-gray-400 hover:bg-black/[0.03] dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {active && isOpen && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-violet-500" />
              )}
              <Icon size={18} strokeWidth={2} className="shrink-0" />
              {isOpen && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer: theme toggle + logout */}
      <div
        className={`py-4 border-t border-black/10 dark:border-white/10 space-y-1 ${
          isOpen ? "px-4" : "px-2"
        }`}
      >
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-black/[0.03] dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors ${
            isOpen ? "px-3.5" : "justify-center"
          }`}
        >
          {theme === "dark" ? (
            <Sun size={18} className="shrink-0" />
          ) : (
            <Moon size={18} className="shrink-0" />
          )}
          {isOpen && (theme === "dark" ? "Light mode" : "Dark mode")}
        </button>
        <button
          onClick={handleLogout}
          title="Logout"
          className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-colors ${
            isOpen ? "px-3.5" : "justify-center"
          }`}
        >
          <LogOut size={18} className="shrink-0" />
          {isOpen && "Logout"}
        </button>
      </div>
    </aside>
  );
}