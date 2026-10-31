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
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Image */}
      <img
        src="https://images.unsplash.com/photo-1506765515384-028b60a970df?auto=format&fit=crop&w=1950&q=80"
        alt="Feedback Banner"
        className="absolute inset-0 object-cover w-full h-full"
      />

      {/* Overlay: Split into two columns */}
      <div className="absolute inset-0 bg-black/60 flex flex-col md:flex-row items-center justify-between px-6 md:px-20 py-8">
        {/* Left Side - Text Block */}
        <div className="w-full md:w-1/2 text-white mb-8 md:mb-0 md:pr-8">
          <h1 className="text-6xl md:text-15xl font-bold mb-4">Thanks for visiting!</h1>
          <span className="block sm:hidden"><br /></span> <br />
          <p className="text-lg leading-relaxed">
            Our <span className="font-semibold">Hangout & Foods</span> category is coming soon—stay tuned!
            <br />
            Meanwhile, explore other categories and share your feedback. We’d love to hear from you!
          </p>
        </div>

        {/* Right Side - Feedback Form */}
        <div
          className={`w-full md:w-1/2 max-w-md p-6 rounded-xl shadow-lg ${
            isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
          }`}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">
            We'd love your feedback!
          </h2>
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
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg w-fit mx-auto disabled:opacity-50"
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
