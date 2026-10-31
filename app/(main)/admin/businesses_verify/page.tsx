//admin/businesses_verify/page.tsx

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "verified" | "pending">("all");
  const [toast, setToast] = useState<string | null>(null);

  // Fetch businesses
  const fetchBusinesses = async () => {
    setLoading(true);

    let query = supabase
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter === "verified") query = query.eq("verified", true);
    if (filter === "pending") query = query.eq("verified", false);

    const { data, error } = await query;

    if (error) {
      alert("❌ Failed to fetch: " + error.message);
    } else {
      setBusinesses(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchBusinesses();
  }, [filter]);

  // Toast auto hide
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Toggle verify
  const toggleVerify = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("businesses")
      .update({ verified: !current })
      .eq("id", id);

    if (error) {
      alert("❌ Failed: " + error.message);
      return;
    }

    setToast("✅ Business updated successfully");
    fetchBusinesses();
  };

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            background: "#16a34a",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: 10,
            fontWeight: 600,
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            zIndex: 999,
          }}
        >
          {toast}
        </div>
      )}

      <div
        style={{
          padding: 24,
          background: "#f9fafb",
          minHeight: "100vh",
          fontFamily: "sans-serif",
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>
          Admin – Business Management
        </h1>

        {/* FILTER */}
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          {["all", "verified", "pending"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: filter === f ? "#111827" : "#fff",
                color: filter === f ? "#fff" : "#111827",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {/* COUNTS */}
        <div
          style={{
            marginTop: 20,
            marginBottom: 10,
            display: "flex",
            gap: 20,
          }}
        >
          <div><b>{businesses.length}</b> Total</div>
          <div><b>{businesses.filter(b => b.verified).length}</b> Verified</div>
          <div><b>{businesses.filter(b => !b.verified).length}</b> Pending</div>
        </div>

        {/* LIST */}
        <div style={{ marginTop: 20, display: "grid", gap: 16 }}>
          {businesses.map((b) => (
            <div
              key={b.id}
              style={{
                padding: 18,
                borderRadius: 16,
                background: "#fff",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                border: "1px solid #f1f5f9",
                transition: "0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-3px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0px)")
              }
            >
              <h2 style={{ margin: 0 }}>{b.name}</h2>

              <p style={{ fontSize: 13, color: "#6b7280" }}>
                {b.category} • {b.city}
              </p>

              <p style={{ fontSize: 13 }}>
                Owner: <b>{b.owner_name}</b>
              </p>

              <p style={{ fontSize: 13 }}>
                Phone: {b.phone || "N/A"}
              </p>

              {/* STATUS */}
              <div style={{ marginTop: 6 }}>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: b.verified ? "#dcfce7" : "#fee2e2",
                    color: b.verified ? "#166534" : "#991b1b",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {b.verified ? "Verified" : "Pending"}
                </span>
              </div>

              {/* BUTTON */}
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => toggleVerify(b.id, b.verified)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    background: b.verified ? "#ef4444" : "#14710F",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {b.verified ? "Unverify" : "Verify"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}