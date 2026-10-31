"use client";

import React, { useState } from "react";
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
  Truck,
  PackageCheck,
  MapPin,
  User,
  Phone,
  IndianRupee,
  Camera,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CargoFormData {
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
  delivery_mode: "standard" | "express" | "";
  pickup_required: boolean;
  delivery_required: boolean;
  notes: string;
  status: "Pending" | "Out for Delivery" | "Delivered";
  handling_charge: string;
  docket_charge: string;
  pickup_charge: string;
  packaging_charge: string;
  extra_mile_delivery: string;
  estimate_charge: string;
  final_charge: string;
  third_party_tracking: string;
}

const emptyForm: CargoFormData = {
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
  handling_charge: "",
  docket_charge: "",
  pickup_charge: "",
  packaging_charge: "",
  extra_mile_delivery: "",
  estimate_charge: "",
  final_charge: "",
  third_party_tracking: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTrackingId() {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `SBX-${rand}`;
}

function sumCharges(data: CargoFormData) {
  const fields = [
    data.handling_charge,
    data.docket_charge,
    data.pickup_charge,
    data.packaging_charge,
    data.extra_mile_delivery,
  ];
  return fields.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SectionHeading = ({
  index,
  icon: Icon,
  title,
  subtitle,
}: {
  index: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700 ring-1 ring-amber-200">
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex-1">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[11px] tracking-widest text-slate-400">
          {index}
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
          {title}
        </h3>
      </div>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  </div>
);

const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium text-slate-600">
      {label}
      {required && <span className="ml-0.5 text-amber-600">*</span>}
    </Label>
    {children}
  </div>
);

export default function CargoBookingForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const supabase = useSupabaseClient();
  const [form, setForm] = useState<CargoFormData>(emptyForm);
  const [trackingId] = useState(generateTrackingId());
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CargoFormData, string>>>({});

  const update = <K extends keyof CargoFormData>(key: K, value: CargoFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
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
    const next: Partial<Record<keyof CargoFormData, string>> = {};
    if (!form.sender_name.trim()) next.sender_name = "Required";
    if (!/^\d{10}$/.test(form.sender_phone)) next.sender_phone = "10 digit number";
    if (!form.sender_address.trim()) next.sender_address = "Required";
    if (!/^\d{6}$/.test(form.sender_pincode)) next.sender_pincode = "6 digit pincode";
    if (!form.receiver_name.trim()) next.receiver_name = "Required";
    if (!/^\d{10}$/.test(form.receiver_phone)) next.receiver_phone = "10 digit number";
    if (!form.receiver_address.trim()) next.receiver_address = "Required";
    if (!/^\d{6}$/.test(form.receiver_pincode)) next.receiver_pincode = "6 digit pincode";
    if (!form.product_name.trim()) next.product_name = "Required";
    if (!form.weight_estimate || parseFloat(form.weight_estimate) <= 0)
      next.weight_estimate = "Enter a weight";
    if (!form.delivery_mode) next.delivery_mode = "Choose a mode";
    if (!form.estimate_charge || parseFloat(form.estimate_charge) <= 0)
      next.estimate_charge = "Enter an estimate";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Check the highlighted fields before booking.");
      return;
    }
    setSubmitting(true);
    try {
      let photo_url = "";
      if (photoFile) {
        const path = `bookings/${trackingId}-${photoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("cargo-photos")
          .upload(path, photoFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage
          .from("cargo-photos")
          .getPublicUrl(path);
        photo_url = publicUrl.publicUrl;
      }

      const payload = {
        ...form,
        tracking_id: trackingId,
        photo_url,
        weight_estimate: parseFloat(form.weight_estimate),
        handling_charge: form.handling_charge ? parseFloat(form.handling_charge) : null,
        docket_charge: form.docket_charge ? parseFloat(form.docket_charge) : null,
        pickup_charge: form.pickup_charge ? parseFloat(form.pickup_charge) : null,
        packaging_charge: form.packaging_charge ? parseFloat(form.packaging_charge) : null,
        extra_mile_delivery: form.extra_mile_delivery
          ? parseFloat(form.extra_mile_delivery)
          : null,
        estimate_charge: parseFloat(form.estimate_charge),
        final_charge: form.final_charge ? parseFloat(form.final_charge) : null,
      };

      const response = await fetch("/api/book-cargo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success(`Booking ${trackingId} created`);
      setForm(emptyForm);
      removePhoto();
      onSuccess?.();
    } catch (err) {
      toast.error((err as Error).message || "Could not create booking");
    } finally {
      setSubmitting(false);
    }
  };

  const total = sumCharges(form) + (parseFloat(form.estimate_charge) || 0);

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
      {/* Waybill header strip */}
      <div className="overflow-hidden rounded-t-lg border border-slate-200 bg-slate-900">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-400 text-slate-900">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">New cargo booking</p>
              <p className="text-xs text-slate-400">Fill in shipper, consignee and package details</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Tracking ID</p>
            <p className="font-mono text-sm font-semibold text-amber-400">{trackingId}</p>
          </div>
        </div>
      </div>

      <div className="space-y-8 rounded-b-lg border border-t-0 border-slate-200 bg-white px-5 py-7 sm:px-7">
        {/* Sender */}
        <section>
          <SectionHeading index="01" icon={User} title="Shipper details" subtitle="Who is sending the package" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Sender name" required>
              <Input
                value={form.sender_name}
                onChange={(e) => update("sender_name", e.target.value)}
                placeholder="e.g. Bonison"
                aria-invalid={!!errors.sender_name}
              />
              {errors.sender_name && <p className="text-xs text-red-600">{errors.sender_name}</p>}
            </Field>
            <Field label="Phone number" required>
              <Input
                value={form.sender_phone}
                onChange={(e) => update("sender_phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10 digit mobile number"
                inputMode="numeric"
                aria-invalid={!!errors.sender_phone}
              />
              {errors.sender_phone && <p className="text-xs text-red-600">{errors.sender_phone}</p>}
            </Field>
            <Field label="Pickup address" required>
              <Textarea
                value={form.sender_address}
                onChange={(e) => update("sender_address", e.target.value)}
                placeholder="House / street / locality"
                rows={2}
                aria-invalid={!!errors.sender_address}
              />
              {errors.sender_address && <p className="text-xs text-red-600">{errors.sender_address}</p>}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="City / state">
                <Input
                  value={form.sender_city_state}
                  onChange={(e) => update("sender_city_state", e.target.value)}
                  placeholder="e.g. Imphal, Manipur"
                />
              </Field>
              <Field label="Pincode" required>
                <Input
                  value={form.sender_pincode}
                  onChange={(e) => update("sender_pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="795103"
                  inputMode="numeric"
                  aria-invalid={!!errors.sender_pincode}
                />
                {errors.sender_pincode && <p className="text-xs text-red-600">{errors.sender_pincode}</p>}
              </Field>
            </div>
          </div>
        </section>

        <div className="border-t border-dashed border-slate-200" />

        {/* Receiver */}
        <section>
          <SectionHeading index="02" icon={MapPin} title="Consignee details" subtitle="Who is receiving the package" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Receiver name" required>
              <Input
                value={form.receiver_name}
                onChange={(e) => update("receiver_name", e.target.value)}
                placeholder="e.g. Swarup"
                aria-invalid={!!errors.receiver_name}
              />
              {errors.receiver_name && <p className="text-xs text-red-600">{errors.receiver_name}</p>}
            </Field>
            <Field label="Phone number" required>
              <Input
                value={form.receiver_phone}
                onChange={(e) => update("receiver_phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10 digit mobile number"
                inputMode="numeric"
                aria-invalid={!!errors.receiver_phone}
              />
              {errors.receiver_phone && <p className="text-xs text-red-600">{errors.receiver_phone}</p>}
            </Field>
            <Field label="Delivery address" required>
              <Textarea
                value={form.receiver_address}
                onChange={(e) => update("receiver_address", e.target.value)}
                placeholder="House / street / locality"
                rows={2}
                aria-invalid={!!errors.receiver_address}
              />
              {errors.receiver_address && <p className="text-xs text-red-600">{errors.receiver_address}</p>}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="City / state">
                <Input
                  value={form.receiver_city_state}
                  onChange={(e) => update("receiver_city_state", e.target.value)}
                  placeholder="e.g. Delhi"
                />
              </Field>
              <Field label="Pincode" required>
                <Input
                  value={form.receiver_pincode}
                  onChange={(e) => update("receiver_pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="110074"
                  inputMode="numeric"
                  aria-invalid={!!errors.receiver_pincode}
                />
                {errors.receiver_pincode && <p className="text-xs text-red-600">{errors.receiver_pincode}</p>}
              </Field>
            </div>
          </div>
        </section>

        <div className="border-t border-dashed border-slate-200" />

        {/* Package */}
        <section>
          <SectionHeading index="03" icon={PackageCheck} title="Package & delivery" subtitle="What is being shipped and how" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Product name" required>
              <Input
                value={form.product_name}
                onChange={(e) => update("product_name", e.target.value)}
                placeholder="e.g. Clothes"
                aria-invalid={!!errors.product_name}
              />
              {errors.product_name && <p className="text-xs text-red-600">{errors.product_name}</p>}
            </Field>
            <Field label="Weight estimate (kg)" required>
              <Input
                value={form.weight_estimate}
                onChange={(e) => update("weight_estimate", e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="10"
                inputMode="decimal"
                aria-invalid={!!errors.weight_estimate}
              />
              {errors.weight_estimate && <p className="text-xs text-red-600">{errors.weight_estimate}</p>}
            </Field>
            <Field label="Delivery mode" required>
              <Select value={form.delivery_mode} onValueChange={(v) => update("delivery_mode", v as CargoFormData["delivery_mode"])}>
                <SelectTrigger aria-invalid={!!errors.delivery_mode}>
                  <SelectValue placeholder="Choose mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="express">Express</SelectItem>
                </SelectContent>
              </Select>
              {errors.delivery_mode && <p className="text-xs text-red-600">{errors.delivery_mode}</p>}
            </Field>
            <Field label="Current status">
              <Select value={form.status} onValueChange={(v) => update("status", v as CargoFormData["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Out for Delivery">Out for delivery</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div className="flex items-center gap-6 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  checked={form.pickup_required}
                  onChange={(e) => update("pickup_required", e.target.checked)}
                />
                Pickup required
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  checked={form.delivery_required}
                  onChange={(e) => update("delivery_required", e.target.checked)}
                />
                Delivery required
              </label>
            </div>

            <Field label="Third-party tracking (optional)">
              <Input
                value={form.third_party_tracking}
                onChange={(e) => update("third_party_tracking", e.target.value)}
                placeholder="Courier partner AWB number"
              />
            </Field>

            <Field label="Package photo">
              {!photoPreview ? (
                <label className="flex h-[72px] cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 text-xs text-slate-500 hover:border-amber-400 hover:text-amber-700">
                  <Camera className="h-4 w-4" />
                  Upload photo
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                </label>
              ) : (
                <div className="relative h-[72px] w-[72px] overflow-hidden rounded-md border border-slate-200">
                  <img src={photoPreview} alt="Package preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute right-0.5 top-0.5 rounded-full bg-slate-900/80 p-0.5 text-white"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </Field>

            <Field label="Notes">
              <Textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Fragile, handle with care, etc."
                rows={2}
                className="sm:col-span-2"
              />
            </Field>
          </div>
        </section>

        <div className="border-t border-dashed border-slate-200" />

        {/* Charges */}
        <section>
          <SectionHeading index="04" icon={IndianRupee} title="Charges" subtitle="Breakdown used to compute the final bill" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Estimate charge" required>
              <Input
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
                value={form.handling_charge}
                onChange={(e) => update("handling_charge", e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0"
                inputMode="decimal"
              />
            </Field>
            <Field label="Docket charge">
              <Input
                value={form.docket_charge}
                onChange={(e) => update("docket_charge", e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0"
                inputMode="decimal"
              />
            </Field>
            <Field label="Pickup charge">
              <Input
                value={form.pickup_charge}
                onChange={(e) => update("pickup_charge", e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0"
                inputMode="decimal"
              />
            </Field>
            <Field label="Packaging charge">
              <Input
                value={form.packaging_charge}
                onChange={(e) => update("packaging_charge", e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0"
                inputMode="decimal"
              />
            </Field>
            <Field label="Extra mile delivery">
              <Input
                value={form.extra_mile_delivery}
                onChange={(e) => update("extra_mile_delivery", e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0"
                inputMode="decimal"
              />
            </Field>
            <Field label="Final charge (optional)">
              <Input
                value={form.final_charge}
                onChange={(e) => update("final_charge", e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="Settled after delivery"
                inputMode="decimal"
              />
            </Field>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-md bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Charges total
            </span>
            <span className="font-mono text-base font-semibold text-slate-900">
              ₹{total.toFixed(2)}
            </span>
          </div>
        </section>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between rounded-b-lg border border-t-0 border-slate-200 bg-slate-50 px-5 py-4 sm:px-7">
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          Fields marked with * are required
        </p>
        <Button type="submit" disabled={submitting} className="bg-amber-500 text-slate-900 hover:bg-amber-400">
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
  );
}