// app/(main)/admin/cargo/bookingPage/page.tsx

"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PackageCheck,
  Camera,
  X,
  Loader2,
  List,
  UserPlus,
  User,
  CreditCard,
  FileText,
  Plus,
  LayoutDashboard,
  Search,
  CheckCircle2,
  Upload,
  Download,
  AlertTriangle,
  RotateCcw,
  Building2,
  Truck,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CargoCustomer {
  id: string;
  name: string;
  phone: string;
  address: string;
  city_state: string;
  pincode: string;
  gstin?: string;
}

interface CargoFormData {
  // Billing — who is invoiced. Can be linked to a saved customer, or filled
  // manually for a walk-in booking. GSTIN is always a manual/override field.
  billing_customer_id: string;
  billing_name: string;
  billing_phone: string;
  billing_address: string;
  billing_city_state: string;
  billing_pincode: string;
  billing_gstin: string;
  // Shipping — where the package is delivered. Auto-fills Receiver below
  // whenever it changes, so it never needs to be entered twice.
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city_state: string;
  shipping_pincode: string;
  // Sender / Receiver — the logistics parties (pickup & delivery).
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
  delivery_mode: "Indian Post" | "Express Cargo" | "Normal Cargo" | "";
  pickup_required: boolean;
  delivery_required: boolean;
  notes: string;
  status: "Pending" | "Out for Delivery" | "Delivered";
  third_party_tracking: string;
  handling_charge: string;
  docket_charge: string;
  pickup_charge: string;
  packaging_charge: string;
  extra_mile_delivery: string;
  estimate_charge: string;
  final_charge: string;
  tax_percent: string;
  payment_status: "paid" | "unpaid" | "partial";
  amount_paid: string;
}

type RowErrors = Partial<Record<keyof CargoFormData, string>>;

// Shipping/receiver fields that get kept in sync with each other.
const ADDRESS_SUFFIXES = ["name", "phone", "address", "city_state", "pincode"] as const;
type AddressSuffix = (typeof ADDRESS_SUFFIXES)[number];

