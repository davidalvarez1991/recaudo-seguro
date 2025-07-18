
"use client";

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Home, Users, Settings } from "lucide-react";
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
            <SidebarMenuButton asChild isActive={pathname.includes('cobradores')} tooltip="Gestión de Cobradores">
                <Link href="/dashboard/proveedor/cobradores">
                <Users />
                <span>Ver Cobradores</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
           <SidebarMenuButton tooltip="Configuración">
            <Settings />
            <span>Configuración</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarContent>
  );
}
