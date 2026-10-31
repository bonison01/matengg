// /account/* — customer login, sign-up and bookings for the centralized
// events API. Personal pages: never indexed.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Mateng account",
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
