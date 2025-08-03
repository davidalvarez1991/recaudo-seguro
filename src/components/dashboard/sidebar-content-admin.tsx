
"use client";

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Home, Settings, Users, DollarSign } from "lucide-react";
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

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <SidebarContent>
      <SidebarMenu className="mt-4">
        <SidebarMenuItem>
           <SidebarMenuButton
            asChild
            isActive={isActive(`/dashboard/${role}`) && pathname === `/dashboard/${role}`}
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
           <SidebarMenuButton
            asChild
            isActive={isActive(`/dashboard/admin/proveedores`)}
            tooltip="Gestión de Proveedores" 
            onClick={handleLinkClick}
           >
            <Link href="/dashboard/admin/proveedores">
              <Users />
              <span>Proveedores</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
           <SidebarMenuButton 
            asChild
            isActive={isActive(`/dashboard/admin/soportes`)}
            tooltip="Soportes de Ingresos"
            onClick={handleLinkClick}
           >
            <Link href="/dashboard/admin/soportes">
              <DollarSign />
              <span>Soportes</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        
        <SidebarMenuItem>
           <SidebarMenuButton 
            asChild
            isActive={isActive(`/dashboard/admin/settings`)}
            tooltip="Configuración"
            onClick={handleLinkClick}
           >
            <Link href="/dashboard/admin/settings">
              <Settings />
              <span>Configuración</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarContent>
  );
}
