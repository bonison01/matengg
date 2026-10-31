'use client';

import QRCode from 'react-qr-code';

const COMPETITION_LABELS: Record<string, string> = {
  painting: 'Painting',
  quiz: 'Quiz',
  mathematics: 'Mathematics',
  young_innovator: 'Young Innovator',
};

// Fixed for all candidates
const EXAM_DATE_DISPLAY = '12 July 2026';

// Venue + start time per competition (Quiz / Painting / Young Innovator are fixed at MU Canchipur)
const COMPETITION_EXAM_INFO: Record<string, { venue: string; time: string }> = {
  young_innovator: { venue: 'Manipur University, Canchipur', time: '8:00 AM' },
  quiz: { venue: 'Manipur University, Canchipur', time: '9:00 AM' },
  painting: { venue: 'Manipur University, Canchipur', time: '10:00 AM' },
};

const MATH_EXAM_TIME_DISPLAY = '10:00 AM';

interface DocumentRow {
  document_type: string;
  s3_url: string;
}

interface TeamMemberRow {
  name: string;
  dob: string;
  student_class: string;
  institute: string;
}

interface RegistrationData {
  id: number;
  full_name: string;
  dob: string;
  student_class: string;
  institution_name: string;
  gender: string;
  contact_number: string;
  email: string;
  father_name: string;
  competition_category: string[];
  participation_type: 'individual' | 'team';
  team_size: number | null;
  team_members: TeamMemberRow[] | null;
  exam_center: string | null;
  roll_number: string | null;
  documents?: DocumentRow[];
}

const EXAM_CENTRE_NAMES: Record<string, string> = {
  Bishnupur: 'Bishnupur Higher Secondary, Bishnupur',
  Kakching: 'Wabagai Higher Secondary, Kakching',
  Thoubal: 'Y.K. College, Wangjing, Thoubal',
  Imphal: 'Oriental College, Sagolband, Imphal West',
};

function getExamCentreName(centre: string | null): string {
  if (!centre) return 'To be announced';
  return EXAM_CENTRE_NAMES[centre] || centre;
}

// Returns the venue + time for a given competition category
function getCompetitionVenueAndTime(
  cat: string,
  mathCentre: string | null
): { venue: string; time: string } {
  if (cat === 'mathematics') {
    return { venue: getExamCentreName(mathCentre), time: MATH_EXAM_TIME_DISPLAY };
  }
  return COMPETITION_EXAM_INFO[cat] || { venue: 'To be announced', time: 'TBA' };
}

