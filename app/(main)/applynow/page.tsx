"use client";

import React, { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import { supabase } from "@/lib/supabaseClient";

export default function StudentRegistrationPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    school: "",
    class: "",
    stream: "",
    interest: "",
  });

  const [giveawayNumber, setGiveawayNumber] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const generateGiveawayNumber = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `GW-${randomNum}`;
  };

  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {

    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const number = generateGiveawayNumber();

      const { error } = await supabase.from("student_registrations").insert([
        {
          ...formData,
          giveaway_number: number,
        },
      ]);

      if (error) {
        setErrorMsg("Failed to submit. Try again.");
        setLoading(false);
        return;
      }

      setGiveawayNumber(number);
      setShowPopup(true);
      loadStudents();

      setFormData({
        name: "",
        phone: "",
        address: "",
        school: "",
        class: "",
        stream: "",
        interest: "",
      });
    } catch (err) {
      setErrorMsg("Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    const { data, error } = await supabase
      .from("student_registrations")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setStudents(data);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const takeScreenshot = async () => {
    const popup = document.getElementById("popup-card");
    if (popup) {
      const canvas = await html2canvas(popup);
      const img = document.createElement("a");
      img.href = canvas.toDataURL("image/png");
      img.download = `giveaway-${giveawayNumber}.png`;
      img.click();
    }
  };

  return (
    <div className="min-h-screen bg-black px-4 py-10 text-white">
      <h1 className="text-3xl font-bold text-center mb-8">
        🎓 Student Registration – Thoubal Career Fair 2025.
      </h1>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="max-w-xl mx-auto bg-gray-800 p-6 rounded-xl shadow-lg"
      >
        <div className="flex flex-col gap-4">
          <input
            type="text"
            name="name"
            required
            placeholder="Student Name"
            value={formData.name}
            onChange={handleChange}
            className="p-3 border border-gray-600 rounded-md bg-gray-900 text-white"
          />

          <input
            type="tel"
            name="phone"
            required
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            className="p-3 border border-gray-600 rounded-md bg-gray-900 text-white"
            pattern="[0-9]{10}"
          />

          <textarea
            name="address"
            required
            placeholder="Address"
            rows={2}
            value={formData.address}
            onChange={handleChange}
            className="p-3 border border-gray-600 rounded-md bg-gray-900 text-white"
          />

          <input
            type="text"
            name="school"
            required
            placeholder="School Name"
            value={formData.school}
            onChange={handleChange}
            className="p-3 border border-gray-600 rounded-md bg-gray-900 text-white"
          />

          <input
            type="text"
            name="class"
            required
            placeholder="Class (e.g., Class 11)"
            value={formData.class}
            onChange={handleChange}
            className="p-3 border border-gray-600 rounded-md bg-gray-900 text-white"
          />

          <select
  name="stream"
  value={formData.stream}
  onChange={handleChange}
  className="p-3 border border-gray-600 rounded-md bg-gray-900 text-white"
  required
>
  <option value="" disabled>Select Stream</option>
  <option value="Science">Science</option>
  <option value="Commerce">Commerce</option>
  <option value="Arts">Arts</option>
  <option value="Others">Others</option>
</select>


          <input
  type="text"
  name="interest"
  placeholder="Student Interest (e.g., gym, sports, reading, coding, arts, music)"
  value={formData.interest}
  onChange={handleChange}
  className="p-3 border border-gray-600 rounded-md bg-gray-900 text-white"
/>


          {errorMsg && (
            <p className="text-red-400 text-center text-sm">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`mt-2 w-full py-3 text-white bg-green-600 rounded-md ${
              loading ? "opacity-50" : "hover:bg-green-700"
            }`}
          >
            {loading ? "Submitting..." : "Register Now"}
          </button>
        </div>
      </form>

      {/* POPUP */}
      {showPopup && giveawayNumber && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div
            id="popup-card"
            className="bg-gray-800 p-8 rounded-xl shadow-lg text-center text-white"
          >
            <h2 className="text-2xl font-bold mb-2">🎉 Registration Successful!</h2>
            <p className="mb-2">Your Giveaway Tablet Number is:</p>

            <div className="text-4xl font-mono font-bold text-green-500 mb-4">
              {giveawayNumber}
            </div>

            <button
              onClick={takeScreenshot}
              className="px-5 py-2 bg-green-600 text-white rounded-md"
            >
              📸 Save Screenshot
            </button>

            <button
              onClick={() => setShowPopup(false)}
              className="block mt-4 text-sm underline text-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
