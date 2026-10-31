// app/(main)/admin/(protected)/cargo/customers/page.tsx
//
// The customer list. Clicking a customer now navigates to its own route
// (/admin/cargo/customers/[id]) instead of swapping in a detail view via
// local state — so each customer has a real, bookmarkable, refresh-safe
// URL. See ./[id]/page.tsx and ./CustomerDetail.tsx.

"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Search, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CargoCustomer, CustomerWithStats } from "./shared";

// NOTE: no Supabase client here. cargo_customers and cargo_payments are
// both RLS-locked to service-role only — every read/write below goes
// through /api/admin/cargo/customers/* routes.
//
// cargo_customers now also stores `gstin` (nullable, optional) so a
// customer's GST number can be reused as their default billing detail
// on the booking form.

const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

// ---------------------------------------------------------------------------
// Add/Edit Customer Modal
// ---------------------------------------------------------------------------

function CustomerModal({
  existing,
  onClose,
  onSaved,
}: {
  existing?: CargoCustomer;
  onClose: () => void;
  onSaved: (c: CargoCustomer) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(existing?.name ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [cityState, setCityState] = useState(existing?.city_state ?? "");
  const [pincode, setPincode] = useState(existing?.pincode ?? "");
  const [gstin, setGstin] = useState(existing?.gstin ?? "");

  const save = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast.error("Name, phone and address are required");
      return;
    }
    if (gstin && !GSTIN_REGEX.test(gstin)) {
      toast.error("GSTIN doesn't look valid — check the format");
      return;
    }
    setSaving(true);
    const payload = { name, phone, address, city_state: cityState, pincode, gstin };

    try {
      const res = existing
        ? await fetch(`/api/admin/cargo/customers/${existing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/cargo/customers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Could not save customer");

      toast.success(existing ? "Customer updated" : "Customer added");
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
        <h2 className="mb-4 text-sm font-medium text-neutral-900">
          {existing ? "Edit customer" : "Add frequent customer"}
        </h2>
        <div className="space-y-3">
          {[
            { label: "Full name *", value: name, set: setName, placeholder: "e.g. Bonison" },
            {
              label: "Phone *",
              value: phone,
              set: (v: string) => setPhone(v.replace(/\D/g, "").slice(0, 10)),
              placeholder: "10 digit number",
            },
            {
              label: "Address *",
              value: address,
              set: setAddress,
              placeholder: "Street / locality",
            },
            {
              label: "City / state",
              value: cityState,
              set: setCityState,
              placeholder: "Imphal, Manipur",
            },
            {
              label: "Pincode",
              value: pincode,
              set: (v: string) => setPincode(v.replace(/\D/g, "").slice(0, 6)),
              placeholder: "795103",
            },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label} className="space-y-1">
              <Label className="text-xs text-neutral-500">{label}</Label>
              <Input
                className="bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60"
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}
          <div className="space-y-1">
            <Label className="text-xs text-neutral-500">GSTIN (optional)</Label>
            <Input
              className="bg-white border-neutral-300 font-mono text-neutral-900 placeholder:text-neutral-400 placeholder:opacity-60 placeholder:font-sans"
              value={gstin}
              onChange={(e) =>
                setGstin(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15))
              }
              placeholder="22AAAAA0000A1Z5"
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
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : existing ? "Save changes" : "Add customer"}
          </Button>
        </div>
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Main Customer List
// ---------------------------------------------------------------------------

export default function CargoCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<CargoCustomer | undefined>();
  const [filter, setFilter] = useState<"all" | "outstanding" | "clear">("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cargo/customers");
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Could not load customers");
      setCustomers((json.data as CustomerWithStats[]) ?? []);
    } catch (err: any) {
      toast.error(err.message || "Could not load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let rows = [...customers];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.gstin ?? "").toLowerCase().includes(q)
      );
    }
    if (filter === "outstanding") rows = rows.filter((c) => c.outstanding > 0);
    if (filter === "clear") rows = rows.filter((c) => c.outstanding === 0);
    return rows;
  }, [customers, search, filter]);

  const totalOutstanding = customers.reduce((s, c) => s + c.outstanding, 0);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This won't delete their bookings.`)) return;
    try {
      const res = await fetch(`/api/admin/cargo/customers/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Could not delete customer");
      toast.success("Customer removed");
      load();
    } catch (err: any) {
      toast.error(err.message || "Could not delete customer");
    }
  };

  return (
    <>
      {(showModal || editCustomer) && (
        <CustomerModal
          existing={editCustomer}
          onClose={() => {
            setShowModal(false);
            setEditCustomer(undefined);
          }}
          onSaved={() => {
            setShowModal(false);
            setEditCustomer(undefined);
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
                onClick={() => router.push("/admin/cargo")}
                className="mb-2 flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to bookings
              </button>
              <h1 className="text-lg font-medium text-neutral-900">Frequent customers</h1>
              <p className="text-sm text-neutral-500">
                {customers.length} customers · Total outstanding:{" "}
                <span className={totalOutstanding > 0 ? "font-medium text-red-600" : "text-neutral-500"}>
                  ₹{totalOutstanding.toFixed(2)}
                </span>
              </p>
            </div>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add customer
            </Button>
          </div>

          {/* Summary cards */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-neutral-200 p-4">
              <p className="text-xs text-neutral-500">Total customers</p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900">{customers.length}</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-xs text-neutral-500">With outstanding dues</p>
              <p className="mt-1 text-2xl font-semibold text-red-600">
                {customers.filter((c) => c.outstanding > 0).length}
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-xs text-neutral-500">Total outstanding</p>
              <p className="mt-1 text-2xl font-semibold text-red-600">
                ₹{totalOutstanding.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone or GSTIN"
                className="bg-white pl-8 text-neutral-900 placeholder:text-neutral-400 border-neutral-300"
              />
            </div>
            {(["all", "outstanding", "clear"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg border px-3 py-1.5 text-sm capitalize transition ${
                  filter === f
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                }`}
              >
                {f === "outstanding" ? "Has dues" : f === "clear" ? "All paid" : "All"}
              </button>
            ))}
          </div>

          {/* Customer list */}
          {loading ? (
            <div className="flex justify-center py-16 text-neutral-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-neutral-400">
              No customers found.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-4 rounded-lg border border-neutral-200 p-4 hover:border-emerald-200 hover:bg-emerald-50/30 transition cursor-pointer"
                  onClick={() => router.push(`/admin/cargo/customers/${c.id}`)}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-700">
                    {c.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900">{c.name}</p>
                    <p className="text-xs text-neutral-500">
                      {c.phone}
                      {c.city_state ? ` · ${c.city_state}` : ""}
                      {c.gstin ? (
                        <span className="ml-2 rounded bg-indigo-50 px-1 py-0.5 font-mono text-[10px] font-medium text-indigo-600">
                          {c.gstin}
                        </span>
                      ) : null}
                    </p>
                  </div>

                  <div className="hidden sm:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-neutral-400">Bookings</p>
                      <p className="font-medium text-neutral-700">{c.booking_count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-neutral-400">Billed</p>
                      <p className="font-medium text-neutral-700">₹{c.total_billed.toFixed(0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-neutral-400">Outstanding</p>
                      <p
                        className={`font-semibold ${
                          c.outstanding > 0 ? "text-red-600" : "text-emerald-600"
                        }`}
                      >
                        {c.outstanding > 0 ? `₹${c.outstanding.toFixed(0)}` : "✓ Clear"}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setEditCustomer(c)}
                      className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="rounded-md p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}