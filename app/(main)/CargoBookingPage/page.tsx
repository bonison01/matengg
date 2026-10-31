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
  PackageCheck,
  Camera,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

const PartyCard = ({
  title,
  prefix,
  form,
  errors,
  update,
}: {
  title: string;
  prefix: "sender" | "receiver";
  form: CargoFormData;
  errors: Partial<Record<keyof CargoFormData, string>>;
  update: <K extends keyof CargoFormData>(key: K, value: CargoFormData[K]) => void;
}) => {
  const name = `${prefix}_name` as const;
  const phone = `${prefix}_phone` as const;
  const address = `${prefix}_address` as const;
  const cityState = `${prefix}_city_state` as const;
  const pincode = `${prefix}_pincode` as const;

  return (
    <div className="rounded-lg border border-neutral-200 border-t-2 border-t-emerald-500 p-4">
      <h3 className="mb-4 text-sm font-medium text-neutral-900">{title}</h3>
      <div className="space-y-4">
        <Field label="Full name" required>
          <Input
            value={form[name]}
            onChange={(e) => update(name, e.target.value as never)}
            placeholder="e.g. Bonison"
            aria-invalid={!!errors[name]}
          />
          {errors[name] && <p className="text-xs text-red-600">{errors[name]}</p>}
        </Field>
        <Field label="Phone number" required>
          <Input
            value={form[phone]}
            onChange={(e) => update(phone, e.target.value.replace(/\D/g, "").slice(0, 10) as never)}
            placeholder="10 digit mobile number"
            inputMode="numeric"
            aria-invalid={!!errors[phone]}
          />
          {errors[phone] && <p className="text-xs text-red-600">{errors[phone]}</p>}
        </Field>
        <Field label="Address" required>
          <Textarea
            value={form[address]}
            onChange={(e) => update(address, e.target.value as never)}
            placeholder="House / street / locality"
            rows={2}
            aria-invalid={!!errors[address]}
          />
          {errors[address] && <p className="text-xs text-red-600">{errors[address]}</p>}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City / state">
            <Input
              value={form[cityState]}
              onChange={(e) => update(cityState, e.target.value as never)}
              placeholder="e.g. Imphal, Manipur"
            />
          </Field>
          <Field label="Pincode" required>
            <Input
              value={form[pincode]}
              onChange={(e) => update(pincode, e.target.value.replace(/\D/g, "").slice(0, 6) as never)}
              placeholder="795103"
              inputMode="numeric"
              aria-invalid={!!errors[pincode]}
            />
            {errors[pincode] && <p className="text-xs text-red-600">{errors[pincode]}</p>}
          </Field>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CargoBookingForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
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
        delivery_mode: form.delivery_mode,
        pickup_required: form.pickup_required,
        delivery_required: form.delivery_required,
        notes: form.notes,
        status: form.status,
        third_party_tracking: form.third_party_tracking,
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

      const { error: insertError } = await supabase.from("cargo_bookings").insert(payload);
      if (insertError) throw insertError;

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
    <div className="min-h-screen bg-white">
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-neutral-900">New booking</h1>
          <p className="text-sm text-neutral-500">Enter shipper and consignee details</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-neutral-400">Tracking ID</p>
          <p className="font-mono text-sm font-medium text-emerald-700">{trackingId}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Sender + Receiver side by side */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PartyCard title="Sender" prefix="sender" form={form} errors={errors} update={update} />
          <PartyCard title="Receiver" prefix="receiver" form={form} errors={errors} update={update} />
        </div>

        {/* Package */}
        <div className="rounded-lg border border-neutral-200 p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-neutral-900">
            <PackageCheck className="h-4 w-4 text-emerald-600" />
            Package & delivery
          </div>
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
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Fragile, handle with care, etc."
                rows={2}
              />
            </Field>
          </div>
        </div>

        {/* Charges */}
        <div className="rounded-lg border border-neutral-200 p-4">
          <h3 className="mb-4 text-sm font-medium text-neutral-900">Charges</h3>
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

          <div className="mt-4 flex items-center justify-between rounded-md bg-emerald-50 px-4 py-3">
            <span className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Charges total
            </span>
            <span className="font-mono text-base font-medium text-emerald-800">
              ₹{total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-6 flex items-center justify-end gap-3">
        <p className="mr-auto text-xs text-neutral-400">* required fields</p>
        <Button type="submit" disabled={submitting} className="bg-emerald-600 text-white hover:bg-emerald-700">
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
  );
}