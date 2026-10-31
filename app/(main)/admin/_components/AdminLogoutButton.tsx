// app/(main)/admin/_components/AdminLogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    // Clears the httpOnly cookie server-side (client JS can't delete an
    // httpOnly cookie directly, so this goes through an API route).
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
    >
      Log out
    </button>
  );
}