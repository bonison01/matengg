'use client';

import { useState } from 'react';
import EduFestAdmitCardSearch from './EduFestAdmitCardSearch';
import EduFestAdmitCard from './EduFestAdmitCard';
import { generateEduFestAdmitCardPDF } from '../generatePDF';

export default function EduFestAdmitCardPage() {
  const [candidate, setCandidate] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!candidate) return;
    if (!candidate.roll_number) {
      alert('Your registration is still pending verification. The admit card will be available once a roll number is assigned.');
      return;
    }
    try {
      setDownloading(true);
      await generateEduFestAdmitCardPDF(candidate);
    } catch (err) {
      console.error('Download failed:', err);
      alert('❌ Could not generate admit card.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6 md:px-10">
      <h1 className="text-2xl font-bold mb-6 text-center text-white">EduFest Admit Card Portal</h1>

      <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
        <div className="lg:w-[420px] lg:flex-shrink-0">
          <EduFestAdmitCardSearch onFound={setCandidate} />

          {candidate && (
            <button
              onClick={() => setCandidate(null)}
              className="w-full mt-3 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-sm transition-all"
            >
              Search Again
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center gap-4 w-full">
          {candidate && (
            <>
              {!candidate.roll_number && (
                <div className="w-full max-w-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm rounded-xl px-4 py-3 text-center">
                  ⚠ Verification pending. Your roll number and admit card will be available once your registration is verified.
                </div>
              )}
              <button
                onClick={handleDownload}
                disabled={downloading || !candidate.roll_number}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                  downloading || !candidate.roll_number
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                }`}
              >
                {downloading
                  ? 'Downloading…'
                  : candidate.roll_number
                  ? 'Download Admit Card (PDF)'
                  : 'Admit Card Not Available Yet'}
              </button>
              <EduFestAdmitCard data={candidate} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}