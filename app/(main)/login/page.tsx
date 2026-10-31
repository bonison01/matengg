'use client';

import React, { useState, useEffect, Suspense } from "react";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";

// Separate component to use useSearchParams inside Suspense
function LoginPageContent() {
  const { setTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    setTheme("dark");
  }, []);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 relative z-10">
      <div className="w-full max-w-sm">
        {isLogin ? (
          <LoginForm setIsLogin={setIsLogin} redirect={redirect} />
        ) : (
          <SignupForm setIsLogin={setIsLogin} redirect={redirect} />
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}