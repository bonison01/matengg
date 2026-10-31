// app/(main)/admin/cargo/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  Tag,
  Plus,
  Users,
  ArrowUpDown,
  Check,
  Pencil,
  Package,
  Truck,
  CheckCircle2,
  Wallet,
  IndianRupee,
  Copy,
  Download,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
// NOTE: adjust this import to wherever InvoiceTemplate actually lives in your project
// (e.g. the component your `/admin/cargo/invoice/[id]` route already renders).
import InvoiceTemplate from "./InvoiceTemplate";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Booking {
  id: string;
  tracking_id: string;
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  sender_city_state: string;
  sender_pincode: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  receiver_city_state: string;
  receiver_pincode: string;
  product_name: string;
  weight_estimate: number;
  delivery_mode: string;
  pickup_required: boolean | null;
  delivery_required: boolean | null;
  notes: string;
  status: "Pending" | "Out for Delivery" | "Delivered";
  third_party_tracking: string;
  estimate_charge: number;
  handling_charge: number | null;
  docket_charge: number | null;
  pickup_charge: number | null;
  packaging_charge: number | null;
  extra_mile_delivery: number | null;
  final_charge: number | null;
  tax_percent: number | null;
  payment_status: "paid" | "unpaid" | "partial";
  amount_paid: number;
  created_at: string;
}

type SortKey = "created_at" | "estimate_charge" | "weight_estimate";
type PaymentStatus = "paid" | "unpaid" | "partial";

const STATUS_TRIGGER_STYLES: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700",
  "Out for Delivery": "bg-blue-50 text-blue-700",
  Delivered: "bg-emerald-50 text-emerald-700",
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  unpaid: "bg-red-50 text-red-700",
  partial: "bg-amber-50 text-amber-700",
};

const STATUS_OPTIONS: Booking["status"][] = ["Pending", "Out for Delivery", "Delivered"];

const PAGE_SIZE_OPTIONS = [20, 30, 40, 50];

// The company acts as the "care of" / return-address on every shipping
// label, regardless of the booking. Edit these three lines if the
// registered office or contact number ever changes.
const COMPANY_CARE_OF = {
  name: "Justmateng Service Pvt Ltd",
  address: "Sagolband Sayang Imphal - 795004",
  phone: "9774795906",
};

// ---------------------------------------------------------------------------
// Label size presets
// A4 = 210mm x 297mm. Each preset splits it into an equal grid so that
// cols * widthMm === 210 and rows * heightMm === 297 — the labels always
// tile exactly across one A4 sheet with zero waste.
// Font size and padding scale down as the label gets smaller so a 1/6-page
// label isn't crammed and a whole-page label isn't tiny.
// ---------------------------------------------------------------------------

type LabelSizeConfig = {
  id: string;
  label: string;
  perPage: number;
  cols: number;
  rows: number;
  widthMm: number;
  heightMm: number;
  fontPt: number;
  paddingMm: number;
};

const LABEL_SIZE_OPTIONS: LabelSizeConfig[] = [
  { id: "full", label: "Whole A4 (1/1)", perPage: 1, cols: 1, rows: 1, widthMm: 210, heightMm: 297, fontPt: 26, paddingMm: 14 },
  { id: "half", label: "Half A4 (1/2)", perPage: 2, cols: 1, rows: 2, widthMm: 210, heightMm: 148.5, fontPt: 19, paddingMm: 9 },
  { id: "third", label: "One-third A4 (1/3)", perPage: 3, cols: 1, rows: 3, widthMm: 210, heightMm: 99, fontPt: 15, paddingMm: 6 },
  { id: "quarter", label: "Quarter A4 (1/4)", perPage: 4, cols: 2, rows: 2, widthMm: 105, heightMm: 148.5, fontPt: 11, paddingMm: 4 },
  { id: "sixth", label: "One-sixth A4 (1/6)", perPage: 6, cols: 2, rows: 3, widthMm: 105, heightMm: 99, fontPt: 9, paddingMm: 3 },
];

const DEFAULT_LABEL_SIZE_ID = "quarter";

function modeLabel(mode: string) {
  if (mode === "Indian Post" || mode === "standard") return "Indian Post";
  if (mode === "Express Cargo" || mode === "express") return "Express";
  if (mode === "Normal Cargo" || mode === "normal") return "Normal";
  return mode;
}

// Maps legacy stored delivery modes onto the options the edit dropdown
// offers, so older rows don't show a blank selection.
function normalizeEditDeliveryMode(mode: string | null | undefined): string {
  if (mode === "standard") return "Indian Post";
  if (mode === "express") return "Express Cargo";
  if (mode === "normal") return "Normal Cargo";
  return mode ?? "";
}

// Final charge (total): use the explicit final_charge if set, otherwise sum
// every individual charge line — mirrors the invoice's total calculation.
function computeFinalCharge(b: Booking): number {
  if (b.final_charge != null) return b.final_charge;
  const parts: number[] = [
    b.estimate_charge ?? 0,
    b.handling_charge ?? 0,
    b.docket_charge ?? 0,
    b.pickup_charge ?? 0,
    b.packaging_charge ?? 0,
    b.extra_mile_delivery ?? 0,
  ];
  return parts.reduce((sum: number, v: number) => sum + v, 0);
}

async function copyToClipboard(text: string, label = "Value") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Could not copy");
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ---------------------------------------------------------------------------
// Portal — renders modals straight into document.body so they always sit
// above the site's global nav, regardless of any `transform`/`filter`
// ancestor in the layout that would otherwise trap `position: fixed`.
// ---------------------------------------------------------------------------

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

// ---------------------------------------------------------------------------
// Field helper
// ---------------------------------------------------------------------------

