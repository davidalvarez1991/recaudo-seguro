
"use client";

import { useEffect } from 'react';

export function ViewportSetter() {
  useEffect(() => {
    const viewport = document.querySelector("meta[name=viewport]");
    const desiredContent = 'width=650';

    if (viewport) {
      viewport.setAttribute('content', desiredContent);
    } else {
      const newViewport = document.createElement('meta');
      newViewport.name = "viewport";
      newViewport.content = desiredContent;
      document.head.appendChild(newViewport);
    }

    // This observer will re-apply our desired viewport if Next.js tries to change it during client-side navigation.
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'content') {
          const target = mutation.target as HTMLMetaElement;
          if (target.name === 'viewport' && target.content !== desiredContent) {
            target.setAttribute('content', desiredContent);
          }
        }
      }
    });

    const headElement = document.querySelector('head');
    if (headElement) {
        observer.observe(headElement, { 
            attributes: true, 
            childList: true, 
            subtree: true 
        });
    }

    return () => {
      // Disconnect the observer when the component unmounts
      observer.disconnect();
    };
  }, []);

  return null; // This component does not render anything
}
