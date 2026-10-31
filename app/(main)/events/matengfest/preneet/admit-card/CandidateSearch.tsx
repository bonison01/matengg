"use client";

import React, { useState } from "react";
import { getCandidateById, getCandidateBySearch } from "./api";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlertCircle, UserSearch, IdCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CandidateSearch({ onSelect }: { onSelect: (data: any) => void }) {
  const [mode, setMode] = useState<"search" | "id">("search");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasData, setHasData] = useState(false);

  const handleFetch = async () => {
    try {
      setLoading(true);
      setError("");

      let data;

      if (mode === "search") {
        if (!dob || !phone) {
          setError("Please enter both Date of Birth and Phone Number");
          return;
        }
        data = await getCandidateBySearch(dob, phone);
        data = data?.[0];
      } else {
        if (!id.trim()) {
          setError("Please enter Candidate ID");
          return;
        }

        // Extract number here
        const numericPart = id.replace(/\D/g, "");
        const cleanedId = numericPart.replace(/^0+/, "");

        data = await getCandidateById(cleanedId);
      }

      if (!data) {
        setError("No candidate found with the provided details.");
        return;
      }

      onSelect(data);
      setHasData(true);
    } catch (err: any) {
      if (err?.status === 404) {
        setError(err.message);
      } else {
        setError(err?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDob("");
    setPhone("");
    setId("");
    setError("");
    setHasData(false);
    onSelect(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 h-fit">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 md:p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
            <UserSearch className="h-6 md:h-8 w-6 md:w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-2xl md:text-3xl">Find Your Admit Card</CardTitle>
            <CardDescription className="text-sm md:text-base font-medium">
              Enter your details to download the admit card
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Mode Toggle */}
        <div className="space-y-2">
          <Label className="text-sm md:text-base font-medium">Search With</Label>
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(value: "search" | "id") => setMode(value)}
            className="grid grid-cols-2 gap-2 bg-gray-400/50"
          >
            <ToggleGroupItem
              value="search"
              className="flex items-center gap-2 data-[state=on]:bg-green-600 data-[state=on]:text-white py-3 md:py-5 px-4 md:text-base"
            >
              <UserSearch className="h-4 w-4" />
              DOB & Phone
            </ToggleGroupItem>

            <ToggleGroupItem
              value="id"
              className="flex items-center gap-2 data-[state=on]:bg-green-600 data-[state=on]:text-white py-3 md:py-5 px-4 md:text-base"
            >
              <IdCard className="h-4 w-4" />
              Registration Number
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {mode === "search" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="dob" className="md:text-base">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="h-11 border-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="md:text-base">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 border-gray-500"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="candidate-id">Registration Number</Label>
              <Input
                id="candidate-id"
                type="text"
                placeholder="Enter your registration number"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="h-11"
              />
            </div>
          )}
        </div>

        {hasData ? (
          <Button
            onClick={handleReset}
            className="w-full h-12 text-base font-medium bg-gray-600 hover:bg-gray-700 text-white"
          >
            Reset
          </Button>
        ) : (
          <Button
            onClick={handleFetch}
            disabled={loading}
            className="w-full h-12 text-base font-medium text-white"
            size="lg"
          >
            {loading ? "Fetching Admit Card..." : "Get Admit Card"}
          </Button>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}