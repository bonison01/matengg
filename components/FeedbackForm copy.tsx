"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface FeedbackFormProps {
  isDarkMode: boolean;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ isDarkMode }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;

    if (!message.trim()) {
      alert("Message cannot be empty.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("feedbacks").insert([{ name, email, message }]);
    setLoading(false);

    if (error) {
      console.error("Feedback submission error:", error);
      alert("There was an error submitting your feedback. Please try again.");
    } else {
      alert("Thanks for your feedback!");
      e.currentTarget.reset();
    }
  };

  return (
    <div className="w-full h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Image Section */}
      <div className="relative w-full md:w-1/2 h-1/2 md:h-full">
        <img
          src="https://images.unsplash.com/photo-1506765515384-028b60a970df?auto=format&fit=crop&w=1950&q=80"
          alt="Feedback Banner"
          className="object-cover w-full h-full"
        />

        {/* Form Overlay for Mobile View */}
        <div
          className={`absolute inset-0 flex items-center justify-center md:hidden bg-black/60 px-4`}
        >
          <div
            className={`w-full max-w-md p-6 rounded-xl shadow-lg ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            }`}
          >
            <h2 className="text-2xl font-bold mb-4 text-center">We'd love your feedback!</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                className="px-4 py-2 rounded-lg border bg-white text-black"
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email (optional)"
                className="px-4 py-2 rounded-lg border bg-white text-black"
              />
              <textarea
                name="message"
                placeholder="Your Feedback"
                required
                rows={4}
                className="px-4 py-2 rounded-lg border resize-none bg-white text-black"
              ></textarea>
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg w-fit mx-auto disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Form Section for Desktop View */}
      <div
        className={`hidden md:flex w-full md:w-1/2 items-center justify-center p-12 ${
          isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-6">We'd love your feedback!</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              className={`px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-black"
              }`}
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email (optional)"
              className={`px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-black"
              }`}
            />
            <textarea
              name="message"
              placeholder="Your Feedback"
              required
              rows={4}
              className={`px-4 py-2 rounded-lg border resize-none ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-black"
              }`}
            ></textarea>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg w-fit disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;
