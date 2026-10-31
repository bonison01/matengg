"use client";
// React hook for the customer session from the centralized API.
import { useEffect, useState } from "react";
import { getSession, onSessionChange, type CustomerSession } from "./api";

/**
 * Current customer session (or null). `ready` is false until the first client
 * render, so pages can avoid flashing a logged-out state during hydration.
 */
export function useCustomer(): { session: CustomerSession | null; ready: boolean } {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setSession(getSession());
    setReady(true);
    return onSessionChange(() => setSession(getSession()));
  }, []);
  return { session, ready };
}
