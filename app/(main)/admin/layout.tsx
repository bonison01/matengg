// app/(main)/admin/layout.tsx
//
// This layout no longer renders any header/nav itself. Two child route
// groups handle that split:
//   - (auth)/login, (auth)/signup  -> no admin chrome at all (see their
//     own layout.tsx, which is just a pass-through too)
//   - (protected)/dashboard, (protected)/team, and your existing
//     cargo/* pages -> wrapped in the real admin shell with nav + logout
//     (see (protected)/layout.tsx)
//
// This fixes the bug where "Log out" appeared on the login page itself,
// since login/signup are no longer inside the layout that renders it.

import type { ReactNode } from "react";

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}