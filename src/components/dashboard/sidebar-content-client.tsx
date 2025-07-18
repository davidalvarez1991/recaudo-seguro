"use client";

import { useState } from "react";
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Home, Users, Settings, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CobradorRegistrationForm } from "@/components/auth/cobrador-registration-form";

// In a real app, you would fetch user data to determine the role
// and dynamically render the sidebar content based on that role.
// For this example, we'll use the path to determine the role.

export function SidebarContentClient() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // A simple way to guess the role from the URL
  const segments = pathname.split('/');
  const role = segments.length > 2 ? segments[2] : null;

  const isProveedor = role === 'proveedor';

  return (
    <SidebarContent>
      <SidebarMenu>
        <SidebarMenuItem>
           <SidebarMenuButton
            asChild
            isActive={pathname === `/dashboard/${role}` && !pathname.includes('cobradores')}
            tooltip="Inicio"
          >
            <Link href={`/dashboard/${role}`}>
              <Home />
              <span>Inicio</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        
        {isProveedor && (
          <>
            <SidebarMenuItem>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                   <SidebarMenuButton tooltip="Crear Cobrador">
                      <UserPlus />
                      <span>Crear Cobrador</span>
                    </SidebarMenuButton>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Registrar Nuevo Cobrador</DialogTitle>
                    <DialogDescription>
                      Completa los datos para crear una nueva cuenta de cobrador.
                    </DialogDescription>
                  </DialogHeader>
                  <CobradorRegistrationForm onFormSubmit={() => setIsModalOpen(false)} />
                </DialogContent>
              </Dialog>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.includes('cobradores')} tooltip="Gestión de Cobradores">
                    <Link href="/dashboard/proveedor/cobradores">
                    <Users />
                    <span>Ver Cobradores</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </>
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
