"use client";

import React, { useState } from "react";
import { generateRegistrationFormPDF } from "./generateRegistrationFormPDF";


export default function DownloadFormButton({ data }: any) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await generateRegistrationFormPDF(data); 
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={`px-4 py-2 rounded w-fit text-white ${
        isDownloading
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-green-600 hover:bg-green-700"
      }`}
    >
      {isDownloading ? "Downloading..." : "Download Admit Card"}
    </button>
  );
}