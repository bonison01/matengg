// app/(main)/events/matengfest/edufest_registration/page.tsx
'use client';

import RegistrationForm from './RegistrationForm';

// Registration closes at 5:00 PM on 25th July 2026 (IST).
const REGISTRATION_DEADLINE = new Date('2026-07-25T17:00:00+05:30');

export default function EduFestPage() {
  const isClosed = new Date() >= REGISTRATION_DEADLINE;

  if (!isClosed) {
    return <RegistrationForm />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Registration Closed</h1>
          <p className="text-white/60">
            Registrations for EduFest are now closed. Thank you to everyone who registered.
          </p>
        </div>

        <div className="pt-4 border-t border-white/10">
          <p className="text-sm text-white/40">
            For queries, please contact the organizing committee.
          </p>
        </div>
      </div>
    </div>
  );
}