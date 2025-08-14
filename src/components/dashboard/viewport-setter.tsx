"use client";

import { useEffect } from 'react';

export function ViewportSetter() {
  useEffect(() => {
    const setViewport = () => {
      const viewport = document.querySelector("meta[name=viewport]");
      if (viewport) {
        viewport.setAttribute('content', 'width=650');
      }
    };
    setViewport();
  }, []);

  return null; // This component does not render anything
}
