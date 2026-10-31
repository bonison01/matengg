import { useEffect, useState } from "react";

/** Counts from 0 up to `target` in increments of `step` every `intervalMs`. */
export function useCountUp(target: number, step: number, intervalMs = 40) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setValue((prev) => (prev < target ? Math.min(prev + step, target) : target));
    }, intervalMs);
    return () => clearInterval(id);
  }, [target, step, intervalMs]);

  return value;
}
