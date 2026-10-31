"use client";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { CandidateRow, ProfileFormRow, ContractRow } from "../../types";
import {
  IdCard,
  FileSpreadsheet,
  FileText,
  FileCheck,
  FileWarning,
  ClipboardList,
  Mail,
  Phone,
  Home,
  UserCircle,
} from "lucide-react";

export default function ProfileModal({
  showProfile,
  setShowProfile,
  selected,
}: {
  showProfile: boolean;
  setShowProfile: (b: boolean) => void;
  selected: CandidateRow | null;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormRow | null>(null);
  const [contractData, setContractData] = useState<ContractRow | null>(null);

  // Prevent background scrolling
  useEffect(() => {
    if (showProfile) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
  }, [showProfile]);

  // Press ESC to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowProfile(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!selected) return;
      setLoading(true);

      const [formRes, contractRes] = await Promise.all([
        supabase
          .from("employee_forms")
          .select("*")
          .eq("formid", selected.formid)
          .maybeSingle(),

        supabase
          .from("employee_contracts")
          .select("*")
          .eq("formid", selected.formid)
          .maybeSingle(),
      ]);

      setFormData(formRes.data as ProfileFormRow);
      setContractData(contractRes.data as ContractRow);
      setLoading(false);
    };

    if (showProfile) {
      loadProfile();
    }
  }, [showProfile, selected]);

  if (!showProfile || !selected) return null;

  return (
    <div
      className="fixed left-0 right-0 top-[65px] bottom-0 bg-black/50 flex justify-center items-start p-4 z-[4000] cursor-pointer"
      onClick={() => setShowProfile(false)}
    >
      <div
        className="bg-white cursor-default rounded-xl border border-gray-300 shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >

        {/* TOP HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold">
            Candidate Profile — {selected.fullname}
          </h2>
          <button
            className="text-gray-500 hover:text-black text-xl"
            onClick={() => setShowProfile(false)}
          >
            ✕
          </button>
        </div>

        <div className="p-6">

          {loading && <div className="text-center text-gray-600">Loading...</div>}

          {!loading && formData && (
            <>
              {/* SECTION: BASIC INFO */}
              <Section title="Basic Information">
                <ProfileItem icon={<UserCircle size={16} />} label="Full Name" value={formData.fullname} />
                <ProfileItem icon={<Mail size={16} />} label="Email" value={formData.email} />
                <ProfileItem icon={<Phone size={16} />} label="Mobile" value={formData.mobile} />
                <ProfileItem icon={<Phone size={16} />} label="Alt Contact" value={formData.altcontact} />
                <ProfileItem icon={<ClipboardList size={16} />} label="Form ID" value={formData.formid} />
                <ProfileItem icon={<ClipboardList size={16} />} label="Employee ID" value={contractData?.employeeid ?? "—"} />
              </Section>

              {/* SECTION: ADDRESS */}
              <Section title="Address">
                <ProfileItem icon={<Home size={16} />} label="Permanent Address" value={formData.permanentaddress} />
                <ProfileItem icon={<Home size={16} />} label="Residential Address" value={formData.residentialaddress} />
              </Section>

              {/* SECTION: REASON TO JOIN / STRENGTH */}
              <Section title="Candidate Motivation">
                <ProfileText label="Reason to Join" value={formData.reason} />
                <ProfileText label="Strengths & Weakness" value={formData.strengthsweakness} />
                <ProfileText label="Goal in 5 Years" value={formData.goals5years} />
              </Section>

              {/* SECTION: DOCUMENTS */}
              <Section title="Uploaded Documents">
                <DocBlock title="Aadhar Card" files={formData.aadharurl} icon={<IdCard size={14} />} />
                <DocBlock title="PAN Card" files={formData.panurl} icon={<FileSpreadsheet size={14} />} />
                <DocBlock title="Vehicle Documents" files={formData.vehicledocsurl} icon={<FileCheck size={14} />} />
                <DocSingle title="Driver License" file={formData.driverlicenseurl} icon={<IdCard size={14} />} />
                <DocSingle title="CV / Resume" file={formData.cvurl} icon={<FileText size={14} />} />
              </Section>

              {/* SECTION: HR & CONTRACT */}
              {contractData && (
                <Section title="HR & Contract Information">
                  <ProfileItem label="Application Status" value={contractData.application_status} />
                  <ProfileItem label="Employment Status" value={contractData.employment_status ?? "—"} />
                  <ProfileItem label="Assigned Position" value={contractData.assignedposition ?? "—"} />
                  <ProfileItem label="Expected Joining Date" value={contractData.joiningdate ?? "—"} />
                  <ProfileText label="Admin Remarks" value={contractData.adminremarks ?? "—"} />

                  {/* INCLUDED DOCUMENT FLAGS */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {contractData.includeterms && (
                      <Chip text="Terms & Conditions" icon={<ClipboardList size={13} />} />
                    )}
                    {contractData.includesalarypolicy && (
                      <Chip text="Salary Structure" icon={<FileText size={13} />} />
                    )}
                    {contractData.includeleavepolicy && (
                      <Chip text="Leave Policy" icon={<ClipboardList size={13} />} />
                    )}
                  </div>

                  {/* CUSTOM DOCUMENT */}
                  {contractData.custompdfurl && (
                    <div className="mt-4">
                      <DocSingle
                        title="Custom Contract Document"
                        file={contractData.custompdfurl}
                        icon={<FileWarning size={14} />}
                      />
                    </div>
                  )}
                </Section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------- HELPER COMPONENTS ------------------------------------ */

function Section({ title, children }: any) {
  return (
    <div className="mb-7">
      <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-600 mb-2">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
      <hr className="mt-4 opacity-40" />
    </div>
  );
}

function ProfileItem({ icon, label, value }: any) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-[14px]">
      {icon}
      <span className="font-medium text-gray-700">{label}:</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

function ProfileText({ label, value }: any) {
  if (!value) return null;
  return (
    <div>
      <p className="font-medium text-gray-700 text-sm">{label}:</p>
      <p className="text-[13px] text-gray-700 leading-snug whitespace-pre-line border-l pl-3 border-gray-200">
        {value}
      </p>
    </div>
  );
}

function DocBlock({ title, files, icon }: any) {
  if (!files || files.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
        {title}:
      </p>
      <div className="flex flex-wrap gap-2 mt-1">
        {files.map((file: string, i: number) => (
          <button
            key={i}
            onClick={() => window.open(file, "_blank")}
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 text-xs px-2 py-1 rounded flex items-center gap-1 border border-gray-300"
          >
            {icon} View {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

function DocSingle({ title, file, icon }: any) {
  if (!file) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
        {title}:
      </p>
      <button
        onClick={() => window.open(file, "_blank")}
        className="bg-gray-200 hover:bg-gray-300 text-gray-900 text-xs px-2 py-1 rounded flex items-center gap-1 border border-gray-300"
      >
        {icon} View
      </button>
    </div>
  );
}

function Chip({ text, icon }: { text: string; icon: any }) {
  return (
    <span className="px-3 py-1 text-[11px] border border-blue-300 bg-blue-100 text-blue-800 rounded flex items-center gap-1">
      {icon} {text}
    </span>
  );
}
