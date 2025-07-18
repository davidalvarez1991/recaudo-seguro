
"use client";

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Home, Settings, HandCoins } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarContentClientProps = {
    role: 'cliente' | 'cobrador';
};

export function SidebarContentClient({ role }: SidebarContentClientProps) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  if (role === 'cobrador') {
      return (
         <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
               <SidebarMenuButton
                asChild
                isActive={pathname === `/dashboard/${role}`}
                tooltip="Inicio"
                onClick={() => setOpenMobile(false)}
              >
                <Link href={`/dashboard/${role}`}>
                  <Home />
                  <span>Inicio</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
               <SidebarMenuButton 
                asChild
                isActive={pathname.includes('/creditos')}
                tooltip="Créditos"
                onClick={() => setOpenMobile(false)}
               >
                <Link href={`/dashboard/${role}/creditos`}>
                  <HandCoins />
                  <span>Créditos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
               <SidebarMenuButton tooltip="Configuración" onClick={() => setOpenMobile(false)}>
                <Settings />
                <span>Configuración</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      );
  }

  // Default to client sidebar
  return (
    <SidebarContent>
      <SidebarMenu>
        <SidebarMenuItem>
           <SidebarMenuButton
            asChild
            isActive={pathname === `/dashboard/${role}`}
            tooltip="Inicio"
            onClick={() => setOpenMobile(false)}
          >
            <Link href={`/dashboard/${role}`}>
              <Home />
              <span>Inicio</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        
        <SidebarMenuItem>
           <SidebarMenuButton tooltip="Configuración" onClick={() => setOpenMobile(false)}>
            <Settings />
            <span>Configuración</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarContent>
  );
}
