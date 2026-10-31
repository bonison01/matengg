// app/(main)/admin/(protected)/cargo/customers/CustomerDetail.tsx
//
// The customer detail panel — now a standalone component rendered from
// its own route at customers/[id]/page.tsx, so each customer has a real,
// bookmarkable, refresh-safe URL instead of living behind client-side
// state on the list page.

"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Search,
  CreditCard,
  ArrowLeft,
  FileDown,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  CargoCustomer,
  Booking,
  Payment,
  effectiveCharge,
  firstWord,
  PAYMENT_BADGE,
  BOOKINGS_FILTER_COOKIE,
  setCookie,
  DATE_PRESETS,
  DatePresetKey,
  presetRange,
  loadSavedBookingsFilter,
} from "./shared";

function RecordPaymentModal({
  customer,
  outstanding,
  onClose,
  onRecorded,
}: {
  customer: CargoCustomer;
  outstanding: number;
  onClose: () => void;
  onRecorded: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/cargo/customers/${customer.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, note }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Could not record payment");

      toast.success(`₹${amt.toFixed(2)} payment recorded for ${customer.name}`);
      onRecorded();
    } catch (err: any) {
      toast.error(err.message || "Could not record payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-sm font-medium text-neutral-900">Record payment</h2>
        <p className="mb-4 text-xs text-neutral-500">
          {customer.name} · Outstanding:{" "}
          <span className="font-medium text-red-600">₹{outstanding.toFixed(2)}</span>
        </p>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-neutral-500">Amount received (₹) *</Label>
            <Input
              className="bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder={`Up to ₹${outstanding.toFixed(2)}`}
              inputMode="decimal"
              autoFocus
            />
            {amount && parseFloat(amount) > 0 && (
              <p className="text-xs text-neutral-400">
                Remaining after this: ₹
                {Math.max(0, outstanding - parseFloat(amount)).toFixed(2)}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-neutral-500">Note (optional)</Label>
            <Input
              className="bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Cash, UPI, bank transfer…"
            />
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={save}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm payment"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Customer Detail Panel
// ---------------------------------------------------------------------------

export function CustomerDetail({
  customer,
}: {
  customer: CargoCustomer;
}) {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);

  // Bookings table: search + payment-status filter + date range.
  // Initialized from the saved cookie so a reload doesn't reset them.
  const savedFilter = useMemo(() => loadSavedBookingsFilter(), []);
  const [bookingSearch, setBookingSearch] = useState(savedFilter.search);
  const [bookingFilter, setBookingFilter] = useState<"all" | "paid" | "unpaid" | "partial">(
    savedFilter.filter
  );
  const [dateFrom, setDateFrom] = useState(savedFilter.dateFrom); // yyyy-mm-dd, inclusive
  const [dateTo, setDateTo] = useState(savedFilter.dateTo); // yyyy-mm-dd, inclusive
  const [datePreset, setDatePreset] = useState<DatePresetKey>(savedFilter.datePreset);

  // Persist the filter to its cookie whenever any part of it changes.
  useEffect(() => {
    setCookie(
      BOOKINGS_FILTER_COOKIE,
      JSON.stringify({
        search: bookingSearch,
        filter: bookingFilter,
        dateFrom,
        dateTo,
        datePreset,
      })
    );
  }, [bookingSearch, bookingFilter, dateFrom, dateTo, datePreset]);

  const applyDatePreset = (key: DatePresetKey) => {
    setDatePreset(key);
    const range = presetRange(key);
    if (range) {
      setDateFrom(range.from);
      setDateTo(range.to);
    }
    // "custom" leaves dateFrom/dateTo untouched — the person drives them.
  };

  // Manual edits to either date input count as a custom range, even if a
  // preset was previously selected.
  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    setDatePreset("custom");
  };
  const handleDateToChange = (value: string) => {
    setDateTo(value);
    setDatePreset("custom");
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cargo/customers/${customer.id}/detail`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Could not load customer detail");
      setBookings(json.data.bookings ?? []);
      setPayments(json.data.payments ?? []);
    } catch (err: any) {
      toast.error(err.message || "Could not load customer detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [customer.id]);

  const totalBilled = bookings.reduce((s, b) => s + effectiveCharge(b), 0);
  const totalPaid = bookings.reduce((s, b) => s + (b.amount_paid ?? 0), 0);
  const outstanding = Math.max(0, totalBilled - totalPaid);

  const filteredBookings = useMemo(() => {
    let rows = [...bookings];
    if (bookingSearch.trim()) {
      const q = bookingSearch.toLowerCase();
      rows = rows.filter(
        (b) =>
          b.tracking_id.toLowerCase().includes(q) ||
          b.product_name.toLowerCase().includes(q) ||
          (b.sender_name ?? "").toLowerCase().includes(q) ||
          (b.receiver_name ?? "").toLowerCase().includes(q)
      );
    }
    if (bookingFilter !== "all") rows = rows.filter((b) => b.payment_status === bookingFilter);
    if (dateFrom) {
      const from = new Date(dateFrom + "T00:00:00");
      rows = rows.filter((b) => new Date(b.created_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59");
      rows = rows.filter((b) => new Date(b.created_at) <= to);
    }
    return rows;
  }, [bookings, bookingSearch, bookingFilter, dateFrom, dateTo]);

  // Exports the currently filtered bookings to a downloadable PDF.
  // Uses "Rs." instead of "₹" inside the PDF body — jsPDF's default fonts
  // don't render the rupee glyph correctly and it comes out garbled.
  const exportBookingsPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(`${customer.name} - Bookings`, 14, 14);
    doc.setFontSize(9);
    const rangeLabel =
      dateFrom || dateTo
        ? ` | Range: ${dateFrom || "start"} to ${dateTo || "today"}`
        : "";
    doc.text(
      `${customer.phone} | Generated ${new Date().toLocaleDateString("en-IN")}${rangeLabel}`,
      14,
      20
    );

    autoTable(doc, {
      startY: 26,
      head: [["Tracking", "Description", "Status", "Charge", "Paid", "Due", "Payment", "Date"]],
      body: filteredBookings.map((b) => {
        const charge = effectiveCharge(b);
        const due = Math.max(0, charge - (b.amount_paid ?? 0));
        const desc = [
          `Inv: ${b.tracking_id}`,
          `From: ${firstWord(b.sender_name)} / ${firstWord(b.sender_address)}`,
          `To: ${firstWord(b.receiver_name)} / ${firstWord(b.receiver_address)}`,
        ].join("\n");
        return [
          b.tracking_id,
          desc,
          b.status,
          `Rs.${charge.toFixed(2)}`,
          `Rs.${(b.amount_paid ?? 0).toFixed(2)}`,
          due > 0 ? `Rs.${due.toFixed(2)}` : "-",
          b.payment_status,
          new Date(b.created_at).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
        ];
      }),
      styles: { fontSize: 8, valign: "top" },
      columnStyles: { 1: { cellWidth: 55 } },
      headStyles: { fillColor: [16, 185, 129] },
    });

    doc.save(`${customer.name.replace(/\s+/g, "_")}_bookings.pdf`);
  };

  return (
    <>
      {showPayModal && (
        <RecordPaymentModal
          customer={customer}
          outstanding={outstanding}
          onClose={() => setShowPayModal(false)}
          onRecorded={() => {
            setShowPayModal(false);
            load();
          }}
        />
      )}

      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <button
                onClick={() => router.push("/admin/cargo/customers")}
                className="mb-2 flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                All customers
              </button>
              <h1 className="text-lg font-medium text-neutral-900">{customer.name}</h1>
              <p className="text-sm text-neutral-500">
                {customer.phone} · {customer.address}
                {customer.city_state ? `, ${customer.city_state}` : ""}
              </p>
              {customer.gstin && (
                <p className="mt-0.5 font-mono text-xs text-neutral-400">GSTIN: {customer.gstin}</p>
              )}
            </div>
            {outstanding > 0 && (
              <Button
                onClick={() => setShowPayModal(true)}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <CreditCard className="mr-1.5 h-4 w-4" />
                Record payment
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-neutral-200 p-4">
              <p className="text-xs text-neutral-500">Total billed</p>
              <p className="mt-1 text-xl font-semibold text-neutral-900">₹{totalBilled.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border border-neutral-200 p-4">
              <p className="text-xs text-neutral-500">Total paid</p>
              <p className="mt-1 text-xl font-semibold text-emerald-700">₹{totalPaid.toFixed(2)}</p>
            </div>
            <div
              className={`rounded-lg border p-4 ${
                outstanding > 0 ? "border-red-200 bg-red-50" : "border-neutral-200"
              }`}
            >
              <p className="text-xs text-neutral-500">Outstanding</p>
              <p
                className={`mt-1 text-xl font-semibold ${
                  outstanding > 0 ? "text-red-600" : "text-neutral-900"
                }`}
              >
                ₹{outstanding.toFixed(2)}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12 text-neutral-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Bookings */}
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-sm font-medium text-neutral-700">
                    Bookings ({filteredBookings.length}
                    {filteredBookings.length !== bookings.length ? ` of ${bookings.length}` : ""})
                  </h2>

                  <div className="relative ml-auto min-w-[220px] max-w-xs flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                    <Input
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      placeholder="Search tracking, product, sender/receiver…"
                      className="bg-white pl-8 text-neutral-900 placeholder:text-neutral-400 border-neutral-300"
                    />
                  </div>

                  {(["all", "paid", "unpaid", "partial"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setBookingFilter(f)}
                      className={`rounded-lg border px-3 py-1.5 text-xs capitalize transition ${
                        bookingFilter === f
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                      }`}
                    >
                      {f}
                    </button>
                  ))}

                  <div className="flex items-center gap-1.5">
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                      <select
                        value={datePreset}
                        onChange={(e) => applyDatePreset(e.target.value as DatePresetKey)}
                        className="h-9 rounded-md border border-neutral-300 bg-white pl-8 pr-2 text-xs text-neutral-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {DATE_PRESETS.map((p) => (
                          <option key={p.key} value={p.key}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => handleDateFromChange(e.target.value)}
                      max={dateTo || undefined}
                      className="h-9 w-[150px] bg-white text-xs text-neutral-700 border-neutral-300"
                      aria-label="From date"
                    />
                    <span className="text-xs text-neutral-400">to</span>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => handleDateToChange(e.target.value)}
                      min={dateFrom || undefined}
                      className="h-9 w-[150px] bg-white text-xs text-neutral-700 border-neutral-300"
                      aria-label="To date"
                    />
                    {(dateFrom || dateTo) && (
                      <button
                        type="button"
                        onClick={() => {
                          setDateFrom("");
                          setDateTo("");
                          setDatePreset("all");
                        }}
                        className="text-xs text-neutral-400 underline underline-offset-2 hover:text-neutral-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={exportBookingsPdf}
                    className="border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                  >
                    <FileDown className="mr-1.5 h-3.5 w-3.5" />
                    Export PDF
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-neutral-200">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-emerald-100 bg-emerald-50/50">
                        <th className="px-4 py-2.5 text-left font-medium text-emerald-800">Tracking</th>
                        <th className="w-[260px] px-4 py-2.5 text-left font-medium text-emerald-800">Description</th>
                        <th className="px-4 py-2.5 text-left font-medium text-emerald-800">Status</th>
                        <th className="px-4 py-2.5 text-left font-medium text-emerald-800">Charge</th>
                        <th className="px-4 py-2.5 text-left font-medium text-emerald-800">Paid</th>
                        <th className="px-4 py-2.5 text-left font-medium text-emerald-800">Due</th>
                        <th className="px-4 py-2.5 text-left font-medium text-emerald-800">Payment</th>
                        <th className="px-4 py-2.5 text-left font-medium text-emerald-800">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-neutral-400">
                            No bookings found
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((b) => {
                          const charge = effectiveCharge(b);
                          const due = Math.max(0, charge - (b.amount_paid ?? 0));
                          return (
                            <tr
                              key={b.id}
                              className="border-b border-neutral-100 last:border-0 hover:bg-emerald-50/30"
                            >
                              <td className="px-4 py-2.5 font-mono text-xs text-neutral-700">
                                {b.tracking_id}
                              </td>
                              <td className="px-4 py-2.5 text-xs text-neutral-600">
                                <div className="space-y-0.5">
                                  <div className="font-medium text-neutral-700">
                                    Inv: {b.tracking_id}
                                  </div>
                                  <div>
                                    From: {firstWord(b.sender_name)} · {firstWord(b.sender_address)}
                                  </div>
                                  <div>
                                    To: {firstWord(b.receiver_name)} · {firstWord(b.receiver_address)}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                                  {b.status}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-neutral-700">₹{charge.toFixed(2)}</td>
                              <td className="px-4 py-2.5 text-emerald-700">
                                ₹{(b.amount_paid ?? 0).toFixed(2)}
                              </td>
                              <td
                                className={`px-4 py-2.5 font-medium ${
                                  due > 0 ? "text-red-600" : "text-neutral-400"
                                }`}
                              >
                                {due > 0 ? `₹${due.toFixed(2)}` : "—"}
                              </td>
                              <td className="px-4 py-2.5">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                                    PAYMENT_BADGE[b.payment_status] ?? "bg-neutral-100 text-neutral-600"
                                  }`}
                                >
                                  {b.payment_status}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-neutral-500">
                                {new Date(b.created_at).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment history */}
              {payments.length > 0 && (
                <div>
                  <h2 className="mb-3 text-sm font-medium text-neutral-700">
                    Payment history ({payments.length})
                  </h2>
                  <div className="overflow-x-auto rounded-lg border border-neutral-200">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-100 bg-neutral-50">
                          <th className="px-4 py-2.5 text-left font-medium text-neutral-500">Amount</th>
                          <th className="px-4 py-2.5 text-left font-medium text-neutral-500">Note</th>
                          <th className="px-4 py-2.5 text-left font-medium text-neutral-500">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr
                            key={p.id}
                            className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                          >
                            <td className="px-4 py-2.5 font-medium text-emerald-700">
                              ₹{Number(p.amount).toFixed(2)}
                            </td>
                            <td className="px-4 py-2.5 text-neutral-600">{p.note || "—"}</td>
                            <td className="px-4 py-2.5 text-neutral-500">
                              {new Date(p.paid_at).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}