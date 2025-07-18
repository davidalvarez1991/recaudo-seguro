
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
      // Fallback for unknown roles, redirect to login
      // Note: This logic might be better handled server-side,
      // but as a fallback it's useful here.
      if (typeof window !== 'undefined') {
        // Clear cookie if possible, though httpOnly makes it tricky on client
        router.push('/login');
      }
      return null;
  }
}