const Field = ({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={`space-y-1.5 ${className ?? ""}`}>
    <Label className="text-xs font-medium text-neutral-500">
      {label}
      {required && <span className="ml-0.5 text-emerald-600">*</span>}
    </Label>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Edit Modal
// ---------------------------------------------------------------------------

type EditForm = {
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  sender_city_state: string;
  sender_pincode: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  receiver_city_state: string;
  receiver_pincode: string;
  product_name: string;
  weight_estimate: string;
  delivery_mode: string;
  pickup_required: boolean;
  delivery_required: boolean;
  notes: string;
  status: Booking["status"];
  third_party_tracking: string;
  estimate_charge: string;
  handling_charge: string;
  docket_charge: string;
  pickup_charge: string;
  packaging_charge: string;
  extra_mile_delivery: string;
  final_charge: string;
  tax_percent: string;
  payment_status: PaymentStatus;
  amount_paid: string;
};

function bookingToEditForm(b: Booking): EditForm {
  return {
    sender_name: b.sender_name ?? "",
    sender_phone: b.sender_phone ?? "",
    sender_address: b.sender_address ?? "",
    sender_city_state: b.sender_city_state ?? "",
    sender_pincode: b.sender_pincode ?? "",
    receiver_name: b.receiver_name ?? "",
    receiver_phone: b.receiver_phone ?? "",
    receiver_address: b.receiver_address ?? "",
    receiver_city_state: b.receiver_city_state ?? "",
    receiver_pincode: b.receiver_pincode ?? "",
    product_name: b.product_name ?? "",
    weight_estimate: b.weight_estimate != null ? String(b.weight_estimate) : "",
    delivery_mode: normalizeEditDeliveryMode(b.delivery_mode),
    pickup_required: b.pickup_required ?? false,
    delivery_required: b.delivery_required ?? false,
    notes: b.notes ?? "",
    status: b.status,
    third_party_tracking: b.third_party_tracking ?? "",
    estimate_charge: b.estimate_charge != null ? String(b.estimate_charge) : "",
    handling_charge: b.handling_charge != null ? String(b.handling_charge) : "",
    docket_charge: b.docket_charge != null ? String(b.docket_charge) : "",
    pickup_charge: b.pickup_charge != null ? String(b.pickup_charge) : "",
    packaging_charge: b.packaging_charge != null ? String(b.packaging_charge) : "",
    extra_mile_delivery: b.extra_mile_delivery != null ? String(b.extra_mile_delivery) : "",
    final_charge: b.final_charge != null ? String(b.final_charge) : "",
    tax_percent: b.tax_percent != null ? String(b.tax_percent) : "",
    payment_status: b.payment_status,
    amount_paid: b.amount_paid > 0 ? String(b.amount_paid) : "",
  };
}

function EditModal({
  booking,
  onClose,
  onSaved,
}: {
  booking: Booking;
  onClose: () => void;
  onSaved: (updated: Booking) => void;
}) {
  const [form, setForm] = useState<EditForm>(() => bookingToEditForm(booking));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof EditForm, string>>>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  const upd = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const totalCharges = [
    form.estimate_charge,
    form.handling_charge,
    form.docket_charge,
    form.pickup_charge,
    form.packaging_charge,
    form.extra_mile_delivery,
  ].reduce((s, v) => s + (parseFloat(v) || 0), 0);

  const taxPercentNum = parseFloat(form.tax_percent) || 0;
  const taxAmount = totalCharges * (taxPercentNum / 100);

  const validate = () => {
    const next: Partial<Record<keyof EditForm, string>> = {};
    if (!form.sender_name.trim()) next.sender_name = "Required";
    if (!/^\d{10}$/.test(form.sender_phone)) next.sender_phone = "10 digit number";
    if (!form.sender_address.trim()) next.sender_address = "Required";
    if (!form.receiver_name.trim()) next.receiver_name = "Required";
    if (!/^\d{10}$/.test(form.receiver_phone)) next.receiver_phone = "10 digit number";
    if (!form.receiver_address.trim()) next.receiver_address = "Required";
    if (!form.product_name.trim()) next.product_name = "Required";
    if (!form.weight_estimate || parseFloat(form.weight_estimate) <= 0)
      next.weight_estimate = "Enter a weight";
    if (!form.delivery_mode) next.delivery_mode = "Choose a mode";
    if (!form.estimate_charge || parseFloat(form.estimate_charge) <= 0)
      next.estimate_charge = "Enter an estimate";
    if (form.tax_percent) {
      const t = parseFloat(form.tax_percent);
      if (isNaN(t) || t < 0 || t > 100) next.tax_percent = "0–100 only";
    }
    if (
      form.payment_status === "partial" &&
      (!form.amount_paid || parseFloat(form.amount_paid) <= 0)
    ) {
      next.amount_paid = "Enter amount paid";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) {
      toast.error("Fix the highlighted fields before saving.");
      return;
    }
    setSaving(true);
    try {
      const amountPaid =
        form.payment_status === "paid"
          ? totalCharges
          : form.payment_status === "partial"
          ? parseFloat(form.amount_paid) || 0
          : 0;

      const payload = {
        sender_name: form.sender_name,
        sender_phone: form.sender_phone,
        sender_address: form.sender_address,
        sender_city_state: form.sender_city_state,
        sender_pincode: form.sender_pincode,
        receiver_name: form.receiver_name,
        receiver_phone: form.receiver_phone,
        receiver_address: form.receiver_address,
        receiver_city_state: form.receiver_city_state,
        receiver_pincode: form.receiver_pincode,
        product_name: form.product_name,
        weight_estimate: parseFloat(form.weight_estimate),
        delivery_mode: form.delivery_mode,
        pickup_required: form.pickup_required,
        delivery_required: form.delivery_required,
        notes: form.notes,
        status: form.status,
        third_party_tracking: form.third_party_tracking,
        estimate_charge: parseFloat(form.estimate_charge),
        handling_charge: form.handling_charge ? parseFloat(form.handling_charge) : null,
        docket_charge: form.docket_charge ? parseFloat(form.docket_charge) : null,
        pickup_charge: form.pickup_charge ? parseFloat(form.pickup_charge) : null,
        packaging_charge: form.packaging_charge ? parseFloat(form.packaging_charge) : null,
        extra_mile_delivery: form.extra_mile_delivery ? parseFloat(form.extra_mile_delivery) : null,
        final_charge: form.final_charge ? parseFloat(form.final_charge) : null,
        tax_percent: form.tax_percent ? parseFloat(form.tax_percent) : null,
        payment_status: form.payment_status,
        amount_paid: amountPaid,
      };

      const res = await fetch(`/api/admin/cargo/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Could not update booking");
      toast.success("Booking updated");
      onSaved({ ...booking, ...json.data });
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Could not update booking");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "bg-white text-neutral-900 placeholder:text-neutral-400 border-neutral-300 text-sm";

  return (
    <Portal>
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="fixed inset-0 z-[999999] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8"
      >
      <div className="w-full max-w-3xl rounded-xl border border-neutral-200 bg-white shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Edit booking</h2>
            <p className="font-mono text-xs text-emerald-700">{booking.tracking_id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">

          {/* Sender */}
          <div className="rounded-lg border border-neutral-200 border-t-2 border-t-emerald-500 p-4">
            <h3 className="mb-4 text-sm font-medium text-neutral-800">Sender</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Full name" required>
                <Input className={inputCls} value={form.sender_name}
                  onChange={(e) => upd("sender_name", e.target.value)} />
                {errors.sender_name && <p className="text-xs text-red-600">{errors.sender_name}</p>}
              </Field>
              <Field label="Phone" required>
                <Input className={inputCls} value={form.sender_phone} inputMode="numeric"
                  onChange={(e) => upd("sender_phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
                {errors.sender_phone && <p className="text-xs text-red-600">{errors.sender_phone}</p>}
              </Field>
              <Field label="Address" required className="sm:col-span-2">
                <Textarea className={inputCls} value={form.sender_address} rows={2}
                  onChange={(e) => upd("sender_address", e.target.value)} />
                {errors.sender_address && <p className="text-xs text-red-600">{errors.sender_address}</p>}
              </Field>
              <Field label="City / State">
                <Input className={inputCls} value={form.sender_city_state}
                  onChange={(e) => upd("sender_city_state", e.target.value)} placeholder="e.g. Imphal, Manipur" />
              </Field>
              <Field label="Pincode">
                <Input className={inputCls} value={form.sender_pincode} inputMode="numeric"
                  onChange={(e) => upd("sender_pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} />
              </Field>
            </div>
          </div>

          {/* Receiver */}
          <div className="rounded-lg border border-neutral-200 border-t-2 border-t-blue-500 p-4">
            <h3 className="mb-4 text-sm font-medium text-neutral-800">Receiver</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Full name" required>
                <Input className={inputCls} value={form.receiver_name}
                  onChange={(e) => upd("receiver_name", e.target.value)} />
                {errors.receiver_name && <p className="text-xs text-red-600">{errors.receiver_name}</p>}
              </Field>
              <Field label="Phone" required>
                <Input className={inputCls} value={form.receiver_phone} inputMode="numeric"
                  onChange={(e) => upd("receiver_phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
                {errors.receiver_phone && <p className="text-xs text-red-600">{errors.receiver_phone}</p>}
              </Field>
              <Field label="Address" required className="sm:col-span-2">
                <Textarea className={inputCls} value={form.receiver_address} rows={2}
                  onChange={(e) => upd("receiver_address", e.target.value)} />
                {errors.receiver_address && <p className="text-xs text-red-600">{errors.receiver_address}</p>}
              </Field>
              <Field label="City / State">
                <Input className={inputCls} value={form.receiver_city_state}
                  onChange={(e) => upd("receiver_city_state", e.target.value)} placeholder="e.g. Delhi" />
              </Field>
              <Field label="Pincode">
                <Input className={inputCls} value={form.receiver_pincode} inputMode="numeric"
                  onChange={(e) => upd("receiver_pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} />
              </Field>
            </div>
          </div>

          {/* Package */}
          <div className="rounded-lg border border-neutral-200 p-4">
            <h3 className="mb-4 text-sm font-medium text-neutral-800">Package & delivery</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Product name" required>
                <Input className={inputCls} value={form.product_name}
                  onChange={(e) => upd("product_name", e.target.value)} />
                {errors.product_name && <p className="text-xs text-red-600">{errors.product_name}</p>}
              </Field>
              <Field label="Weight (kg)" required>
                <Input className={inputCls} value={form.weight_estimate} inputMode="decimal"
                  onChange={(e) => upd("weight_estimate", e.target.value.replace(/[^0-9.]/g, ""))} />
                {errors.weight_estimate && <p className="text-xs text-red-600">{errors.weight_estimate}</p>}
              </Field>
              <Field label="Delivery mode" required>
                <Select value={form.delivery_mode} onValueChange={(v) => upd("delivery_mode", v)}>
                  <SelectTrigger className="bg-white text-neutral-900 border-neutral-300 text-sm">
                    <SelectValue placeholder="Choose mode" />
                  </SelectTrigger>
                  {/* z-index must beat the modal overlay (z-[999999]) or the
                      options render underneath it and can't be clicked. */}
                  <SelectContent className="z-[9999999] bg-white text-neutral-900">
                    <SelectItem value="Indian Post">Indian Post</SelectItem>
                    <SelectItem value="Normal Cargo">Normal Cargo</SelectItem>
                    <SelectItem value="Express Cargo">Express Cargo</SelectItem>
                    <SelectItem value="Surface(By Road)">Surface(By Road)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.delivery_mode && <p className="text-xs text-red-600">{errors.delivery_mode}</p>}
              </Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => upd("status", v as Booking["status"])}>
                  <SelectTrigger className="bg-white text-neutral-900 border-neutral-300 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[9999999] bg-white text-neutral-900">
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-center gap-6 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-neutral-300 text-emerald-600"
                    checked={form.pickup_required} onChange={(e) => upd("pickup_required", e.target.checked)} />
                  Pickup required
                </label>
                <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-neutral-300 text-emerald-600"
                    checked={form.delivery_required} onChange={(e) => upd("delivery_required", e.target.checked)} />
                  Delivery required
                </label>
              </div>
              <Field label="Third-party tracking">
                <Input className={inputCls} value={form.third_party_tracking}
                  onChange={(e) => upd("third_party_tracking", e.target.value)} placeholder="AWB number" />
              </Field>
              <Field label="Notes" className="sm:col-span-2">
                <Textarea className={inputCls} value={form.notes} rows={2}
                  onChange={(e) => upd("notes", e.target.value)} placeholder="Fragile, handle with care…" />
              </Field>
            </div>
          </div>

          {/* Charges */}
          <div className="rounded-lg border border-neutral-200 p-4">
            <h3 className="mb-4 text-sm font-medium text-neutral-800">Charges</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {([
                ["Freight charge", "estimate_charge", true],
                ["Handling charge", "handling_charge", false],
                ["Docket charge", "docket_charge", false],
                ["Pickup charge", "pickup_charge", false],
                ["Packaging charge", "packaging_charge", false],
                ["Extra mile delivery", "extra_mile_delivery", false],
                ["Final charge (optional)", "final_charge", false],
                ["Tax % (optional)", "tax_percent", false],
              ] as [string, keyof EditForm, boolean][]).map(([label, key, req]) => (
                <Field key={key} label={label} required={req}>
                  <Input
                    className={inputCls}
                    value={form[key] as string}
                    inputMode="decimal"
                    onChange={(e) => upd(key, e.target.value.replace(/[^0-9.]/g, "") as never)}
                    placeholder={key === "tax_percent" ? "e.g. 18" : "0"}
                  />
                  {errors[key] && <p className="text-xs text-red-600">{errors[key]}</p>}
                </Field>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-md bg-emerald-50 px-4 py-2.5">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-700">Total</span>
              <span className="font-mono text-sm font-semibold text-emerald-800">₹{totalCharges.toFixed(2)}</span>
            </div>
            {taxPercentNum > 0 && (
              <div className="mt-2 flex items-center justify-between rounded-md bg-neutral-50 px-4 py-2 text-xs text-neutral-500">
                <span>Tax ({form.tax_percent}%) — shown on the invoice, not added to amount paid</span>
                <span className="font-mono">₹{taxAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="rounded-lg border border-neutral-200 p-4">
            <h3 className="mb-3 text-sm font-medium text-neutral-800">Payment</h3>
            <div className="flex flex-wrap gap-2">
              {(["paid", "unpaid", "partial"] as const).map((opt) => (
                <button key={opt} type="button" onClick={() => upd("payment_status", opt)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition ${
                    form.payment_status === opt
                      ? opt === "paid"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : opt === "unpaid"
                        ? "border-red-400 bg-red-50 text-red-700"
                        : "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                  }`}>
                  {opt === "paid" ? "✓ Paid" : opt === "unpaid" ? "✗ Unpaid" : "~ Partial"}
                </button>
              ))}
            </div>
            {form.payment_status === "partial" && (
              <div className="mt-3 max-w-xs">
                <Field label="Amount paid" required>
                  <Input className={inputCls} value={form.amount_paid} inputMode="decimal"
                    onChange={(e) => upd("amount_paid", e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="e.g. 500" />
                  {errors.amount_paid && <p className="text-xs text-red-600">{errors.amount_paid}</p>}
                  {form.amount_paid && totalCharges > 0 && (
                    <p className="mt-0.5 text-xs text-neutral-400">
                      Due: ₹{Math.max(0, totalCharges - parseFloat(form.amount_paid)).toFixed(2)}
                    </p>
                  )}
                </Field>
              </div>
            )}
            {form.payment_status === "paid" && (
              <p className="mt-2 text-xs text-neutral-400">
                Will mark full ₹{totalCharges.toFixed(2)} as paid.
              </p>
            )}
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-3 border-t border-neutral-100 px-5 py-4">
          <Button variant="outline" onClick={onClose} disabled={saving}
            className="border-neutral-200 text-neutral-600">
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}
            className="bg-emerald-600 text-white hover:bg-emerald-700">
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
            ) : (
              <><Check className="mr-2 h-4 w-4" />Save changes</>
            )}
          </Button>
        </div>
      </div>
    </div>
    </Portal>
  );
}

