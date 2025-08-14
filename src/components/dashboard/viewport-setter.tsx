
"use client";

import { useEffect } from 'react';

export function ViewportSetter() {
  useEffect(() => {
    const originalViewport = document.querySelector("meta[name=viewport]");
    
    // Save the original content if we want to restore it later
    const originalContent = originalViewport ? originalViewport.getAttribute('content') : 'width=device-width, initial-scale=1.0';

    if (originalViewport) {
      originalViewport.setAttribute('content', 'width=650');
    } else {
      const newViewport = document.createElement('meta');
      newViewport.name = "viewport";
      newViewport.content = "width=650";
      document.head.appendChild(newViewport);
    }

    // Cleanup function to restore the original viewport when the component unmounts
    return () => {
      const viewportToRestore = document.querySelector("meta[name=viewport]");
      if (viewportToRestore && originalContent) {
        viewportToRestore.setAttribute('content', originalContent);
      }
    };
  }, []);

  return null; // This component does not render anything
}
