'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateEduFestAdmitCardPDF } from '../generatePDF';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function CompleteClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [registration, setRegistration] = useState<any>(null);
    const [countdown, setCountdown] = useState(30);
    const [pdfGenerated, setPdfGenerated] = useState(false);
    const pdfRef = useRef(false);

    useEffect(() => {
        if (!id) return;
        fetch(`${API_BASE}/edu-fest/${id}`)
            .then(r => r.json())
            .then(async (reg) => {
                setRegistration(reg);
                try {
                    const docsRes = await fetch(`${API_BASE}/edu-fest/${id}/documents`);
                    const docsData = await docsRes.json();
                    reg.documents = docsData.documents || [];
                } catch { }
                setRegistration({ ...reg });
            })
            .catch(() => { });
    }, [id]);

    const buildPdfData = (registration: any) => ({
    id: registration.id,
    full_name: registration.full_name,
    dob: registration.dob,
    student_class: registration.student_class,
    institution_name: registration.institution_name,
    contact_number: registration.contact_number,
    gender: registration.gender,
    email: registration.email,
    father_name: registration.father_name,
    roll_number: registration.roll_number ?? '',
    exam_center: registration.exam_center ?? '',
    competition_category: registration.competition_category
        ? [registration.competition_category].flat()
        : [],
    participation_type: registration.participation_type,
    team_size: registration.team_size ?? null,
    team_members: (registration.team_members || []).map((m: any) => ({
        name: m.name,
        student_class: m.student_class || '',
        dob: m.dob || '',
        institute: m.institute || '',
    })),
    documents: registration.documents || [],
});

    const handleDownloadPDF = async () => {
        if (!registration) return;
        try {
            await generateEduFestAdmitCardPDF(buildPdfData(registration));
        } catch (err) {
            console.error('PDF generation failed', err);
        }
    };

    // Auto-download PDF once registration is loaded
    useEffect(() => {
        if (!registration || pdfRef.current) return;
        pdfRef.current = true;

        setTimeout(() => {
            generateEduFestAdmitCardPDF(buildPdfData(registration))
                .then(() => setPdfGenerated(true))
                .catch(() => setPdfGenerated(true));
        }, 1200);
    }, [registration]);

    // Countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(c => {
                if (c <= 1) {
                    clearInterval(interval);
                    router.push('/');
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [router]);

    const formNo = id ? `MEF-${String(id).padStart(6, '0')}` : '';

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6 py-16 text-center relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />

            {/* Confetti dots */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{
                            backgroundColor: ['#10b981', '#34d399', '#6ee7b7', '#059669'][i % 4],
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 60}%`,
                            opacity: 0.3 + Math.random() * 0.4,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${1.5 + Math.random() * 2}s`,
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 max-w-lg w-full">
                {/* Success icon */}
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-5xl mx-auto mb-6 shadow-[0_0_60px_rgba(16,185,129,0.2)]">
                    ✓
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs md:text-sm font-semibold font-mono tracking-widest uppercase mb-4">
                    Registration Complete
                </div>

                <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
                    You're In! 🎉
                </h1>
                <p className="text-white/50 mb-2">
                    {registration?.full_name && `Congratulations, ${registration.full_name}!`} Your registration for Mateng EduFest 2026 has been received.
                </p>
                <p className="text-white/40 text-sm mb-8">
                    A confirmation email has been sent to <span className="text-emerald-400">{registration?.email || 'your registered email'}</span>
                </p>

                {/* Registration info card */}
                <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 mb-6 text-left space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-white/40">Form Number</span>
                        <span className="text-white font-mono">{formNo}</span>
                    </div>
                    {registration && (
                        <>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/40">Event</span>
                                <span className="text-emerald-400 capitalize">
                                    {[registration.competition_category]
                                        .flat()
                                        .map((c: string) => c.replace(/_/g, ' '))
                                        .join(', ')}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/40">Participation</span>
                                <span className="text-white capitalize">{registration.participation_type}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* PDF status */}
                <div className={`flex items-center justify-center gap-3 p-4 rounded-xl border mb-6 text-sm transition-all ${pdfGenerated
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-white/3 border-white/8 text-white/40'
                    }`}>
                    {pdfGenerated ? (
                        <>📄 Registration form PDF downloaded!</>
                    ) : (
                        <>
                            <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-emerald-400 animate-spin" />
                            Generating your registration form PDF…
                        </>
                    )}
                </div>

                {/* Manual re-download button */}
                <button
                    onClick={handleDownloadPDF}
                    className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-all mb-6"
                >
                    📄 Re-download PDF
                </button>

                {/* Countdown */}
                <div className="space-y-3">
                    <p className="text-white/30 text-xs">
                        Redirecting to home in {countdown}s
                    </p>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500/60 rounded-full transition-all duration-1000"
                            style={{ width: `${(countdown / 30) * 100}%` }}
                        />
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="text-xs text-white/30 hover:text-white/60 transition-colors underline underline-offset-2"
                    >
                        Go to home now
                    </button>
                </div>
            </div>
        </div>
    );
}