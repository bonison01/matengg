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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

      {/* TABLE */}
      <div className="mt-12 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">📋 Registered Students</h2>

        <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-xl border border-gray-700">
          <table className="w-full text-left text-white">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">School</th>
                <th className="p-3">Class</th>
                <th className="p-3">Giveaway No.</th>
              </tr>
            </thead>

            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-gray-700">
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">{s.phone}</td>
                  <td className="p-3">{s.school}</td>
                  <td className="p-3">{s.class}</td>
                  <td className="p-3 text-green-400 font-mono">{s.giveaway_number}</td>
                </tr>
              ))}

              {students.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-4 text-center text-gray-400"
                  >
                    No students registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
