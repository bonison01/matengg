/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, ChangeEvent, FormEvent, useCallback, useEffect } from "react";
import QRCode from "react-qr-code";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Upload, CheckCircle2, XCircle, Trash2, ArrowRight, AlertTriangle } from "lucide-react";

const REGISTRATION_FEE = 250;
const API_BASE_URL = "https://api.matendelivery.com";
// const API_BASE_URL = "http://127.0.0.1:8000";

interface FormData {
  candidate_name: string;
  father_name: string;
  mother_name: string;
  dob: string;
  age: number;
  gender: string;
  nationality: string;
  category: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
  mobile: string;
  alternate_mobile: string;
  email: string;
  highest_qualification: string;
  passing_year: number;
  school_name: string;
}

type DialogState =
  | { type: "success"; registrationNo: string }
  | { type: "error"; message: string }
  | { type: "cancel" }
  | null;

// ── Validation helpers ──────────────────────────────────────────────────────
const isValidPhone = (v: string) => /^\d{10}$/.test(v);
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function PreeNeetRegistrationForm() {
  const [step, setStep] = useState<1 | 2>(1);
  // candidateId stored after step 1 API calls succeed
  const [candidateId, setCandidateId] = useState<number | null>(null);

  const [formData, setFormData] = useState<FormData>({
    candidate_name: "",
    father_name: "",
    mother_name: "",
    dob: "",
    age: 0,
    gender: "",
    nationality: "Indian",
    category: "",
    address: "",
    city: "",
    state: "",
    pin_code: "",
    mobile: "",
    alternate_mobile: "",
    email: "",
    highest_qualification: "",
    passing_year: new Date().getFullYear(),
    school_name: "",
  });

  const [loading, setLoading] = useState(false);
  const [dialogState, setDialogState] = useState<DialogState>(null);

  // ── Phone validation ────────────────────────────────────────────────────
  const [phoneTouched, setPhoneTouched] = useState(false);
  const phoneValid = isValidPhone(formData.mobile);

  // ── Email validation with debounce ──────────────────────────────────────
  const [emailValidated, setEmailValidated] = useState<boolean | null>(null);
  const emailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEmailChange = useCallback((val: string) => {
    setFormData((prev) => ({ ...prev, email: val }));
    if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
    emailDebounceRef.current = setTimeout(() => {
      setEmailValidated(val.length > 0 ? isValidEmail(val) : null);
    }, 500);
  }, []);

  useEffect(() => () => { if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current); }, []);

  // ── File states ─────────────────────────────────────────────────────────
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const passportInputRef = useRef<HTMLInputElement>(null);

  const [signature, setSignature] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<string | null>(null);
  const paymentInputRef = useRef<HTMLInputElement>(null);

  const upiLink = `upi://pay?pa=khumbongmayumbonison@icici&pn=BookFair2026&am=${REGISTRATION_FEE}&cu=INR`;

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "email") {
      handleEmailChange(value);
      return;
    }
    if (name === "mobile" || name === "alternate_mobile") {
      // Only digits, max 10
      const digits = value.replace(/\D/g, "").slice(0, 10);
      if (name === "mobile") setPhoneTouched(true);
      setFormData((prev) => ({ ...prev, [name]: digits }));
      return;
    }
    if (name === "dob") {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      setFormData((prev) => ({ ...prev, dob: value, age }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof FormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: Number(value) || 0 }));
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void,
    previewSetter: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("File size must be under 10MB"); return; }
    setter(file);
    previewSetter(URL.createObjectURL(file));
  };

  const clearFile = (
    setter: (file: File | null) => void,
    previewSetter: (url: string | null) => void,
    inputRef: React.RefObject<HTMLInputElement | null>
  ) => {
    setter(null);
    previewSetter(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const resetForm = () => {
    setFormData({
      candidate_name: "", father_name: "", mother_name: "", dob: "", age: 0,
      gender: "", nationality: "Indian", category: "", address: "", city: "",
      state: "", pin_code: "", mobile: "", alternate_mobile: "", email: "",
      highest_qualification: "", passing_year: new Date().getFullYear(), school_name: "",
    });
    setPhoneTouched(false);
    setEmailValidated(null);
    clearFile(setPassportPhoto, setPassportPreview, passportInputRef);
    clearFile(setSignature, setSignaturePreview, signatureInputRef);
    clearFile(setPaymentScreenshot, setPaymentPreview, paymentInputRef);
    setCandidateId(null);
    setStep(1);
  };

  // ── Core upload helper ──────────────────────────────────────────────────
  const uploadDocument = async (
    candId: number,
    file: File,
    document_type: "passport_photo" | "candidate_signature" | "payment_screenshot"
  ) => {
    const fd = new FormData();
    fd.append("document_type", document_type);
    fd.append("file", file);
    const res = await fetch(`${API_BASE_URL}/candidates/${candId}/documents`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) throw new Error(`Failed to upload ${document_type}`);
    return res.json();
  };

  // ── Step 1 submit: validate → create candidate → upload photo + signature ──
  const handleProceedToPayment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!passportPhoto || !signature) {
      setDialogState({ type: "error", message: "Please upload both passport photo and signature before proceeding." });
      return;
    }

    setLoading(true);

    try {
      // STEP 1: Validate — check for existing candidate
      const validateRes = await fetch(`${API_BASE_URL}/candidates/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: formData.email, mobile: formData.mobile }),
      });

      if (!validateRes.ok) throw new Error("Validation check failed. Please try again.");

      const validateData = await validateRes.json();

      let candId: number;

      if (validateData.exists && validateData.candidate) {
        // Candidate already exists — reuse
        candId = validateData.candidate.id;
      } else {
        // STEP 2: Create new candidate
        const candidateRes = await fetch(`${API_BASE_URL}/candidates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!candidateRes.ok) {
          const errorData = await candidateRes.json();
          let message = errorData.detail?.[0]?.msg || "Registration failed.";
          if (message.includes("String should have at least")) {
            message = "Please enter valid data in all fields.";
          }
          throw new Error(message);
        }

        const created = await candidateRes.json();
        candId = created.id;
      }

      // STEP 3: Upload passport photo and signature
      await Promise.all([
        uploadDocument(candId, passportPhoto, "passport_photo"),
        uploadDocument(candId, signature, "candidate_signature"),
      ]);

      setCandidateId(candId);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setStep(2);
    } catch (err: any) {
      setDialogState({ type: "error", message: err.message || "Registration failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 submit: upload payment screenshot only ───────────────────────
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!paymentScreenshot) {
      setDialogState({ type: "error", message: "Please upload your payment screenshot before submitting." });
      return;
    }

    if (!candidateId) {
      setDialogState({ type: "error", message: "Candidate ID missing. Please restart registration." });
      return;
    }

    setLoading(true);

    try {
      await uploadDocument(candidateId, paymentScreenshot, "payment_screenshot");

      const registrationNo = `BF-${String(candidateId).padStart(6, "0")}`;
      setDialogState({ type: "success", registrationNo });
      resetForm();
    } catch (err: any) {
      setDialogState({ type: "error", message: err.message || "Payment upload failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    const prev = dialogState;
    setDialogState(null);
    if (prev?.type === "cancel") {
      resetForm();
    } else if (prev?.type === "success") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ── Validation icon component ───────────────────────────────────────────
  const ValidationIcon = ({ valid, show }: { valid: boolean; show: boolean }) => (
    <AnimatePresence>
      {show && (
        <motion.span
          key={valid ? "ok" : "err"}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.2 }}
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        >
          {valid ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </motion.span>
      )}
    </AnimatePresence>
  );

  // ── Step indicator ──────────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-3 py-4">
      {[1, 2].map((s) => (
        <div key={s} className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-9 h-9 rounded-full font-semibold text-sm transition-all duration-300 ${step === s
              ? "bg-gray-900 text-white shadow-md"
              : s < step
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-500"
            }`}>
            {s < step ? <CheckCircle2 className="h-5 w-5" /> : s}
          </div>
          <span className={`text-sm font-medium hidden sm:block transition-colors duration-300 ${step === s ? "text-gray-900" : s < step ? "text-green-600" : "text-gray-400"
            }`}>
            {s === 1 ? "Registration Details" : "Payment"}
          </span>
          {s < 2 && <div className={`w-10 h-0.5 transition-colors duration-300 ${step > s ? "bg-green-400" : "bg-gray-200"}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 border-gray-800 shadow-2xl bg-white overflow-hidden py-0">
          <CardHeader className="text-center border-b border-gray-200 py-6 bg-gradient-to-r from-gray-100 to-gray-50">
            <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              PRE-NEET REGISTRATION FORM – 2026
            </CardTitle>
            <p className="text-muted-foreground mt-3 text-lg">
              Organized by Justmateng Service Pvt. Ltd | Registration Fee: ₹{REGISTRATION_FEE}
            </p>
            <StepIndicator />
          </CardHeader>

          <CardContent className="pt-10 pb-12 px-6 md:px-10">
            <AnimatePresence mode="wait">

              {/* ════════════════════ STEP 1 ════════════════════ */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <form onSubmit={handleProceedToPayment} className="space-y-10">

                    {/* ── Personal Details ── */}
                    <div className="space-y-6">
                      <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Personal Details</h2>

                      <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium block mb-1.5 text-gray-500">Candidate Name *</label>
                          <Input name="candidate_name" value={formData.candidate_name} onChange={handleInputChange} required className="border-gray-300 !text-black" />
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-1.5 text-gray-500">Father's Name *</label>
                          <Input name="father_name" value={formData.father_name} onChange={handleInputChange} required className="border-gray-300 !text-black" />
                        </div>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium block mb-1.5 text-gray-500">Mother's Name *</label>
                          <Input name="mother_name" value={formData.mother_name} onChange={handleInputChange} required className="border-gray-300 !text-black" />
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-1.5 text-gray-500">Nationality *</label>
                          <Input name="nationality" value={formData.nationality} onChange={handleInputChange} required className="border-gray-300 !text-black" />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-4">
                        <div>
                          <label className="text-sm font-medium block mb-1.5 text-gray-500">Date of Birth *</label>
                          <Input type="date" name="dob" value={formData.dob} onChange={handleInputChange} required className="border-gray-300 !text-black" />
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-1.5 text-gray-500">Age</label>
                          <Input type="number" value={formData.age} readOnly className="bg-gray-100 border-gray-300 !text-black" />
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-1.5 text-gray-500">Gender *</label>
                          <Select value={formData.gender} onValueChange={handleSelectChange("gender")} required>
                            <SelectTrigger className="border-gray-300 !bg-white !text-black w-full">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent className="!text-black !bg-white">
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-1.5 text-gray-500">Category *</label>
                          <Select value={formData.category} onValueChange={handleSelectChange("category")} required>
                            <SelectTrigger className="border-gray-300 !bg-white !text-black w-full">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent className="!text-black !bg-white">
                              <SelectItem value="General">General</SelectItem>
                              <SelectItem value="OBC">OBC</SelectItem>
                              <SelectItem value="SC">SC</SelectItem>
                              <SelectItem value="ST">ST</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-8" />

                    {/* ── Contact & Address ── */}
                    <div className="space-y-6">
                      <h2 className="text-2xl font-semibold text-gray-500 border-b pb-2">Contact & Address</h2>

                      <div className="grid gap-6 sm:grid-cols-2">
                        {/* Mobile */}
                        <div>
                          <label className="text-sm font-medium block mb-1.5 text-gray-500">Mobile Number *</label>
                          <div className="relative">
                            <Input
                              name="mobile"
                              inputMode="numeric"
                              value={formData.mobile}
                              onChange={handleInputChange}
                              required
                              maxLength={10}
                              className={`border-gray-300 !text-black pr-10 transition-colors ${phoneTouched && !phoneValid
                                  ? "border-red-500 focus-visible:ring-red-500"
                                  : phoneTouched && phoneValid
                                    ? "border-green-500 focus-visible:ring-green-500"
                                    : ""
                                }`}
                            />
                            <ValidationIcon valid={phoneValid} show={phoneTouched} />
                          </div>
                          <AnimatePresence>
                            {phoneTouched && !phoneValid && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-xs text-red-500 mt-1 overflow-hidden"
                              >
                                Mobile must be exactly 10 digits.
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Alternate mobile */}
                        <div>
                          <label className="text-sm font-medium block mb-1.5 text-gray-500">Alternate Mobile Number</label>
                          <Input
                            name="alternate_mobile"
                            inputMode="numeric"
                            value={formData.alternate_mobile}
                            onChange={handleInputChange}
                            maxLength={10}
                            className="border-gray-300 !text-black"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="text-sm font-medium block mb-1.5 text-gray-500">Email Address *</label>
                        <div className="relative">
                          <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className={`border-gray-300 !text-black pr-10 transition-colors ${emailValidated === false
                                ? "border-red-500 focus-visible:ring-red-500"
                                : emailValidated === true
                                  ? "border-green-500 focus-visible:ring-green-500"
                                  : ""
                              }`}
                          />
                          <ValidationIcon valid={emailValidated === true} show={emailValidated !== null} />
                        </div>
                        <AnimatePresence>
                          {emailValidated === false && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-xs text-red-500 mt-1 overflow-hidden"
                            >
                              Please enter a valid email address.
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <div>
                        <label className="text-sm font-medium block mb-1.5 text-gray-500">Full Address *</label>
                        <Textarea name="address" value={formData.address} onChange={handleInputChange} rows={3} required className="border-gray-300 !text-black !bg-white" />
                      </div>

                      <div className="grid gap-6 sm:grid-cols-3">
                        <div>
                          <label className="text-sm font-medium block mb-1.5 text-gray-500">City *</label>
                          <Input name="city" value={formData.city} onChange={handleInputChange} required className="border-gray-300 !text-black" />
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-1.5 text-gray-500">State *</label>
                          <Input name="state" value={formData.state} onChange={handleInputChange} required className="border-gray-300 !text-black" />
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-1.5 text-gray-500">PIN Code *</label>
                          <Input name="pin_code" value={formData.pin_code} onChange={handleInputChange} maxLength={6} required className="border-gray-300 !text-black" />
                        </div>
                      </div>
                    </div>

                    <Separator className="my-8" />

                    {/* ── Educational Details ── */}
                    <div className="space-y-6">
                      <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Educational Details</h2>

                      <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium block mb-1.5 text-gray-500">Highest Qualification *</label>
                          <Input name="highest_qualification" value={formData.highest_qualification} onChange={handleInputChange} required className="border-gray-300 !text-black" />
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-1.5 text-gray-500">Year of Passing *</label>
                          <Input type="number" name="passing_year" value={formData.passing_year} onChange={handleNumberChange} required className="border-gray-300 !text-black" />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium block mb-1.5 text-gray-500">School / College Name *</label>
                        <Textarea name="school_name" value={formData.school_name} onChange={handleInputChange} rows={2} required className="border-gray-300 !bg-white !text-black" />
                      </div>
                    </div>

                    <Separator className="my-8" />

                    {/* ── Documents ── */}
                    <div className="space-y-8">
                      <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Documents & Payment</h2>

                      <div className="grid gap-10 md:grid-cols-2">
                        {/* Passport Photo */}
                        <div className="relative">
                          <label htmlFor="passport-photo-input" className={`block border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 min-h-[220px] flex items-center justify-center cursor-pointer ${passportPreview ? "border-primary/50 bg-white shadow-sm hover:shadow-md" : "border-gray-400 hover:border-primary/70 bg-gray-50/50"}`}>
                            {passportPreview ? (
                              <img src={passportPreview} alt="Passport preview" className="max-h-52 mx-auto object-cover rounded-lg shadow-md" />
                            ) : (
                              <div className="text-muted-foreground">
                                <Upload className="mx-auto h-14 w-14 mb-4 opacity-70" />
                                <p className="text-lg">Click to select passport photo</p>
                                <p className="text-sm mt-1">(max 10MB, jpg/png)</p>
                              </div>
                            )}
                          </label>
                          <Input ref={passportInputRef} id="passport-photo-input" type="file" accept="image/jpeg,image/png" onChange={(e) => handleFileChange(e, setPassportPhoto, setPassportPreview)} className="hidden" />
                          {passportPreview && (
                            <button type="button" onClick={() => clearFile(setPassportPhoto, setPassportPreview, passportInputRef)} className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-md transition-all hover:scale-110 active:scale-95">
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>

                        {/* Signature */}
                        <div className="relative">
                          <label htmlFor="signature-input" className={`block border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 min-h-[220px] flex items-center justify-center cursor-pointer ${signaturePreview ? "border-primary/50 bg-white shadow-sm hover:shadow-md" : "border-gray-400 hover:border-primary/70 bg-gray-50/50"}`}>
                            {signaturePreview ? (
                              <img src={signaturePreview} alt="Signature preview" className="max-h-40 mx-auto object-contain rounded shadow-md" />
                            ) : (
                              <div className="text-muted-foreground">
                                <Upload className="mx-auto h-14 w-14 mb-4 opacity-70" />
                                <p className="text-lg">Click to select signature</p>
                                <p className="text-sm mt-1">(max 10MB, jpg/png)</p>
                              </div>
                            )}
                          </label>
                          <Input ref={signatureInputRef} id="signature-input" type="file" accept="image/jpeg,image/png" onChange={(e) => handleFileChange(e, setSignature, setSignaturePreview)} className="hidden" />
                          {signaturePreview && (
                            <button type="button" onClick={() => clearFile(setSignature, setSignaturePreview, signatureInputRef)} className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-md transition-all hover:scale-110 active:scale-95">
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full text-lg text-white py-7 mt-8 bg-gradient-to-t from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 shadow-lg transition-all duration-300"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Proceed to Payment
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* ════════════════════ STEP 2 ════════════════════ */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="space-y-8">
                      <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
                        Payment (₹{REGISTRATION_FEE})
                      </h2>

                      <div className="border rounded-xl p-8 bg-gray-50/70 shadow-inner">
                        <div className="grid gap-10 md:grid-cols-2 items-center">
                          {/* QR Code */}
                          <div className="flex flex-col items-center">
                            <p className="text-base font-medium mb-5 text-gray-500">Scan to Pay via UPI</p>
                            <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-200">
                              <QRCode value={upiLink} size={200} />
                            </div>
                          </div>

                          {/* Payment Screenshot */}
                          <div className="relative">
                            <label htmlFor="payment-screenshot-input" className={`block border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 min-h-[180px] flex items-center justify-center cursor-pointer ${paymentPreview ? "border-primary/50 bg-white shadow-sm hover:shadow-md" : "border-gray-400 hover:border-primary/70 bg-gray-50/50"}`}>
                              {paymentPreview ? (
                                <img src={paymentPreview} alt="Payment proof" className="max-h-40 mx-auto object-contain rounded shadow-md" />
                              ) : (
                                <div className="text-muted-foreground">
                                  <Upload className="mx-auto h-12 w-12 mb-4 opacity-70" />
                                  <p>Click to upload payment screenshot</p>
                                  <p className="text-sm mt-1">(max 10MB, jpg/png/pdf)</p>
                                </div>
                              )}
                            </label>
                            <Input ref={paymentInputRef} id="payment-screenshot-input" type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => handleFileChange(e, setPaymentScreenshot, setPaymentPreview)} className="hidden" />
                            {paymentPreview && (
                              <button type="button" onClick={() => clearFile(setPaymentScreenshot, setPaymentPreview, paymentInputRef)} className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-md transition-all hover:scale-110 active:scale-95">
                                <Trash2 className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row-reverse justify-between gap-4 mt-8">
                      <Button
                        type="submit"
                        size="lg"
                        className=" text-lg text-white py-7 bg-gradient-to-t from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 shadow-lg transition-all duration-300"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Complete Registration"
                        )}
                      </Button>

                      <Button
                        type="button"
                        size="lg"
                        variant="destructive"
                        className="text-lg py-7 border-red-300 bg-red-400 hover:bg-red-500 hover:border-red-400 transition-all duration-300"
                        onClick={() => setDialogState({ type: "cancel" })}
                        disabled={loading}
                      >
                        Cancel Registration
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      {/* ── Dialog ── */}
      <AnimatePresence>
        {dialogState && (
          <Dialog open={!!dialogState} onOpenChange={handleDialogClose}>
            <DialogContent className="sm:max-w-md bg-white">
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <DialogHeader>
                  {dialogState.type === "success" && (
                    <>
                      <div className="flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-16 w-16 text-green-600" />
                      </div>
                      <DialogTitle className="text-2xl text-center text-green-700">
                        Registration Successful!
                      </DialogTitle>
                      <DialogDescription className="text-center text-lg mt-3">
                        Your registration number is
                        <br />
                        <span className="font-bold text-xl text-green-800 mt-1 block">
                          {dialogState.registrationNo}
                        </span>
                      </DialogDescription>
                    </>
                  )}

                  {dialogState.type === "error" && (
                    <>
                      <div className="flex items-center justify-center mb-4">
                        <XCircle className="h-16 w-16 text-red-600" />
                      </div>
                      <DialogTitle className="text-2xl text-center text-red-700">
                        Submission Failed
                      </DialogTitle>
                      <DialogDescription className="text-center text-base mt-3 text-gray-500">
                        {dialogState.message}
                      </DialogDescription>
                      <DialogDescription className="text-center text-base mt-3 text-gray-500">
                        Sorry for the inconvenience. Please use the link below:
                        <br />
                        <a
                          href="https://docs.google.com/forms/d/e/1FAIpQLSeU09M40bdGZkNUuN-ANp8ROSq0iefzozBMivf2j68_uHz-Rg/viewform?usp=dialog"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          Open Form
                        </a>
                      </DialogDescription>
                    </>
                  )}

                  {dialogState.type === "cancel" && (
                    <>
                      <div className="flex items-center justify-center mb-4">
                        <AlertTriangle className="h-16 w-16 text-amber-500" />
                      </div>
                      <DialogTitle className="text-2xl text-center text-amber-700">
                        Cancel Registration?
                      </DialogTitle>
                      <DialogDescription className="text-center text-base mt-3 text-gray-500">
                        Are you sure you want to cancel? All your entered data will be lost and you will need to start over.
                      </DialogDescription>
                    </>
                  )}
                </DialogHeader>

                <DialogFooter className="sm:justify-center mt-6 gap-3">
                  {dialogState.type === "cancel" ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setDialogState(null)}
                        className="border-gray-300 text-gray-700 bg-white"
                      >
                        Go Back
                      </Button>
                      <Button
                        onClick={handleDialogClose}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Yes, Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleDialogClose}
                      className={
                        dialogState.type === "success"
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-red-600 hover:bg-red-700 text-white"
                      }
                    >
                      {dialogState.type === "success" ? "Continue" : "Try Again"}
                    </Button>
                  )}
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}