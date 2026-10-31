import { Suspense } from "react";
import type { Metadata } from "next";
import AuthScreen from "@/components/events-api/AuthScreen";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthScreen mode="login" />
    </Suspense>
  );
}
