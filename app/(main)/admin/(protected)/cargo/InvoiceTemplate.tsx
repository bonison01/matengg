///Users/apple/Documents/justmateng1/app/(main)/admin/(protected)/cargo/InvoiceTemplate.tsx
import React from "react";

export interface InvoiceBooking {
  id: string;
  tracking_id: string;
  // Billing & shipping — optional. Rendered as a dedicated block, matching
  // the reference invoice layout, only when at least one is present so
  // older bookings without this data print exactly as before.
  billing_name?: string | null;
  billing_phone?: string | null;
  billing_address?: string | null;
  billing_city_state?: string | null;
  billing_pincode?: string | null;
  billing_gstin?: string | null;
  shipping_name?: string | null;
  shipping_phone?: string | null;
  shipping_address?: string | null;
  shipping_city_state?: string | null;
  shipping_pincode?: string | null;
  sender_name: string;
  sender_address: string;
  sender_city_state?: string | null;
  sender_pincode: string;
  receiver_name: string;
  receiver_address: string;
  receiver_city_state?: string | null;
  receiver_pincode: string;
  receiver_phone: string;
  product_name: string;
  weight_estimate: number;
  delivery_mode: string;
  third_party_tracking?: string | null;
  notes?: string | null;
  estimate_charge: number;
  docket_charge?: number | null;
  packaging_charge?: number | null;
  handling_charge?: number | null;
  pickup_charge?: number | null;
  extra_mile_delivery?: number | null;
  final_charge?: number | null;
  // Optional invoice tax rate (e.g. 18 for 18% GST). Not mandatory — when
  // absent or zero, the invoice renders exactly as before (a single final
  // charge box, no tax lines).
  tax_percent?: number | null;
  created_at: string;
}

const COMPANY = {
  name: "mateng",
  address: "Sagolband Sayang Leirak, Sagolband, Imphal, Manipur - 795004",
  phone: "8787649928",
  website: "justmateng.com",
  gstin: "14AAGCJ5156M1ZA",
  supportPhone: "9774795906",
};

function rupee(n: number | null | undefined) {
  return `INR ${(n ?? 0).toFixed(2)}`;
}

export function invoiceNumber(booking: InvoiceBooking) {
  const d = new Date(booking.created_at);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const shortId = booking.id.replace(/-/g, "").slice(0, 3).toUpperCase();
  return `INV-${y}${m}${day}-${shortId}`;
}

