"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";

type FilterType = "all" | "pending" | "approved" | "rejected";

export default function BookFairAdminDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const EVENT_INFO = {
    event_date: "05 Feb 2026",
    event_time: "10:00 AM – 12:00 PM",
    venue: "City Convention Hall",
  };

  /* =====================
     FETCH DATA
     ===================== */
  const fetchRegistrations = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("book_fair_registrations")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setData(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  /* =====================
     APPROVE / REJECT
     ===================== */
  const approveRegistration = async (id: string) => {
    setActionLoading(id);

    await supabase
      .from("book_fair_registrations")
      .update({
        approved: true,
        payment_status: "paid",
        ...EVENT_INFO,
      })
      .eq("id", id);

    await fetchRegistrations();
    setActionLoading(null);
  };

  const rejectRegistration = async (id: string) => {
    setActionLoading(id);

    await supabase
      .from("book_fair_registrations")
      .update({
        approved: false,
        payment_status: "rejected",
      })
      .eq("id", id);

    await fetchRegistrations();
    setActionLoading(null);
  };

  /* =====================
     SEARCH + FILTER
     ===================== */
  const filteredData = useMemo(() => {
    return data.filter((r) => {
      const searchMatch =
        r.registration_no?.toLowerCase().includes(search.toLowerCase()) ||
        r.participant_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.phone?.includes(search);

      if (!searchMatch) return false;

      if (filter === "approved") return r.approved === true;
      if (filter === "rejected") return r.payment_status === "rejected";
      if (filter === "pending")
        return r.payment_status === "pending_verification";

      return true;
    });
  }, [data, search, filter]);

  /* =====================
     CSV DOWNLOAD
     ===================== */
  const downloadCSV = () => {
    if (!filteredData.length) return;

    const headers = [
      "Registration No",
      "Name",
      "Class",
      "Institution",
      "Phone",
      "Competition",
      "Amount",
      "Payment Status",
      "Approved",
      "Event Date",
      "Event Time",
      "Venue",
      "Created At",
    ];

    const rows = filteredData.map((r) => [
      r.registration_no,
      r.participant_name,
      r.student_class,
      r.institution_name,
      r.phone,
      r.competition,
      r.amount,
      r.payment_status,
      r.approved ? "Yes" : "No",
      r.event_date,
      r.event_time,
      r.venue,
      new Date(r.created_at).toLocaleString(),
    ]);

    const csv =
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) =>
              `"${String(cell ?? "").replace(/"/g, '""')}"`
            )
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "book_fair_registrations.csv";
    link.click();
  };

  /* =====================
     INVOICE PDF
     ===================== */
  const downloadInvoicePDF = (r: any) => {
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Manipur Book Fair 2026", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      "Organised by NRS (North East Reading Society)",
      20,
      26
    );

    doc.line(20, 30, 190, 30);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Registration Invoice", 20, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(`Registration No: ${r.registration_no}`, 20, 52);
    doc.text(`Name: ${r.participant_name}`, 20, 60);
    doc.text(`Class: ${r.student_class || "-"}`, 20, 68);
    doc.text(`Institution: ${r.institution_name || "-"}`, 20, 76);
    doc.text(`Phone: ${r.phone}`, 20, 84);

    doc.line(20, 90, 190, 90);

    doc.text(`Competition: ${r.competition}`, 20, 102);
    doc.text(`Amount Paid: ₹${r.amount}`, 20, 110);
    doc.text(`Payment Status: ${r.payment_status}`, 20, 118);

    doc.line(20, 124, 190, 124);

    doc.text(`Event Date: ${r.event_date}`, 20, 136);
    doc.text(`Event Time: ${r.event_time}`, 20, 144);
    doc.text(`Venue: ${r.venue}`, 20, 152);

    doc.setFontSize(9);
    doc.text(
      "This is a system-generated invoice. No signature required.",
      20,
      170
    );

    doc.save(`Invoice-${r.registration_no}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <h1 className="text-3xl font-bold text-green-700 mb-6">
        📊 Book Fair Admin Dashboard
      </h1>

      {/* CONTROLS */}
      <div className="bg-white p-4 rounded-xl shadow mb-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Search by Reg No / Name / Phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-full md:w-1/3"
        />

        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as FilterType)}
              className={`px-3 py-1 rounded text-sm font-semibold ${
                filter === f
                  ? "bg-green-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          onClick={downloadCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold text-sm"
        >
          ⬇ Download CSV
        </button>
      </div>

      {/* TABLE */}
      {loading ? (
        <p>Loading registrations...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full border">
            <thead className="bg-green-700 text-white text-sm">
              <tr>
                <th className="p-3 border">Reg No</th>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Class</th>
                <th className="p-3 border">Institution</th>
                <th className="p-3 border">Phone</th>
                <th className="p-3 border">Competition</th>
                <th className="p-3 border">Amount</th>
                <th className="p-3 border">Payment</th>
                <th className="p-3 border">Screenshot</th>
                <th className="p-3 border">Invoice</th>
                <th className="p-3 border">Action</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {filteredData.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2 border font-semibold">{r.registration_no}</td>
                  <td className="p-2 border">{r.participant_name}</td>
                  <td className="p-2 border">{r.student_class || "—"}</td>
                  <td className="p-2 border">{r.institution_name || "—"}</td>
                  <td className="p-2 border">{r.phone}</td>
                  <td className="p-2 border">{r.competition}</td>
                  <td className="p-2 border">₹{r.amount}</td>
                  <td className="p-2 border">{r.payment_status}</td>

                  <td className="p-2 border text-center">
                    {r.payment_screenshot_url ? (
                      <a
                        href={r.payment_screenshot_url}
                        target="_blank"
                        className="text-green-600 underline"
                      >
                        View
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="p-2 border text-center">
                    <button
                      onClick={() => downloadInvoicePDF(r)}
                      className="text-green-700 underline text-xs"
                    >
                      Download
                    </button>
                  </td>

                  <td className="p-2 border text-center space-x-2">
                    {!r.approved && r.payment_status !== "rejected" ? (
                      <>
                        <button
                          onClick={() => approveRegistration(r.id)}
                          disabled={actionLoading === r.id}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectRegistration(r.id)}
                          disabled={actionLoading === r.id}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}

              {!filteredData.length && (
                <tr>
                  <td colSpan={11} className="p-4 text-center text-gray-500">
                    No registrations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
