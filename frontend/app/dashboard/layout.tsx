import { Sidebar } from "@/components/sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { SidebarProvider } from "@/components/sidebar-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-white dark:bg-[#0a0a0f] text-gray-900 dark:text-white">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <DashboardTopbar />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}