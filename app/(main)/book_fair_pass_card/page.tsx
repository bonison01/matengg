"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";

export default function PassCardPage() {
  const [regNo, setRegNo] = useState("");
  const [passCard, setPassCard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPassCard = async () => {
    if (!regNo) return;

    setLoading(true);
    setError("");
    setPassCard(null);

    const { data, error } = await supabase
      .from("book_fair_registrations")
      .select(`
        registration_no,
        participant_name,
        student_class,
        institution_name,
        competition,
        event_date,
        event_time,
        venue,
        payment_status,
        approved
      `)
      .eq("registration_no", regNo)
      .single();

    console.log("FETCHED PASS CARD DATA:", data);

    if (error || !data) {
      setError("Registration not found.");
    } else if (data.payment_status !== "paid" || data.approved !== true) {
      setError("Your registration is not approved yet.");
    } else {
      setPassCard(data);
    }

    setLoading(false);
  };

  // ===== PDF GENERATION (jsPDF – NULL SAFE) =====
  const downloadPDF = () => {
    if (!passCard) return;

    const doc = new jsPDF();

    // HEADER
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Manipur Book Fair 2026", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(
      "Organised by NRS (North East Reading Society)",
      20,
      28
    );

    doc.line(20, 32, 190, 32);

    // TITLE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Participant Pass Card", 20, 42);

    // DETAILS (NULL SAFE)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    doc.text(
      `Registration No: ${passCard.registration_no || "-"}`,
      20,
      55
    );
    doc.text(
      `Name: ${passCard.participant_name || "-"}`,
      20,
      63
    );
    doc.text(
      `Class: ${passCard.student_class || "-"}`,
      20,
      71
    );
    doc.text(
      `Institution: ${passCard.institution_name || "-"}`,
      20,
      79
    );

    // COMPETITION HIGHLIGHT
    doc.setFont("helvetica", "bold");
    doc.setDrawColor(21, 128, 61);
    doc.setFillColor(220, 252, 231);
    doc.rect(20, 86, 170, 12, "FD");
    doc.text(
      `Competition: ${passCard.competition || "-"}`,
      25,
      94
    );

    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${passCard.event_date || "-"}`, 20, 111);
    doc.text(`Time: ${passCard.event_time || "-"}`, 20, 119);
    doc.text(`Venue: ${passCard.venue || "-"}`, 20, 127);

    // SIGNATURE
    doc.line(20, 150, 80, 150);
    doc.setFontSize(10);
    doc.text("Authorized Signature", 20, 156);

    const img = new Image();
    img.src = "/signature.png"; // from /public
    img.onload = () => {
      doc.addImage(img, "PNG", 20, 135, 40, 12);

      doc.setFontSize(9);
      doc.text(
        "NRS – North East Reading Society",
        20,
        162
      );

      doc.text(
        "This is a computer-generated pass card. No physical signature required.",
        20,
        175
      );

      doc.save(`PassCard-${passCard.registration_no}.pdf`);
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 text-black">
      {/* INPUT */}
      <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-center text-green-700">
          🎟 Download Pass Card
        </h1>

        <p className="text-sm text-center mt-2 text-gray-600">
          Enter your Registration Number
        </p>

        <input
          type="text"
          placeholder="e.g. BF-123456"
          value={regNo}
          onChange={(e) => setRegNo(e.target.value)}
          className="w-full p-3 border rounded mt-4"
        />

        <button
          onClick={fetchPassCard}
          disabled={loading}
          className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold"
        >
          {loading ? "Checking..." : "Get Pass Card"}
        </button>

        {error && (
          <p className="mt-4 text-sm text-red-600 text-center">
            {error}
          </p>
        )}
      </div>

      {/* PREVIEW */}
      {passCard && (
        <div className="max-w-md mx-auto mt-6 bg-white border rounded-xl p-6 shadow">
          <h2 className="text-lg font-bold text-green-700 text-center">
            Pass Card Ready
          </h2>

          <div className="mt-4 text-sm space-y-2">
            <p><b>Registration:</b> {passCard.registration_no || "-"}</p>
            <p><b>Name:</b> {passCard.participant_name || "-"}</p>
            <p><b>Class:</b> {passCard.student_class || "-"}</p>
            <p><b>Institution:</b> {passCard.institution_name || "-"}</p>
            <p className="font-bold text-green-800">
              🎨 Competition: {passCard.competition || "-"}
            </p>
            <p><b>Date:</b> {passCard.event_date || "-"}</p>
            <p><b>Time:</b> {passCard.event_time || "-"}</p>
            <p><b>Venue:</b> {passCard.venue || "-"}</p>
          </div>

          <button
            onClick={downloadPDF}
            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold"
          >
            ⬇ Download Pass Card (PDF)
          </button>
        </div>
      )}
    </div>
  );
}
