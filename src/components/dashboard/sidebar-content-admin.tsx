
"use client";

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Home, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarContentAdmin() {
  const pathname = usePathname();
  const role = 'admin';
  const { setOpenMobile } = useSidebar();

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
           <SidebarMenuButton tooltip="Gestión de Usuarios" onClick={() => setOpenMobile(false)}>
            <Users />
            <span>Usuarios</span>
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
