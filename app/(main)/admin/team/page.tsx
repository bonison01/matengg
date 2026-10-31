// app/(main)/admin/team/page.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminRow {
  id: string;
  email_or_phone: string;
  name: string | null;
  role: string;
  verified: boolean;
  created_at: string;
}

export default function AdminTeamPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pending");
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Could not load admins.");
      setAdmins(json.data ?? []);
    } catch (err: any) {
      toast.error(err.message || "Could not load admins.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/admin/pending/${id}/verify`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Could not approve admin.");
      setAdmins((rows) => rows.map((a) => (a.id === id ? { ...a, verified: true } : a)));
      toast.success("Admin approved.");
    } catch (err: any) {
      toast.error(err.message || "Could not approve admin.");
    } finally {
      setApprovingId(null);
    }
  };

  const pending = admins.filter((a) => !a.verified);
  const verified = admins.filter((a) => a.verified);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-1 text-lg font-medium text-neutral-900">Team</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Approve new admin signups and see who currently has access.
        </p>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
          </div>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-semibold text-amber-700">
                Pending approval {pending.length > 0 && `(${pending.length})`}
              </h2>
              {pending.length === 0 ? (
                <p className="text-sm text-neutral-400">No pending requests.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-amber-200">
                  <table className="min-w-full text-sm">
                    <tbody>
                      {pending.map((a) => (
                        <tr key={a.id} className="border-b border-amber-100 last:border-0 bg-amber-50/40">
                          <td className="px-4 py-2.5 text-neutral-900">{a.name || "—"}</td>
                          <td className="px-4 py-2.5 text-neutral-500">{a.email_or_phone}</td>
                          <td className="px-4 py-2.5 text-neutral-400">
                            {new Date(a.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(a.id)}
                              disabled={approvingId === a.id}
                              className="h-7 bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              {approvingId === a.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                "Approve"
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold text-neutral-700">
                Active admins ({verified.length})
              </h2>
              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <table className="min-w-full text-sm">
                  <tbody>
                    {verified.map((a) => (
                      <tr key={a.id} className="border-b border-neutral-100 last:border-0">
                        <td className="px-4 py-2.5 text-neutral-900">{a.name || "—"}</td>
                        <td className="px-4 py-2.5 text-neutral-500">{a.email_or_phone}</td>
                        <td className="px-4 py-2.5 capitalize text-neutral-500">{a.role}</td>
                        <td className="px-4 py-2.5 text-neutral-400">
                          {new Date(a.created_at).toLocaleDateString("en-IN", {
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
            </section>
          </>
        )}
      </div>
    </div>
  );
}