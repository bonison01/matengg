// /app/(main)/discovery/page.tsx
import React, { Suspense } from "react";
import DiscoverPageContent from "./DiscoverPageContent"; // Adjust the import path as needed

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DiscoverPageContent />
    </Suspense>
  );
}