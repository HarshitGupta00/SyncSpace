// hooks/useMediaQuery.js
// Returns true when viewport matches the given CSS media query.
// Used for responsive sidebar collapse, mobile nav.

import { useState, useEffect } from "react";

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);

  return matches;
};

// Pre-built breakpoint hooks matching Tailwind defaults
export const useIsMobile  = () => useMediaQuery("(max-width: 767px)");
export const useIsTablet  = () => useMediaQuery("(max-width: 1023px)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");

export default useMediaQuery;
