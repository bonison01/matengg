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

  return (
    <table className="w-full text-sm">
      <tbody>
      {filtered.map((c) => (
        <tr key={c.formid} className="border">
          <td className="p-3">{c.formid}</td>
          <td className="p-3">{c.fullname}</td>
          <td className="p-3">{c.email}</td>
          <td className="p-3">{c.applyposition || c.positiontype}</td>

          <td className="p-3">
            {c.application_status}
          </td>

          <td className="p-3">
            {c.employment_status ?? "—"}
          </td>

          <td className="p-3">{c.employeeid || "—"}</td>

          <td className="p-3">{c.appliedDate}</td>

          <td className="p-3">
            <button className="text-blue-600 mr-3" onClick={() => openProfile(c)}>
              Profile
            </button>
            <button className="text-green-700 mr-3" onClick={() => openEdit(c)}>
              Edit
            </button>

            <button
              className="text-purple-600"
              onClick={() =>
                sendEmail(c.email, c.formid, c.fullname, c.application_status)
              }
            >
              Email
            </button>
          </td>
        </tr>
      ))}
      </tbody>
    </table>
  );
}
