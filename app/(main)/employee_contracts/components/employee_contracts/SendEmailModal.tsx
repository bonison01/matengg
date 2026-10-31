"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SendEmailModal({ show, onClose, candidate, reload }: any) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [contract, setContract] = useState<any>(null);
  const [availableDocs, setAvailableDocs] = useState<string[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  useEffect(() => {
    if (show && candidate) loadData();
  }, [show, candidate]);

  async function loadData() {
    setLoading(true);

    // Fetch DB contract
    const { data } = await supabase
      .from("employee_contracts")
      .select("*")
      .eq("formid", candidate.formid)
      .maybeSingle();

    setContract(data);

    // Fetch PDF list
    const res = await fetch("/api/listPdfs");
    const json = await res.json();
    setAvailableDocs(json.pdfs);

    // Pre-selected docs
    const pre: string[] = [];
    if (data?.includeterms) pre.push("terms.pdf");
    if (data?.includesalarypolicy) pre.push("salary.pdf");
    if (data?.includeleavepolicy) pre.push("leave.pdf");
    if (data?.custompdfurl) pre.push("custom.pdf");

    setSelectedDocs(pre);

    setLoading(false);
  }

  function toggleDoc(file: string) {
    setSelectedDocs((prev) =>
      prev.includes(file) ? prev.filter((x) => x !== file) : [...prev, file]
    );
  }

  async function send() {
    setSending(true);

    await fetch("/api/sendOffer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: candidate.email,
        name: candidate.name,
        formid: candidate.formid,
        selectedDocs,
        custompdfurl: contract?.custompdfurl,
      }),
    });

    setSending(false);
    onClose();
    reload();
    alert("Email sent!");
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[5000]" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">
          Send Email — {candidate.name}
        </h2>

        {loading ? (
          <p>Loading documents…</p>
        ) : (
          <>
            <p className="font-medium mb-2">Select Documents:</p>
            <div className="border rounded p-3 max-h-60 overflow-y-auto">
              {availableDocs.map((file) => (
                <label key={file} className="flex items-center gap-2 mb-1 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedDocs.includes(file)}
                    onChange={() => toggleDoc(file)}
                  />
                  {file}
                </label>
              ))}

              {contract?.custompdfurl && (
                <label className="flex items-center gap-2 mt-2 text-sm text-blue-700">
                  <input
                    type="checkbox"
                    checked={selectedDocs.includes("custom.pdf")}
                    onChange={() => toggleDoc("custom.pdf")}
                  />
                  Custom Offer Letter
                </label>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button className="border px-4 py-2 rounded" onClick={onClose}>
                Cancel
              </button>
              <button
                disabled={sending}
                className="bg-black text-white px-4 py-2 rounded"
                onClick={send}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
