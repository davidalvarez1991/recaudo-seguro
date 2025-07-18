
"use client";

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Home, Settings, ClipboardList, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarContentProveedor() {
  const pathname = usePathname();
  const role = "proveedor";
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
           <SidebarMenuButton 
            asChild 
            isActive={pathname.includes('cobradores')} 
            tooltip="Gestión de Cobradores"
            onClick={() => setOpenMobile(false)}
            >
            <Link href="/dashboard/proveedor/cobradores">
              <Users />
              <span>Cobradores</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
           <SidebarMenuButton 
            asChild 
            isActive={pathname.includes('registros')} 
            tooltip="Registro de Actividad"
            onClick={() => setOpenMobile(false)}
            >
            <Link href="/dashboard/proveedor/registros">
              <ClipboardList />
              <span>Registros</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
           <SidebarMenuButton 
            asChild 
            isActive={pathname.includes('settings')} 
            tooltip="Configuración"
            onClick={() => setOpenMobile(false)}
            >
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
