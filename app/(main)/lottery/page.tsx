"use client";

import React, { useState } from "react";
import html2canvas from "html2canvas";
import { supabase } from "@/lib/supabaseClient";

export default function LotteryEntryPage() {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    mobile: "",
    email: "",
    age: "",
  });

  const [lotteryNumber, setLotteryNumber] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 👇 Add your prizes here — images are in public folder
  const prizes = [
    { id: 1, name: "🏆 Grand Prize: Smart TV 32 inch", image: "/lot1.png" },
    { id: 2, name: "🎁 Second Prize: Smart TV 24 inch", image: "/lot2.png" },
    { id: 3, name: "🎉 Third Prize: Rice Cooker 5 ltr", image: "/lot3.png" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateLotteryNumber = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `LT-${randomNum}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const ageNum = parseInt(formData.age, 10);
    if (isNaN(ageNum) || ageNum < 15) {
      setErrorMsg("You must be at least 15 years old to enter.");
      return;
    }

    setLoading(true);

    try {
      // ✅ Check for duplicate email
      const { data: existing, error: checkError } = await supabase
        .from("lottery_entries")
        .select("id")
        .eq("email", formData.email)
        .maybeSingle();

      if (checkError) {
        console.error("Email check error:", checkError);
        setErrorMsg("Something went wrong while checking your email.");
        setLoading(false);
        return;
      }

      if (existing) {
        setErrorMsg("This email has already been used to enter the lottery.");
        setLoading(false);
        return;
      }

      const number = generateLotteryNumber();

      const { error: insertError } = await supabase.from("lottery_entries").insert([
        {
          name: formData.name,
          address: formData.address,
          mobile: formData.mobile,
          email: formData.email,
          age: ageNum,
          lottery_number: number,
        },
      ]);

      if (insertError) {
        console.error("Insert error:", insertError);
        setErrorMsg("Failed to submit your entry. Please try again.");
        setLoading(false);
        return;
      }

      setLotteryNumber(number);
      setShowPopup(true);
      setFormData({ name: "", address: "", mobile: "", email: "", age: "" });
    } catch (err) {
      console.error("Unexpected error:", err);
      setErrorMsg("Unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const takeScreenshot = async () => {
    const popup = document.getElementById("lottery-popup");
    if (popup) {
      const canvas = await html2canvas(popup);
      const img = document.createElement("a");
      img.href = canvas.toDataURL("image/png");
      img.download = `lottery-${lotteryNumber}.png`;
      img.click();
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-start py-10 px-4 ${
        isDarkMode ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isDarkMode}
            onChange={(e) => setIsDarkMode(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-600 transition"></div>
          <span className="ml-2 text-sm font-medium">{isDarkMode ? "Dark" : "Light"}</span>
        </label>
      </div>

      <h1 className="text-3xl font-bold mb-6">🎟️ Lottery Entry Form</h1>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-md p-6 rounded-xl shadow-md ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="flex flex-col gap-4">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Full Name"
            className="p-3 border rounded-md bg-transparent focus:ring-2 focus:ring-green-500 outline-none"
          />
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            placeholder="Address"
            rows={3}
            className="p-3 border rounded-md bg-transparent focus:ring-2 focus:ring-green-500 outline-none"
          />
          <input
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            required
            placeholder="Mobile Number"
            pattern="[0-9]{10}"
            className="p-3 border rounded-md bg-transparent focus:ring-2 focus:ring-green-500 outline-none"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Email Address"
            className="p-3 border rounded-md bg-transparent focus:ring-2 focus:ring-green-500 outline-none"
          />
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            required
            placeholder="Age"
            min="15"
            className="p-3 border rounded-md bg-transparent focus:ring-2 focus:ring-green-500 outline-none"
          />

          {errorMsg && <p className="text-red-500 text-sm text-center">{errorMsg}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`mt-4 w-full py-3 rounded-md text-white transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Submitting..." : "Submit Entry"}
          </button>
        </div>
      </form>

      {/* POPUP */}
      {showPopup && lotteryNumber && (
        <div
          id="lottery-popup"
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
        >
          <div
            className={`p-8 rounded-2xl shadow-lg text-center ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
          >
            <h1 className="text-2xl font-bold mb-2">🎉 Lottery Date 19th Oct, 2025 <br />at Hiyangei Keithel, Thoubal Mela Ground. 5:30PM!</h1>
            <h2 className="text-2xl font-bold mb-2">🎉 Congratulations!</h2>
            <p className="text-lg mb-4">Your Lottery Entry Number is:</p>
            <div className="text-4xl font-mono font-bold text-green-500 mb-4">
              {lotteryNumber}
            </div>
            <button
              onClick={takeScreenshot}
              className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              📸 Take Screenshot
            </button>
            <button
              onClick={() => setShowPopup(false)}
              className="block mx-auto mt-4 text-sm underline text-gray-400 hover:text-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 🎁 PRIZES SECTION */}
      <div className="mt-12 w-full max-w-4xl text-center">
        <h2 className="text-2xl font-bold mb-4">🎁 Lottery Prizes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {prizes.map((prize) => (
            <div
              key={prize.id}
              className={`p-4 rounded-xl shadow-md ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <img
                src={prize.image}
                alt={prize.name}
                className="w-full h-48 object-cover rounded-md mb-3"
              />
              <h3 className="text-lg font-semibold">{prize.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
