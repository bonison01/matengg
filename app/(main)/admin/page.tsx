// app/(main)/admin/page.tsx
//
// Handles bare /admin with no trailing path. There's no actual content
// to show here — just redirect onward. Where it lands is decided by
// middleware.ts: if there's no valid admin session, middleware
// intercepts the redirect target (/admin/dashboard) BEFORE this page's
// own logic even matters and bounces to /admin/login instead. So this
// page only ever needs one line — middleware handles the auth branch.

import { redirect } from "next/navigation";

export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}