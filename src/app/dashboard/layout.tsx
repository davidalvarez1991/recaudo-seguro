
import { UserNav } from "@/components/dashboard/user-nav";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { getUserData, getUserRole } from "@/lib/actions";
import { redirect } from "next/navigation";
import { SidebarContent } from "@/components/dashboard/sidebar-content";

// Define a mapping of font family names to Google Fonts URL strings
const fontMap: { [key: string]: string } = {
    'Roboto': 'Roboto:wght@400;700&display=swap',
    'Lato': 'Lato:wght@400;700&display=swap',
    'Montserrat': 'Montserrat:wght@400;700&display=swap',
    'Oswald': 'Oswald:wght@400;700&display=swap',
    'Playfair Display': 'Playfair+Display:wght@400;700&display=swap',
    'Merriweather': 'Merriweather:wght@400;700&display=swap',
};

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

  const userData = await getUserData(userId);
  const role = userData?.role;

  if (!role) {
     cookies().set('loggedInUser', '', { expires: new Date(0), path: '/' });
     redirect('/login');
  }
  
  let fontUrl = null;
  let fontFamilyStyle = {};
  
  const userFont = userData?.fontFamily;
  if (userFont && fontMap[userFont]) {
    fontUrl = `https://fonts.googleapis.com/css2?family=${fontMap[userFont]}`;
    fontFamilyStyle = { fontFamily: `'${userFont}', sans-serif` };
  }


  return (
    <html lang="es" style={fontFamilyStyle}>
      {fontUrl && (
          <head>
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
              <link href={fontUrl} rel="stylesheet" />
          </head>
      )}
      <body>
          <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen w-full flex-col bg-background">
              <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 z-50">
                 <div className="flex items-center gap-2">
                  <SidebarTrigger />
                  <Link
                    href="/dashboard/proveedor"
                    className="flex items-center gap-2 font-semibold text-primary"
                  >
                    <ShieldCheck className="h-6 w-6" />
                    <span className="text-lg hidden sm:inline-block">Recaudo Seguro</span>
                  </Link>
                </div>
                <div className="ml-auto flex items-center gap-4">
                  <UserNav />
                </div>
              </header>
              <div className="flex">
                <Sidebar collapsible="icon">
                  <SidebarContent role={role} />
                </Sidebar>
                <SidebarInset>
                  <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                    {children}
                  </main>
                </SidebarInset>
              </div>
            </div>
          </SidebarProvider>
      </body>
    </html>
  );
}
