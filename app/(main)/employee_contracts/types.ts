export interface CandidateRow {
  formid: string;
  fullname: string;
  email: string;
  applyposition: string | null;
  positiontype: string | null;
  application_status: "pending" | "talks" | "approved" | "rejected";
  employment_status: "active" | "inactive" | null;
  appliedDate: string;
  employeeid: string | null;
  blood_group: string | null;      // NEW
  agreement_ip: string | null;     // NEW
}

export interface ProfileFormRow {
  formid: string;
  email: string | null;
  fullname: string;
  permanentaddress: string | null;
  residentialaddress: string | null;
  vehicletype: string | null;
  mobile: string | null;
  altcontact: string | null;
  reason: string | null;
  strengthsweakness: string | null;
  goals5years: string | null;
  applyposition: string | null;
  positiontype: string | null;
  aadharurl: string[] | null;
  panurl: string[] | null;
  cvurl: string | null;
  driverlicenseurl: string | null;
  vehicledocsurl: string[] | null;
}

export interface ContractRow {
  formid: string;
  application_status: "pending" | "talks" | "approved" | "rejected";
  employment_status: "active" | "inactive" | null;
  joiningdate: string | null;
  assignedposition: string | null;
  adminremarks: string | null;
  includeterms: boolean | null;
  includesalarypolicy: boolean | null;
  includeleavepolicy: boolean | null;
  custompdfurl: string | null;
  employeeid: string | null;
}

export interface Counts {
  pending: number;
  talks: number;
  approved: number;
  rejected: number;
  active: number;
  inactive: number;
}
