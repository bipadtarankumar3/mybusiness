'use client';

import { useEffect, useState } from 'react';

/**
 * Debounces a rapidly changing value (e.g., search query input) by `delay` ms.
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;
