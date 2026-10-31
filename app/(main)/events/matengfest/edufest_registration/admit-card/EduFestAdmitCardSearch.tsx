'use client';

import { useState } from 'react';
import { supabase } from '../type';
import { AlertCircle, IdCard, Search } from 'lucide-react';

interface Props {
  onFound: (data: any) => void;
}

export default function EduFestAdmitCardSearch({ onFound }: Props) {
  const [regNoInput, setRegNoInput] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setError('');

    if (!regNoInput.trim() || !dob) {
      setError('Please enter both your Registration Number and Date of Birth.');
      return;
    }

    // Accept "MED000123", "med000123", or just "123" / "000123"
    const numericPart = regNoInput.replace(/\D/g, '').replace(/^0+/, '');
    if (!numericPart) {
      setError('That registration number doesn\'t look right. It should look like MED000123.');
      return;
    }

    setLoading(true);
    try {
      const { data: reg, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .eq('id', Number(numericPart))
        .eq('dob', dob)
        .maybeSingle();

      if (regError) throw regError;

      if (!reg) {
        setError('No registration found with that Registration Number and Date of Birth. Please double-check and try again.');
        return;
      }

      if (reg.verification_status !== 'verified') {
        setError(
          reg.verification_status === 'rejected'
            ? 'Your registration could not be verified. Please contact our team at 6009729928 for help.'
            : 'Your registration is still under verification. Please check back soon, or contact 6009729928 if it has been a while.'
        );
        return;
      }

      // Fetch documents (photo, signature) for the admit card.
      const { data: docs, error: docError } = await supabase
        .from('documents')
        .select('document_type, s3_url')
        .eq('registration_id', reg.id);

      if (docError) throw docError;

      onFound({ ...reg, documents: docs || [] });
    } catch (err) {
      console.error('Admit card search failed:', err);
      setError('Something went wrong while searching. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <IdCard className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg">Download Admit Card</h2>
          <p className="text-gray-400 text-sm">Enter your details to find your admit card</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">
            Registration Number
          </label>
          <input
            value={regNoInput}
            onChange={e => setRegNoInput(e.target.value)}
            placeholder="MED000123"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">
            Date of Birth
          </label>
          <input
            type="date"
            value={dob}
            onChange={e => setDob(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm [color-scheme:dark] focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm leading-relaxed">{error}</p>
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          {loading ? 'Searching…' : 'Find My Admit Card'}
        </button>
      </div>
    </div>
  );
}