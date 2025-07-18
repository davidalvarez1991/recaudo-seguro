import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    };

    // Check on initial client-side render
    checkSize();

    // Add event listener for future changes
    window.addEventListener("resize", checkSize);

    // Cleanup event listener on component unmount
    return () => window.removeEventListener("resize", checkSize);
  }, [])

  return isMobile;
}
