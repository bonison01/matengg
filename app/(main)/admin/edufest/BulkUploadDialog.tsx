// app/(main)/admin/edufest/BulkUploadDialog.tsx
'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../events/matengfest/edufest_registration/type';

type CompetitionKey = 'painting' | 'quiz' | 'mathematics' | 'young_innovator';
const VALID_COMPETITIONS: CompetitionKey[] = ['painting', 'quiz', 'mathematics', 'young_innovator'];
const EXAM_CENTERS = ['Imphal', 'Thoubal', 'Kakching', 'Bishnupur'];

interface ParsedRow {
  rowIndex: number;
  full_name: string;
  dob: string;
  student_class: string;
  institution_name: string;
  contact_number: string;
  alternate_contact_number: string;
  gender: string;
  email: string;
  address: string;
  father_name: string;
  father_occupation: string;
  competition_category: string[];
  participation_type: 'individual' | 'team';
  team_size: number | null;
  team_members: { name: string; student_class: string; dob: string; institute: string }[];
  exam_center: string | null;
  errors: string[];
}

const TEMPLATE_HEADERS = [
  'full_name', 'dob', 'student_class', 'institution_name', 'contact_number',
  'alternate_contact_number', 'gender', 'email', 'address', 'father_name',
  'father_occupation', 'competition_category', 'participation_type', 'team_members',
  'exam_center',
];

const TEMPLATE_SAMPLE = [
  'Ningthem Singh', '2012-05-14', 'Class 7', 'DM School Imphal', '9856012345',
  '', 'Male', 'ningthem@example.com', 'Uripok, Imphal West', 'Ibomcha Singh',
  'Farmer', 'painting;quiz', 'team',
  'Sana Devi|Class 7|2012-08-02|DM School Imphal',
  'Imphal',
];

function parseRow(raw: any, rowIndex: number): ParsedRow {
  const errors: string[] = [];

  const str = (v: any) => (v === undefined || v === null ? '' : String(v).trim());

  const full_name = str(raw.full_name);
  const dob = str(raw.dob);
  const student_class = str(raw.student_class);
  const institution_name = str(raw.institution_name);
  const contact_number = str(raw.contact_number).replace(/\D/g, '').slice(0, 10);
  const alternate_contact_number = str(raw.alternate_contact_number).replace(/\D/g, '').slice(0, 10);
  const gender = str(raw.gender);
  const email = str(raw.email);
  const address = str(raw.address);
  const father_name = str(raw.father_name);
  const father_occupation = str(raw.father_occupation);
  const exam_center_raw = str(raw.exam_center);

  if (!full_name) errors.push('Missing full_name');
  if (!dob) errors.push('Missing dob');
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) errors.push('dob must be YYYY-MM-DD');
  if (!student_class) errors.push('Missing student_class');
  if (!institution_name) errors.push('Missing institution_name');
  if (contact_number.length !== 10) errors.push('contact_number must be 10 digits');
  if (!gender) errors.push('Missing gender');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email');
  if (!address) errors.push('Missing address');
  if (!father_name) errors.push('Missing father_name');
  if (!father_occupation) errors.push('Missing father_occupation');

  const competition_category = str(raw.competition_category)
    .split(';')
    .map(c => c.trim())
    .filter(Boolean);
  if (competition_category.length === 0) {
    errors.push('Missing competition_category');
  } else {
    competition_category.forEach(c => {
      if (!VALID_COMPETITIONS.includes(c as CompetitionKey)) {
        errors.push(`Unknown competition "${c}"`);
      }
    });
  }

  const hasTeamEvent = competition_category.includes('quiz') || competition_category.includes('young_innovator');
  const participation_type_raw = str(raw.participation_type).toLowerCase();
  const participation_type: 'individual' | 'team' =
    hasTeamEvent && participation_type_raw === 'team' ? 'team' : 'individual';

  const team_members: ParsedRow['team_members'] = [];
  if (participation_type === 'team') {
    const memberStr = str(raw.team_members);
    if (memberStr) {
      memberStr.split(',').forEach(chunk => {
        const parts = chunk.split('|').map(p => p.trim());
        if (parts.length >= 4 && parts[0]) {
          team_members.push({ name: parts[0], student_class: parts[1], dob: parts[2], institute: parts[3] });
        }
      });
    }
    if (team_members.length === 0) errors.push('participation_type is "team" but no valid team_members provided');
  }

  const exam_center = exam_center_raw && EXAM_CENTERS.includes(exam_center_raw) ? exam_center_raw : null;
  if (exam_center_raw && !exam_center) errors.push(`Unknown exam_center "${exam_center_raw}"`);

  return {
    rowIndex,
    full_name, dob, student_class, institution_name, contact_number,
    alternate_contact_number, gender, email, address, father_name, father_occupation,
    competition_category, participation_type,
    team_size: participation_type === 'team' ? team_members.length + 1 : null,
    team_members,
    exam_center,
    errors,
  };
}

