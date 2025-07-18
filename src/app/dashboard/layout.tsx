import { UserNav } from "@/components/dashboard/user-nav";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { SidebarContentClient } from "@/components/dashboard/sidebar-content-client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In a real application, you would add logic here to check for a valid
  // user session and fetch the user's role to display the correct sidebar.
  // For now, we'll conditionally render the sidebar content.
  // e.g., `if (!session) { redirect('/login'); }`

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 z-50">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Link
              href="#"
              className="flex items-center gap-2 font-semibold text-primary"
            >
              <ShieldCheck className="h-6 w-6" />
              <span className="text-lg">Recaudo Seguro</span>
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <UserNav />
          </div>
        </header>
        <div className="flex">
          <Sidebar>
            <SidebarContentClient />
          </Sidebar>
          <SidebarInset>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
              {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
