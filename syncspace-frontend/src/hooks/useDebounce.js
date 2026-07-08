// hooks/useDebounce.js
// Returns a debounced version of a value — updates only after delay ms
// of no changes. Used for search inputs, autosave triggers.

import { useState, useEffect } from "react";

const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
