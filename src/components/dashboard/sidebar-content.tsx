
"use client";

import { SidebarContentAdmin } from "@/components/dashboard/sidebar-content-admin";
import { SidebarContentMain } from "@/components/dashboard/sidebar-content-main";
import { useRouter } from "next/navigation";

type SidebarContentProps = {
  role: string;
};

export function SidebarContent({ role }: SidebarContentProps) {
  const router = useRouter();

  switch(role) {
    case 'admin':
      return <SidebarContentAdmin />;
    case 'proveedor':
    case 'cobrador':
      return <SidebarContentMain role={role} />;
    case 'cliente':
        // For now, redirect or show a minimal sidebar if a client logs in
        // Since their dashboard is simple.
        // Let's reuse the main for now with a client case.
         return <SidebarContentMain role={role} />;
    default:
      if (typeof window !== 'undefined') {
        router.push('/login');
      }
      return null;
  }
}
