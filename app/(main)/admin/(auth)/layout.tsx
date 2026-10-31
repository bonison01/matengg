// app/(main)/admin/(auth)/layout.tsx
//
// Wraps /admin/login and /admin/signup. Deliberately renders nothing
// extra — someone on these pages isn't logged in (that's the whole
// point of the page), so there should be no "Log out" button, no nav,
// no admin branding chrome. The pages themselves are already
// full-screen, self-contained designs.

import type { ReactNode } from "react";

export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}