export default function EduFestAdmitCard({ data }: { data: RegistrationData }) {
  const photo = data.documents?.find(d => d.document_type === 'passport_photo')?.s3_url;
  const signature = data.documents?.find(d => d.document_type === 'candidate_signature')?.s3_url;
  const rollNumber = data.roll_number;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div id="edufest-admit-card" className="bg-gray-100 p-4 md:p-8 max-w-3xl mx-auto">
        <div className="w-full bg-white shadow-lg" style={{ fontFamily: 'Arial, sans-serif' }}>
          <div className="border-2 border-black">

            {/* Header */}
            <div className="grid grid-cols-[2fr_1fr] border-b-2 border-black">
              <div className="border-r-2 border-black p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-black">MATENG EDUFEST 2026</div>
                  <div className="text-sm font-semibold mt-1 text-black">Competition Admit Card</div>
                </div>
              </div>
              <div className="p-4 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/mateng-edufest-logo.png" alt="" className="w-[140px]" />
              </div>
            </div>

            {/* Pending verification banner */}
            {!rollNumber && (
              <div className="bg-yellow-50 border-b-2 border-black px-4 py-2 text-center">
                <span className="text-xs font-bold text-yellow-800">
                  ⚠ Verification pending — roll number will appear here once the candidate is verified
                </span>
              </div>
            )}

            {/* Candidate Information */}
            <div className="grid grid-cols-2 border-b-2 border-black">
              <div className="border-r-2 border-black">
                <Row label="Roll Number:" value={rollNumber || 'Pending Verification'} bold />
                <Row label="Candidate's Name:" value={data.full_name} />
                <Row label="Gender:" value={data.gender} />
                <Row label="Class / Grade:" value={data.student_class} last />
              </div>
              <div>
                <Row label="Date of Birth:" value={data.dob} />
                <Row label="Father's Name:" value={data.father_name} />
                <Row label="Institution:" value={data.institution_name} />
                <Row label="Participation:" value={data.participation_type} capitalize last />
              </div>
            </div>

            {/* Exam Date Band — date is common, venue/time now shown per competition below */}
            <div className="border-b-2 border-black">
              <div className="bg-blue-50 px-4 py-1.5 text-center border-b border-black">
                <span className="text-xs font-bold tracking-widest uppercase text-blue-700">
                  Exam Date
                </span>
              </div>
              <div className="px-4 py-2.5 text-center">
                <span className="text-sm font-bold text-gray-900">{EXAM_DATE_DISPLAY}</span>
                <span className="text-xs text-gray-500 ml-2">(see venue &amp; time per competition below)</span>
              </div>
            </div>

            {/* QR + Signature + Photo */}
            <div className="grid grid-cols-3 border-b-2 border-black">
              <div className="border-r-2 border-black p-4 flex flex-col items-center justify-center">
                <div className="bg-white p-2">
                  <QRCode
                    value={`Roll No: ${rollNumber || 'N/A'}, Name: ${data.full_name}`}
                    size={110}
                    level="H"
                  />
                </div>
                <div className="text-sm font-bold mt-2 text-black">{rollNumber || 'Pending'}</div>
              </div>
              <div className="border-r-2 border-black p-4 flex items-center justify-center">
                <div className="text-center">
                  {signature ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={signature} alt="signature" className="h-28 rounded-lg mx-auto" />
                  ) : (
                    <div className="h-28 w-36 flex items-center justify-center text-gray-400 text-xs border border-dashed border-gray-300">
                      No signature
                    </div>
                  )}
                  <p className="text-gray-600 italic text-sm mt-1">Signature</p>
                </div>
              </div>
              <div className="p-4 flex items-center justify-center">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="photo" className="h-28 rounded-lg" />
                ) : (
                  <div className="h-28 w-24 flex items-center justify-center text-gray-400 text-xs border border-dashed border-gray-300">
                    No photo
                  </div>
                )}
              </div>
            </div>

            {/* Competition Details — now with per-competition venue and time */}
            <div className="bg-gray-50 p-2 text-center font-bold border-b-2 border-black text-black">
              Competition Details
            </div>
            <div className="border-b-2 border-black">
              {/* Table header */}
              <div className="grid grid-cols-[1.2fr_1.6fr_1fr] border-b border-black bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                <div className="p-2 border-r border-black">Competition</div>
                <div className="p-2 border-r border-black">Venue</div>
                <div className="p-2">Time</div>
              </div>
              {data.competition_category?.map((cat, i) => {
                const { venue, time } = getCompetitionVenueAndTime(cat, data.exam_center);
                const last = i === data.competition_category.length - 1;
                return (
                  <div
                    key={cat}
                    className={`grid grid-cols-[1.2fr_1.6fr_1fr] ${last ? '' : 'border-b border-black'}`}
                  >
                    <div className="p-2 border-r border-black font-bold text-sm text-black">
                      {COMPETITION_LABELS[cat] || cat}
                    </div>
                    <div className="p-2 border-r border-black text-sm text-gray-900">{venue}</div>
                    <div className="p-2 text-sm text-gray-900 font-semibold">{time}</div>
                  </div>
                );
              })}
            </div>

            {/* Team Members */}
            {data.participation_type === 'team' && data.team_members && data.team_members.length > 0 && (
              <>
                <div className="bg-gray-50 p-2 text-center font-bold border-b-2 border-black text-black">
                  Team Members
                </div>
                <div className="border-b-2 border-black">
                  {data.team_members.map((m, i) => (
                    <Row
                      key={i}
                      label={m.name}
                      value={`${m.student_class} · ${m.institute}`}
                      last={i === data.team_members!.length - 1}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Self Declaration */}
            <div className="p-4 text-xs text-gray-800">
              <div className="text-center font-bold text-red-600 mb-2">SELF DECLARATION (UNDERTAKING)</div>
              <div>
                I, _________________________________, resident of _________________________________, do hereby
                declare that the information provided above is true to the best of my knowledge, and I undertake to
                abide by all rules and instructions of Mateng EduFest 2026.
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 text-center border-t-2 border-black text-[10px] text-gray-500 italic">
              This admit card is computer generated and does not require a physical signature. For assistance, contact
              Mateng at justmatengservice@gmail.com or call 600 944 9928.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Row({
  label, value, bold, capitalize, last,
}: {
  label: string;
  value: string;
  bold?: boolean;
  capitalize?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`grid grid-cols-2 ${last ? '' : 'border-b border-black'}`}>
      <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">{label}</div>
      <div className={`p-2 text-sm text-gray-900 ${bold ? 'font-bold' : ''} ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </div>
    </div>
  );
}