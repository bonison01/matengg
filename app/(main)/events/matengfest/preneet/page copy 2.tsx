"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AdmitCardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-6">
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          PRE-NEET 2026 Admit Card
        </h1>

        <p className="text-gray-500 text-lg">
          Click below to download your admit card
        </p>

        <Button
          size="lg"
          className="px-8 py-6 text-lg bg-green-600 hover:bg-green-700 text-white shadow-lg"
          onClick={() => router.push("/preneet/admit-card")}
        >
          Download Admit Card
        </Button>

      </div>
    </div>
  );
}