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

// In a real app, you would fetch user data to determine the role
// and dynamically render the sidebar content based on that role.
// For this example, we'll use the path to determine the role.

export function SidebarContentClient() {
  const pathname = usePathname();

  // A simple way to guess the role from the URL
  const role = pathname.split('/')[2]; 
  
  const isProveedor = role === 'proveedor';

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
        
        {isProveedor && (
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.includes('/cobradores')} tooltip="Gestión de Cobradores">
                    <Link href="/dashboard/proveedor/cobradores">
                    <Users />
                    <span>Gestión de Cobradores</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        )}

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
