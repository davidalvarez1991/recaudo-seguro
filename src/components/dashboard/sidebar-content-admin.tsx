
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

  const handleLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setOpenMobile(false);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <SidebarContent>
      <SidebarMenu className="mt-4">
        <SidebarMenuItem>
           <SidebarMenuButton
            asChild
            isActive={isActive(`/dashboard/${role}`)}
            tooltip="Inicio"
            onClick={handleLinkClick}
          >
            <Link href={`/dashboard/${role}`}>
              <Home />
              <span>Inicio</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        
        <SidebarMenuItem>
           <SidebarMenuButton tooltip="Gestión de Usuarios" onClick={handleLinkClick}>
            <Users />
            <span>Usuarios</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        
        <SidebarMenuItem>
           <SidebarMenuButton tooltip="Configuración" onClick={handleLinkClick}>
            <Settings />
            <span>Configuración</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarContent>
  );
}
