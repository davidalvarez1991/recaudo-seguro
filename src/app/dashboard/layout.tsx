
import { UserNav } from "@/components/dashboard/user-nav";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import { SidebarContent } from "@/components/dashboard/sidebar-content";
import { getAuthenticatedUser } from "@/lib/auth";
import { AppLogo } from "@/components/logo";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The middleware now handles redirection for unauthenticated users,
  // so we can safely assume user and role exist here.
  const { user, role } = await getAuthenticatedUser();

  return (
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full flex-col bg-background">
          <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 z-50">
             <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Link
                href="/dashboard/proveedor"
                className="flex items-center gap-2 font-semibold text-primary"
              >
                <AppLogo className="h-7 w-7" />
                <span className="text-lg hidden sm:inline-block">Recaudo Seguro</span>
              </Link>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <UserNav />
            </div>
          </header>
          <div className="flex">
            <Sidebar collapsible="icon">
              <SidebarContent role={role!} />
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
