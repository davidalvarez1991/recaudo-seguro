
"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ViewportSetter() {
  const pathname = usePathname();

  useEffect(() => {
    const originalViewport = document.querySelector("meta[name=viewport]");
    const originalContent = originalViewport ? originalViewport.getAttribute('content') : 'width=device-width, initial-scale=1.0';

    if (pathname.startsWith('/dashboard')) {
        let viewport = document.querySelector("meta[name=viewport]");
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.setAttribute('name', 'viewport');
            document.getElementsByTagName('head')[0].appendChild(viewport);
        }
        viewport.setAttribute('content', 'width=1024');
    }

    // Revert on component unmount
    return () => {
        const viewport = document.querySelector("meta[name=viewport]");
        if (viewport && originalContent) {
            viewport.setAttribute('content', originalContent);
        }
    };
  }, [pathname]);

  return null; // This component does not render anything
}
