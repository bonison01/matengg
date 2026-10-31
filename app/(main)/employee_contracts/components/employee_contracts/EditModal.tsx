"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CandidateRow, ContractRow } from "../../types";

interface EditModalProps {
  showEdit: boolean;
  setShowEdit: (boolean: boolean) => void;
  selected: CandidateRow | null;
  loadCandidates: () => void;
}

export default function EditModal({
  showEdit,
  setShowEdit,
  selected,
  loadCandidates,
}: EditModalProps) {
  const [saving, setSaving] = useState(false);
  const [loadedContract, setLoadedContract] = useState<ContractRow | null>(null);

  const [editState, setEditState] = useState({
    application_status: "pending",
    employment_status: "",
    joiningDate: "",
    positionPreset: "",
    positionCustom: "",
    adminRemarks: "",
    includeTerms: false,
    includeSalary: false,
    includeLeave: false,
    customPDFFile: null as File | null,
    customPDFUrl: null as string | null,
  });

  useEffect(() => {
    document.body.style.overflow = showEdit ? "hidden" : "auto";
  }, [showEdit]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowEdit(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Load existing contract data
  useEffect(() => {
    const loadContract = async () => {
      if (!selected) return;
      const { data } = await supabase
        .from("employee_contracts")
        .select("*")
        .eq("formid", selected.formid)
        .maybeSingle();

      setLoadedContract(data);
      if (!data) return;

      setEditState({
        application_status: data.application_status ?? selected.application_status,
        employment_status: data.employment_status ?? "",
        joiningDate: data.joiningdate ?? "",
        positionPreset: "",
        positionCustom: data.assignedposition ?? "",
        adminRemarks: data.adminremarks ?? "",
        includeTerms: data.includeterms ?? false,
        includeSalary: data.includesalarypolicy ?? false,
        includeLeave: data.includeleavepolicy ?? false,
        customPDFFile: null,
        customPDFUrl: data.custompdfurl ?? null,
      });
    };
    loadContract();
  }, [selected]);

  const generateEmployeeId = () => {
    const num = Math.floor(100000 + Math.random() * 900000);
    return `EMP-${num}`;
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);

    let employeeid: string | null = loadedContract?.employeeid ?? null;
    let custompdfurl: string | null = editState.customPDFUrl;

    // Upload custom PDF file (if provided)
    if (editState.customPDFFile) {
      const filename = `${selected.formid}-${Date.now()}.pdf`;
      const { error: uploadErr } = await supabase.storage
        .from("employee-contract-pdfs")
        .upload(filename, editState.customPDFFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadErr) {
        alert("PDF upload failed");
        console.error(uploadErr);
      } else {
        const { data } = supabase.storage
          .from("employee-contract-pdfs")
          .getPublicUrl(filename);
        custompdfurl = data.publicUrl;
      }
    }

    // generate employee id when approved and not present
    if (editState.application_status === "approved" && !employeeid) {
      employeeid = generateEmployeeId();
    }

    const finalEmploymentStatus =
      editState.application_status === "approved"
        ? editState.employment_status || null
        : null;

    // Upsert employee_contracts
    const { error: upsertErr } = await supabase.from("employee_contracts").upsert(
      {
        formid: selected.formid,
        application_status: editState.application_status,
        employment_status: finalEmploymentStatus,
        joiningdate: editState.joiningDate || null,
        assignedposition: editState.positionCustom || null,
        adminremarks: editState.adminRemarks || null,
        includeterms: editState.includeTerms,
        includesalarypolicy: editState.includeSalary,
        includeleavepolicy: editState.includeLeave,
        custompdfurl,
        employeeid,
      },
      { onConflict: "formid" }
    );

    // Update employee_forms status
    if (!upsertErr) {
      await supabase
        .from("employee_forms")
        .update({
          application_status: editState.application_status,
          employment_status: finalEmploymentStatus,
        })
        .eq("formid", selected.formid);
    }

    // If approved — call sendOffer API to email offer + terms + agreement link
    if (editState.application_status === "approved") {
      try {
        await fetch("/api/sendOffer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: selected.email,
            name: selected.fullname,
            formid: selected.formid,
            employeeid,
            includeTerms: editState.includeTerms,
            includeSalary: editState.includeSalary,
            includeLeave: editState.includeLeave,
            custompdfurl,
          }),
        });
      } catch (err) {
        console.error("sendOffer call failed", err);
      }
    }

    // If rejected — call sendOffer with rejection (so sendOffer handles it)
    if (editState.application_status === "rejected") {
      try {
        await fetch("/api/sendOffer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: selected.email,
            name: selected.fullname,
            formid: selected.formid,
            rejected: true,
          }),
        });
      } catch (err) {
        console.error("sendOffer (rejected) call failed", err);
      }
    }

    setSaving(false);
    setShowEdit(false);
    loadCandidates();
    alert("Updated successfully");
  };

  if (!showEdit || !selected) return null;

  return (
    <div
      className="fixed left-0 right-0 top-[70px] bottom-0 bg-black/40 cursor-pointer flex justify-center items-start p-4 z-[5000]"
      onClick={() => setShowEdit(false)}
    >
      <div
        className="bg-white cursor-default rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-gray-200 text-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h3 className="text-lg font-semibold">
            Edit — {selected.fullname}
          </h3>
          <button
            onClick={() => setShowEdit(false)}
            className="text-gray-500 hover:text-black text-xl"
          >
            ✕
          </button>
        </div>

        {/* Application Status */}
        <div className="space-y-4">
          <div>
            <label className="font-medium text-sm">Application Status</label>
            <select
              className="border rounded p-2 mt-1 w-full"
              value={editState.application_status}
              onChange={(e) =>
                setEditState((prev) => ({
                  ...prev,
                  application_status: e.target.value,
                  employment_status:
                    e.target.value === "approved" ? prev.employment_status : "",
                }))
              }
            >
              <option value="pending">Pending</option>
              <option value="talks">In Talks</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {editState.application_status === "approved" && (
            <div>
              <label className="font-medium text-sm">
                Employment Status (after joining)
              </label>
              <select
                className="border rounded p-2 mt-1 w-full"
                value={editState.employment_status}
                onChange={(e) =>
                  setEditState((prev) => ({
                    ...prev,
                    employment_status: e.target.value,
                  }))
                }
              >
                <option value="">Not joined yet</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}

          <div>
            <label className="font-medium text-sm">Joining Date</label>
            <input
              type="date"
              className="border rounded p-2 mt-1 w-full"
              value={editState.joiningDate}
              onChange={(e) =>
                setEditState((prev) => ({
                  ...prev,
                  joiningDate: e.target.value,
                }))
              }
            />
          </div>

          {/* Assigned Position */}
<div>
  <label className="font-medium text-sm">Assigned Position</label>
  
  <select
    className="border rounded p-2 mt-1 w-full"
    value={editState.positionPreset}
    onChange={(e) =>
      setEditState((prev) => ({
        ...prev,
        positionPreset: e.target.value,
        positionCustom: e.target.value === "others" ? "" : e.target.value,
      }))
    }
  >
    <option value="">Select Position</option>
    <option value="Delivery">Delivery</option>
    <option value="Operations">Operations</option>
    <option value="Video Editor">Video Editor</option>
    <option value="HR">HR</option>
    <option value="Accounting">Accounting</option>
    <option value="Sales">Sales</option>
    <option value="others">Other (Custom)</option>
  </select>

  {/* If "Other" selected → show custom input */}
  {editState.positionPreset === "others" && (
    <input
      className="border rounded p-2 mt-2 w-full"
      placeholder="Enter custom position"
      value={editState.positionCustom}
      onChange={(e) =>
        setEditState((prev) => ({
          ...prev,
          positionCustom: e.target.value,
        }))
      }
    />
  )}
</div>


          <div>
            <label className="font-medium text-sm">Admin Remarks</label>
            <textarea
              className="border rounded p-2 mt-1 w-full h-20"
              value={editState.adminRemarks}
              onChange={(e) =>
                setEditState((prev) => ({
                  ...prev,
                  adminRemarks: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <p className="font-medium text-sm mb-1">Documents in Offer Email</p>
            <Checkbox label="Terms & Conditions / R&Rs" checked={editState.includeTerms} onChange={(checked) => setEditState((prev) => ({ ...prev, includeTerms: checked }))} />
            <Checkbox label="Salary / Commission Structure" checked={editState.includeSalary} onChange={(checked) => setEditState((prev) => ({ ...prev, includeSalary: checked }))} />
            <Checkbox label="Leave Policy" checked={editState.includeLeave} onChange={(checked) => setEditState((prev) => ({ ...prev, includeLeave: checked }))} />
          </div>

          <div>
            <label className="font-medium text-sm">Custom PDF (optional)</label>
            <input
              type="file"
              accept="application/pdf"
              className="border rounded p-2 mt-1 w-full"
              onChange={(e) =>
                setEditState((prev) => ({
                  ...prev,
                  customPDFFile: e.target.files?.[0] ?? null,
                }))
              }
            />
            {editState.customPDFUrl && (
              <p className="text-xs mt-1">
                Existing:{" "}
                <a
                  href={editState.customPDFUrl}
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  View current PDF
                </a>
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowEdit(false)}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={saveEdit}
            disabled={saving}
            className="px-4 py-2 rounded bg-black text-white"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Checkbox component */
function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs mb-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