const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const emptyForm: CargoFormData = {
  billing_customer_id: "",
  billing_name: "",
  billing_phone: "",
  billing_address: "",
  billing_city_state: "",
  billing_pincode: "",
  billing_gstin: "",
  shipping_name: "",
  shipping_phone: "",
  shipping_address: "",
  shipping_city_state: "",
  shipping_pincode: "",
  sender_name: "",
  sender_phone: "",
  sender_address: "",
  sender_city_state: "",
  sender_pincode: "",
  receiver_name: "",
  receiver_phone: "",
  receiver_address: "",
  receiver_city_state: "",
  receiver_pincode: "",
  product_name: "",
  weight_estimate: "",
  delivery_mode: "",
  pickup_required: false,
  delivery_required: false,
  notes: "",
  status: "Pending",
  third_party_tracking: "",
  handling_charge: "",
  docket_charge: "",
  pickup_charge: "",
  packaging_charge: "",
  extra_mile_delivery: "",
  estimate_charge: "",
  final_charge: "",
  tax_percent: "",
  payment_status: "unpaid",
  amount_paid: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTrackingId() {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `SBX-${rand}`;
}

function sumCharges(data: CargoFormData) {
  return [
    data.handling_charge,
    data.docket_charge,
    data.pickup_charge,
    data.packaging_charge,
    data.extra_mile_delivery,
    data.estimate_charge,
  ].reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
}

// Shared validation — used by the single-order form. Every field listed here
// is genuinely required for that manual flow.
function validateBookingData(data: CargoFormData): RowErrors {
  const next: RowErrors = {};

  // Billing
  if (!data.billing_name.trim()) next.billing_name = "Required";
  if (!/^\d{10}$/.test(data.billing_phone)) next.billing_phone = "10 digit number";
  if (!data.billing_address.trim()) next.billing_address = "Required";
  if (!/^\d{6}$/.test(data.billing_pincode)) next.billing_pincode = "6 digit pincode";
  if (data.billing_gstin && !GSTIN_REGEX.test(data.billing_gstin)) {
    next.billing_gstin = "Invalid GSTIN";
  }

  // Shipping (auto-filled from billing unless overridden — see updateShippingField)
  if (!data.shipping_name.trim()) next.shipping_name = "Required";
  if (!/^\d{10}$/.test(data.shipping_phone)) next.shipping_phone = "10 digit number";
  if (!data.shipping_address.trim()) next.shipping_address = "Required";
  if (!/^\d{6}$/.test(data.shipping_pincode)) next.shipping_pincode = "6 digit pincode";

  if (!data.sender_name.trim()) next.sender_name = "Required";
  if (!/^\d{10}$/.test(data.sender_phone)) next.sender_phone = "10 digit number";
  if (!data.sender_address.trim()) next.sender_address = "Required";
  if (!/^\d{6}$/.test(data.sender_pincode)) next.sender_pincode = "6 digit pincode";
  if (!data.receiver_name.trim()) next.receiver_name = "Required";
  if (!/^\d{10}$/.test(data.receiver_phone)) next.receiver_phone = "10 digit number";
  if (!data.receiver_address.trim()) next.receiver_address = "Required";
  if (!/^\d{6}$/.test(data.receiver_pincode)) next.receiver_pincode = "6 digit pincode";
  if (!data.product_name.trim()) next.product_name = "Required";
  if (!data.weight_estimate || parseFloat(data.weight_estimate) <= 0)
    next.weight_estimate = "Enter a weight";
  if (!data.delivery_mode) next.delivery_mode = "Choose a mode";
  if (!data.estimate_charge || parseFloat(data.estimate_charge) <= 0)
    next.estimate_charge = "Enter an estimate";
  if (data.tax_percent) {
    const t = parseFloat(data.tax_percent);
    if (isNaN(t) || t < 0 || t > 100) next.tax_percent = "0–100 only";
  }
  if (
    data.payment_status === "partial" &&
    (!data.amount_paid || parseFloat(data.amount_paid) <= 0)
  ) {
    next.amount_paid = "Enter amount paid";
  }
  return next;
}

// True when a bulk row has nothing meaningful in it — every user-fillable
// field is blank/false. `status`, `payment_status` and `tax_percent` are
// excluded since they carry default values ("Pending"/"unpaid"/"0") even
// when the CSV cell was never populated, so they'd otherwise make an empty
// row look non-empty.
function isBulkRowEmpty(data: CargoFormData): boolean {
  const textFields: (keyof CargoFormData)[] = [
    "billing_name", "billing_phone", "billing_address", "billing_city_state",
    "billing_pincode", "billing_gstin",
    "shipping_name", "shipping_phone", "shipping_address", "shipping_city_state",
    "shipping_pincode",
    "sender_name", "sender_phone", "sender_address", "sender_city_state",
    "sender_pincode",
    "receiver_name", "receiver_phone", "receiver_address", "receiver_city_state",
    "receiver_pincode",
    "product_name", "weight_estimate", "delivery_mode", "notes",
    "third_party_tracking", "handling_charge", "docket_charge", "pickup_charge",
    "packaging_charge", "extra_mile_delivery", "estimate_charge", "final_charge",
    "amount_paid",
  ];
  const allTextBlank = textFields.every((key) => !String(data[key] ?? "").trim());
  return allTextBlank && !data.pickup_required && !data.delivery_required;
}

// Lenient validation used ONLY for bulk CSV rows. No individual field is
// required — a row can be uploaded with most columns blank. Format checks
// (phone length, pincode length, GSTIN pattern, numeric ranges) only apply
// when a value was actually provided, so obviously malformed data still gets
// flagged, but missing data never blocks the row on its own. The one thing
// that IS rejected is a row where literally nothing was filled in at all.
function validateBulkRow(data: CargoFormData): RowErrors {
  const next: RowErrors = {};

  if (isBulkRowEmpty(data)) {
    next.billing_name = "Row is completely empty";
    return next;
  }

  if (data.billing_phone && !/^\d{10}$/.test(data.billing_phone))
    next.billing_phone = "10 digit number";
  if (data.billing_pincode && !/^\d{6}$/.test(data.billing_pincode))
    next.billing_pincode = "6 digit pincode";
  if (data.billing_gstin && !GSTIN_REGEX.test(data.billing_gstin))
    next.billing_gstin = "Invalid GSTIN";

  if (data.shipping_phone && !/^\d{10}$/.test(data.shipping_phone))
    next.shipping_phone = "10 digit number";
  if (data.shipping_pincode && !/^\d{6}$/.test(data.shipping_pincode))
    next.shipping_pincode = "6 digit pincode";

  if (data.sender_phone && !/^\d{10}$/.test(data.sender_phone))
    next.sender_phone = "10 digit number";
  if (data.sender_pincode && !/^\d{6}$/.test(data.sender_pincode))
    next.sender_pincode = "6 digit pincode";

  if (data.receiver_phone && !/^\d{10}$/.test(data.receiver_phone))
    next.receiver_phone = "10 digit number";
  if (data.receiver_pincode && !/^\d{6}$/.test(data.receiver_pincode))
    next.receiver_pincode = "6 digit pincode";

  if (data.weight_estimate && parseFloat(data.weight_estimate) <= 0)
    next.weight_estimate = "Must be positive";
  if (data.estimate_charge && parseFloat(data.estimate_charge) <= 0)
    next.estimate_charge = "Must be positive";

  if (data.tax_percent) {
    const t = parseFloat(data.tax_percent);
    if (isNaN(t) || t < 0 || t > 100) next.tax_percent = "0–100 only";
  }

  if (
    data.payment_status === "partial" &&
    data.amount_paid &&
    parseFloat(data.amount_paid) <= 0
  ) {
    next.amount_paid = "Must be positive";
  }

  return next;
}

// Builds the JSON payload sent to the bookings API for one row. Numeric
// fields fall back to null (rather than NaN) when left blank, so rows from
// the lenient bulk-upload path serialize cleanly even when incomplete.
function buildBookingPayload(data: CargoFormData, trackingId: string) {
  const amountPaid =
    data.payment_status === "paid"
      ? sumCharges(data)
      : data.payment_status === "partial"
      ? parseFloat(data.amount_paid) || 0
      : 0;

  return {
    customer_id: data.billing_customer_id || null,
    billing_name: data.billing_name,
    billing_phone: data.billing_phone,
    billing_address: data.billing_address,
    billing_city_state: data.billing_city_state,
    billing_pincode: data.billing_pincode,
    billing_gstin: data.billing_gstin || null,
    shipping_name: data.shipping_name,
    shipping_phone: data.shipping_phone,
    shipping_address: data.shipping_address,
    shipping_city_state: data.shipping_city_state,
    shipping_pincode: data.shipping_pincode,
    sender_name: data.sender_name,
    sender_phone: data.sender_phone,
    sender_address: data.sender_address,
    sender_city_state: data.sender_city_state,
    sender_pincode: data.sender_pincode,
    receiver_name: data.receiver_name,
    receiver_phone: data.receiver_phone,
    receiver_address: data.receiver_address,
    receiver_city_state: data.receiver_city_state,
    receiver_pincode: data.receiver_pincode,
    product_name: data.product_name,
    delivery_mode: data.delivery_mode,
    pickup_required: data.pickup_required,
    delivery_required: data.delivery_required,
    notes: data.notes,
    status: data.status,
    third_party_tracking: data.third_party_tracking,
    tracking_id: trackingId,
    weight_estimate: data.weight_estimate ? parseFloat(data.weight_estimate) : null,
    handling_charge: data.handling_charge ? parseFloat(data.handling_charge) : null,
    docket_charge: data.docket_charge ? parseFloat(data.docket_charge) : null,
    pickup_charge: data.pickup_charge ? parseFloat(data.pickup_charge) : null,
    packaging_charge: data.packaging_charge ? parseFloat(data.packaging_charge) : null,
    extra_mile_delivery: data.extra_mile_delivery ? parseFloat(data.extra_mile_delivery) : null,
    estimate_charge: data.estimate_charge ? parseFloat(data.estimate_charge) : null,
    final_charge: data.final_charge ? parseFloat(data.final_charge) : null,
    tax_percent: data.tax_percent ? parseFloat(data.tax_percent) : null,
    payment_status: data.payment_status,
    amount_paid: amountPaid,
  };
}

const BULK_CSV_COLUMNS = [
  "billing_name",
  "billing_phone",
  "billing_address",
  "billing_city_state",
  "billing_pincode",
  "billing_gstin",
  "shipping_name",
  "shipping_phone",
  "shipping_address",
  "shipping_city_state",
  "shipping_pincode",
  "sender_name",
  "sender_phone",
  "sender_address",
  "sender_city_state",
  "sender_pincode",
  "receiver_name",
  "receiver_phone",
  "receiver_address",
  "receiver_city_state",
  "receiver_pincode",
  "product_name",
  "weight_estimate",
  "delivery_mode",
  "pickup_required",
  "delivery_required",
  "notes",
  "third_party_tracking",
  "handling_charge",
  "docket_charge",
  "pickup_charge",
  "packaging_charge",
  "extra_mile_delivery",
  "estimate_charge",
  "final_charge",
  "tax_percent",
  "payment_status",
  "amount_paid",
] as const;

function toBool(v?: string) {
  if (!v) return false;
  return ["true", "1", "yes", "y"].includes(v.trim().toLowerCase());
}

function normalizeDeliveryMode(v?: string): CargoFormData["delivery_mode"] {
  const val = (v || "").trim();
  const match = ["Indian Post", "Express Cargo", "Normal Cargo"].find(
    (m) => m.toLowerCase() === val.toLowerCase()
  );
  return (match as CargoFormData["delivery_mode"]) || "";
}

function normalizePaymentStatus(v?: string): CargoFormData["payment_status"] {
  const val = (v || "").trim().toLowerCase();
  return val === "paid" || val === "partial" ? val : "unpaid";
}

// Maps one raw CSV row (string values, arbitrary header casing) to CargoFormData.
// Shipping falls back to Billing when left blank; Receiver falls back to
// Shipping when left blank — the same auto-fill chain used in the single form.
// tax_percent defaults to "0" when the cell is blank.
function mapCsvRow(raw: Record<string, string>): CargoFormData {
  const billing_name = (raw.billing_name || "").trim();
  const billing_phone = (raw.billing_phone || "").replace(/\D/g, "").slice(0, 10);
  const billing_address = (raw.billing_address || "").trim();
  const billing_city_state = (raw.billing_city_state || "").trim();
  const billing_pincode = (raw.billing_pincode || "").replace(/\D/g, "").slice(0, 6);
  const billing_gstin = (raw.billing_gstin || "").trim().toUpperCase();

  const shipping_name = (raw.shipping_name || billing_name).trim();
  const shipping_phone = raw.shipping_phone
    ? raw.shipping_phone.replace(/\D/g, "").slice(0, 10)
    : billing_phone;
  const shipping_address = (raw.shipping_address || billing_address).trim();
  const shipping_city_state = (raw.shipping_city_state || billing_city_state).trim();
  const shipping_pincode = raw.shipping_pincode
    ? raw.shipping_pincode.replace(/\D/g, "").slice(0, 6)
    : billing_pincode;

  return {
    ...emptyForm,
    billing_customer_id: "",
    billing_name,
    billing_phone,
    billing_address,
    billing_city_state,
    billing_pincode,
    billing_gstin,
    shipping_name,
    shipping_phone,
    shipping_address,
    shipping_city_state,
    shipping_pincode,
    sender_name: (raw.sender_name || "").trim(),
    sender_phone: (raw.sender_phone || "").replace(/\D/g, "").slice(0, 10),
    sender_address: (raw.sender_address || "").trim(),
    sender_city_state: (raw.sender_city_state || "").trim(),
    sender_pincode: (raw.sender_pincode || "").replace(/\D/g, "").slice(0, 6),
    receiver_name: (raw.receiver_name || shipping_name).trim(),
    receiver_phone: raw.receiver_phone
      ? raw.receiver_phone.replace(/\D/g, "").slice(0, 10)
      : shipping_phone,
    receiver_address: (raw.receiver_address || shipping_address).trim(),
    receiver_city_state: (raw.receiver_city_state || shipping_city_state).trim(),
    receiver_pincode: raw.receiver_pincode
      ? raw.receiver_pincode.replace(/\D/g, "").slice(0, 6)
      : shipping_pincode,
    product_name: (raw.product_name || "").trim(),
    weight_estimate: (raw.weight_estimate || "").trim(),
    delivery_mode: normalizeDeliveryMode(raw.delivery_mode),
    pickup_required: toBool(raw.pickup_required),
    delivery_required: toBool(raw.delivery_required),
    notes: (raw.notes || "").trim(),
    status: "Pending",
    third_party_tracking: (raw.third_party_tracking || "").trim(),
    handling_charge: (raw.handling_charge || "").trim(),
    docket_charge: (raw.docket_charge || "").trim(),
    pickup_charge: (raw.pickup_charge || "").trim(),
    packaging_charge: (raw.packaging_charge || "").trim(),
    extra_mile_delivery: (raw.extra_mile_delivery || "").trim(),
    estimate_charge: (raw.estimate_charge || "").trim(),
    final_charge: (raw.final_charge || "").trim(),
    tax_percent: (raw.tax_percent || "").trim() || "0",
    payment_status: normalizePaymentStatus(raw.payment_status),
    amount_paid: (raw.amount_paid || "").trim(),
  };
}

function downloadCsvTemplate() {
  // Build via Papa.unparse (not a manual join) so any field containing a
  // comma — e.g. "Imphal, Manipur" — gets quoted correctly instead of
  // silently shifting every column after it.
  const sampleRow: Record<(typeof BULK_CSV_COLUMNS)[number], string> = {
    billing_name: "Bonison Singh",
    billing_phone: "9876543210",
    billing_address: "123 MG Road",
    billing_city_state: "Imphal, Manipur",
    billing_pincode: "795001",
    billing_gstin: "",
    shipping_name: "Rahul Sharma",
    shipping_phone: "9123456780",
    shipping_address: "45 Connaught Place",
    shipping_city_state: "Delhi",
    shipping_pincode: "110001",
    sender_name: "Bonison Singh",
    sender_phone: "9876543210",
    sender_address: "123 MG Road",
    sender_city_state: "Imphal, Manipur",
    sender_pincode: "795001",
    receiver_name: "",
    receiver_phone: "",
    receiver_address: "",
    receiver_city_state: "",
    receiver_pincode: "",
    product_name: "Clothes",
    weight_estimate: "10",
    delivery_mode: "Express Cargo",
    pickup_required: "true",
    delivery_required: "true",
    notes: "Handle with care",
    third_party_tracking: "",
    handling_charge: "50",
    docket_charge: "20",
    pickup_charge: "0",
    packaging_charge: "30",
    extra_mile_delivery: "0",
    estimate_charge: "500",
    final_charge: "",
    tax_percent: "0",
    payment_status: "unpaid",
    amount_paid: "",
  };
  const csv = Papa.unparse({
    fields: BULK_CSV_COLUMNS as unknown as string[],
    data: [BULK_CSV_COLUMNS.map((col) => sampleRow[col])],
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cargo_bookings_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Success Modal
// ---------------------------------------------------------------------------

function SuccessModal({
  trackingId,
  bookingId,
  onNewOrder,
  onDashboard,
}: {
  trackingId: string;
  bookingId: string;
  onNewOrder: () => void;
  onDashboard: () => void;
}) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <h2 className="text-base font-semibold text-neutral-900">Booking created!</h2>
          <p className="mt-1 font-mono text-sm text-emerald-700">{trackingId}</p>
        </div>

        <div className="space-y-2">
          <Button
            className="w-full border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
            variant="outline"
            onClick={() => router.push(`/admin/cargo/invoice/${bookingId}`)}
          >
            <FileText className="mr-2 h-4 w-4" />
            Download invoice
          </Button>

          <Button
            className="w-full bg-emerald-600 font-bold text-white hover:bg-emerald-700"
            onClick={onNewOrder}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create new order
          </Button>

          <Button
            className="w-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
            variant="outline"
            onClick={onDashboard}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Go to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Customer search combobox
// ---------------------------------------------------------------------------

function CustomerCombobox({
  customers,
  value,
  onChange,
}: {
  customers: CargoCustomer[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = customers.find((c) => c.id === value);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [customers, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (id: string) => {
    onChange(id);
    setSearch("");
    setOpen(false);
  };

  const clear = () => {
    onChange("");
    setSearch("");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div
        className="flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
        onClick={() => setOpen((o) => !o)}
      >
        {selected ? (
          <span className="flex-1 truncate">
            {selected.name} · {selected.phone}
            {selected.gstin && (
              <span className="ml-2 rounded bg-indigo-50 px-1 py-0.5 text-[10px] font-medium text-indigo-600">
                GST
              </span>
            )}
          </span>
        ) : (
          <span className="text-neutral-400">Select a customer for billing (optional)</span>
        )}
        {selected ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); clear(); }}
            className="ml-2 text-neutral-400 hover:text-neutral-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <Search className="ml-2 h-3.5 w-3.5 text-neutral-400" />
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-lg">
          <div className="border-b border-neutral-100 p-2">
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or phone…"
              className="h-7 border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            <li
              className="cursor-pointer px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-50"
              onClick={() => clear()}
            >
              — No saved customer (walk-in) —
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-neutral-400">No results</li>
            ) : (
              filtered.map((c) => (
                <li
                  key={c.id}
                  className={`cursor-pointer px-3 py-2 text-sm hover:bg-emerald-50 ${
                    c.id === value ? "bg-emerald-50 text-emerald-700" : "text-neutral-700"
                  }`}
                  onClick={() => select(c.id)}
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="ml-2 text-neutral-400">{c.phone}</span>
                  {c.city_state && (
                    <span className="ml-2 text-neutral-400">· {c.city_state}</span>
                  )}
                  {c.gstin && (
                    <span className="ml-2 rounded bg-indigo-50 px-1 py-0.5 text-[10px] font-medium text-indigo-600">
                      GST
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small building blocks
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

// Small chevron button every collapsible section header uses. Kept
// separate from the title so the title stays plain text (no nested
// interactive elements) and each section remembers its own open state.
const CollapseToggle = ({ open, onToggle }: { open: boolean; onToggle: () => void }) => (
  <button
    type="button"
    onClick={onToggle}
    className="rounded-md p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
    aria-label={open ? "Collapse section" : "Expand section"}
  >
    <ChevronDown className={`h-4 w-4 transition-transform ${open ? "" : "-rotate-90"}`} />
  </button>
);

// ---------------------------------------------------------------------------
// Party card (sender / receiver) — with "same as customer" toggle
// ---------------------------------------------------------------------------

const PartyCard = ({
  title,
  prefix,
  form,
  errors,
  update,
  // Optional "same as ___" toggle — omit sameAsLabel to hide it entirely
  // (used for Receiver, which is driven by Shipping instead).
  sameAsLabel,
  sameAsChecked,
  onSameAsChange,
}: {
  title: string;
  prefix: "sender" | "receiver";
  form: CargoFormData;
  errors: RowErrors;
  update: <K extends keyof CargoFormData>(key: K, value: CargoFormData[K]) => void;
  sameAsLabel?: string;
  sameAsChecked?: boolean;
  onSameAsChange?: (checked: boolean) => void;
}) => {
  const name = `${prefix}_name` as const;
  const phone = `${prefix}_phone` as const;
  const address = `${prefix}_address` as const;
  const cityState = `${prefix}_city_state` as const;
  const pincode = `${prefix}_pincode` as const;

  const isLocked = !!sameAsLabel && !!sameAsChecked;
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border border-neutral-200 border-t-2 border-t-emerald-500 p-4">
      <div className={open ? "mb-4 flex items-center justify-between gap-3" : "flex items-center justify-between gap-3"}>
        <div className="flex items-center gap-1.5">
          <CollapseToggle open={open} onToggle={() => setOpen((o) => !o)} />
          <h3 className="text-sm font-medium text-neutral-900">{title}</h3>
        </div>

        {/* Same-as checkbox — only shown when a label/handler was passed */}
        {sameAsLabel && onSameAsChange && (
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
              checked={!!sameAsChecked}
              onChange={(e) => onSameAsChange(e.target.checked)}
            />
            Same as {sameAsLabel}
          </label>
        )}
      </div>

      {open && (
        <>
          {/* Prefill banner */}
          {isLocked && (
            <div className="mb-3 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
              ✓ Fields mirror {sameAsLabel}. Uncheck above to edit manually.
            </div>
          )}

          <div className="space-y-4">
            <Field label="Full name" required>
              <Input
                className={`bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300 ${isLocked ? "opacity-70 cursor-not-allowed" : ""}`}
                value={form[name]}
                onChange={(e) => update(name, e.target.value as never)}
                placeholder="e.g. Bonison"
                aria-invalid={!!errors[name]}
                readOnly={isLocked}
              />
              {errors[name] && <p className="text-xs text-red-600">{errors[name]}</p>}
            </Field>
            <Field label="Phone number" required>
              <Input
                className={`bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300 ${isLocked ? "opacity-70 cursor-not-allowed" : ""}`}
                value={form[phone]}
                onChange={(e) =>
                  update(phone, e.target.value.replace(/\D/g, "").slice(0, 10) as never)
                }
                placeholder="10 digit mobile number"
                inputMode="numeric"
                aria-invalid={!!errors[phone]}
                readOnly={isLocked}
              />
              {errors[phone] && <p className="text-xs text-red-600">{errors[phone]}</p>}
            </Field>
            <Field label="Address" required>
              <Textarea
                className={`bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300 ${isLocked ? "opacity-70 cursor-not-allowed" : ""}`}
                value={form[address]}
                onChange={(e) => update(address, e.target.value as never)}
                placeholder="House / street / locality"
                rows={2}
                aria-invalid={!!errors[address]}
                readOnly={isLocked}
              />
              {errors[address] && <p className="text-xs text-red-600">{errors[address]}</p>}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City / state">
                <Input
                  className={`bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300 ${isLocked ? "opacity-70 cursor-not-allowed" : ""}`}
                  value={form[cityState]}
                  onChange={(e) => update(cityState, e.target.value as never)}
                  placeholder="e.g. Imphal, Manipur"
                  readOnly={isLocked}
                />
              </Field>
              <Field label="Pincode" required>
                <Input
                  className={`bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300 ${isLocked ? "opacity-70 cursor-not-allowed" : ""}`}
                  value={form[pincode]}
                  onChange={(e) =>
                    update(pincode, e.target.value.replace(/\D/g, "").slice(0, 6) as never)
                  }
                  placeholder="795103"
                  inputMode="numeric"
                  aria-invalid={!!errors[pincode]}
                  readOnly={isLocked}
                />
                {errors[pincode] && <p className="text-xs text-red-600">{errors[pincode]}</p>}
              </Field>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Billing & Shipping card
// ---------------------------------------------------------------------------

function BillingShippingCard({
  form,
  errors,
  update,
  customers,
  onCustomerSelect,
  shippingSameAsBilling,
  onShippingSameAsBillingChange,
  updateShippingField,
  onSaveCustomer,
}: {
  form: CargoFormData;
  errors: RowErrors;
  update: <K extends keyof CargoFormData>(key: K, value: CargoFormData[K]) => void;
  customers: CargoCustomer[];
  onCustomerSelect: (id: string) => void;
  shippingSameAsBilling: boolean;
  onShippingSameAsBillingChange: (checked: boolean) => void;
  updateShippingField: (suffix: AddressSuffix, value: string) => void;
  onSaveCustomer: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border border-neutral-200 border-t-2 border-t-indigo-500 p-4">
      <div className={open ? "mb-4 flex items-center justify-between gap-3" : "flex items-center justify-between gap-3"}>
        <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-900">
          <CollapseToggle open={open} onToggle={() => setOpen((o) => !o)} />
          <Building2 className="h-4 w-4 text-indigo-600" />
          Billing &amp; shipping
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSaveCustomer}
          className="h-7 border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 text-xs"
        >
          <UserPlus className="mr-1.5 h-3.5 w-3.5" />
          Save current as customer
        </Button>
      </div>

      {open && (
        <>
          <div className="mb-4">
            <Label className="mb-1.5 block text-xs font-medium text-neutral-500">
              Billing customer
            </Label>
            <CustomerCombobox
              customers={customers}
              value={form.billing_customer_id}
              onChange={onCustomerSelect}
            />
            {form.billing_customer_id && (
              <p className="mt-2 text-xs text-emerald-600">
                ✓ Billing details filled from the customer record. Edit any field below if this
                booking differs (e.g. a one-off GSTIN).
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
            {/* Billing address */}
            <div className="rounded-md border border-neutral-200 p-3">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Billing address
              </h4>
              <div className="space-y-3">
                <Field label="Billing name" required>
                  <Input
                    className="bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300"
                    value={form.billing_name}
                    onChange={(e) => update("billing_name", e.target.value)}
                    placeholder="e.g. Bonison Singh"
                    aria-invalid={!!errors.billing_name}
                  />
                  {errors.billing_name && <p className="text-xs text-red-600">{errors.billing_name}</p>}
                </Field>
                <Field label="Billing phone" required>
                  <Input
                    className="bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300"
                    value={form.billing_phone}
                    onChange={(e) => update("billing_phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10 digit mobile number"
                    inputMode="numeric"
                    aria-invalid={!!errors.billing_phone}
                  />
                  {errors.billing_phone && <p className="text-xs text-red-600">{errors.billing_phone}</p>}
                </Field>
                <Field label="Billing address" required>
                  <Textarea
                    className="bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300"
                    value={form.billing_address}
                    onChange={(e) => update("billing_address", e.target.value)}
                    placeholder="House / street / locality"
                    rows={2}
                    aria-invalid={!!errors.billing_address}
                  />
                  {errors.billing_address && <p className="text-xs text-red-600">{errors.billing_address}</p>}
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City / state">
                    <Input
                      className="bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300"
                      value={form.billing_city_state}
                      onChange={(e) => update("billing_city_state", e.target.value)}
                      placeholder="e.g. Imphal, Manipur"
                    />
                  </Field>
                  <Field label="Pincode" required>
                    <Input
                      className="bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300"
                      value={form.billing_pincode}
                      onChange={(e) => update("billing_pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="795103"
                      inputMode="numeric"
                      aria-invalid={!!errors.billing_pincode}
                    />
                    {errors.billing_pincode && <p className="text-xs text-red-600">{errors.billing_pincode}</p>}
                  </Field>
                </div>
                <Field label="GSTIN (optional)">
                  <Input
                    className="bg-white font-mono text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 placeholder:font-sans border-neutral-300"
                    value={form.billing_gstin}
                    onChange={(e) =>
                      update("billing_gstin", e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15))
                    }
                    placeholder="22AAAAA0000A1Z5"
                  />
                  {errors.billing_gstin && <p className="text-xs text-red-600">{errors.billing_gstin}</p>}
                </Field>
              </div>
            </div>

            {/* Shipping address — frozen (sticky) while the page scrolls, so
                it stays visible while filling in the rest of the form below. */}
            <div className="sticky top-4 rounded-md border border-neutral-200 bg-white p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Shipping address
                </h4>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                    checked={shippingSameAsBilling}
                    onChange={(e) => onShippingSameAsBillingChange(e.target.checked)}
                  />
                  Same as billing
                </label>
              </div>

              {shippingSameAsBilling && (
                <div className="mb-3 rounded-md bg-indigo-50 border border-indigo-200 px-3 py-2 text-xs text-indigo-700">
                  ✓ Mirrors the billing address. Uncheck to enter a different delivery address.
                </div>
              )}

              <div className="space-y-3">
                <Field label="Shipping name" required>
                  <Input
                    className={`bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300 ${shippingSameAsBilling ? "opacity-70 cursor-not-allowed" : ""}`}
                    value={form.shipping_name}
                    onChange={(e) => updateShippingField("name", e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    aria-invalid={!!errors.shipping_name}
                    readOnly={shippingSameAsBilling}
                  />
                  {errors.shipping_name && <p className="text-xs text-red-600">{errors.shipping_name}</p>}
                </Field>
                <Field label="Shipping phone" required>
                  <Input
                    className={`bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300 ${shippingSameAsBilling ? "opacity-70 cursor-not-allowed" : ""}`}
                    value={form.shipping_phone}
                    onChange={(e) => updateShippingField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10 digit mobile number"
                    inputMode="numeric"
                    aria-invalid={!!errors.shipping_phone}
                    readOnly={shippingSameAsBilling}
                  />
                  {errors.shipping_phone && <p className="text-xs text-red-600">{errors.shipping_phone}</p>}
                </Field>
                <Field label="Shipping address" required>
                  <Textarea
                    className={`bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300 ${shippingSameAsBilling ? "opacity-70 cursor-not-allowed" : ""}`}
                    value={form.shipping_address}
                    onChange={(e) => updateShippingField("address", e.target.value)}
                    placeholder="House / street / locality"
                    rows={2}
                    aria-invalid={!!errors.shipping_address}
                    readOnly={shippingSameAsBilling}
                  />
                  {errors.shipping_address && <p className="text-xs text-red-600">{errors.shipping_address}</p>}
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City / state">
                    <Input
                      className={`bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300 ${shippingSameAsBilling ? "opacity-70 cursor-not-allowed" : ""}`}
                      value={form.shipping_city_state}
                      onChange={(e) => updateShippingField("city_state", e.target.value)}
                      placeholder="e.g. Delhi"
                      readOnly={shippingSameAsBilling}
                    />
                  </Field>
                  <Field label="Pincode" required>
                    <Input
                      className={`bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300 ${shippingSameAsBilling ? "opacity-70 cursor-not-allowed" : ""}`}
                      value={form.shipping_pincode}
                      onChange={(e) => updateShippingField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="110001"
                      inputMode="numeric"
                      aria-invalid={!!errors.shipping_pincode}
                      readOnly={shippingSameAsBilling}
                    />
                    {errors.shipping_pincode && <p className="text-xs text-red-600">{errors.shipping_pincode}</p>}
                  </Field>
                </div>
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-neutral-400">
                <Truck className="h-3 w-3" />
                This address is copied into Receiver below automatically.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Save-customer modal
// ---------------------------------------------------------------------------

function SaveCustomerModal({
  form,
  onClose,
  onSaved,
}: {
  form: CargoFormData;
  onClose: () => void;
  onSaved: (customer: CargoCustomer) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [which, setWhich] = useState<"billing" | "sender" | "receiver">("billing");

  const save = async () => {
    setSaving(true);
    const data =
      which === "billing"
        ? {
            name: form.billing_name,
            phone: form.billing_phone,
            address: form.billing_address,
            city_state: form.billing_city_state,
            pincode: form.billing_pincode,
            gstin: form.billing_gstin || "",
          }
        : which === "sender"
        ? {
            name: form.sender_name,
            phone: form.sender_phone,
            address: form.sender_address,
            city_state: form.sender_city_state,
            pincode: form.sender_pincode,
          }
        : {
            name: form.receiver_name,
            phone: form.receiver_phone,
            address: form.receiver_address,
            city_state: form.receiver_city_state,
            pincode: form.receiver_pincode,
          };

    try {
      const res = await fetch("/api/admin/cargo/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Could not save customer");
      toast.success(`${json.data.name} saved as frequent customer`);
      onSaved(json.data as CargoCustomer);
    } catch (err: any) {
      toast.error(err.message || "Could not save customer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-sm font-medium text-neutral-900">Save as frequent customer</h2>
        <p className="mb-4 text-xs text-neutral-500">
          Choose whose details to save. Billing carries the GSTIN if one was entered.
        </p>
        <div className="mb-4 flex gap-2">
          {(["billing", "sender", "receiver"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setWhich(opt)}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium capitalize transition ${
                which === opt
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="mb-4 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600 space-y-1">
          <p className="font-medium text-neutral-800">
            {which === "billing" ? form.billing_name : which === "sender" ? form.sender_name : form.receiver_name}
          </p>
          <p>{which === "billing" ? form.billing_phone : which === "sender" ? form.sender_phone : form.receiver_phone}</p>
          <p>{which === "billing" ? form.billing_address : which === "sender" ? form.sender_address : form.receiver_address}</p>
          {which === "billing" && form.billing_gstin && (
            <p className="font-mono text-neutral-500">GSTIN: {form.billing_gstin}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={save}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save customer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bulk upload modal
// ---------------------------------------------------------------------------

interface BulkRow {
  rowNumber: number; // 1-based, matches CSV data row (excluding header)
  data: CargoFormData;
  errors: RowErrors;
  status: "pending" | "uploading" | "success" | "error";
  message?: string;
  trackingId?: string;
}

function BulkUploadModal({
  onClose,
  onAllDone,
}: {
  onClose: () => void;
  onAllDone: () => void;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<"select" | "preview" | "uploading" | "done">("select");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const validCount = rows.filter((r) => Object.keys(r.errors).length === 0).length;
  const invalidCount = rows.length - validCount;
  const successCount = rows.filter((r) => r.status === "success").length;
  const errorCount = rows.filter((r) => r.status === "error").length;

  const handleFile = (file: File) => {
    setParseError(null);
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (results) => {
        if (!results.data.length) {
          setParseError("This file has no data rows.");
          return;
        }
        // Bulk rows use the lenient validator — nothing is required here,
        // only malformed values (when present) get flagged. This lets
        // partially-filled CSVs go straight to the DB.
        const parsed: BulkRow[] = results.data.map((raw, i) => {
          const data = mapCsvRow(raw);
          return {
            rowNumber: i + 1,
            data,
            errors: validateBulkRow(data),
            status: "pending",
          };
        });
        setRows(parsed);
        setStage("preview");
      },
      error: (err) => setParseError(err.message || "Could not read this CSV file."),
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const uploadAll = async () => {
    setStage("uploading");
    const toUpload = rows.filter((r) => Object.keys(r.errors).length === 0 && r.status !== "success");
    let done = 0;

    for (const row of toUpload) {
      setRows((prev) =>
        prev.map((r) => (r.rowNumber === row.rowNumber ? { ...r, status: "uploading" } : r))
      );

      const trackingId = generateTrackingId();
      try {
        const payload = buildBookingPayload(row.data, trackingId);
        const fd = new FormData();
        fd.append("payload", JSON.stringify(payload));

        const res = await fetch("/api/admin/cargo/bookings", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Could not create booking");

        setRows((prev) =>
          prev.map((r) =>
            r.rowNumber === row.rowNumber
              ? { ...r, status: "success", trackingId }
              : r
          )
        );
      } catch (err: any) {
        setRows((prev) =>
          prev.map((r) =>
            r.rowNumber === row.rowNumber
              ? { ...r, status: "error", message: err.message || "Upload failed" }
              : r
          )
        );
      }

      done += 1;
      setProgress(Math.round((done / toUpload.length) * 100));
    }

    setStage("done");
    onAllDone();
  };

  const retryFailed = () => {
    setRows((prev) => prev.map((r) => (r.status === "error" ? { ...r, status: "pending" } : r)));
    uploadAll();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-neutral-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Bulk upload bookings</h2>
            <p className="text-xs text-neutral-500">Upload many orders at once from a CSV file</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Stage: select file */}
          {stage === "select" && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 px-6 py-10 text-center hover:border-emerald-400"
              >
                <Upload className="h-8 w-8 text-neutral-400" />
                <p className="text-sm font-medium text-neutral-700">
                  Drag & drop a CSV file here, or
                </p>
                <label className="cursor-pointer text-sm font-medium text-emerald-700 underline underline-offset-2">
                  browse for a file
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </label>
                <p className="text-xs text-neutral-400">.csv files only</p>
              </div>

              {parseError && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {parseError}
                </div>
              )}

              <button
                type="button"
                onClick={downloadCsvTemplate}
                className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800"
              >
                <Download className="h-3.5 w-3.5" />
                Download CSV template
              </button>

              <div className="rounded-md bg-neutral-50 p-3 text-xs text-neutral-500">
                No columns are required — fill in whatever you have for each row and leave the
                rest blank; blank cells are stored as empty/null. A row left completely blank
                (no fields filled in at all) is rejected. Delivery mode, when provided, must be
                one of "Indian Post", "Normal Cargo", "Express Cargo" — anything else is treated
                as unset. Shipping columns auto-fill from Billing when left blank; Receiver
                columns auto-fill from Shipping when left blank. billing_gstin is validated only
                if you fill it in (GSTIN format). tax_percent defaults to 0 when left blank (if
                filled, it must be 0–100).
              </div>
            </div>
          )}

          {/* Stage: preview */}
          {stage === "preview" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="text-neutral-500">{fileName}</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                  {validCount} ready to upload
                </span>
                {invalidCount > 0 && (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-700">
                    {invalidCount} need fixing
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setStage("select");
                    setRows([]);
                    setFileName("");
                  }}
                  className="ml-auto text-neutral-400 underline underline-offset-2 hover:text-neutral-700"
                >
                  Choose a different file
                </button>
              </div>

              <div className="max-h-80 overflow-auto rounded-lg border border-neutral-200">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-neutral-50 text-neutral-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Row</th>
                      <th className="px-3 py-2 font-medium">Billing</th>
                      <th className="px-3 py-2 font-medium">Sender</th>
                      <th className="px-3 py-2 font-medium">Receiver</th>
                      <th className="px-3 py-2 font-medium">Product</th>
                      <th className="px-3 py-2 font-medium">Charge</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {rows.map((r) => {
                      const hasErrors = Object.keys(r.errors).length > 0;
                      return (
                        <tr key={r.rowNumber} className={hasErrors ? "bg-red-50/50" : ""}>
                          <td className="px-3 py-2 text-neutral-400">{r.rowNumber}</td>
                          <td className="px-3 py-2 text-neutral-700">
                            {r.data.billing_name || "—"}
                          </td>
                          <td className="px-3 py-2 text-neutral-700">
                            {r.data.sender_name || "—"}
                          </td>
                          <td className="px-3 py-2 text-neutral-700">
                            {r.data.receiver_name || "—"}
                          </td>
                          <td className="px-3 py-2 text-neutral-700">
                            {r.data.product_name || "—"}
                          </td>
                          <td className="px-3 py-2 font-mono text-neutral-700">
                            {r.data.estimate_charge ? `₹${r.data.estimate_charge}` : "—"}
                          </td>
                          <td className="px-3 py-2 max-w-[220px]">
                            {hasErrors ? (
                              <span className="text-red-600">
                                {r.errors.billing_name === "Row is completely empty"
                                  ? "Row is completely empty"
                                  : Object.entries(r.errors)
                                      .map(([field, msg]) => `${field}: ${msg}`)
                                      .join("; ")}
                              </span>
                            ) : (
                              <span className="text-emerald-600">Ready</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {invalidCount > 0 && (
                <p className="text-xs text-neutral-500">
                  Rows with errors will be skipped. Fix them in your CSV and re-upload if needed.
                </p>
              )}
            </div>
          )}

          {/* Stage: uploading */}
          {stage === "uploading" && (
            <div className="space-y-4 py-6">
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-sm text-neutral-600">
                Uploading bookings… {progress}%
              </p>
            </div>
          )}

          {/* Stage: done */}
          {stage === "done" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="text-sm text-emerald-800">
                  {successCount} booking{successCount === 1 ? "" : "s"} created successfully.
                </p>
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-800">
                    {errorCount} row{errorCount === 1 ? "" : "s"} failed to upload.
                  </p>
                </div>
              )}

              <div className="max-h-64 overflow-auto rounded-lg border border-neutral-200">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-neutral-50 text-neutral-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Row</th>
                      <th className="px-3 py-2 font-medium">Product</th>
                      <th className="px-3 py-2 font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {rows
                      .filter((r) => r.status === "success" || r.status === "error")
                      .map((r) => (
                        <tr key={r.rowNumber}>
                          <td className="px-3 py-2 text-neutral-400">{r.rowNumber}</td>
                          <td className="px-3 py-2 text-neutral-700">{r.data.product_name}</td>
                          <td className="px-3 py-2">
                            {r.status === "success" ? (
                              <span className="font-mono text-emerald-700">{r.trackingId}</span>
                            ) : (
                              <span className="text-red-600">{r.message}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-neutral-100 px-6 py-4">
          {stage === "preview" && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={uploadAll}
                disabled={validCount === 0}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload {validCount} booking{validCount === 1 ? "" : "s"}
              </Button>
            </>
          )}
          {stage === "done" && (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {errorCount > 0 && (
                <Button variant="outline" onClick={retryFailed}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Retry failed
                </Button>
              )}
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => router.push("/admin/cargo")}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Go to dashboard
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CargoBookingForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<CargoFormData>(emptyForm);
  const [trackingId, setTrackingId] = useState(generateTrackingId);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<RowErrors>({});
  const [customers, setCustomers] = useState<CargoCustomer[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [successData, setSuccessData] = useState<{ trackingId: string; bookingId: string } | null>(null);

  // "Same as billing" state for Sender — mirrors billing_* into sender_*
  const [senderSameAsBilling, setSenderSameAsBilling] = useState(false);
  // "Same as billing" state for Shipping — also drives Receiver, see effect below
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(false);

  // Collapse state for the plain (non-componentized) sections further down
  // the form — each section remembers its own open/closed state.
  const [packageOpen, setPackageOpen] = useState(true);
  const [chargesOpen, setChargesOpen] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(true);

  useEffect(() => {
    fetch("/api/admin/cargo/customers")
      .then((res) => res.json())
      .then((json) => setCustomers((json.data as CargoCustomer[]) ?? []))
      .catch((err) => console.error("Customers fetch error:", err));
  }, []);

  const update = <K extends keyof CargoFormData>(key: K, value: CargoFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // Writes a Sender field. Kept separate from updateShippingField since
  // Sender has no downstream field it needs to mirror into.
  const updateSenderField = (suffix: AddressSuffix, value: string) => {
    const senderKey = `sender_${suffix}` as keyof CargoFormData;
    setForm((prev) => ({ ...prev, [senderKey]: value }));
    setErrors((prev) => ({ ...prev, [senderKey]: undefined }));
  };

  // Writes a Shipping field and mirrors it straight into the matching
  // Receiver field, so Shipping never needs to be entered twice.
  const updateShippingField = (suffix: AddressSuffix, value: string) => {
    const shippingKey = `shipping_${suffix}` as keyof CargoFormData;
    const receiverKey = `receiver_${suffix}` as keyof CargoFormData;
    setForm((prev) => ({ ...prev, [shippingKey]: value, [receiverKey]: value }));
    setErrors((prev) => ({ ...prev, [shippingKey]: undefined, [receiverKey]: undefined }));
  };

  // Keeps Sender in sync with Billing whenever "Same as billing" is
  // checked — including when the billing customer or any billing field
  // changes afterwards.
  useEffect(() => {
    if (!senderSameAsBilling) return;
    ADDRESS_SUFFIXES.forEach((suffix) => {
      const billingKey = `billing_${suffix}` as keyof CargoFormData;
      updateSenderField(suffix, form[billingKey] as string);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    senderSameAsBilling,
    form.billing_name,
    form.billing_phone,
    form.billing_address,
    form.billing_city_state,
    form.billing_pincode,
  ]);

  const handleSenderSameAsBillingChange = (checked: boolean) => {
    setSenderSameAsBilling(checked);
    if (!checked) {
      ADDRESS_SUFFIXES.forEach((suffix) => updateSenderField(suffix, ""));
    }
    // If checked, the effect above fills Sender from Billing.
  };

  // Keeps Shipping (and therefore Receiver) in sync with Billing whenever
  // "Same as billing" is checked — including when the billing customer or
  // any billing field changes afterwards.
  useEffect(() => {
    if (!shippingSameAsBilling) return;
    ADDRESS_SUFFIXES.forEach((suffix) => {
      const billingKey = `billing_${suffix}` as keyof CargoFormData;
      updateShippingField(suffix, form[billingKey] as string);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    shippingSameAsBilling,
    form.billing_name,
    form.billing_phone,
    form.billing_address,
    form.billing_city_state,
    form.billing_pincode,
  ]);

  const handleShippingSameAsBillingChange = (checked: boolean) => {
    setShippingSameAsBilling(checked);
    if (!checked) {
      ADDRESS_SUFFIXES.forEach((suffix) => updateShippingField(suffix, ""));
    }
    // If checked, the effect above fills Shipping/Receiver from Billing.
  };

  const handleCustomerSelect = (customerId: string) => {
    if (!customerId) {
      update("billing_customer_id", "");
      return;
    }
    const c = customers.find((c) => c.id === customerId);
    if (!c) return;

    setForm((prev) => ({
      ...prev,
      billing_customer_id: customerId,
      billing_name: c.name,
      billing_phone: c.phone,
      billing_address: c.address,
      billing_city_state: c.city_state ?? "",
      billing_pincode: c.pincode ?? "",
      billing_gstin: c.gstin ?? "",
    }));
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const validate = () => {
    const next = validateBookingData(form);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const resetForm = () => {
    setForm(emptyForm);
    removePhoto();
    setTrackingId(generateTrackingId());
    setErrors({});
    setSenderSameAsBilling(false);
    setShippingSameAsBilling(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Check the highlighted fields before booking.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildBookingPayload(form, trackingId);

      const fd = new FormData();
      fd.append("payload", JSON.stringify(payload));
      if (photoFile) fd.append("photo", photoFile);

      const res = await fetch("/api/admin/cargo/bookings", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Could not create booking");

      setSuccessData({ trackingId, bookingId: json.data.id });
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Could not create booking");
    } finally {
      setSubmitting(false);
    }
  };

  const total = sumCharges(form);

  return (
    <>
      {successData && (
        <SuccessModal
          trackingId={successData.trackingId}
          bookingId={successData.bookingId}
          onNewOrder={() => {
            setSuccessData(null);
            resetForm();
          }}
          onDashboard={() => router.push("/admin/cargo")}
        />
      )}

      {showSaveModal && (
        <SaveCustomerModal
          form={form}
          onClose={() => setShowSaveModal(false)}
          onSaved={(c) => {
            setCustomers((prev) => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)));
            setShowSaveModal(false);
          }}
        />
      )}

      {showBulkModal && (
        <BulkUploadModal
          onClose={() => setShowBulkModal(false)}
          onAllDone={() => onSuccess?.()}
        />
      )}

      <div className="min-h-screen bg-white">
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl px-4 py-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium text-neutral-900">New booking</h1>
              <p className="text-sm text-neutral-500">Enter shipper and consignee details</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBulkModal(true)}
                className="border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
              >
                <Upload className="mr-1.5 h-4 w-4" />
                Bulk upload
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/cargo")}
                className="border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
              >
                <List className="mr-1.5 h-4 w-4" />
                View bookings
              </Button>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wide text-neutral-400">Tracking ID</p>
                <p className="font-mono text-sm font-medium text-emerald-700">{trackingId}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Billing & Shipping */}
            <BillingShippingCard
              form={form}
              errors={errors}
              update={update}
              customers={customers}
              onCustomerSelect={handleCustomerSelect}
              shippingSameAsBilling={shippingSameAsBilling}
              onShippingSameAsBillingChange={handleShippingSameAsBillingChange}
              updateShippingField={updateShippingField}
              onSaveCustomer={() => setShowSaveModal(true)}
            />

            {/* Sender + Receiver */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <PartyCard
                title="Sender"
                prefix="sender"
                form={form}
                errors={errors}
                update={update}
                sameAsLabel="billing address"
                sameAsChecked={senderSameAsBilling}
                onSameAsChange={handleSenderSameAsBillingChange}
              />
              <PartyCard
                title="Receiver"
                prefix="receiver"
                form={form}
                errors={errors}
                update={update}
              />
            </div>

            {/* Package */}
            <div className="rounded-lg border border-neutral-200 p-4">
              <div className={packageOpen ? "mb-4 flex items-center gap-2 text-sm font-medium text-neutral-900" : "flex items-center gap-2 text-sm font-medium text-neutral-900"}>
                <CollapseToggle open={packageOpen} onToggle={() => setPackageOpen((o) => !o)} />
                <PackageCheck className="h-4 w-4 text-emerald-600" />
                Package & delivery
              </div>
              {packageOpen && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Product name" required>
                  <Input
                    className="bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300"
                    value={form.product_name}
                    onChange={(e) => update("product_name", e.target.value)}
                    placeholder="e.g. Clothes"
                    aria-invalid={!!errors.product_name}
                  />
                  {errors.product_name && <p className="text-xs text-red-600">{errors.product_name}</p>}
                </Field>
                <Field label="Weight estimate (kg)" required>
                  <Input
                    className="bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300"
                    value={form.weight_estimate}
                    onChange={(e) => update("weight_estimate", e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="10"
                    inputMode="decimal"
                    aria-invalid={!!errors.weight_estimate}
                  />
                  {errors.weight_estimate && <p className="text-xs text-red-600">{errors.weight_estimate}</p>}
                </Field>
                <Field label="Delivery mode" required>
                  <Select
                    value={form.delivery_mode}
                    onValueChange={(v) => update("delivery_mode", v as CargoFormData["delivery_mode"])}
                  >
                    <SelectTrigger className="bg-white text-neutral-900 border-neutral-300" aria-invalid={!!errors.delivery_mode}>
                      <SelectValue placeholder="Choose mode" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-neutral-900">
                      <SelectItem value="Indian Post">Indian Post</SelectItem>
                      <SelectItem value="Normal Cargo">Normal Cargo</SelectItem>
                      <SelectItem value="Express Cargo">Express Cargo</SelectItem>
                      <SelectItem value="Surface(By Road)">Surface(By Road)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.delivery_mode && <p className="text-xs text-red-600">{errors.delivery_mode}</p>}
                </Field>
                <Field label="Current status">
                  <Select
                    value={form.status}
                    onValueChange={(v) => update("status", v as CargoFormData["status"])}
                  >
                    <SelectTrigger className="bg-white text-neutral-900 border-neutral-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-neutral-900">
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Dispatched">Dispatched</SelectItem>
                      <SelectItem value="Out for Delivery">Out for delivery</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <div className="flex items-center gap-6 sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                      checked={form.pickup_required}
                      onChange={(e) => update("pickup_required", e.target.checked)}
                    />
                    Pickup required
                  </label>
                  <label className="flex items-center gap-2 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                      checked={form.delivery_required}
                      onChange={(e) => update("delivery_required", e.target.checked)}
                    />
                    Delivery required
                  </label>
                </div>

                <Field label="Third-party tracking (optional)">
                  <Input
                    className="bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300"
                    value={form.third_party_tracking}
                    onChange={(e) => update("third_party_tracking", e.target.value)}
                    placeholder="Courier partner AWB number"
                  />
                </Field>

                <Field label="Package photo">
                  {!photoPreview ? (
                    <label className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-neutral-300 text-xs text-neutral-500 hover:border-emerald-400 hover:text-emerald-700">
                      <Camera className="h-3.5 w-3.5" />
                      Upload photo
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                    </label>
                  ) : (
                    <div className="relative h-9 w-9 overflow-hidden rounded-md border border-neutral-200">
                      <img src={photoPreview} alt="Package preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -right-1 -top-1 rounded-full bg-neutral-900/80 p-0.5 text-white"
                        aria-label="Remove photo"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  )}
                </Field>

                <Field label="Notes" className="sm:col-span-2">
                  <Textarea
                    className="bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300"
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    placeholder="Fragile, handle with care, etc."
                    rows={2}
                  />
                </Field>
              </div>
              )}
            </div>

            {/* Charges */}
            <div className="rounded-lg border border-neutral-200 p-4">
              <div className={chargesOpen ? "mb-4 flex items-center gap-1.5" : "flex items-center gap-1.5"}>
                <CollapseToggle open={chargesOpen} onToggle={() => setChargesOpen((o) => !o)} />
                <h3 className="text-sm font-medium text-neutral-900">Charges</h3>
              </div>
              {chargesOpen && (
              <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="Freight charge" required>
                  <Input
                    className="bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300"
                    value={form.estimate_charge}
                    onChange={(e) => update("estimate_charge", e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="100"
                    inputMode="decimal"
                    aria-invalid={!!errors.estimate_charge}
                  />
                  {errors.estimate_charge && <p className="text-xs text-red-600">{errors.estimate_charge}</p>}
                </Field>
                <Field label="Handling charge">
                  <Input
                    className="bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300"
                    value={form.handling_charge}
                    onChange={(e) => update("handling_charge", e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0"
                    inputMode="decimal"
                  />
                </Field>
                <Field label="Docket charge">
                  <Input
                    className="bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300"
                    value={form.docket_charge}
                    onChange={(e) => update("docket_charge", e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0"
                    inputMode="decimal"
                  />
                </Field>
                <Field label="Pickup charge">
                  <Input
                    className="bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300"
                    value={form.pickup_charge}
                    onChange={(e) => update("pickup_charge", e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0"
                    inputMode="decimal"
                  />
                </Field>
                <Field label="Packaging charge">
                  <Input
                    className="bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300"
                    value={form.packaging_charge}
                    onChange={(e) => update("packaging_charge", e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0"
                    inputMode="decimal"
                  />
                </Field>
                <Field label="Extra mile delivery">
                  <Input
                    className="bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300"
                    value={form.extra_mile_delivery}
                    onChange={(e) => update("extra_mile_delivery", e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0"
                    inputMode="decimal"
                  />
                </Field>
                <Field label="Final charge (optional)">
                  <Input
                    className="bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300"
                    value={form.final_charge}
                    onChange={(e) => update("final_charge", e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="Settled after delivery"
                    inputMode="decimal"
                  />
                </Field>
                <Field label="Tax % (optional)">
                  <Input
                    className="bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300"
                    value={form.tax_percent}
                    onChange={(e) => update("tax_percent", e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="e.g. 18"
                    inputMode="decimal"
                    aria-invalid={!!errors.tax_percent}
                  />
                  {errors.tax_percent && <p className="text-xs text-red-600">{errors.tax_percent}</p>}
                </Field>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-md bg-emerald-50 px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                  Charges total
                </span>
                <span className="font-mono text-base font-medium text-emerald-800">
                  ₹{total.toFixed(2)}
                </span>
              </div>
              {form.tax_percent && parseFloat(form.tax_percent) > 0 && (
                <div className="mt-2 flex items-center justify-between rounded-md bg-neutral-50 px-4 py-2 text-xs text-neutral-500">
                  <span>Tax ({form.tax_percent}%) — shown on the invoice, not added to amount paid</span>
                  <span className="font-mono">
                    ₹{(total * (parseFloat(form.tax_percent) / 100)).toFixed(2)}
                  </span>
                </div>
              )}
              </>
              )}
            </div>

            {/* Payment status */}
            <div className="rounded-lg border border-neutral-200 p-4">
              <div className={paymentOpen ? "mb-4 flex items-center gap-2 text-sm font-medium text-neutral-900" : "flex items-center gap-2 text-sm font-medium text-neutral-900"}>
                <CollapseToggle open={paymentOpen} onToggle={() => setPaymentOpen((o) => !o)} />
                <CreditCard className="h-4 w-4 text-emerald-600" />
                Payment
              </div>
              {paymentOpen && (
              <>
              <div className="flex flex-wrap gap-3">
                {(["paid", "unpaid", "partial"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => update("payment_status", opt)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition ${
                      form.payment_status === opt
                        ? opt === "paid"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : opt === "unpaid"
                          ? "border-red-400 bg-red-50 text-red-700"
                          : "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                    }`}
                  >
                    {opt === "paid" ? "✓ Paid" : opt === "unpaid" ? "✗ Unpaid" : "~ Partial"}
                  </button>
                ))}
              </div>

              {form.payment_status === "partial" && (
                <div className="mt-4 max-w-xs">
                  <Field label="Amount paid now" required>
                    <Input
                      className="bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 border-neutral-300"
                      value={form.amount_paid}
                      onChange={(e) => update("amount_paid", e.target.value.replace(/[^0-9.]/g, ""))}
                      placeholder="e.g. 500"
                      inputMode="decimal"
                      aria-invalid={!!errors.amount_paid}
                    />
                    {errors.amount_paid && <p className="text-xs text-red-600">{errors.amount_paid}</p>}
                    {form.amount_paid && total > 0 && (
                      <p className="mt-1 text-xs text-neutral-500">
                        Remaining: ₹{Math.max(0, total - parseFloat(form.amount_paid)).toFixed(2)}
                      </p>
                    )}
                  </Field>
                </div>
              )}

              {form.payment_status === "unpaid" && !form.billing_customer_id && (
                <p className="mt-3 text-xs text-amber-600">
                  Tip: link a billing customer so this unpaid amount appears in their ledger.
                </p>
              )}
              {form.payment_status === "unpaid" && form.billing_customer_id && (
                <p className="mt-3 text-xs text-neutral-500">
                  ₹{total.toFixed(2)} will be recorded as outstanding for this customer.
                </p>
              )}
              </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <p className="mr-auto text-xs text-neutral-400">* required fields</p>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                "Confirm booking"
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}