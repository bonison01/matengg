"use client";

import React, { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

interface FileState {
  aadhar: FileList | null;
  pan: FileList | null;
  cv: FileList | null;
  license: FileList | null;
  vehicleDocs: FileList | null;
}

export default function JoiningForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-generate a form ID that matches formid column (unique)
  const [formID] = useState(
    `FORM-${Math.floor(100000 + Math.random() * 900000)}`
  );

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    mobile: "",
    altMobile: "",
    permanentAddress: "",
    residentialAddress: "",
    reason: "",
    vehicleType: "",
    strengthWeakness: "",
    goal5: "",
    applyPos: "",
    positionType: "delivery" as "delivery" | "other",
  });

  const [files, setFiles] = useState<FileState>({
    aadhar: null,
    pan: null,
    cv: null,
    license: null,
    vehicleDocs: null,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: selected } = e.target;
    setFiles((prev) => ({ ...prev, [name]: selected }));
  };

  const uploadFile = async (
    bucket: string,
    file: File,
    filename: string
  ): Promise<string | null> => {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filename, file, { upsert: true });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
    return data.publicUrl;
  };

  const resetForm = () => {
    if (formRef.current) formRef.current.reset();

    setFormData({
      email: "",
      fullName: "",
      mobile: "",
      altMobile: "",
      permanentAddress: "",
      residentialAddress: "",
      reason: "",
      vehicleType: "",
      strengthWeakness: "",
      goal5: "",
      applyPos: "",
      positionType: "delivery",
    });

    setFiles({
      aadhar: null,
      pan: null,
      cv: null,
      license: null,
      vehicleDocs: null,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // URLs to store in DB
    let aadharURL: string[] = [];
    let vehicleDocsURL: string[] = [];
    let panURL: string | null = null;
    let cvURL: string | null = null;
    let driverLicenseURL: string | null = null;

    try {
      // AADHAR (array)
      if (files.aadhar) {
        for (let i = 0; i < files.aadhar.length; i++) {
          const file = files.aadhar[i];
          const url = await uploadFile(
            "employee-aadhar",
            file,
            `${formID}-aadhar-${i}`
          );
          if (url) aadharURL.push(url);
        }
      }

      // VEHICLE DOCS (array)
      if (files.vehicleDocs) {
        for (let i = 0; i < files.vehicleDocs.length; i++) {
          const file = files.vehicleDocs[i];
          const url = await uploadFile(
            "employee-vehicle-docs",
            file,
            `${formID}-veh-${i}`
          );
          if (url) vehicleDocsURL.push(url);
        }
      }

      // PAN (single)
      if (files.pan?.[0]) {
        panURL = await uploadFile(
          "employee-pan",
          files.pan[0],
          `${formID}-pan`
        );
      }

      // CV (single)
      if (files.cv?.[0]) {
        cvURL = await uploadFile("employee-cv", files.cv[0], `${formID}-cv`);
      }

      // LICENSE (single)
      if (files.license?.[0]) {
        driverLicenseURL = await uploadFile(
          "employee-driver-license",
          files.license[0],
          `${formID}-license`
        );
      }

      // Insert row into employee_forms with EXACT column names
      const { error: insertErr } = await supabase
        .from("employee_forms")
        .insert([
          {
            formid: formID,
            email: formData.email,
            fullname: formData.fullName,
            permanentaddress: formData.permanentAddress,
            residentialaddress: formData.residentialAddress,
            vehicletype: formData.vehicleType,
            mobile: formData.mobile,
            altcontact: formData.altMobile,
            reason: formData.reason,
            strengthsweakness: formData.strengthWeakness,
            goals5years: formData.goal5,
            applyposition: formData.applyPos,
            positiontype: formData.positionType, // 'delivery' | 'other'
            aadharurl: aadharURL,               // text[]
            panurl: panURL ? [panURL] : [],     // text[]
            cvurl: cvURL,                       // text
            driverlicenseurl: driverLicenseURL, // text
            vehicledocsurl: vehicleDocsURL,     // text[]
            application_status: "pending",      // check constraint ok
            employment_status: null,            // active/inactive later
            status: "pending",                  // your extra status column
          },
        ]);

      if (insertErr) {
        console.error("Insert error:", insertErr);
        setErrorMsg("❗ Failed to submit application. Check console for details.");
        setLoading(false);
        return;
      }

      // Optionally create base row in employee_contracts table
      // await supabase.from("employee_contracts").insert([{ formid: formID }]);

      setSuccessModal(true);
      resetForm();
      setLoading(false);
    } catch (err) {
      console.error("Unexpected error:", err);
      setErrorMsg("🚨 Unexpected internal error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-extrabold mb-3">
          Employee Onboarding Form
        </h2>
        <p className="text-gray-500 mb-5">
          Your form ID: <span className="font-mono font-semibold">{formID}</span>
        </p>

        {errorMsg && (
          <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded mb-4 text-sm">
            {errorMsg}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit}>
          {/* CONTACT INFO */}
          <section className="mb-6">
            <h3 className="font-semibold mb-2 text-gray-800">
              Contact & Personal Details
            </h3>

            <label className="block text-sm font-semibold mb-1">Email</label>
            <input
              name="email"
              type="email"
              onChange={handleChange}
              required
              className="border p-2 w-full mb-3 rounded"
            />

            <label className="block text-sm font-semibold mb-1">
              Full Name
            </label>
            <input
              name="fullName"
              onChange={handleChange}
              required
              className="border p-2 w-full mb-3 rounded"
            />

            <label className="block text-sm font-semibold mb-1">
              Mobile Number
            </label>
            <input
              name="mobile"
              onChange={handleChange}
              required
              className="border p-2 w-full mb-3 rounded"
            />

            <label className="block text-sm font-semibold mb-1">
              Alternative Contact
            </label>
            <input
              name="altMobile"
              onChange={handleChange}
              className="border p-2 w-full mb-3 rounded"
            />

            <label className="block text-sm font-semibold mb-1">
              Permanent Address
            </label>
            <input
              name="permanentAddress"
              onChange={handleChange}
              className="border p-2 w-full mb-3 rounded"
            />

            <label className="block text-sm font-semibold mb-1">
              Residential Address
            </label>
            <input
              name="residentialAddress"
              onChange={handleChange}
              className="border p-2 w-full mb-3 rounded"
            />
          </section>

          {/* MOTIVATION */}
          <section className="mb-6">
            <h3 className="font-semibold mb-2 text-gray-800">Motivation</h3>

            <label className="block text-sm font-semibold mb-1">
              Why do you want to join us?
            </label>
            <textarea
              name="reason"
              onChange={handleChange}
              className="border p-2 w-full mb-3 rounded"
            />
          </section>

          {/* POSITION SELECTION */}
          <section className="mb-6">
            <h3 className="font-semibold mb-2 text-gray-800">Position</h3>

            <label className="block text-sm font-semibold mb-1">
              Applying for
            </label>
            <select
              name="positionType"
              value={formData.positionType}
              onChange={handleChange}
              className="border p-2 w-full mb-3 rounded"
            >
              <option value="delivery">Delivery Role</option>
              <option value="other">Other Position</option>
            </select>

            {/* DELIVERY FIELDS */}
            {formData.positionType === "delivery" && (
              <>
                <label className="block text-sm font-semibold mb-1">
                  Vehicle Type
                </label>
                <input
                  name="vehicleType"
                  onChange={handleChange}
                  className="border p-2 w-full mb-3 rounded"
                />

                <label className="block text-sm font-semibold mb-1">
                  Driver License (image / PDF)
                </label>
                <input
                  name="license"
                  type="file"
                  onChange={handleFile}
                  className="border p-2 w-full mb-3 rounded"
                />

                <label className="block text-sm font-semibold mb-1">
                  Vehicle Documents (Smart Card, Insurance, NOC)
                </label>
                <input
                  name="vehicleDocs"
                  type="file"
                  multiple
                  onChange={handleFile}
                  className="border p-2 w-full mb-3 rounded"
                />
              </>
            )}

            {/* OTHER POSITION FIELDS */}
            {formData.positionType === "other" && (
              <>
                <label className="block text-sm font-semibold mb-1">
                  Position you are applying for
                </label>
                <input
                  name="applyPos"
                  onChange={handleChange}
                  className="border p-2 w-full mb-3 rounded"
                />

                <label className="block text-sm font-semibold mb-1">
                  Strengths & Weakness
                </label>
                <textarea
                  name="strengthWeakness"
                  onChange={handleChange}
                  className="border p-2 w-full mb-3 rounded"
                />

                <label className="block text-sm font-semibold mb-1">
                  Your Goal in 5 Years
                </label>
                <textarea
                  name="goal5"
                  onChange={handleChange}
                  className="border p-2 w-full mb-3 rounded"
                />

                <label className="block text-sm font-semibold mb-1">
                  Upload CV / Resume
                </label>
                <input
                  name="cv"
                  type="file"
                  onChange={handleFile}
                  className="border p-2 w-full mb-3 rounded"
                />
              </>
            )}
          </section>

          {/* DOCUMENTS (COMMON) */}
          <section className="mb-6">
            <h3 className="font-semibold mb-2 text-gray-800">
              ID & Verification Documents
            </h3>

            <label className="block text-sm font-semibold mb-1">
              Aadhar Card (Front & Back)
            </label>
            <input
              name="aadhar"
              type="file"
              multiple
              onChange={handleFile}
              className="border p-2 w-full mb-3 rounded"
            />

            <label className="block text-sm font-semibold mb-1">
              PAN Card
            </label>
            <input
              name="pan"
              type="file"
              onChange={handleFile}
              className="border p-2 w-full mb-3 rounded"
            />
          </section>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded font-semibold ${
              loading ? "bg-gray-400" : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>

      {/* SUCCESS MODAL */}
      {successModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full text-center">
            <h3 className="text-xl font-bold mb-2">🎉 Application Submitted!</h3>
            <p className="text-sm mb-2">
              Your form ID is:
            </p>
            <p className="font-mono text-lg mb-4">{formID}</p>
            <button
              onClick={() => setSuccessModal(false)}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
