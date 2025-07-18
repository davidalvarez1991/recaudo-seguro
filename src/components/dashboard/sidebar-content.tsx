
"use client";

import { SidebarContentAdmin } from "@/components/dashboard/sidebar-content-admin";
import { SidebarContentClient } from "@/components/dashboard/sidebar-content-client";
import { SidebarContentProveedor } from "@/components/dashboard/sidebar-content-proveedor";
import { useRouter } from "next/navigation";

type SidebarContentProps = {
  role: string;
};

export function SidebarContent({ role }: SidebarContentProps) {
  const router = useRouter();

  switch(role) {
    case 'proveedor':
      return <SidebarContentProveedor />;
    case 'admin':
      return <SidebarContentAdmin />;
    case 'cobrador':
      return <SidebarContentClient role="cobrador" />;
    case 'cliente':
      return <SidebarContentClient role="cliente" />;
    default:
      if (typeof window !== 'undefined') {
        router.push('/login');
      }
      return null;
  }
}
