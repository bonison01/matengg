import { Suspense } from "react";
import type { Metadata } from "next";
import AuthScreen from "@/components/events-api/AuthScreen";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <AuthScreen mode="forgot" />
    </Suspense>
  );
}
