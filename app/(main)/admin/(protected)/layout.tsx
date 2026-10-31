// app/(main)/admin/(protected)/layout.tsx
//
// The real admin shell (nav + logout button), moved here from the old
// app/(main)/admin/layout.tsx. Anything inside this route group is, by
// construction, a page that requires a logged-in admin — middleware.ts
// already enforces that server-side, so by the time this renders, a
// valid session is guaranteed to exist. That's also why it's safe to
// render the logout button unconditionally here.

import type { ReactNode } from "react";
import Link from "next/link";
import AdminLogoutButton from "../_components/AdminLogoutButton";

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/admin/dashboard" className="text-sm font-semibold text-neutral-900">
            Mateng Admin
          </Link>
          <Link href="/admin/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
            Dashboard
          </Link>
          <Link href="/admin/team" className="text-sm text-neutral-500 hover:text-neutral-900">
            Team
          </Link>
        </div>
        <AdminLogoutButton />
      </header>
      <main>{children}</main>
    </div>
  );
}