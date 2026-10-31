import { useCallback, useEffect, useState } from "react";

/** Popup state. Auto-opens shortly after mount; reopen any time via `open`. */
export function useEventModal(autoOpenDelayMs = 800) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), autoOpenDelayMs);
    return () => clearTimeout(timer);
  }, [autoOpenDelayMs]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, open, close };
}
