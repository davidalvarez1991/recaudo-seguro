
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

export function SidebarContentProveedor() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
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
