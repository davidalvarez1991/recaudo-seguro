
"use client";

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Home, Settings, ClipboardList } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarContentProveedor() {
  const pathname = usePathname();
  const role = "proveedor";

  return (
    <SidebarContent>
      <SidebarMenu>
        <SidebarMenuItem>
           <SidebarMenuButton
            asChild
            isActive={pathname === `/dashboard/${role}`}
            tooltip="Inicio"
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
            isActive={pathname.includes('registros')} 
            tooltip="Registro de Actividad">
            <Link href="/dashboard/proveedor/registros">
              <ClipboardList />
              <span>Registros</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
           <SidebarMenuButton asChild isActive={pathname.includes('settings')} tooltip="Configuración">
            <Link href="/dashboard/proveedor/settings">
              <Settings />
              <span>Configuración</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarContent>
  );
}
