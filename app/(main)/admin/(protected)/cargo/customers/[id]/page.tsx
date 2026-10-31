// app/(main)/admin/(protected)/cargo/customers/[id]/page.tsx
//
// Gives each customer their own real URL — /admin/cargo/customers/<id> —
// instead of the detail view living behind client-side state on the list
// page. Fetches just that customer's core record (name/phone/address/etc)
// via GET /api/admin/cargo/customers/[id]; CustomerDetail itself fetches
// that customer's bookings/payments via the existing /detail endpoint.

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { CustomerDetail } from "../CustomerDetail";
import type { CargoCustomer } from "../shared";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<CargoCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`/api/admin/cargo/customers/${params.id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Could not load customer");
        if (!cancelled) setCustomer(json.data as CargoCustomer);
      } catch (err: any) {
        if (!cancelled) {
          setNotFound(true);
          toast.error(err.message || "Could not load customer");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-neutral-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (notFound || !customer) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="mb-4 text-neutral-500">Could not find this customer.</p>
        <button
          onClick={() => router.push("/admin/cargo/customers")}
          className="mx-auto flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all customers
        </button>
      </div>
    );
  }

  return <CustomerDetail customer={customer} />;
}