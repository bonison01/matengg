"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import {
  CandidateRow,
  Counts,
  ProfileFormRow,
  ContractRow,
} from "./types";

import StatusSummary from "./components/employee_contracts/StatusSummary";
import Filters from "./components/employee_contracts/Filters";
import CandidateTable from "./components/employee_contracts/CandidateTable";
import EditModal from "./components/employee_contracts/EditModal";
import ProfileModal from "./components/employee_contracts/ProfileModal";
import SendEmailModal from "./components/employee_contracts/SendEmailModal";

export default function EmployeeContractsPage() {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [counts, setCounts] = useState<Counts>({
    pending: 0,
    talks: 0,
    approved: 0,
    rejected: 0,
    active: 0,
    inactive: 0,
  });

  const [filterAppStatus, setFilterAppStatus] = useState("all");
  const [filterEmpStatus, setFilterEmpStatus] = useState("all");

  const [selected, setSelected] = useState<CandidateRow | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormRow | null>(null);
  const [profileContract, setProfileContract] = useState<ContractRow | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTarget, setEmailTarget] = useState<any>(null);

  // ===============================================================
  // LOAD CANDIDATES (updated: blood_group + agreement_ip)
  // ===============================================================
  const loadCandidates = async () => {
  const { data, error } = await supabase
    .from("employee_forms")
    .select(`
      formid,
      fullname,
      email,
      applyposition,
      positiontype,
      created_at,
      blood_group,
      application_status,
      employment_status,
      employee_contracts (
        employeeid,
        application_status,
        employment_status,
        agreement_ip
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load error:", error);
    return;
  }

  const list: CandidateRow[] = data!.map((r: any) => {
    const c = r.employee_contracts ?? null;

    return {
      formid: r.formid,
      fullname: r.fullname,
      email: r.email,
      applyposition: r.applyposition,
      positiontype: r.positiontype,
      appliedDate: new Date(r.created_at).toISOString().split("T")[0],

      // EXACT MATCH WITH EditModal saved values
      application_status:
        c?.application_status ?? r.application_status ?? "pending",

      employment_status:
        c?.employment_status ?? r.employment_status ?? null,

      employeeid: c?.employeeid ?? null,
      blood_group: r.blood_group ?? "—",
      agreement_ip: c?.agreement_ip ?? null,
    };
  });

  setCandidates(list);

  // Summary counts
  setCounts({
    pending: list.filter((c) => c.application_status === "pending").length,
    talks: list.filter((c) => c.application_status === "talks").length,
    approved: list.filter((c) => c.application_status === "approved").length,
    rejected: list.filter((c) => c.application_status === "rejected").length,
    active: list.filter((c) => c.employment_status === "active").length,
    inactive: list.filter((c) => c.employment_status === "inactive").length,
  });
};


  useEffect(() => {
    loadCandidates();
  }, []);

  // OPEN PROFILE
  const openProfile = async (row: CandidateRow) => {
    setSelected(row);

    const [{ data: formRow }, { data: contractRow }] = await Promise.all([
      supabase.from("employee_forms").select("*").eq("formid", row.formid).maybeSingle(),
      supabase.from("employee_contracts").select("*").eq("formid", row.formid).maybeSingle(),
    ]);

    if (!formRow) {
      alert("Profile missing");
      return;
    }

    setProfileForm(formRow);
    setProfileContract(contractRow);
    setShowProfile(true);
  };

  // OPEN EDIT MODAL
  const openEdit = (row: CandidateRow) => {
    setSelected(row);
    setShowEdit(true);
  };

  // OPEN EMAIL MODAL
  const sendEmail = (
    email: string,
    formid: string,
    name: string,
    application_status: string
  ) => {
    setEmailTarget({ email, formid, name, application_status });
    setShowEmailModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">

      <StatusSummary counts={counts} />

      <Filters
        filterAppStatus={filterAppStatus}
        filterEmpStatus={filterEmpStatus}
        setFilterAppStatus={setFilterAppStatus}
        setFilterEmpStatus={setFilterEmpStatus}
      />

      <CandidateTable
        candidates={candidates}
        filterAppStatus={filterAppStatus}
        filterEmpStatus={filterEmpStatus}
        openProfile={openProfile}
        openEdit={openEdit}
        sendEmail={sendEmail}
      />

      <EditModal
        showEdit={showEdit}
        setShowEdit={setShowEdit}
        selected={selected}
        loadCandidates={loadCandidates}
      />

      <ProfileModal
        showProfile={showProfile}
        setShowProfile={setShowProfile}
        selected={selected}
      />

      <SendEmailModal
        show={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        candidate={emailTarget}
        reload={loadCandidates}
      />
    </div>
  );
}
