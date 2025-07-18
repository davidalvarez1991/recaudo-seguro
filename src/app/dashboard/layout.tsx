
import { UserNav } from "@/components/dashboard/user-nav";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { SidebarContentProveedor } from "@/components/dashboard/sidebar-content-proveedor";
import { SidebarContentClient } from "@/components/dashboard/sidebar-content-client";
import { cookies } from "next/headers";
import { SidebarContentAdmin } from "@/components/dashboard/sidebar-content-admin";
import { getUserRole } from "@/lib/actions";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const userId = cookieStore.get('loggedInUser')?.value;

  if (!userId) {
    redirect('/login');
  }

  const role = await getUserRole(userId);

  if (!role) {
     // This case might happen if user document is deleted but cookie remains.
     // Or if there's a delay in DB replication.
     // Logging out is a safe default.
    redirect('/login');
  }

  const renderSidebarContent = () => {
    switch(role) {
      case 'proveedor':
        return <SidebarContentProveedor />;
      case 'admin':
        return <SidebarContentAdmin />;
      case 'cobrador':
        return <SidebarContentClient role="cobrador" />;
      case 'cliente':
        return <SidebarContentClient role="cliente" />;
      default:
        // Fallback for unknown roles, redirect to login
        return redirect('/login');
    }
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 z-50">
          <div className="flex items-center gap-2">
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
          <Sidebar collapsible="icon">
            {renderSidebarContent()}
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
