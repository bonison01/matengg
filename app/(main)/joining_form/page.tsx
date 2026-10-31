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

  const [formID] = useState(`FORM-${Math.floor(100000 + Math.random() * 900000)}`);

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

  const uploadFile = async (bucket: string, file: File, filename: string): Promise<string | null> => {
    bucket = bucket.toLowerCase();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filename, file, { upsert: true });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`;
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

    let aadharURL: string[] = [];
    let vehicleDocsURL: string[] = [];
    let panURL: string[] = [];
    let cvURL: string | null = null;
    let driverLicenseURL: string | null = null;

    try {
      if (files.aadhar) {
        for (let i = 0; i < files.aadhar.length; i++) {
          const url = await uploadFile("employee-aadhar", files.aadhar[i], `${formID}-aadhar-${i}`);
          if (url) aadharURL.push(url);
        }
      }

      if (files.vehicleDocs) {
        for (let i = 0; i < files.vehicleDocs.length; i++) {
          const url = await uploadFile("employee-vehicle-docs", files.vehicleDocs[i], `${formID}-veh-${i}`);
          if (url) vehicleDocsURL.push(url);
        }
      }

      if (files.pan?.[0]) {
        const url = await uploadFile("employee-pan", files.pan[0], `${formID}-pan`);
        if (url) panURL.push(url);
      }

      if (files.cv?.[0]) {
        cvURL = await uploadFile("employee-cv", files.cv[0], `${formID}-cv`);
      }

      if (files.license?.[0]) {
        driverLicenseURL = await uploadFile("employee-driver-license", files.license[0], `${formID}-license`);
      }

      const { error: insertErr } = await supabase.from("employee_forms").insert([
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
          positiontype: formData.positionType,
          aadharurl: aadharURL,
          panurl: panURL,
          cvurl: cvURL,
          driverlicenseurl: driverLicenseURL,
          vehicledocsurl: vehicleDocsURL,
          application_status: "pending",
          employment_status: null,
          status: "pending",
        },
      ]);

      if (insertErr) {
        console.error(insertErr);
        setErrorMsg("❗ Failed submitting — check console");
        setLoading(false);
        return;
      }

      setSuccessModal(true);
      resetForm();
      setLoading(false);

    } catch (err) {
      console.error("UNEXPECTED ERROR:", err);
      setErrorMsg("❗ Unexpected internal error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-4xl mx-auto">

        <h2 className="text-3xl font-extrabold mb-3">Employee Onboarding Form</h2>
        <p className="text-black mb-5">
          Your form ID: <span className="font-mono font-semibold">{formID}</span>
        </p>

        {errorMsg && (
          <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded mb-4 text-sm">
            {errorMsg}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit}>

          {/* Contact Info */}
          <section className="mb-6">
            <h3 className="font-semibold mb-2 text-black">Contact & Personal Details</h3>

            <label className="block text-sm font-semibold mb-1 text-black">Email</label>
            <input name="email" type="email" onChange={handleChange} required className="border p-2 w-full mb-3 rounded" />

            <label className="block text-sm font-semibold mb-1 text-black">Full Name</label>
            <input name="fullName" onChange={handleChange} required className="border p-2 w-full mb-3 rounded" />

            <label className="block text-sm font-semibold mb-1 text-black">Mobile Number</label>
            <input name="mobile" onChange={handleChange} required className="border p-2 w-full mb-3 rounded" />

            <label className="block text-sm font-semibold mb-1 text-black">Alternative Contact</label>
            <input name="altMobile" onChange={handleChange} className="border p-2 w-full mb-3 rounded" />

            <label className="block text-sm font-semibold mb-1 text-black">Permanent Address</label>
            <input name="permanentAddress" onChange={handleChange} className="border p-2 w-full mb-3 rounded" />

            <label className="block text-sm font-semibold mb-1 text-black">Residential Address</label>
            <input name="residentialAddress" onChange={handleChange} className="border p-2 w-full mb-3 rounded" />

          </section>

          {/* Motivation */}
          <section className="mb-6">
            <h3 className="font-semibold mb-2 text-black">Motivation</h3>

            <label className="block text-sm font-semibold mb-1 text-black">Why do you want to join us?</label>
            <textarea name="reason" onChange={handleChange} className="border p-2 w-full mb-3 rounded" />
          </section>

          {/* Position */}
          <section className="mb-6">
            <h3 className="font-semibold mb-2 text-black">Position</h3>

            <label className="block text-sm font-semibold mb-1 text-black">Applying for</label>
            <select name="positionType" value={formData.positionType} onChange={handleChange} className="border p-2 w-full mb-3 rounded">
              <option value="delivery">Delivery Role</option>
              <option value="other">Other Position</option>
            </select>

            {formData.positionType === "delivery" && (
              <>
                <label className="block text-sm font-semibold mb-1 text-black">Vehicle Type</label>
                <input name="vehicleType" onChange={handleChange} className="border p-2 w-full mb-3 rounded" />

                <label className="block text-sm font-semibold mb-1 text-black">Driver License</label>
                <input name="license" type="file" onChange={handleFile} className="border p-2 w-full mb-3 rounded" />

                <label className="block text-sm font-semibold mb-1 text-black">Vehicle Documents (Smart Card / Insurance / NOC)</label>
                <input name="vehicleDocs" type="file" multiple onChange={handleFile} className="border p-2 w-full mb-3 rounded" />
              </>
            )}

            {formData.positionType === "other" && (
              <>
                <label className="block text-sm font-semibold mb-1 text-black">Position Applied</label>
                <input name="applyPos" onChange={handleChange} className="border p-2 w-full mb-3 rounded" />

                <label className="block text-sm font-semibold mb-1 text-black">Strengths & Weakness</label>
                <textarea name="strengthWeakness" onChange={handleChange} className="border p-2 w-full mb-3 rounded" />

                <label className="block text-sm font-semibold mb-1 text-black">5 Year Goal</label>
                <textarea name="goal5" onChange={handleChange} className="border p-2 w-full mb-3 rounded" />

                <label className="block text-sm font-semibold mb-1 text-black">CV / Resume</label>
                <input name="cv" type="file" onChange={handleFile} className="border p-2 w-full mb-3 rounded" />
              </>
            )}

          </section>

          {/* ID Documents */}
          <section className="mb-6">
            <h3 className="font-semibold mb-2 text-black">ID & Verification Documents</h3>

            <label className="block text-sm font-semibold mb-1 text-black">Aadhar Card (Front & Back)</label>
            <input name="aadhar" type="file" multiple onChange={handleFile} className="border p-2 w-full mb-3 rounded" />

            <label className="block text-sm font-semibold mb-1 text-black">PAN Card</label>
            <input name="pan" type="file" onChange={handleFile} className="border p-2 w-full mb-3 rounded" />
          </section>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded font-semibold ${loading ? "bg-gray-400" : "bg-black text-white hover:bg-gray-800"}`}
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>

      {/* SUCCESS MODAL */}
      {successModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-lg max-w-sm w-full text-center text-black">
            <h3 className="text-xl font-bold mb-2">🎉 Successfully Submitted!</h3>
            <p className="text-sm mb-2">Your form ID is:</p>
            <p className="font-mono text-lg mb-4">{formID}</p>

            <button
              onClick={() => setSuccessModal(false)}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
