"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ViewportSetter() {
  const pathname = usePathname();

  useEffect(() => {
    const setViewport = () => {
      const viewport = document.querySelector("meta[name=viewport]");
      const desiredContent = 'width=750';
      if (viewport && viewport.getAttribute('content') !== desiredContent) {
        viewport.setAttribute('content', desiredContent);
      } else if (!viewport) {
        const newViewport = document.createElement('meta');
        newViewport.name = 'viewport';
        newViewport.content = desiredContent;
        document.getElementsByTagName('head')[0].appendChild(newViewport);
      }
    };

    setViewport();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'content') {
          const target = mutation.target as HTMLMetaElement;
          if (target.content !== 'width=750') {
            target.content = 'width=750';
          }
        }
      });
    });

    const viewportMeta = document.querySelector("meta[name=viewport]");
    if (viewportMeta) {
      observer.observe(viewportMeta, { attributes: true });
    }

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
