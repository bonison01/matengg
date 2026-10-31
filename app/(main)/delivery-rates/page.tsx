"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bike, Car, Boxes, Globe } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function DeliveryRatesPage() {
  const router = useRouter();

  const handleDownloadPdf = () => {
    // Replace with the actual path to your PDF file
    const pdfUrl = "/B2B_Services_Brochure.pdf";
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = "B2B_Services_Brochure.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100svh] p-4  pt-10 bg-zinc-950 text-white poppins">
      <div className="w-full max-w-4xl mx-auto text-center my-8">
        <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-neutral-400">
          Choose Your Delivery Mode
        </h1>
        <p className="text-lg text-gray-400">
          Select the service that best fits your needs, from local deliveries to B2B cargo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl p-4">
        {/* 2-Wheeler Delivery Card */}
        {/* <Card className="flex flex-col items-center justify-between p-6 bg-zinc-900 border-zinc-600 hover:border-blue-500 transition-colors duration-200 ease-in-out">
          <CardHeader className="flex flex-col items-center p-0 mb-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-500/10 mb-2">
              <Bike className="w-8 h-8 text-blue-400" />
            </div>
            <CardTitle className="text-lg font-bold text-neutral-100 mt-2 text-center">
              2-Wheeler Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center p-0 flex-grow">
            <p className="text-sm text-gray-400">
              Ideal for fast, small-package deliveries within the city.
            </p>
          </CardContent>
          <div className="w-full mt-4">
            <Button
              className="w-full text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              onClick={() => router.push("/two-wheeler")}
            >
              Get Started
            </Button>
          </div>
        </Card> */}

        {/* Light Vehicles Delivery Card */}
        <Card className="flex flex-col items-center justify-between p-6 bg-zinc-900 border-zinc-600 hover:border-green-500 transition-colors duration-200 ease-in-out">
          <CardHeader className="flex flex-col items-center p-0 mb-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-purple-500/10 mb-2">
              <Car className="w-8 h-8 text-green-400" />
            </div>
            <CardTitle className="text-lg font-bold text-neutral-100 mt-2 text-center">
              Instant Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center p-0 flex-grow">
            <p className="text-sm text-gray-400">
              Offering two-wheeler and light vehicle services—ideal for fast city deliveries and larger items that won't fit on a bike.
            </p>
          </CardContent>
          <div className="w-full mt-4">
            <Button
              className="w-full text-white bg-green-600 hover:bg-green-700 transition-colors"
              onClick={() => router.push("/light-vehicle")}
            >
              Get Started
            </Button>
          </div>
        </Card>

        {/* B2B Services Card */}
        <Card className="flex flex-col items-center justify-between p-6 bg-zinc-900 border-zinc-600 hover:border-green-500 transition-colors duration-200 ease-in-out">
          <CardHeader className="flex flex-col items-center p-0 mb-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-orange-500/10 mb-2">
              <Boxes className="w-8 h-8 text-green-400" />
            </div>
            <CardTitle className="text-lg font-bold text-neutral-100 mt-2 text-center">
              Standard Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center p-0 flex-grow">
            <p className="text-sm text-gray-400">
              Custom logistics solutions for business-to-business needs.
            </p>
          </CardContent>
          <div className="w-full mt-4">
            <Button
              className="w-full text-white bg-green-600 hover:bg-green-700 transition-colors"
              onClick={() => router.push("/RouteRatesPage")}
            >
              Get Started
            </Button>
          </div>
        </Card>

        {/* Cargo Services Card */}
        <Card className="flex flex-col items-center justify-between p-6 bg-zinc-900 border-zinc-600 hover:border-green-500 transition-colors duration-200 ease-in-out">
          <CardHeader className="flex flex-col items-center p-0 mb-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-500/10 mb-2">
              <Globe className="w-8 h-8 text-green-400" />
            </div>
            <CardTitle className="text-lg font-bold text-neutral-100 mt-2 text-center">
              Cargo Services
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center p-0 flex-grow">
            <p className="text-sm text-gray-400">
              For heavy or long-distance shipping, including inter-city transport.
            </p>
          </CardContent>
          <div className="w-full mt-4">
            <a href="/CargoBookingPage" target="_blank" rel="noopener noreferrer">
              <Button
                className="w-full text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                Explore Cargo
              </Button>
            </a>
          </div>
        </Card>
      </div>

      <Separator className="bg-zinc-700 w-full max-w-2xl my-8" />

      <div className="text-center text-gray-500 mt-4">
        <p>&copy; {new Date().getFullYear()} Mateng. All rights reserved.</p>
      </div>
    </div>
  );
}