"use client";

import { CandidateRow } from "../../types";

interface Props {
  candidates: CandidateRow[];
  filterAppStatus: string;
  filterEmpStatus: string;
  openProfile: (row: CandidateRow) => void;
  openEdit: (row: CandidateRow) => void;
  sendEmail: (
    email: string,
    formid: string,
    name: string,
    application_status: string
  ) => void;
}

export default function CandidateTable({
  candidates,
  filterAppStatus,
  filterEmpStatus,
  openProfile,
  openEdit,
  sendEmail,
}: Props) {

  const filtered = candidates.filter((c) => {
    if (filterAppStatus !== "all" && c.application_status !== filterAppStatus) return false;
    if (filterEmpStatus !== "all" && c.employment_status !== filterEmpStatus) return false;
    return true;
  });

  const badgeColors: any = {
    pending: "bg-yellow-100 text-yellow-700",
    talks: "bg-blue-100 text-blue-700",
    approved: "bg-purple-100 text-purple-700",
    rejected: "bg-red-100 text-red-700",
  };

  const empColors: any = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-200 text-gray-700",
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
          <tr>
            {[
              "FormID", "Name", "Email", "Position", "Application",
              "Employment", "Emp ID", "Blood", "Agreement IP",
              "Applied", "Actions"
            ].map((h) => (
              <th key={h} className="p-3 text-left font-semibold border-b">
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {filtered.map((c, idx) => (
            <tr
              key={c.formid}
              className={`transition hover:bg-gray-50 ${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
              }`}
            >
              <td className="p-3 border-b font-mono text-xs">{c.formid}</td>
              <td className="p-3 border-b">{c.fullname}</td>
              <td className="p-3 border-b">{c.email}</td>
              <td className="p-3 border-b">{c.applyposition || c.positiontype}</td>

              {/* Application Status with Badge */}
              <td className="p-3 border-b">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    badgeColors[c.application_status] || "bg-gray-200 text-gray-700"
                  }`}
                >
                  {c.application_status}
                </span>
              </td>

              {/* Employment Status */}
              <td className="p-3 border-b">
                {c.employment_status ? (
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      empColors[c.employment_status] || "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {c.employment_status}
                  </span>
                ) : (
                  "—"
                )}
              </td>

              {/* Emp ID */}
              <td className="p-3 border-b font-mono text-xs">
                {c.employeeid ?? "—"}
              </td>

              {/* Blood */}
              <td className="p-3 border-b">{c.blood_group ?? "—"}</td>

              {/* Agreement IP */}
              <td className="p-3 border-b font-mono text-[11px]">
                {c.agreement_ip ?? "—"}
              </td>

              {/* Applied */}
              <td className="p-3 border-b">{c.appliedDate}</td>

              {/* Actions */}
              <td className="p-3 border-b">
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                    onClick={() => openProfile(c)}
                  >
                    Profile
                  </button>

                  <button
                    className="px-2 py-1 text-xs rounded bg-green-50 text-green-700 hover:bg-green-100"
                    onClick={() => openEdit(c)}
                  >
                    Edit
                  </button>

                  <button
                    className="px-2 py-1 text-xs rounded bg-purple-50 text-purple-700 hover:bg-purple-100"
                    onClick={() =>
                      sendEmail(
                        c.email,
                        c.formid,
                        c.fullname,
                        c.application_status
                      )
                    }
                  >
                    Email
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {filtered.length === 0 && (
            <tr>
              <td colSpan={11} className="p-6 text-center text-gray-500">
                No candidates match your filters
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
