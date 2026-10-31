///Users/mac/Documents/github/testmateng1/app/(main)/events/matengfest/edufest_registration/RegistrationForm.tsx
'use client';

import { useState } from 'react';
import Step1Details from './Step1Details';
import Step2Payment from './Step2Payment';
import { FormData } from './type';

const INITIAL_FORM: FormData = {
  full_name: '',
  dob: '',
  student_class: '',
  institution_name: '',
  contact_number: '',
  gender: '',
  alternate_contact_number: '',
  address: '',
  father_name: '',
  father_occupation: '',
  competition_category: [],
  participation_type: 'individual',
  team_size: null,
  team_members: [],
  email: '',
  passport_photo: null,
  candidate_signature: null,
};

export default function RegistrationForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [registrationId, setRegistrationId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-transparent to-teal-950/20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        <div className="relative max-w-3xl mx-auto px-6 py-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs md:text-sm font-mono font-semibold tracking-widest uppercase mb-4">
            Mateng EduFest 2026
          </div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            Competition Registration
          </h1>
          
          <p className="text-gray-400 text-sm">Inspiring Young Minds Through Creativity, Knowledge & Innovation</p>
<div className="flex flex-wrap items-center justify-center gap-3 mt-6">
  {/* Prospectus */}
  <a
    href="/bulletin.pdf"
    download
    className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 transition-all duration-200 shadow-lg shadow-emerald-500/20"
  >
    Download Prospectus
  </a>

  {/* Maths Syllabus */}
  <a
    href="/syllabus.pdf"
    download
    className="px-5 py-2.5 rounded-xl border border-emerald-500/40 bg-white/5 text-emerald-300 font-semibold text-sm hover:bg-emerald-500/10 transition-all duration-200"
  >
    Download Maths Syllabus
  </a>
</div>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mt-8">
            {[
              { n: 1, label: 'Details' },
              { n: 2, label: 'Payment' },
            ].map(({ n, label }) => (
              <div key={n} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm  font-mono transition-all duration-300 ${
                  step === n
                    ? 'bg-emerald-500 text-gray-200 font-bold'
                    : step > n
                    ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800'
                    : 'bg-white/5 text-white/60 border border-white/10'
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-sm ${
                    step === n ? 'bg-black/20' : step > n ? 'bg-emerald-500 text-black' : 'bg-white/20'
                  }`}>
                    {step > n ? '✓' : n}
                  </span>
                  {label}
                </div>
                {n < 2 && <div className={`w-8 h-[1px] ${step > n ? 'bg-emerald-500' : 'bg-white/20'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form area */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        {step === 1 && (
          <Step1Details
            formData={formData}
            setFormData={setFormData}
            onNext={(id: number) => {
              setRegistrationId(id);
              setStep(2);
            }}
          />
        )}
        {step === 2 && registrationId && (
          <Step2Payment
            formData={formData}
            registrationId={registrationId}
            onBack={() => setStep(1)}
          />
        )}
      </div>
    </div>
  );
}