"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ViewportSetter() {
  const pathname = usePathname();

  const setViewport = () => {
    const viewport = document.querySelector("meta[name=viewport]");
    const desiredContent = 'width=650';
    if (viewport && viewport.getAttribute('content') !== desiredContent) {
      viewport.setAttribute('content', desiredContent);
    } else if (!viewport) {
      // If viewport doesn't exist, create it.
      const newViewport = document.createElement('meta');
      newViewport.name = 'viewport';
      newViewport.content = desiredContent;
      document.getElementsByTagName('head')[0].appendChild(newViewport);
    }
  };

  useEffect(() => {
    setViewport();
  }, [pathname]); // Re-run the effect every time the path changes

  return null; // This component does not render anything
}
