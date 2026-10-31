import { Suspense } from "react";
import type { Metadata } from "next";
import AuthScreen from "@/components/events-api/AuthScreen";

export const metadata: Metadata = { title: "Sign up" };

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <AuthScreen mode="register" />
    </Suspense>
  );
}