// ---------------------------------------------------------------------------
// Inline payment editor (popover-style)
// ---------------------------------------------------------------------------

function PaymentEditor({
  booking,
  onUpdated,
}: {
  booking: Booking;
  onUpdated: (updated: Partial<Booking>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>(booking.payment_status);
  const [amountPaid, setAmountPaid] = useState(
    booking.amount_paid > 0 ? String(booking.amount_paid) : ""
  );
  const ref = useRef<HTMLDivElement>(null);
  const charge = computeFinalCharge(booking);

  const openEditor = () => {
    setStatus(booking.payment_status);
    setAmountPaid(booking.amount_paid > 0 ? String(booking.amount_paid) : "");
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { payment_status: status };
      if (status === "partial") {
        const amt = parseFloat(amountPaid);
        if (!amt || amt <= 0) {
          toast.error("Enter a valid amount paid");
          setSaving(false);
          return;
        }
        body.amount_paid = amt;
      }

      const res = await fetch(`/api/admin/cargo/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Could not update payment");

      toast.success("Payment updated");
      onUpdated({ payment_status: json.data.payment_status, amount_paid: json.data.amount_paid });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Could not update payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={openEditor}
        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize transition hover:opacity-80 ${PAYMENT_STYLES[booking.payment_status]}`}>
        {booking.payment_status}
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-50 w-56 rounded-xl border border-neutral-200 bg-white p-3 shadow-xl">
          <p className="mb-2 text-xs font-medium text-neutral-500">Update payment</p>
          <div className="mb-2 flex gap-1.5">
            {(["paid", "unpaid", "partial"] as const).map((opt) => (
              <button key={opt} type="button" onClick={() => setStatus(opt)}
                className={`flex-1 rounded-lg border py-1 text-xs font-medium capitalize transition ${
                  status === opt
                    ? opt === "paid"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : opt === "unpaid"
                      ? "border-red-400 bg-red-50 text-red-700"
                      : "border-amber-400 bg-amber-50 text-amber-700"
                    : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                }`}>
                {opt}
              </button>
            ))}
          </div>
          {status === "partial" && (
            <div className="mb-2">
              <p className="mb-1 text-xs text-neutral-400">Amount paid (of ₹{Number(charge).toFixed(0)})</p>
              <Input autoFocus value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="e.g. 500" inputMode="decimal"
                className="h-7 bg-white text-xs text-neutral-900 border-neutral-300" />
              {amountPaid && parseFloat(amountPaid) > 0 && (
                <p className="mt-0.5 text-xs text-neutral-400">
                  Due: ₹{Math.max(0, charge - parseFloat(amountPaid)).toFixed(0)}
                </p>
              )}
            </div>
          )}
          {status === "paid" && (
            <p className="mb-2 text-xs text-neutral-400">Will mark full ₹{Number(charge).toFixed(0)} as paid.</p>
          )}
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="flex-1 h-7 text-xs border-neutral-200"
              onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" className="flex-1 h-7 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
              onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="mr-1 h-3 w-3" />Save</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invoice Modal
// ---------------------------------------------------------------------------

function InvoiceModal({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Prints just the invoice content. From the browser print dialog the user
  // can pick "Save as PDF" as the destination to download it.
  const handleDownload = () => {
    window.print();
  };

  return (
    <Portal>
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="fixed inset-0 z-[999999] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8 print:static print:bg-white print:p-0"
      >
        {/* Print styles: hide everything except the invoice content when printing */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #invoice-print-area,
            #invoice-print-area * {
              visibility: visible;
            }
            #invoice-print-area {
              position: absolute;
              inset: 0;
              width: 100%;
              max-height: none !important;
              overflow: visible !important;
            }
          }
        `}</style>

        <div className="w-full max-w-3xl rounded-xl border border-neutral-200 bg-white shadow-2xl print:w-auto print:max-w-none print:border-0 print:shadow-none">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 print:hidden">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Invoice</h2>
              <p className="font-mono text-xs text-emerald-700">{booking.tracking_id}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div id="invoice-print-area" className="max-h-[75vh] overflow-y-auto">
            <InvoiceTemplate booking={booking} />
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ---------------------------------------------------------------------------
// Label content — single label (To / From / C-o-Justmateng), sized and
// scaled to whichever preset the user picked.
// ---------------------------------------------------------------------------

function LabelBox({ booking, size }: { booking: Booking; size: LabelSizeConfig }) {
  const receiverLines = [
    booking.receiver_address,
    booking.receiver_city_state,
    booking.receiver_pincode,
  ].filter(Boolean);

  const senderLines = [
    booking.sender_address,
    booking.sender_city_state,
    booking.sender_pincode,
  ].filter(Boolean);

  return (
    <div
      className="flex flex-col border border-black text-black overflow-hidden box-border"
      style={{
        width: `${size.widthMm}mm`,
        height: `${size.heightMm}mm`,
        fontSize: `${size.fontPt}pt`,
      }}
    >
      <div className="grid flex-1 grid-cols-2">
        <div className="border-r border-black" style={{ padding: `${size.paddingMm}mm` }}>
          <p className="font-bold leading-snug">To,</p>
          <p className="font-bold leading-snug">{booking.receiver_name}</p>
          {receiverLines.map((line, i) => (
            <p key={i} className="font-bold leading-snug">{line}</p>
          ))}
          <p className="font-bold leading-snug">{booking.receiver_phone}</p>
        </div>
        <div style={{ padding: `${size.paddingMm}mm` }}>
          <p className="font-bold leading-snug">From,</p>
          <p className="font-bold leading-snug">{booking.sender_name}</p>
          {senderLines.map((line, i) => (
            <p key={i} className="font-bold leading-snug">{line}</p>
          ))}
          <p className="font-bold leading-snug">{booking.sender_phone}</p>
        </div>
      </div>
      <div className="border-t border-black text-center" style={{ padding: `${size.paddingMm}mm` }}>
        <p className="font-bold leading-snug">C/o</p>
        <p className="font-bold leading-snug">{COMPANY_CARE_OF.name}</p>
        <p className="font-bold leading-snug">{COMPANY_CARE_OF.address}</p>
        <p className="font-bold leading-snug">{COMPANY_CARE_OF.phone}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Label Modal — lets the user pick a label size, previews it live, then
// prints one or many labels tiled onto as few A4 sheets as possible.
// ---------------------------------------------------------------------------

function LabelModal({
  bookings,
  onClose,
}: {
  bookings: Booking[];
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [sizeId, setSizeId] = useState(DEFAULT_LABEL_SIZE_ID);

  const sizeConfig = useMemo(
    () => LABEL_SIZE_OPTIONS.find((s) => s.id === sizeId) ?? LABEL_SIZE_OPTIONS[3],
    [sizeId]
  );

  const pages = useMemo(() => chunk(bookings, sizeConfig.perPage), [bookings, sizeConfig]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Portal>
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="fixed inset-0 z-[999999] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8 print:static print:bg-white print:p-0"
      >
        {/* Print styles: hide everything except the labels. Each physical
            page holds exactly `sizeConfig.perPage` labels, tiled to fill A4. */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #label-print-area,
            #label-print-area * {
              visibility: visible;
            }
            #label-print-area {
              position: absolute;
              top: 0;
              left: 0;
            }
            @page {
              size: A4;
              margin: 0;
            }
          }
        `}</style>

        <div className="w-full max-w-3xl rounded-xl border border-neutral-200 bg-white shadow-2xl print:w-auto print:max-w-none print:border-0 print:shadow-none">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 print:hidden">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">
                {bookings.length === 1 ? "Shipping label" : `Shipping labels (${bookings.length})`}
              </h2>
              <p className="text-xs text-neutral-500">
                {bookings.length === 1
                  ? bookings[0].tracking_id
                  : `${pages.length} page${pages.length === 1 ? "" : "s"} — ${sizeConfig.perPage} per sheet`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Print
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Size picker — ask before printing */}
          <div className="border-b border-neutral-100 px-5 py-4 print:hidden">
            <p className="mb-2 text-xs font-medium text-neutral-500">Label size (per A4 sheet)</p>
            <div className="flex flex-wrap gap-2">
              {LABEL_SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSizeId(opt.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    sizeId === opt.id
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              {sizeConfig.perPage} label{sizeConfig.perPage === 1 ? "" : "s"} per sheet — text size adjusts automatically.
            </p>
          </div>

          <div className="max-h-[65vh] overflow-y-auto p-5 print:max-h-none print:overflow-visible print:p-0">
            <div id="label-print-area" className="flex flex-col items-center gap-6 print:gap-0">
              {pages.map((group, gi) => (
                <div
                  key={gi}
                  className={gi < pages.length - 1 ? "print:break-after-page" : ""}
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${sizeConfig.cols}, ${sizeConfig.widthMm}mm)`,
                    gridTemplateRows: `repeat(${sizeConfig.rows}, ${sizeConfig.heightMm}mm)`,
                  }}
                >
                  {group.map((b) => (
                    <LabelBox key={b.id} booking={b} size={sizeConfig} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation modal
// ---------------------------------------------------------------------------

function DeleteModal({
  booking,
  onClose,
  onDeleted,
}: {
  booking: Booking;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && !deleting) onClose();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/cargo/bookings/${booking.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Could not delete booking");
      toast.success("Booking deleted");
      onDeleted(booking.id);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Could not delete booking");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Portal>
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 px-4"
      >
        <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-2xl">
          <div className="mb-4 flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900">Delete this booking?</h2>
            <p className="mt-1 font-mono text-sm text-emerald-700">{booking.tracking_id}</p>
            <p className="mt-2 text-sm text-neutral-500">
              {booking.sender_name} → {booking.receiver_name}
            </p>
            <p className="mt-2 text-xs text-red-600">This cannot be undone.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-neutral-200 text-neutral-600"
              onClick={onClose}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</>
              ) : (
                <><Trash2 className="mr-2 h-4 w-4" />Delete</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-neutral-400">{label}</p>
        <p className="truncate text-base font-semibold text-neutral-900">{value}</p>
      </div>
    </div>
  );
}

function Dashboard({ bookings }: { bookings: Booking[] }) {
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === "Pending").length;
    const outForDelivery = bookings.filter((b) => b.status === "Out for Delivery").length;
    const delivered = bookings.filter((b) => b.status === "Delivered").length;
    const revenue = bookings.reduce((s, b) => s + computeFinalCharge(b), 0);
    const collected = bookings.reduce((s, b) => s + (b.amount_paid ?? 0), 0);
    const outstanding = bookings
      .filter((b) => b.payment_status !== "paid")
      .reduce((s, b) => s + Math.max(0, computeFinalCharge(b) - (b.amount_paid ?? 0)), 0);
    return { total, pending, outForDelivery, delivered, revenue, collected, outstanding };
  }, [bookings]);

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <StatCard icon={<Package className="h-4.5 w-4.5 text-neutral-600" />} label="Total bookings"
        value={String(stats.total)} accent="bg-neutral-100" />
      <StatCard icon={<Loader2 className="h-4.5 w-4.5 text-amber-600" />} label="Pending"
        value={String(stats.pending)} accent="bg-amber-50" />
      <StatCard icon={<Truck className="h-4.5 w-4.5 text-blue-600" />} label="Out for delivery"
        value={String(stats.outForDelivery)} accent="bg-blue-50" />
      <StatCard icon={<CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />} label="Delivered"
        value={String(stats.delivered)} accent="bg-emerald-50" />
      <StatCard icon={<IndianRupee className="h-4.5 w-4.5 text-emerald-600" />} label="Total revenue"
        value={fmt(stats.revenue)} accent="bg-emerald-50" />
      <StatCard icon={<Wallet className="h-4.5 w-4.5 text-emerald-600" />} label="Collected"
        value={fmt(stats.collected)} accent="bg-emerald-50" />
      <StatCard icon={<Wallet className="h-4.5 w-4.5 text-red-600" />} label="Outstanding"
        value={fmt(stats.outstanding)} accent="bg-red-50" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile booking card
// ---------------------------------------------------------------------------

function BookingCard({
  b,
  updatingId,
  selected,
  onToggleSelect,
  onStatusChange,
  onPaymentUpdated,
  onInvoice,
  onLabel,
  onEdit,
  onDelete,
}: {
  b: Booking;
  updatingId: string | null;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onStatusChange: (id: string, status: Booking["status"]) => void;
  onPaymentUpdated: (id: string, updates: Partial<Booking>) => void;
  onInvoice: (b: Booking) => void;
  onLabel: (b: Booking) => void;
  onEdit: (b: Booking) => void;
  onDelete: (b: Booking) => void;
}) {
  const charge = computeFinalCharge(b);

  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${selected ? "border-emerald-400 ring-1 ring-emerald-200" : "border-neutral-200"}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0 rounded border-neutral-300 text-emerald-600"
            checked={selected}
            onChange={() => onToggleSelect(b.id)}
          />
          <span className="truncate font-mono text-xs font-semibold text-emerald-700">
            {b.third_party_tracking || "— no 3rd-party tracking —"}
          </span>
          {b.third_party_tracking && (
            <button
              type="button"
              onClick={() => copyToClipboard(b.third_party_tracking, "Tracking number")}
              className="shrink-0 text-neutral-400 hover:text-emerald-600"
            >
              <Copy className="h-3 w-3" />
            </button>
          )}
        </div>
        <span className="shrink-0 text-xs text-neutral-400">
          {new Date(b.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-2 text-sm">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-neutral-900">{b.sender_name}</p>
          <p className="text-xs text-neutral-400">{b.sender_phone}</p>
        </div>
        <span className="text-neutral-300">→</span>
        <div className="min-w-0 flex-1 text-right">
          <p className="truncate font-medium text-neutral-900">{b.receiver_name}</p>
          <p className="text-xs text-neutral-400">{b.receiver_phone}</p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-md bg-neutral-100 px-2 py-1 text-neutral-600">{b.product_name}</span>
        <span className="rounded-md bg-neutral-100 px-2 py-1 text-neutral-600">{b.weight_estimate} kg</span>
        <span className="rounded-md bg-neutral-100 px-2 py-1 text-neutral-600">{modeLabel(b.delivery_mode)}</span>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <Select value={b.status} onValueChange={(v) => onStatusChange(b.id, v as Booking["status"])}
          disabled={updatingId === b.id}>
          <SelectTrigger className={`h-7 flex-1 border px-2 text-xs font-medium ${STATUS_TRIGGER_STYLES[b.status] ?? "bg-neutral-100 text-neutral-600"}`}>
            <div className="flex items-center gap-1">
              {updatingId === b.id && <Loader2 className="h-3 w-3 animate-spin" />}
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white text-neutral-900">
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <PaymentEditor booking={b} onUpdated={(updates) => onPaymentUpdated(b.id, updates)} />

        <span className="ml-auto text-sm font-semibold text-neutral-900">
          ₹{Number(charge).toFixed(0)}
        </span>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm"
          className="h-7 flex-1 border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
          onClick={() => onEdit(b)}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit
        </Button>
        <Button variant="outline" size="sm"
          className="h-7 flex-1 border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
          onClick={() => onInvoice(b)}>
          <FileText className="mr-1.5 h-3.5 w-3.5" />
          Invoice
        </Button>
        <Button variant="outline" size="sm"
          className="h-7 flex-1 border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
          onClick={() => onLabel(b)}>
          <Tag className="mr-1.5 h-3.5 w-3.5" />
          Label
        </Button>
        <Button variant="outline" size="sm"
          className="h-7 flex-1 border-red-200 bg-white text-red-600 hover:bg-red-50"
          onClick={() => onDelete(b)}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [deliveryMode, setDeliveryMode] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("month"); // default: current month
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);
  const [labelBookings, setLabelBookings] = useState<Booking[] | null>(null);
  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState<number>(20);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/cargo/bookings");
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Could not load bookings");
        setBookings((json.data as Booking[]) ?? []);
      } catch (err: any) {
        toast.error(err.message || "Could not load bookings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleStatusChange = async (bookingId: string, newStatus: Booking["status"]) => {
    const previous = bookings;
    setBookings((rows) => rows.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)));
    setUpdatingId(bookingId);
    try {
      const res = await fetch(`/api/admin/cargo/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Could not update status");
      toast.success(`Status → "${newStatus}"`);
    } catch (err: any) {
      toast.error(err.message || "Could not update status");
      setBookings(previous);
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaymentUpdated = (bookingId: string, updates: Partial<Booking>) => {
    setBookings((rows) => rows.map((b) => (b.id === bookingId ? { ...b, ...updates } : b)));
  };

  const handleBookingSaved = (updated: Booking) => {
    setBookings((rows) => rows.map((b) => (b.id === updated.id ? updated : b)));
  };

  const handleBookingDeleted = (id: string) => {
    setBookings((rows) => rows.filter((b) => b.id !== id));
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Turn the simple date preset into an actual start/end range.
  const { effectiveStart, effectiveEnd } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (dateRange) {
      case "today":
        return { effectiveStart: startOfToday, effectiveEnd: null as Date | null };
      case "7d": {
        const d = new Date(startOfToday);
        d.setDate(d.getDate() - 6);
        return { effectiveStart: d, effectiveEnd: null as Date | null };
      }
      case "30d": {
        const d = new Date(startOfToday);
        d.setDate(d.getDate() - 29);
        return { effectiveStart: d, effectiveEnd: null as Date | null };
      }
      case "month": {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        return { effectiveStart: d, effectiveEnd: null as Date | null };
      }
      case "last_month": {
        const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return { effectiveStart: s, effectiveEnd: e as Date | null };
      }
      case "year": {
        const d = new Date(now.getFullYear(), 0, 1);
        return { effectiveStart: d, effectiveEnd: null as Date | null };
      }
      case "custom":
        // Parse as LOCAL time (a bare "YYYY-MM-DD" is parsed as UTC, which
        // would drop early-morning bookings on the start date in IST).
        return {
          effectiveStart: startDate ? new Date(`${startDate}T00:00:00`) : null,
          effectiveEnd: endDate ? new Date(`${endDate}T23:59:59.999`) : null,
        };
      default:
        return { effectiveStart: null as Date | null, effectiveEnd: null as Date | null };
    }
  }, [dateRange, startDate, endDate]);

  // Bookings inside the selected date range only (ignores search/status/etc.)
  // — this is what the dashboard cards are computed from.
  const dateFiltered = useMemo(
    () =>
      bookings.filter((b) => {
        const t = new Date(b.created_at);
        if (effectiveStart && t < effectiveStart) return false;
        if (effectiveEnd && t > effectiveEnd) return false;
        return true;
      }),
    [bookings, effectiveStart, effectiveEnd]
  );

  const rangeText = useMemo(() => {
    const f = (d: Date) =>
      d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    if (!effectiveStart && !effectiveEnd) return "All time";
    const s = effectiveStart ? f(effectiveStart) : "Start";
    const e = effectiveEnd ? f(effectiveEnd) : "Today";
    return `${s} – ${e}`;
  }, [effectiveStart, effectiveEnd]);

  const filtered = useMemo(() => {
    let rows = [...bookings];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (b) =>
          b.tracking_id.toLowerCase().includes(q) ||
          b.third_party_tracking?.toLowerCase().includes(q) ||
          b.sender_name.toLowerCase().includes(q) ||
          b.receiver_name.toLowerCase().includes(q) ||
          b.receiver_phone?.includes(q) ||
          b.sender_phone?.includes(q)
      );
    }
    if (status !== "all") rows = rows.filter((b) => b.status === status);
    if (deliveryMode !== "all")
      rows = rows.filter((b) => {
        const m = b.delivery_mode;
        if (deliveryMode === "Indian Post") return m === "Indian Post" || m === "standard";
        if (deliveryMode === "Express Cargo") return m === "Express Cargo" || m === "express";
        if (deliveryMode === "Normal Cargo") return m === "Normal Cargo" || m === "normal";
        return m === deliveryMode;
      });
    if (paymentFilter !== "all") rows = rows.filter((b) => b.payment_status === paymentFilter);
    if (effectiveStart) rows = rows.filter((b) => new Date(b.created_at) >= effectiveStart);
    if (effectiveEnd) rows = rows.filter((b) => new Date(b.created_at) <= effectiveEnd);
    rows.sort((a, b) => {
      const av =
        sortKey === "created_at"
          ? new Date(a.created_at).getTime()
          : sortKey === "estimate_charge"
          ? computeFinalCharge(a)
          : Number(a[sortKey]) || 0;
      const bv =
        sortKey === "created_at"
          ? new Date(b.created_at).getTime()
          : sortKey === "estimate_charge"
          ? computeFinalCharge(b)
          : Number(b[sortKey]) || 0;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return rows;
  }, [bookings, search, status, deliveryMode, paymentFilter, effectiveStart, effectiveEnd, sortKey, sortDir]);

  // Reset to page 1 whenever the result set or page size changes.
  useEffect(() => {
    setPage(1);
  }, [search, status, deliveryMode, paymentFilter, dateRange, startDate, endDate, sortKey, sortDir, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  // Selected bookings in the order they appear in the current filtered/sorted list.
  const selectedBookingsOrdered = useMemo(
    () => filtered.filter((b) => selectedIds.has(b.id)),
    [filtered, selectedIds]
  );

  const allOnPageSelected = paginated.length > 0 && paginated.every((b) => selectedIds.has(b.id));

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        paginated.forEach((b) => next.delete(b.id));
      } else {
        paginated.forEach((b) => next.add(b.id));
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearch(""); setStatus("all"); setDeliveryMode("all");
    setPaymentFilter("all"); setDateRange("month"); setStartDate(""); setEndDate("");
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const hasActiveFilters =
    search || status !== "all" || deliveryMode !== "all" ||
    paymentFilter !== "all" || dateRange !== "month";

  // -------------------------------------------------------------------------
  // Excel export — exports exactly what's currently filtered (search, status,
  // mode, payment, and date range all apply), regardless of pagination.
  // -------------------------------------------------------------------------
  const exportToExcel = () => {
    if (filtered.length === 0) {
      toast.error("No bookings to export");
      return;
    }

    setExporting(true);
    try {
      const rows = filtered.map((b) => {
        const charge = computeFinalCharge(b);
        const due = Math.max(0, charge - (b.amount_paid ?? 0));
        const taxPct = b.tax_percent ?? 0;
        const taxAmt = charge * (taxPct / 100);
        return {
          "Tracking ID": b.tracking_id,
          "3rd-Party Tracking": b.third_party_tracking || "",
          "Date": new Date(b.created_at).toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
          }),
          "Sender Name": b.sender_name,
          "Sender Phone": b.sender_phone,
          "Sender Address": [b.sender_address, b.sender_city_state, b.sender_pincode]
            .filter(Boolean)
            .join(", "),
          "Receiver Name": b.receiver_name,
          "Receiver Phone": b.receiver_phone,
          "Receiver Address": [b.receiver_address, b.receiver_city_state, b.receiver_pincode]
            .filter(Boolean)
            .join(", "),
          "Product": b.product_name,
          "Weight (kg)": b.weight_estimate,
          "Mode": modeLabel(b.delivery_mode),
          "Status": b.status,
          "Freight Charge": b.estimate_charge ?? 0,
          "Handling Charge": b.handling_charge ?? 0,
          "Docket Charge": b.docket_charge ?? 0,
          "Pickup Charge": b.pickup_charge ?? 0,
          "Packaging Charge": b.packaging_charge ?? 0,
          "Extra Mile Delivery": b.extra_mile_delivery ?? 0,
          "Final Charge": charge,
          "Tax %": taxPct,
          "Tax Amount": Number(taxAmt.toFixed(2)),
          "Payment Status": b.payment_status,
          "Amount Paid": b.amount_paid ?? 0,
          "Amount Due": due,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Reasonable column widths so it's readable on open
      worksheet["!cols"] = [
        { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 18 }, { wch: 12 },
        { wch: 30 }, { wch: 18 }, { wch: 12 }, { wch: 30 }, { wch: 18 },
        { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 10 },
        { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
      ];

      // Append a totals row for quick reconciliation
      const totalPaid = filtered.reduce((s, b) => s + (b.amount_paid ?? 0), 0);
      const totalDue = filtered.reduce(
        (s, b) => s + Math.max(0, computeFinalCharge(b) - (b.amount_paid ?? 0)),
        0
      );
      const totalTax = filtered.reduce(
        (s, b) => s + computeFinalCharge(b) * ((b.tax_percent ?? 0) / 100),
        0
      );
      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          [],
          [
            "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
            `Totals (${filtered.length} bookings)`,
            "",
            `Tax: ₹${totalTax.toFixed(0)}`,
            "",
            `Paid: ₹${totalPaid.toFixed(0)}`,
            `Due: ₹${totalDue.toFixed(0)}`,
          ],
        ],
        { origin: -1 }
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");

      // Build a filename that reflects the active date range/filters
      const rangeLabel =
        dateRange === "custom" && (startDate || endDate)
          ? `${startDate || "start"}_to_${endDate || "end"}`
          : dateRange !== "all"
          ? dateRange
          : "all-time";
      const filename = `mateng-cargo-invoices-${rangeLabel}-${new Date().toISOString().slice(0, 10)}.xlsx`;

      XLSX.writeFile(workbook, filename);
      toast.success(`Exported ${filtered.length} booking${filtered.length === 1 ? "" : "s"}`);
    } catch (err: any) {
      toast.error(err.message || "Could not export");
    } finally {
      setExporting(false);
    }
  };

  const SortBtn = ({ label, k }: { label: string; k: SortKey }) => (
    <button type="button" onClick={() => toggleSort(k)}
      className="flex items-center gap-1 font-medium text-emerald-800 hover:text-emerald-600">
      {label}
      {sortKey === k ? (
        sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );

  const Pagination = () => (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4">
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <span>
          Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
          {"–"}
          {Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
        </span>
        <span className="text-neutral-300">|</span>
        <span>Rows per page</span>
        <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
          <SelectTrigger className="h-7 w-[70px] bg-white text-xs text-neutral-900 border-neutral-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white text-neutral-900">
            {PAGE_SIZE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" className="h-7 w-7 border-neutral-200 bg-white p-0 text-neutral-600 disabled:opacity-40"
          onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="min-w-[70px] text-center text-xs text-neutral-500">
          Page {safePage} of {totalPages}
        </span>
        <Button variant="outline" size="sm" className="h-7 w-7 border-neutral-200 bg-white p-0 text-neutral-600 disabled:opacity-40"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Edit modal */}
      {editingBooking && (
        <EditModal
          booking={editingBooking}
          onClose={() => setEditingBooking(null)}
          onSaved={handleBookingSaved}
        />
      )}

      {/* Delete confirmation modal */}
      {deletingBooking && (
        <DeleteModal
          booking={deletingBooking}
          onClose={() => setDeletingBooking(null)}
          onDeleted={handleBookingDeleted}
        />
      )}

      {/* Invoice modal */}
      {invoiceBooking && (
        <InvoiceModal
          booking={invoiceBooking}
          onClose={() => setInvoiceBooking(null)}
        />
      )}

      {/* Label modal (single row, or bulk-selected rows) */}
      {labelBookings && labelBookings.length > 0 && (
        <LabelModal
          bookings={labelBookings}
          onClose={() => setLabelBookings(null)}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">

        {/* Header */}
        <div className="mb-5 flex flex-wrap items-start gap-3 sm:items-center">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-neutral-900">Bookings</h1>
            <p className="text-sm text-neutral-500">
              {loading ? "Loading…" : `${filtered.length} of ${bookings.length} bookings`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={exportToExcel}
              disabled={loading || exporting || filtered.length === 0}
              className="border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
            >
              {exporting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-4 w-4" />
              )}
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/cargo/customers")}
              className="border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50">
              <Users className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Customers</span>
            </Button>
            <Button onClick={() => router.push("/admin/cargo/bookingPage")}
              className="bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Create new order</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        {/* Dashboard */}
        {!loading && (
          <>
            <p className="mb-2 text-xs text-neutral-500">
              Dashboard for <span className="font-medium text-neutral-700">{rangeText}</span>
              {" · "}change it with the date filter below
            </p>
            <Dashboard bookings={dateFiltered} />
          </>
        )}

        {/* Bulk selection toolbar */}
        {selectedIds.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
            <span className="text-sm font-medium text-emerald-800">
              {selectedIds.size} booking{selectedIds.size === 1 ? "" : "s"} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearSelection}
                className="border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-100">
                Clear
              </Button>
              <Button size="sm" onClick={() => setLabelBookings(selectedBookingsOrdered)}
                className="bg-blue-600 text-white hover:bg-blue-700">
                <Tag className="mr-1.5 h-3.5 w-3.5" />
                Print labels ({selectedIds.size})
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-5 space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tracking ID, 3rd-party tracking, name or phone"
                className="bg-white pl-8 text-neutral-900 placeholder:text-neutral-400 border-neutral-200" />
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}
                className="shrink-0 bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50">
                <X className="mr-1 h-3.5 w-3.5" />Clear
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 w-auto min-w-[120px] bg-white text-xs text-neutral-900 border-neutral-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white text-neutral-900">
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Out for Delivery">Out for delivery</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deliveryMode} onValueChange={setDeliveryMode}>
              <SelectTrigger className="h-8 w-auto min-w-[120px] bg-white text-xs text-neutral-900 border-neutral-200">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent className="bg-white text-neutral-900">
                <SelectItem value="all">All modes</SelectItem>
                <SelectItem value="Indian Post">Indian Post</SelectItem>
                <SelectItem value="Normal Cargo">Normal Cargo</SelectItem>
                <SelectItem value="Express Cargo">Express Cargo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="h-8 w-auto min-w-[110px] bg-white text-xs text-neutral-900 border-neutral-200">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent className="bg-white text-neutral-900">
                <SelectItem value="all">All payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="h-8 w-auto min-w-[130px] bg-white text-xs text-neutral-900 border-neutral-200">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent className="bg-white text-neutral-900">
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="last_month">Last month</SelectItem>
                <SelectItem value="year">This year</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            {dateRange === "custom" && (
              <>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 w-auto bg-white text-xs text-neutral-900 border-neutral-200" />
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 w-auto bg-white text-xs text-neutral-900 border-neutral-200" />
              </>
            )}
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          {loading ? (
            <div className="flex justify-center py-16 text-neutral-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-neutral-400">No bookings match these filters.</div>
          ) : (
            <>
              <div className="space-y-3">
                {paginated.map((b) => (
                  <BookingCard
                    key={b.id}
                    b={b}
                    updatingId={updatingId}
                    selected={selectedIds.has(b.id)}
                    onToggleSelect={toggleSelect}
                    onStatusChange={handleStatusChange}
                    onPaymentUpdated={handlePaymentUpdated}
                    onInvoice={setInvoiceBooking}
                    onLabel={(booking) => setLabelBookings([booking])}
                    onEdit={setEditingBooking}
                    onDelete={setDeletingBooking}
                  />
                ))}
              </div>
              <Pagination />
            </>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-[3%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[7%]" />
              <col className="w-[5%]" />
              <col className="w-[6%]" />
              <col className="w-[10%]" />
              <col className="w-[6%]" />
              <col className="w-[6%]" />
              <col className="w-[6%]" />
              <col className="w-[6%]" />
              <col className="w-[6%]" />
              <col className="w-[6%]" />
              <col className="w-[6%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-emerald-100 bg-emerald-50/60">
                <th className="px-2 py-2.5 text-left">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-emerald-600"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAllOnPage}
                  />
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-emerald-800">3rd-Party Tracking</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-emerald-800">Sender</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-emerald-800">Receiver</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-emerald-800">Product</th>
                <th className="px-3 py-2.5 text-left text-xs"><SortBtn label="Weight" k="weight_estimate" /></th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-emerald-800">Mode</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-emerald-800">Status</th>
                <th className="px-3 py-2.5 text-left text-xs"><SortBtn label="Final Charge" k="estimate_charge" /></th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-emerald-800">Payment</th>
                <th className="px-3 py-2.5 text-left text-xs"><SortBtn label="Date" k="created_at" /></th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-emerald-800">Invoice</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-emerald-800">Label</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-emerald-800">Edit</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-emerald-800">Delete</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-neutral-400">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-sm text-neutral-400">
                    No bookings match these filters.
                  </td>
                </tr>
              ) : (
                paginated.map((b) => {
                  const charge = computeFinalCharge(b);
                  const isSelected = selectedIds.has(b.id);
                  return (
                    <tr key={b.id}
                      className={`border-b border-neutral-100 last:border-0 transition-colors ${isSelected ? "bg-emerald-50/50" : "hover:bg-emerald-50/30"}`}>
                      <td className="px-2 py-2.5">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-neutral-300 text-emerald-600"
                          checked={isSelected}
                          onChange={() => toggleSelect(b.id)}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-1">
                          <span className="truncate font-mono text-xs font-medium text-emerald-700">
                            {b.third_party_tracking || "—"}
                          </span>
                          {b.third_party_tracking && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(b.third_party_tracking, "Tracking number")}
                              className="shrink-0 text-neutral-400 hover:text-emerald-600"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="truncate text-xs font-medium text-neutral-800">{b.sender_name}</p>
                        <p className="truncate text-xs text-neutral-400">{b.sender_phone}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="truncate text-xs font-medium text-neutral-800">{b.receiver_name}</p>
                        <p className="truncate text-xs text-neutral-400">{b.receiver_phone}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="block truncate text-xs text-neutral-700">{b.product_name}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-neutral-500 whitespace-nowrap">
                        {b.weight_estimate} kg
                      </td>
                      <td className="px-3 py-2.5 text-xs text-neutral-500">
                        {modeLabel(b.delivery_mode)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Select value={b.status}
                          onValueChange={(v) => handleStatusChange(b.id, v as Booking["status"])}
                          disabled={updatingId === b.id}>
                          <SelectTrigger className={`h-6 w-full border-0 px-2 text-xs font-medium ${STATUS_TRIGGER_STYLES[b.status] ?? "bg-neutral-100 text-neutral-600"}`}>
                            <div className="flex items-center gap-1 min-w-0">
                              {updatingId === b.id && <Loader2 className="h-2.5 w-2.5 shrink-0 animate-spin" />}
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-white text-neutral-900">
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-medium text-neutral-800 whitespace-nowrap">
                        ₹{Number(charge).toFixed(0)}
                      </td>
                      <td className="px-3 py-2.5">
                        <PaymentEditor booking={b} onUpdated={(updates) => handlePaymentUpdated(b.id, updates)} />
                      </td>
                      <td className="px-3 py-2.5 text-xs text-neutral-500 whitespace-nowrap">
                        {new Date(b.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </td>
                      <td className="px-3 py-2.5">
                        <Button variant="outline" size="sm"
                          className="h-6 w-full border-emerald-200 bg-white px-1.5 text-xs text-emerald-700 hover:bg-emerald-50"
                          onClick={() => setInvoiceBooking(b)}>
                          <FileText className="h-3 w-3" />
                        </Button>
                      </td>
                      <td className="px-3 py-2.5">
                        <Button variant="outline" size="sm"
                          className="h-6 w-full border-blue-200 bg-white px-1.5 text-xs text-blue-700 hover:bg-blue-50"
                          onClick={() => setLabelBookings([b])}>
                          <Tag className="h-3 w-3" />
                        </Button>
                      </td>
                      <td className="px-3 py-2.5">
                        <Button variant="outline" size="sm"
                          className="h-6 w-full border-neutral-200 bg-white px-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
                          onClick={() => setEditingBooking(b)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </td>
                      <td className="px-3 py-2.5">
                        <Button variant="outline" size="sm"
                          className="h-6 w-full border-red-200 bg-white px-1.5 text-xs text-red-600 hover:bg-red-50"
                          onClick={() => setDeletingBooking(b)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {!loading && filtered.length > 0 && <Pagination />}
        </div>

      </div>
    </div>
  );
}