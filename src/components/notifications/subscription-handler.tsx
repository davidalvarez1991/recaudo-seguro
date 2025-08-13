'use client';

import { useEffect } from 'react';
import { registerAndSubscribe } from '@/lib/notifications';
import { usePathname } from 'next/navigation';

export function SubscriptionHandler() {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');

  useEffect(() => {
    // Solo se suscribe si el usuario está en un dashboard (es decir, logueado)
    if (isDashboard) {
      registerAndSubscribe();
    }
  }, [isDashboard]);

  return null; // Este componente no renderiza nada
}
