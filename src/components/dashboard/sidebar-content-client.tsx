
"use client";

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Home, Settings, HandCoins } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarContentClientProps = {
    role: 'cliente' | 'cobrador';
};

export function SidebarContentClient({ role }: SidebarContentClientProps) {
  const pathname = usePathname();

  if (role === 'cobrador') {
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
                isActive={pathname.includes('/creditos')}
                tooltip="Créditos">
                <Link href={`/dashboard/${role}/creditos`}>
                  <HandCoins />
                  <span>Créditos</span>
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

  // Default to client sidebar
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
           <SidebarMenuButton tooltip="Configuración">
            <Settings />
            <span>Configuración</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarContent>
  );
}
