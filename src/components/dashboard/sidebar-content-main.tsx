
"use client";

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Home, Settings, ClipboardList, Users, HandCoins, LayoutDashboard, Download, History, Map, FileText, BarChartHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarContentMainProps = {
    role: 'proveedor' | 'cobrador' | 'cliente';
};

export function SidebarContentMain({ role }: SidebarContentMainProps) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setOpenMobile(false);
    }
  };
  
  const isActive = (path: string) => pathname === path;

  if (role === 'proveedor') {
    return (
      <SidebarContent>
        <SidebarMenu className="mt-4">
          <SidebarMenuItem>
             <SidebarMenuButton
              asChild
              isActive={isActive(`/dashboard/proveedor`)}
              tooltip="Inicio"
              onClick={handleLinkClick}
            >
              <Link href={`/dashboard/proveedor`}>
                <Home />
                <span>Inicio</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
  
          <SidebarMenuItem>
             <SidebarMenuButton 
              asChild 
              isActive={isActive('/dashboard/proveedor/cobradores')} 
              tooltip="Gestión de Cobradores"
              onClick={handleLinkClick}
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
              isActive={isActive('/dashboard/proveedor/registros')} 
              tooltip="Registro de Actividad"
              onClick={handleLinkClick}
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
              isActive={isActive('/dashboard/proveedor/audita')} 
              tooltip="Audita tu Negocio"
              onClick={handleLinkClick}
              >
              <Link href="/dashboard/proveedor/audita">
                <BarChartHorizontal />
                <span>Audita tu Negocio</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
             <SidebarMenuButton 
              asChild 
              isActive={isActive('/dashboard/proveedor/descargas')} 
              tooltip="Descargar Reportes"
              onClick={handleLinkClick}
              >
              <Link href="/dashboard/proveedor/descargas">
                <Download />
                <span>Descargar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
  
          <SidebarMenuItem>
             <SidebarMenuButton 
              asChild 
              isActive={isActive('/dashboard/proveedor/settings')} 
              tooltip="Configuración"
              onClick={handleLinkClick}
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

  if (role === 'cobrador') {
      return (
         <SidebarContent>
          <SidebarMenu className="mt-4">
            <SidebarMenuItem>
               <SidebarMenuButton
                asChild
                isActive={isActive(`/dashboard/cobrador`)}
                tooltip="Inicio"
                onClick={handleLinkClick}
              >
                <Link href={`/dashboard/cobrador`}>
                  <Home />
                  <span>Inicio</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
               <SidebarMenuButton 
                asChild
                isActive={isActive(`/dashboard/cobrador/creditos`)}
                tooltip="Créditos"
                onClick={handleLinkClick}
               >
                <Link href={`/dashboard/cobrador/creditos`}>
                  <HandCoins />
                  <span>Créditos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

             <SidebarMenuItem>
               <SidebarMenuButton 
                asChild
                isActive={isActive(`/dashboard/cobrador/ruta`)}
                tooltip="Ruta de Pago"
                onClick={handleLinkClick}
               >
                <Link href={`/dashboard/cobrador/ruta`}>
                  <Map />
                  <span>Ruta de Pago</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

          </SidebarMenu>
        </SidebarContent>
      );
  }

  // Default to client sidebar
  return (
    <SidebarContent>
      <SidebarMenu className="mt-4">
        <SidebarMenuItem>
           <SidebarMenuButton
            asChild
            isActive={isActive(`/dashboard/cliente`)}
            tooltip="Panel de Cliente"
            onClick={handleLinkClick}
          >
            <Link href={`/dashboard/cliente`}>
              <LayoutDashboard />
              <span>Mis Créditos</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
           <SidebarMenuButton
            asChild
            isActive={isActive(`/dashboard/cliente/historial`)}
            tooltip="Historial de Créditos"
            onClick={handleLinkClick}
          >
            <Link href={`/dashboard/cliente/historial`}>
              <History />
              <span>Historial</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
           <SidebarMenuButton
            asChild
            isActive={isActive(`/dashboard/cliente/contratos`)}
            tooltip="Contratos"
            onClick={handleLinkClick}
          >
            <Link href={`/dashboard/cliente/contratos`}>
              <FileText />
              <span>Contratos</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarContent>
  );
}
