import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────
// Supabase client
// ─────────────────────────────────────────────────────────────────────────
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Storage bucket that holds passport photos, signatures, and payment screenshots.
export const DOCUMENTS_BUCKET = 'edufest-documents';

// ─────────────────────────────────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────────────────────────────────
export type CompetitionKey = 'painting' | 'quiz' | 'mathematics' | 'young_innovator';

export type DocumentType = 'passport_photo' | 'candidate_signature' | 'payment_screenshot';

export interface TeamMember {
  name: string;
  student_class: string;
  dob: string;
  institution_name: string;
}

export interface FormData {
  full_name: string;
  dob: string;
  student_class: string;
  institution_name: string;
  contact_number: string;
  gender: string;
  alternate_contact_number: string;
  address: string;
  father_name: string;
  father_occupation: string;
  competition_category: CompetitionKey[];
  participation_type: 'individual' | 'team';
  team_size: number | null;
  team_members: TeamMember[];
  email: string;
  passport_photo: File | null;
  candidate_signature: File | null;
}

// ─────────────────────────────────────────────────────────────────────────
// Competition metadata
// ─────────────────────────────────────────────────────────────────────────
export const COMPETITION_LABELS: Record<CompetitionKey, string> = {
  painting: 'Painting',
  quiz: 'Quiz',
  mathematics: 'Mathematics',
  young_innovator: 'Young Innovator',
};

// Per-competition base fee (₹). Quiz and Young Innovator are team events —
// the fee is per team, not per member, unless noted otherwise by your rules.
export const COMPETITION_FEES: Record<CompetitionKey, number> = {
  painting: 150,
  quiz: 300,
  mathematics: 200,
  young_innovator: 300,
};

export const COMPETITION_DATES: Record<CompetitionKey, string> = {
  painting: 'TBA',
  quiz: 'TBA',
  mathematics: 'TBA',
  young_innovator: 'TBA',
};

export const COMPETITION_ELIGIBILITY: Record<CompetitionKey, string> = {
  painting: 'Class 1–12',
  quiz: 'Class 1–12',
  mathematics: 'Class 1–12',
  young_innovator: 'Class 1–12',
};

/**
 * Calculates the total registration fee across all selected competitions.
 * Team-eligible competitions (quiz, young_innovator) are multiplied by team
 * size when participation_type is 'team'; everything else is a flat per-entry fee.
 */
export function calculateTotalFee(
  categories: CompetitionKey[],
  participationType: 'individual' | 'team',
  teamSize: number | null
): number {
  return categories.reduce((total, cat) => {
    const base = COMPETITION_FEES[cat];
    const isTeamEligible = cat === 'quiz' || cat === 'young_innovator';
    if (participationType === 'team' && isTeamEligible && teamSize) {
      return total + base * teamSize;
    }
    return total + base;
  }, 0);
}