// Turns a Supabase/PostgREST error into a short, human-readable line.
// Postgres error codes reference: https://www.postgresql.org/docs/current/errcodes-appendix.html
function describeSupabaseError(error: any): string {
  const code = error?.code;
  const message = error?.message || 'Unknown error';
  const hintSuffix = error?.hint ? ` (hint: ${error.hint})` : '';
  const detailSuffix = error?.details ? ` — ${error.details}` : '';

  const knownCodes: Record<string, string> = {
    '42501': 'Row Level Security is blocking this insert (RLS policy violation)',
    '23502': 'A required (NOT NULL) column is missing from the payload',
    '23514': 'A CHECK constraint rejected the value (e.g. an enum/status field)',
    '23505': 'Duplicate value violates a UNIQUE constraint',
    '22P02': 'A value has the wrong type for its column (e.g. array sent to a text column)',
    '42703': 'A column in the payload does not exist on the table',
  };

  const label = code && knownCodes[code] ? `${knownCodes[code]} [${code}]` : code ? `[${code}]` : '';
  return [label, message + detailSuffix + hintSuffix].filter(Boolean).join(': ');
}

export default function BulkUploadDialog({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: () => void;
}) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ inserted: number; failed: number } | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [templateDownloaded, setTemplateDownloaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_SAMPLE]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registrations');
    XLSX.writeFile(wb, 'edufest_bulk_upload_template.xlsx');
    setTemplateDownloaded(true);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setErrorDetails([]);

    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<any>(sheet, { raw: false, defval: '' });

    setRows(json.map((r, i) => parseRow(r, i + 2))); // +2 = header row + 1-index
  };

  const validRows = rows.filter(r => r.errors.length === 0);
  const invalidRows = rows.filter(r => r.errors.length > 0);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setSubmitting(true);
    setErrorDetails([]);
    setProgress({ done: 0, total: validRows.length });

    let inserted = 0;
    let failed = 0;
    const newErrorDetails: string[] = [];
    const BATCH_SIZE = 25;

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE).map(r => ({
        full_name: r.full_name,
        dob: r.dob,
        student_class: r.student_class,
        institution_name: r.institution_name,
        contact_number: r.contact_number,
        alternate_contact_number: r.alternate_contact_number || null,
        gender: r.gender,
        email: r.email,
        address: r.address,
        father_name: r.father_name,
        father_occupation: r.father_occupation,
        competition_category: r.competition_category,
        participation_type: r.participation_type,
        team_size: r.team_size,
        team_members: r.participation_type === 'team' ? r.team_members : [],
        // No documents attached for bulk-imported candidates — photo/signature
        // upload is intentionally bypassed for this path.
        verification_status: 'pending',
        exam_center: r.exam_center,
      }));

      const { data, error } = await supabase.from('registrations').insert(batch).select('id');
      if (error) {
        console.error('Bulk insert batch failed:', error);
        failed += batch.length;
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        newErrorDetails.push(`Batch ${batchNum} (rows ${i + 1}-${Math.min(i + BATCH_SIZE, validRows.length)}): ${describeSupabaseError(error)}`);
      } else {
        inserted += data?.length || 0;
      }
      setProgress({ done: Math.min(i + BATCH_SIZE, validRows.length), total: validRows.length });
    }

    setErrorDetails(newErrorDetails);
    setResult({ inserted, failed });
    setSubmitting(false);
    if (inserted > 0) onComplete();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: 20 }}
      onClick={submitting ? undefined : onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 20, maxWidth: 820, width: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', padding: 28 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 19, color: '#111827' }}>Bulk Upload Registrations</h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              Import candidates from a CSV/Excel file. Photo &amp; signature upload is skipped for these entries —
              they can be added later if needed.
            </p>
          </div>
          <button onClick={submitting ? undefined : onClose} style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: submitting ? 'not-allowed' : 'pointer', color: '#9ca3af' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
          <button
            onClick={downloadTemplate}
            style={{
              padding: '9px 16px', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer',
              border: templateDownloaded ? '1px solid #14710F' : '1px solid #e5e7eb',
              background: templateDownloaded ? '#f0fdf4' : '#fff',
              color: templateDownloaded ? '#14710F' : '#111827',
            }}
          >
            {templateDownloaded ? '✓ Template Downloaded' : '① ⬇ Download Template'}
          </button>
          <button
            onClick={() => templateDownloaded && fileRef.current?.click()}
            disabled={!templateDownloaded}
            title={!templateDownloaded ? 'Download the template first' : ''}
            style={{
              padding: '9px 16px', borderRadius: 10, border: 'none', fontWeight: 600, fontSize: 13,
              cursor: templateDownloaded ? 'pointer' : 'not-allowed',
              background: templateDownloaded ? '#111827' : '#d1d5db',
              color: '#fff',
              opacity: templateDownloaded ? 1 : 0.7,
            }}
          >
            ② 📁 Choose File
          </button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} style={{ display: 'none' }} />
          {fileName && <span style={{ fontSize: 13, color: '#6b7280', alignSelf: 'center' }}>{fileName}</span>}
        </div>

        {!templateDownloaded && (
          <p style={{ fontSize: 12, color: '#b45309', marginTop: 0, marginBottom: 14 }}>
            Download the template first so your columns match the expected format, fill it in, then choose the file to upload.
          </p>
        )}

        {rows.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: 20, marginBottom: 14, fontSize: 13 }}>
              <div style={{ color: '#166534' }}><b>{validRows.length}</b> valid rows</div>
              <div style={{ color: '#991b1b' }}><b>{invalidRows.length}</b> rows with errors</div>
            </div>

            <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f9fafb' }}>
                  <tr>
                    <th style={thStyle}>Row</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Class</th>
                    <th style={thStyle}>Contact</th>
                    <th style={thStyle}>Competitions</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.rowIndex} style={{ background: r.errors.length ? '#fef2f2' : '#fff' }}>
                      <td style={tdStyle}>{r.rowIndex}</td>
                      <td style={tdStyle}>{r.full_name || '—'}</td>
                      <td style={tdStyle}>{r.student_class || '—'}</td>
                      <td style={tdStyle}>{r.contact_number || '—'}</td>
                      <td style={tdStyle}>{r.competition_category.join(', ') || '—'}</td>
                      <td style={tdStyle}>
                        {r.errors.length === 0
                          ? <span style={{ color: '#166534', fontWeight: 600 }}>✓ OK</span>
                          : <span style={{ color: '#991b1b' }} title={r.errors.join('; ')}>⚠ {r.errors[0]}{r.errors.length > 1 ? ` +${r.errors.length - 1}` : ''}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {result && (
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: result.failed ? '#fef3c7' : '#dcfce7', color: result.failed ? '#92400e' : '#166534', fontSize: 13, fontWeight: 600 }}>
            {result.inserted > 0 && `✅ Imported ${result.inserted} candidate${result.inserted === 1 ? '' : 's'}`}
            {result.inserted > 0 && result.failed > 0 && ' — '}
            {result.failed > 0 && `⚠ ${result.failed} failed`}
            {result.inserted === 0 && result.failed === 0 && 'Nothing to import'}
          </div>
        )}

        {errorDetails.length > 0 && (
          <div style={{ marginTop: 10, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12, fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {errorDetails.map((line, idx) => (
              <div key={idx} style={{ marginBottom: idx < errorDetails.length - 1 ? 8 : 0 }}>{line}</div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button
            onClick={handleImport}
            disabled={validRows.length === 0 || submitting}
            style={{ flex: 1, padding: '12px 18px', borderRadius: 10, border: 'none', cursor: validRows.length === 0 || submitting ? 'not-allowed' : 'pointer', background: validRows.length === 0 || submitting ? '#9ca3af' : '#14710F', color: '#fff', fontWeight: 700, fontSize: 14 }}
          >
            {submitting ? `Importing… (${progress.done}/${progress.total})` : `Import ${validRows.length} Candidate${validRows.length === 1 ? '' : 's'}`}
          </button>
          <button
            onClick={submitting ? undefined : onClose}
            style={{ padding: '12px 18px', borderRadius: 10, border: '1px solid #e5e7eb', cursor: submitting ? 'not-allowed' : 'pointer', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14 }}
          >
            {result ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', color: '#6b7280', fontWeight: 700, borderBottom: '1px solid #e5e7eb' };
const tdStyle: React.CSSProperties = { padding: '6px 10px', color: '#111827', borderBottom: '1px solid #f1f5f9' };