import { useEffect, useState } from 'react';

/**
 * Returns `value`, updated only after it has stopped changing for `delayMs`.
 * Used to avoid firing an API request on every keystroke in a search box.
 */
export const useDebouncedValue = (value, delayMs = 300) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debounced;
};

export default useDebouncedValue;
