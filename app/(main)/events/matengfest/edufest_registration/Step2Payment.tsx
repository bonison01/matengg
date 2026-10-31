/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormData, calculateTotalFee, COMPETITION_LABELS, COMPETITION_FEES, supabase, DOCUMENTS_BUCKET } from './type';
import { Smartphone, ArrowLeft } from 'lucide-react';
import QRCode from 'qrcode';

interface Props {
  formData: FormData;
  registrationId: number;
  onBack: () => void;
}

export default function Step2Payment({ formData, registrationId, onBack }: Props) {
  const router = useRouter();
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [networkError, setNetworkError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const teamSize = formData.participation_type === 'team' ? (formData.team_members.length + 1) : null;
  const totalFee = calculateTotalFee(formData.competition_category, formData.participation_type, teamSize);

  const upiLink = `upi://pay?pa=doeasy01-4@okicici&pn=MatengEduFest2026&am=${totalFee}&cu=INR&tn=MED${String(registrationId).padStart(6, '0')}`;

  // Generate the UPI QR code client-side (no external API call).
  // Uses the same `qrcode` library already used in generateAdmitCardPDF.ts
  // for consistency. Regenerates whenever the UPI link changes (e.g. if
  // totalFee or registrationId changes).
  useEffect(() => {
    QRCode.toDataURL(upiLink, {
      width: 240,
      margin: 2,
      color: {
        dark: '#ffffff',
        light: '#0a0a0f',
      },
    })
      .then(setQrDataUrl)
      .catch(err => console.error('Failed to generate QR code:', err));
  }, [upiLink]);

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = ev => setScreenshotPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setError('');
    setNetworkError(false);
  };

  // Fires the confirmation email via /api/sendEduFestConfirmation.
  // This is "best effort" — if it fails, we log it but do NOT block the
  // candidate from seeing the success dialog, since their registration
  // and payment screenshot are already safely recorded by this point.
  const sendConfirmationEmail = async () => {
    try {
      await fetch('/api/sendEduFestConfirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          registrationId,
          competition_category: formData.competition_category,
          competitionLabels: formData.competition_category.map(c => COMPETITION_LABELS[c]),
          participation_type: formData.participation_type,
          team_members: formData.participation_type === 'team' ? formData.team_members : [],
          totalFee,
          institution_name: formData.institution_name,
          student_class: formData.student_class,
        }),
      });
    } catch (err) {
      console.error('Failed to send confirmation email:', err);
    }
  };

  // Replaces POST /edu-fest/{registrationId}/documents (payment_screenshot).
  // Uploads the file to Storage, then records it in the documents table.
  const handleSubmit = async () => {
    if (!screenshotFile) {
      setError('Please upload the payment screenshot to proceed.');
      return;
    }
    setError('');
    setNetworkError(false);
    setUploading(true);
    try {
      const ext = screenshotFile.name.split('.').pop() || 'jpg';
      const storagePath = `${registrationId}/payment_screenshot-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(storagePath, screenshotFile, { upsert: true, contentType: screenshotFile.type });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(DOCUMENTS_BUCKET)
        .getPublicUrl(storagePath);

      const { error: dbError } = await supabase
        .from('documents')
        .upsert(
          {
            registration_id: registrationId,
            document_type: 'payment_screenshot',
            storage_path: storagePath,
            s3_url: publicUrlData.publicUrl,
          },
          { onConflict: 'registration_id,document_type' }
        );

      if (dbError) throw dbError;

      // Registration is fully saved at this point — show success dialog
      // immediately, then fire the email in the background.
      setShowSuccess(true);
      sendConfirmationEmail();
    } catch {
      setNetworkError(true);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        disabled={uploading}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Details
      </button>

      {/* Order summary */}
      <div className="rounded-2xl border border-white/20 bg-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
            <span>🧾</span> Order Summary
          </h2>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex justify-between text-xs md:text-sm text-gray-400">
            <span>Candidate</span>
            <span className="text-white">{formData.full_name}</span>
          </div>
          <div className="flex justify-between text-xs md:text-sm text-gray-400">
            <span>Registration ID</span>
            <span className="text-white font-mono">MED{String(registrationId).padStart(6, '0')}</span>
          </div>
          {formData.participation_type === 'team' && (
            <div className="flex justify-between text-xs md:text-sm text-gray-400">
              <span>Team Size</span>
              <span className="text-white">{formData.team_members.length + 1} members</span>
            </div>
          )}
          <div className="border-t border-white/5 pt-3 mt-3 space-y-2">
            {formData.competition_category.map(cat => {
              const catFee = (() => {
                const base = COMPETITION_FEES[cat];
                if (formData.participation_type === 'team' && (cat === 'quiz' || cat === 'young_innovator')) {
                  return base * (formData.team_members.length + 1);
                }
                return base;
              })();
              return (
                <div key={cat} className="flex justify-between text-base md:text-lg">
                  <span className="text-green-200">{COMPETITION_LABELS[cat]}</span>
                  <span className="text-white font-mono">₹{catFee}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-white/10 pt-3 flex justify-between items-center">
            <span className="text-white font-semibold md:text-lg">Total Amount</span>
            <span className="text-2xl font-bold text-emerald-400 font-mono">₹{totalFee}</span>
          </div>
        </div>
      </div>

      {/* QR Code payment */}
      <div className="rounded-2xl border border-emerald-500/60 bg-emerald-800/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-emerald-500/15">
          <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
            <span>📱</span> Scan & Pay via UPI
          </h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* QR Code */}
            <div className="flex-shrink-0 flex flex-col items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#0a0a0f] border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)] w-[224px] h-[224px] flex items-center justify-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="UPI QR Code"
                    width={200}
                    height={200}
                    className="rounded-xl"
                  />
                ) : (
                  <span className="w-6 h-6 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                )}
              </div>
              {/* <a
                href={upiLink}
                className="text-xs text-emerald-400 border border-emerald-500/30 rounded-lg px-4 py-2 hover:bg-emerald-500/10 transition-all text-center"
              >
                Open in UPI App
              </a> */}
            </div>

            {/* Payment details */}
            <div className="flex-1 space-y-4">
              <div className="space-y-3">
                <InfoRow label="UPI ID" value="doeasy01-4@okicici" mono />
                <InfoRow label="Amount" value={`₹${totalFee}`} highlight />
                {/* <InfoRow label="Name" value="MatengEduFest 2026" /> */}
                <InfoRow label="Reference" value={`MED${String(registrationId).padStart(6, '0')}`} mono />
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs md:text-sm text-amber-300/90">
                ⚠️ &nbsp; After completing payment, take a screenshot of the payment confirmation and upload it below.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Screenshot upload */}
      <div className="rounded-2xl border border-white/20 bg-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
            <span>📸</span> Upload Payment Screenshot
          </h2>
        </div>
        <div className="p-6">
          <div
            className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all ${
              error ? 'border-red-500/40 bg-red-500/5' :
              screenshotPreview ? 'border-emerald-500/30 bg-emerald-500/5' :
              'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
            }`}
            style={{ minHeight: 160 }}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleScreenshot}
            />
            {screenshotPreview ? (
              <div className="flex flex-col items-center justify-center p-4">
                <img src={screenshotPreview} alt="Payment screenshot" className="max-h-40 max-w-full object-contain rounded-lg" />
                <p className="text-xs text-emerald-400 mt-3">✓ Screenshot uploaded — click to change</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl"><Smartphone /></div>
                <p className="text-gray-400 text-sm">Upload payment confirmation screenshot</p>
                <p className="text-white/40 text-xs">JPG, PNG or WEBP</p>
              </div>
            )}
          </div>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>
      </div>

      {networkError && (
        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">📡</span>
          <div>
            <p className="text-red-300 font-semibold text-sm">Network is down</p>
            <p className="text-red-200/80 text-sm mt-1 leading-relaxed">
              Don't worry, please contact our team at{' '}
              <a href="tel:6009729928" className="text-emerald-400 font-semibold hover:underline">
                6009729928
              </a>{' '}
              and we'll help you sort it out.
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={uploading}
        className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(16,185,129,0.2)]"
      >
        {uploading ? (
          <>
            <span className="w-5 h-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
            Submitting…
          </>
        ) : (
          'Complete Registration ✓'
        )}
      </button>

      <SubmitOverlay visible={uploading} />
      <SuccessDialog
        visible={showSuccess}
        registrationId={registrationId}
        email={formData.email}
        onClose={() => router.push('/events/matengfest')}
      />
    </div>
  );
}

function SubmitOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5 px-8 py-10 rounded-3xl bg-[#0f1117] border border-emerald-500/20 shadow-[0_0_60px_rgba(16,185,129,0.15)] max-w-sm mx-4 text-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/15" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-emerald-300/70 animate-spin [animation-duration:1.4s] [animation-direction:reverse]" />
        </div>
        <div>
          <p className="text-white font-semibold text-base">Uploading your payment screenshot…</p>
          <p className="text-gray-400 text-sm mt-1.5">This usually takes just a few seconds. Please don't close this page.</p>
        </div>
        <div className="flex gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
        </div>
      </div>
    </div>
  );
}

function SuccessDialog({
  visible,
  registrationId,
  email,
  onClose,
}: {
  visible: boolean;
  registrationId: number;
  email: string;
  onClose: () => void;
}) {
  if (!visible) return null;

  const regNo = `MED${String(registrationId).padStart(6, '0')}`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="flex flex-col items-center gap-5 px-8 py-10 rounded-3xl bg-[#0f1117] border border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.2)] max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
          <span className="text-3xl text-emerald-400">✓</span>
        </div>

        <div>
          <p className="text-white font-bold text-xl">Registration Completed!</p>
          <p className="text-gray-400 text-sm mt-2 leading-relaxed">
            Your registration for Mateng EduFest 2026 has been received and your payment is under verification.
          </p>
        </div>

        <div className="w-full rounded-xl bg-emerald-950/30 border border-emerald-500/20 py-4">
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">Registration Number</p>
          <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">{regNo}</p>
        </div>

        <p className="text-gray-400 text-sm leading-relaxed">
          A confirmation with these details has been sent to{' '}
          <span className="text-white font-medium">{email}</span>. Please keep your registration number safe for
          future reference.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs md:text-sm text-gray-400 font-mono uppercase tracking-wide">{label}</span>
      <span className={`text-xs md:text-sm ${highlight ? 'text-emerald-400 font-bold' : 'text-white'} ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}