// Kept intentionally compact (tight paddings/margins, text-xs/text-sm
// throughout) so a typical booking's invoice fits on a single A4 page
// once printed — see the print stylesheet in invoice/[id]/page.tsx.
export default function InvoiceTemplate({ booking }: { booking: InvoiceBooking }) {
  const charges = [
    { label: "Freight charge", value: booking.estimate_charge },
    { label: "Docket charge", value: booking.docket_charge },
    { label: "Packaging charge", value: booking.packaging_charge },
    { label: "Handling charge", value: booking.handling_charge },
    { label: "Pickup charge", value: booking.pickup_charge },
    { label: "Extra mile delivery", value: booking.extra_mile_delivery },
  ];

  const subtotal =
    booking.final_charge ??
    charges.reduce((sum, c) => sum + (c.value ?? 0), 0);

  const taxPercent = booking.tax_percent ?? 0;
  const hasTax = taxPercent > 0;
  const halfTaxPercent = taxPercent / 2;
  const cgstAmount = hasTax ? subtotal * (halfTaxPercent / 100) : 0;
  const igstAmount = cgstAmount;
  const grandTotal = subtotal + cgstAmount + igstAmount;

  const hasBillingOrShipping = !!(booking.billing_name || booking.shipping_name);

  return (
    <div className="mx-auto max-w-2xl bg-white p-6 text-neutral-900 print:p-0">
      {/* Header */}
      <div className="border-b-2 border-emerald-600 pb-3">
        <h1 className="text-3xl font-black italic tracking-tight text-black">{COMPANY.name}</h1>
        <p className="mt-0.5 text-xs text-neutral-600">{COMPANY.address}</p>
        <p className="text-xs text-neutral-600">
          Phone: {COMPANY.phone} | Website: {COMPANY.website} | GSTIN: {COMPANY.gstin}
        </p>
      </div>

      {/* Tracking */}
      <div className="mt-3 text-center">
        <p className="text-sm font-semibold">
          Tracking ID:{" "}
          <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-emerald-800">
            {booking.tracking_id}
          </span>
        </p>
      </div>

      {/* Invoice meta */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <p>
          <span className="font-semibold">Invoice #:</span> {invoiceNumber(booking)}
        </p>
        <p>
          <span className="font-semibold">SAC:</span> 996812
        </p>
      </div>
      <p className="text-sm">
        <span className="font-semibold">Date:</span>{" "}
        {new Date(booking.created_at).toISOString().slice(0, 10)}
      </p>

      {/* Shipping / Billing address — only shown when at least one was
          captured on the booking, so older bookings print unchanged.
          Styled deliberately bolder and in a different color (indigo)
          than the sections below it, so it reads as a distinct block. */}
      {hasBillingOrShipping && (
        <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-md border-2 border-indigo-300">
          <div className="border-r-2 border-indigo-300 bg-indigo-50/60 p-3 text-sm font-semibold leading-snug text-indigo-900">
            <p className="mb-0.5 font-bold text-indigo-800">Shipping Address</p>
            {booking.shipping_name && <p className="font-bold">{booking.shipping_name}</p>}
            {booking.shipping_address && <p>{booking.shipping_address}</p>}
            {booking.shipping_city_state && <p>{booking.shipping_city_state}</p>}
            {booking.shipping_pincode && <p>{booking.shipping_pincode}</p>}
            {booking.shipping_phone && <p>Mobile No. {booking.shipping_phone}</p>}
          </div>
          <div className="bg-indigo-50/60 p-3 text-sm font-semibold leading-snug text-indigo-900">
            <p className="mb-0.5 font-bold text-indigo-800">Billing Address</p>
            {booking.billing_name && <p className="font-bold">{booking.billing_name}</p>}
            {booking.billing_address && <p>{booking.billing_address}</p>}
            {booking.billing_city_state && <p>{booking.billing_city_state}</p>}
            {booking.billing_pincode && <p>{booking.billing_pincode}</p>}
            {booking.billing_phone && <p>Mobile No. {booking.billing_phone}</p>}
            {booking.billing_gstin && <p>GST {booking.billing_gstin}</p>}
          </div>
        </div>
      )}

      {hasBillingOrShipping && <hr className="my-3 border-t border-neutral-300" />}

      {/* Sender / receiver — plain, no box/border frame (unlike the
          Shipping/Billing block above it) */}
      <div className={`${hasBillingOrShipping ? "" : "mt-3"} grid grid-cols-2 gap-4`}>
        <div className="text-sm leading-snug">
          <p className="mb-0.5 font-semibold text-emerald-800">From (sender)</p>
          <p className="font-medium">{booking.sender_name}</p>
          <p className="text-neutral-700">{booking.sender_address}</p>
          {booking.sender_city_state && (
            <p className="text-neutral-700">{booking.sender_city_state}</p>
          )}
          <p className="text-neutral-700">{booking.sender_pincode}</p>
        </div>
        <div className="text-sm leading-snug">
          <p className="mb-0.5 font-semibold text-emerald-800">To (receiver)</p>
          <p className="font-medium">{booking.receiver_name}</p>
          <p className="text-neutral-700">{booking.receiver_address}</p>
          {booking.receiver_city_state && (
            <p className="text-neutral-700">{booking.receiver_city_state}</p>
          )}
          <p className="text-neutral-700">{booking.receiver_pincode}</p>
          <p className="text-neutral-700">{booking.receiver_phone}</p>
        </div>
      </div>

      {/* Product details */}
      <div className="mt-3 text-sm leading-snug">
        <p className="mb-0.5 font-semibold text-emerald-800">Product details</p>
        <p>
          <span className="font-medium">Product name:</span> {booking.product_name}
        </p>
        <p>
          <span className="font-medium">Weight:</span> {booking.weight_estimate} kg
        </p>
        <p className="capitalize">
          <span className="font-medium">Delivery mode:</span> {booking.delivery_mode}
        </p>
        {booking.third_party_tracking && (
          <p>
            <span className="font-medium">Third-party tracking:</span>{" "}
            <span className="font-mono">{booking.third_party_tracking}</span>
          </p>
        )}
      </div>

      {booking.notes && (
        <div className="mt-2 rounded-md border border-emerald-100 bg-emerald-50/30 p-2.5 text-sm leading-snug">
          <p className="mb-0.5 font-semibold text-emerald-800">Notes</p>
          <p className="text-neutral-700">{booking.notes}</p>
        </div>
      )}

      {/* Pricing */}
      <div className="mt-3 text-sm">
        <p className="mb-1 font-semibold text-emerald-800">Pricing details</p>
        <div className="space-y-1 leading-tight">
          {charges.map((c) => (
            <div key={c.label} className="flex items-center justify-between">
              <span className="text-neutral-700">{c.label}</span>
              <span className="font-medium">{rupee(c.value)}</span>
            </div>
          ))}
        </div>

        {hasTax && (
          <div className="mt-2 space-y-1 border-t border-dashed border-neutral-300 pt-2 leading-tight">
            <div className="flex items-center justify-between">
              <span className="text-neutral-700">Total before tax</span>
              <span className="font-medium">{rupee(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-700">Add CGST ({halfTaxPercent}%)</span>
              <span className="font-medium">{rupee(cgstAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-700">Add IGST ({halfTaxPercent}%)</span>
              <span className="font-medium">{rupee(igstAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-800">Total after tax</span>
              <span className="font-semibold text-neutral-800">{rupee(grandTotal)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="mt-3 flex items-center justify-between rounded-md border-2 border-emerald-600 bg-emerald-50 px-4 py-2.5">
        <span className="font-semibold text-emerald-800">Final charge (total)</span>
        <span className="text-lg font-bold text-emerald-800">{rupee(grandTotal)}</span>
      </div>

      {/* Footer */}
      <div className="mt-4 space-y-0.5 text-[11px] leading-snug text-neutral-500">
        <p>Note: We are not liable for any prohibited or restricted items. Please refer to our terms and conditions.</p>
        <p>For 100kg+, electronics or medicines — GST invoice is mandatory.</p>
        <p>
          Support: {COMPANY.supportPhone} | Website: {COMPANY.website}
        </p>
        <p className="italic">This is a computer-generated invoice. No signature required.</p>
      </div>
    </div>
  );
}