'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2,
  ArrowRight,
  Tickets,
  Plus,
  Minus,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Timer,
  Lock,
  MapPin,
  Clock,
  DoorOpen,
  Volume2,
  Mic2,
  Phone,
  Mail,
  PartyPopper,
  Sparkles,
  MailWarning,
  Pencil,
  ShieldCheck,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
});
const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

const API_BASE_URL = 'https://api.matengdelivery.com';
// const API_BASE_URL = "http://localhost:8000";

// --------------- Event details ---------------
const EVENT_DATE_LABEL = '26th September 2026';
const EVENT_TIME_LABEL = '5:00 PM';
const GATE_OPEN_LABEL = '3:00 PM';
const VENUE_LABEL = 'Chumthang Shannapung, Langthabal';
const ORGANISER_LABEL = 'Kok Manga';
const EMCEE_LABEL = 'Prem';
const SOUND_LIGHT_LABEL = 'Extreme';
const CONTACT_NUMBERS = ['8787594828', '8575599273', '8732082535'];

// Each artist's photo is cropped straight out of the /summer.png poster —
// bgSize/bgPosition are eyeballed to frame that act's photo in the row.
// Nudge these if the crop drifts once you see it against the real poster file.
const ARTISTS: { name: string; tag: string; bgSize: string; bgPosition: string }[] = [
  { name: 'Innocent Eyes', tag: 'Band', bgSize: '588% 621%', bgPosition: '0% 41%' },
  { name: 'Binita Laishram', tag: 'Vocalist', bgSize: '769% 440%', bgPosition: '20% 36%' },
  { name: 'Jeet Kshetricha', tag: 'Vocalist', bgSize: '769% 540%', bgPosition: '35% 40%' },
  { name: 'Eyoom', tag: 'Band', bgSize: '625% 353%', bgPosition: '51% 41%' },
  { name: 'Makok Band', tag: 'Band', bgSize: '476% 463%', bgPosition: '75% 42%' },
];

// --------------- Booking status ---------------
// Flip this to true to close ticket sales.
const BOOKING_CLOSED = true;
const BOOKING_CLOSED_MESSAGE = 'Ticket sales for Summer of Sound 2026 have closed.';

const SERVICE_FEE_PER_PASS = 8; // per guide: ₹8 per pass
const GATE_CRASH_PRICE = 499; // walk-in price at the venue, not sold online

// --------------- Validation helpers ---------------
const isValidPhone = (val: string) => /^\d{10}$/.test(val);
const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

// --------------- Countdown helper ---------------
type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

const getTimeLeft = (deadline: Date): TimeLeft => {
  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, expired: false };
};

const pad = (n: number) => n.toString().padStart(2, '0');

// --------------- Animated field wrapper ---------------
const FieldWrapper = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

// --------------- Validation icon ---------------
const ValidationIcon = ({ valid, show }: { valid: boolean; show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.span
        key={valid ? 'ok' : 'err'}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.6 }}
        transition={{ duration: 0.2 }}
        className="absolute right-3 top-1/2 -translate-y-1/2"
      >
        {valid ? (
          <CheckCircle2 className="h-4 w-4 text-[#3FA637]" />
        ) : (
          <XCircle className="h-4 w-4 text-red-400" />
        )}
      </motion.span>
    )}
  </AnimatePresence>
);

// --------------- Pricing state (from GET /billing/available-passes) ---------------
type Pricing = {
  normalPrice: number;
  earlyBirdPrice: number;
  earlyBirdAvailable: boolean;
  earlyBirdEndsAt: Date | null;
};

// Early bird is open for now — used as the optimistic default while the
// live /billing/available-passes response loads (and as a fallback if it fails).
const DEFAULT_PRICING: Pricing = {
  normalPrice: 399,
  earlyBirdPrice: 349,
  earlyBirdAvailable: true,
  earlyBirdEndsAt: new Date('2026-08-25T23:59:59+05:30'),
};

// Basic per-provider steps for finding the spam/junk folder — shown inside
// the confirm-details dialog so people know where to look if the ticket
// email doesn't land in the inbox.
const SPAM_FOLDER_STEPS = [
  'Gmail: open the app or gmail.com, tap the ☰ menu, then scroll down and tap "Spam".',
  'Outlook: open the left sidebar, look for "Junk Email" (sometimes under "More").',
  'Yahoo Mail: open the sidebar menu and tap "Spam".',
  'Any provider: search your inbox for "Summer of Sound" or the sender\'s email address — it sometimes helps more than browsing folders.',
];

export default function TicketRegistrationPage() {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const [pricing, setPricing] = useState<Pricing>(DEFAULT_PRICING);

  const [phone, setPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const phoneValid = isValidPhone(phone);

  const [email, setEmail] = useState('');
  const [emailValidated, setEmailValidated] = useState<boolean | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --------------- Welcome / early-bird-is-live popup ---------------
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const hasShownWelcome = useRef(false);

  // --------------- Confirm-details-before-payment popup ---------------
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const pendingFieldsRef = useRef<{ first_name: string; last_name: string; address: string } | null>(
    null
  );

  const handleEmailChange = useCallback((val: string) => {
    setEmail(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setEmailValidated(val.length > 0 ? isValidEmail(val) : null);
    }, 500);
  }, []);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  // --------------- Fetch live pricing / early bird availability ---------------
  useEffect(() => {
    const fetchPasses = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/billing/available-passes`, {
          headers: { accept: 'application/json' },
        });
        if (!res.ok) return;
        const data = await res.json();
        setPricing({
          normalPrice: data.normal_price,
          earlyBirdPrice: data.early_bird_price,
          earlyBirdAvailable: data.early_bird_available,
          earlyBirdEndsAt: data.early_bird_ends_at ? new Date(data.early_bird_ends_at) : null,
        });
      } catch (err) {
        console.error('Failed to fetch available passes, using defaults', err);
      }
    };

    fetchPasses();
  }, []);

  // --------------- Countdown state ---------------
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    pricing.earlyBirdEndsAt
      ? getTimeLeft(pricing.earlyBirdEndsAt)
      : { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  );

  useEffect(() => {
    if (!pricing.earlyBirdEndsAt) return;
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(pricing.earlyBirdEndsAt as Date));
    }, 1000);
    return () => clearInterval(interval);
  }, [pricing.earlyBirdEndsAt]);

  // Early bird is open for now
  const offerActive = pricing.earlyBirdAvailable && !timeLeft.expired;

  const passType = offerActive ? 'early_bird' : 'normal';
  const unitPrice = offerActive ? pricing.earlyBirdPrice : pricing.normalPrice;

  const subtotal = unitPrice * quantity;
  const serviceFee = SERVICE_FEE_PER_PASS * quantity;
  const total = subtotal + serviceFee;

  // Show the "early bird is live" popup shortly after landing on the page —
  // once pricing has loaded and only if the offer is actually active.
  useEffect(() => {
    if (hasShownWelcome.current) return;
    if (BOOKING_CLOSED) return;
    if (!offerActive) return;

    hasShownWelcome.current = true;
    const timer = setTimeout(() => setShowWelcomeDialog(true), 1100);
    return () => clearTimeout(timer);
  }, [offerActive]);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(10, prev + delta)));
  };

  // Step 1: form submit just validates + opens the confirm-details dialog.
  // Nothing is sent to the server yet.
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (BOOKING_CLOSED) return;
    if (!phoneValid || emailValidated !== true) return;

    const formData = new FormData(e.currentTarget);
    pendingFieldsRef.current = {
      first_name: (formData.get('first_name') as string) ?? '',
      last_name: (formData.get('last_name') as string) ?? '',
      address: (formData.get('address') as string) ?? '',
    };

    setShowConfirmDialog(true);
  };

  // Step 2: only fires after the user taps "Confirm & Pay" in the dialog.
  const confirmAndPay = async () => {
    if (!pendingFieldsRef.current) return;
    setShowConfirmDialog(false);
    setLoading(true);

    const payload = {
      ...pendingFieldsRef.current,
      email,
      phone,
      qty: quantity,
      product_type: passType,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/billing/initiate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.detail?.[0]?.msg || error.detail || 'Something went wrong');
        return;
      }

      const data = await res.json();

      // -------- Persist order IDs for the confirmation page / status polling --------
      if (data.merchant_order_id) {
        localStorage.setItem('billing_id', String(data.billing_id));
        localStorage.setItem('merchant_order_id', data.merchant_order_id);
      }

      // Redirect to Razorpay hosted payment page
      if (data.payment_url) {
        window.location.href = data.payment_url;
      }
    } catch (err) {
      console.error(err);
      alert('Payment initiation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const d = (n: number) => n * 0.07;

  return (
    <div
      className={`${fraunces.variable} ${inter.variable} ${mono.variable} relative w-full text-[#F3F1EA]`}
      style={{ background: '#0B1410', fontFamily: 'var(--font-body)' }}
    >
      <style jsx global>{`
        @keyframes pop-in {
          0% {
            opacity: 0;
            transform: translateY(24px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes ring-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(63, 166, 55, 0.35);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(63, 166, 55, 0);
          }
        }
        .eyebrow {
          font-family: var(--font-mono);
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .tabular {
          font-family: var(--font-mono);
          font-feature-settings: 'tnum' 1;
        }
        .live-dot {
          animation: ring-pulse 1.8s ease-in-out infinite;
        }
      `}</style>

      {/* ---------------- EARLY BIRD IS LIVE — WELCOME POPUP ---------------- */}
      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent
          className="border-[#3FA637]/30 text-[#F3F1EA] sm:max-w-md"
          style={{ background: '#111812' }}
        >
          <DialogHeader>
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[#3FA637]/15 mb-2">
              <PartyPopper className="h-6 w-6 text-[#3FA637]" />
            </div>
            <DialogTitle className="text-xl text-[#F3F1EA] flex items-center gap-2">
              Early Bird tickets are live!
              <Sparkles className="h-4 w-4 text-[#E8B84B]" />
            </DialogTitle>
            <DialogDescription className="text-[#92A395]">
              Book now and lock in the lowest price for Summer of Sound 2026.
            </DialogDescription>
          </DialogHeader>

          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'rgba(232,184,75,0.1)', border: '1px solid rgba(232,184,75,0.3)' }}
          >
            <div>
              <p className="text-sm text-[#F3F1EA]">Early Bird Pass</p>
              <p className="text-xs text-[#8FA391] mt-0.5">Valid for entry on {EVENT_DATE_LABEL}</p>
            </div>
            <div className="text-right">
              <span className="block text-xs text-[#6B7A6D] line-through">₹{pricing.normalPrice}</span>
              <span className="tabular text-lg font-bold text-[#E8B84B]">₹{pricing.earlyBirdPrice}</span>
            </div>
          </div>

          <p className="text-xs text-[#6B7A6D]">
            Offer ends soon — price goes up to ₹{pricing.normalPrice} once early bird closes.
          </p>

          <DialogFooter className="flex-row gap-2 sm:justify-between">
            {/* <Button
              type="button"
              variant="outline"
              className="flex-1 border-[#F3F1EA]/15 text-[#F3F1EA] bg-transparent hover:bg-[#F3F1EA]/5"
              onClick={() => setShowWelcomeDialog(false)}
            >
              Maybe later
            </Button> */}
            <Button
              type="button"
              className="flex-1 text-[#0B1410] font-semibold"
              style={{ background: '#3FA637' }}
              onClick={() => {
                setShowWelcomeDialog(false);
                document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Grab my pass
              <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- CONFIRM DETAILS BEFORE PAYMENT POPUP ---------------- */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent
          className="border-[#F3F1EA]/15 text-[#F3F1EA] sm:max-w-md"
          style={{ background: '#111812' }}
        >
          <DialogHeader>
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[#3FA637]/15 mb-2">
              <ShieldCheck className="h-6 w-6 text-[#3FA637]" />
            </div>
            <DialogTitle className="text-xl text-[#F3F1EA]">Please confirm your details</DialogTitle>
            <DialogDescription className="text-[#92A395]">
              Your ticket and QR code will be sent to the email below. Double check it's correct
              before you pay.
            </DialogDescription>
          </DialogHeader>

          <div
            className="rounded-xl divide-y divide-[#F3F1EA]/10"
            style={{ background: 'rgba(11,20,16,0.5)', border: '1px solid rgba(243,241,234,0.1)' }}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <Mail className="h-4 w-4 text-[#3FA637] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-[#6B7A6D]">Email</p>
                <p className="text-sm text-[#F3F1EA] truncate">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <Phone className="h-4 w-4 text-[#3FA637] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-[#6B7A6D]">Phone</p>
                <p className="text-sm text-[#F3F1EA]">{phone}</p>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl px-4 py-3 space-y-2"
            style={{ background: 'rgba(232,184,75,0.08)', border: '1px solid rgba(232,184,75,0.25)' }}
          >
            <p className="text-xs text-[#F3F1EA] flex items-start gap-2">
              <MailWarning className="h-4 w-4 text-[#E8B84B] flex-shrink-0 mt-0.5" />
              <span>
                Can't find the ticket email in your inbox in a few minutes? Check your spam / junk
                folder — it sometimes ends up there:
              </span>
            </p>
            <ul className="text-[11px] text-[#92A395] space-y-1 pl-6 list-disc">
              {SPAM_FOLDER_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-[#F3F1EA]/15 text-[#F3F1EA] bg-transparent hover:bg-[#F3F1EA]/5"
              onClick={() => setShowConfirmDialog(false)}
            >
              <Pencil className="h-4 w-4" />
              Edit details
            </Button>
            <Button
              type="button"
              className="flex-1 text-[#0B1410] font-semibold"
              style={{ background: '#3FA637' }}
              onClick={confirmAndPay}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Confirm &amp; Pay
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- FULL-BLEED HERO PHOTO ---------------- */}
      <section className="relative w-full h-[92vh] sm:h-[86vh] min-h-[560px] sm:min-h-[620px] max-h-[900px] overflow-hidden">
        <Image
          src="/summer.png"
          alt="Summer of Sound Live Concert 2026 — Kok Manga presents"
          fill
          priority
          className="object-cover object-[50%_20%]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(11,20,16,0.15) 0%, rgba(11,20,16,0.25) 40%, rgba(11,20,16,0.88) 82%, #0B1410 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(11,20,16,0.55) 0%, rgba(11,20,16,0) 45%, rgba(11,20,16,0) 100%)',
          }}
        />

        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 flex flex-col justify-end pb-14 sm:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="eyebrow text-[11px] text-[#E8B84B]">Kok Manga Presents</span>

            <h1
              className="mt-3 text-4xl sm:text-6xl lg:text-7xl leading-[1.02] max-w-3xl"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: '#F3F1EA' }}
            >
              Summer of{' '}
              <em style={{ fontStyle: 'italic', color: '#3FA637' }}>Sound</em>
            </h1>

            <p className="eyebrow mt-3 text-[11px] sm:text-xs text-[#B8C4BA]">
              Live Concert &nbsp;·&nbsp; One Stage. One Night. Unforgettable.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 mt-7">
              <span
                className="flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm"
                style={{ background: 'rgba(243,241,234,0.08)', border: '1px solid rgba(243,241,234,0.16)' }}
              >
                <CalendarDays className="h-3.5 w-3.5 text-[#3FA637]" />
                {EVENT_DATE_LABEL}
              </span>
              <span
                className="flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm"
                style={{ background: 'rgba(243,241,234,0.08)', border: '1px solid rgba(243,241,234,0.16)' }}
              >
                <Clock className="h-3.5 w-3.5 text-[#3FA637]" />
                {EVENT_TIME_LABEL}
              </span>
              <span
                className="flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm"
                style={{ background: 'rgba(243,241,234,0.08)', border: '1px solid rgba(243,241,234,0.16)' }}
              >
                <MapPin className="h-3.5 w-3.5 text-[#3FA637]" />
                {VENUE_LABEL}
              </span>
            </div>

            {!BOOKING_CLOSED && (
            <a href="#tickets" className="inline-block mt-9">
              <button
                className="px-8 py-3 rounded-full font-semibold text-[#0B1410] transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2"
                style={{ background: '#3FA637' }}
              >
                <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-[#0B1410]" />
                Get Your Pass
                <ArrowRight className="h-4 w-4" />
              </button>
            </a>
            )}
          </motion.div>
        </div>
      </section>

      {/* ---------------- MEET THE ARTISTS ---------------- */}
      <section className="px-6 pt-16 sm:pt-20 flex flex-col items-center">
        <span className="eyebrow text-[11px] text-[#8FA391] mb-3">The Lineup</span>
        <h2
          className="text-2xl sm:text-3xl mb-8 sm:mb-10 text-center"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
        >
          Who&apos;s taking the stage
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 max-w-5xl w-full">
          {ARTISTS.map((artist) => (
            <div
              key={artist.name}
              className="group rounded-2xl overflow-hidden"
              style={{ background: 'rgba(243,241,234,0.03)', border: '1px dashed rgba(243,241,234,0.16)' }}
            >
              <div
                className="relative w-full aspect-[3/4] overflow-hidden"
                style={{
                  backgroundImage: 'url(/summer.png)',
                  backgroundSize: artist.bgSize,
                  backgroundPosition: artist.bgPosition,
                  backgroundRepeat: 'no-repeat',
                }}
              >
                <div
                  className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(11,20,16,0) 55%, rgba(11,20,16,0.85) 100%)',
                  }}
                />
              </div>
              <div className="px-3 py-3 text-center">
                <p
                  className="text-sm sm:text-base leading-tight text-[#F3F1EA]"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
                >
                  {artist.name}
                </p>
                <span className="eyebrow text-[9px] text-[#8FA391] mt-1 inline-block">{artist.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- EVENT DETAIL CARDS ---------------- */}
      <section className="mt-16 sm:mt-20 px-6 flex flex-col items-center">
        <span className="eyebrow text-[11px] text-[#8FA391] mb-3">Know Before You Go</span>
        <h2
          className="text-2xl sm:text-3xl mb-10 text-center"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
        >
          Event details
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl w-full">
          {[
            { icon: <CalendarDays className="h-5 w-5" />, label: 'Date', value: EVENT_DATE_LABEL },
            { icon: <Clock className="h-5 w-5" />, label: 'Show Time', value: EVENT_TIME_LABEL },
            { icon: <DoorOpen className="h-5 w-5" />, label: 'Gate Open', value: GATE_OPEN_LABEL },
            { icon: <MapPin className="h-5 w-5" />, label: 'Venue', value: VENUE_LABEL },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl p-5 sm:p-6 text-left"
              style={{ background: 'rgba(243,241,234,0.03)', border: '1px dashed rgba(243,241,234,0.16)' }}
            >
              <div className="text-[#3FA637] mb-3">{item.icon}</div>
              <span className="eyebrow text-[9px] text-[#E8B84B]">{item.label}</span>
              <p className="mt-1.5 text-sm sm:text-base text-[#F3F1EA] leading-snug">{item.value}</p>
            </div>
          ))}
        </div>

        <div
          className="mt-6 max-w-5xl w-full rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{ background: 'rgba(243,241,234,0.03)', border: '1px dashed rgba(243,241,234,0.16)' }}
        >
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <span className="flex items-center gap-2 text-[#92A395]">
              <Volume2 className="h-4 w-4 text-[#3FA637]" />
              Sound &amp; Light: <span className="text-[#F3F1EA]">{SOUND_LIGHT_LABEL}</span>
            </span>
            <span className="flex items-center gap-2 text-[#92A395]">
              <Tickets className="h-4 w-4 text-[#3FA637]" />
              Organised by: <span className="text-[#F3F1EA]">{ORGANISER_LABEL}</span>
            </span>
            <span className="flex items-center gap-2 text-[#92A395]">
              <Mic2 className="h-4 w-4 text-[#3FA637]" />
              Emcee: <span className="text-[#F3F1EA]">{EMCEE_LABEL}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#92A395]">
            <Phone className="h-4 w-4 text-[#3FA637]" />
            {CONTACT_NUMBERS.join(' / ')}
          </div>
        </div>
      </section>

      {/* ---------------- TICKET BOOKING ---------------- */}
      <section id="tickets" className="mt-20 sm:mt-24 px-6 pb-24 flex flex-col items-center scroll-mt-20">
        <span className="eyebrow text-[11px] text-[#8FA391] mb-3">Tickets</span>
        <h2
          className="text-2xl sm:text-3xl mb-10 text-center"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
        >
          {BOOKING_CLOSED ? 'Ticket sales closed' : 'Grab your pass'}
        </h2>

        <motion.div
          className="w-full max-w-md lg:max-w-3xl"
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          {BOOKING_CLOSED ? (
            <Card
              className="border-dashed"
              style={{ background: 'rgba(243,241,234,0.03)', borderColor: 'rgba(243,241,234,0.18)' }}
            >
              <CardHeader className="items-center text-center">
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-red-500/15 border border-red-500/30 mb-2">
                  <Lock className="h-6 w-6 text-red-300" />
                </div>
                <CardTitle className="text-2xl text-[#F3F1EA]">Booking Closed</CardTitle>
                <CardDescription className="text-[#92A395] max-w-xs">
                  {BOOKING_CLOSED_MESSAGE}
                </CardDescription>
              </CardHeader>

              <CardFooter>
                <Button
                  type="button"
                  disabled
                  className="w-full h-12 text-base gap-2 cursor-not-allowed opacity-70"
                  style={{ background: 'rgba(243,241,234,0.08)', color: '#92A395' }}
                >
                  <Tickets className="h-4 w-4" />
                  Booking Closed
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card
              className="overflow-hidden border-dashed backdrop-blur-xl gap-4 sm:gap-6"
              style={{ background: 'rgba(17,24,18,0.7)', borderColor: 'rgba(243,241,234,0.18)' }}
            >
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 text-[#F3F1EA]">
                  <Tickets className="h-5 w-5 sm:h-6 sm:w-6 text-[#3FA637]" />
                  Get Your Pass
                </CardTitle>
                <CardDescription className="text-[#92A395] text-sm flex items-center gap-2 flex-wrap">
                  Secure your spot at Summer of Sound
                </CardDescription>
              </CardHeader>

              <form ref={formRef} onSubmit={handleFormSubmit}>
                <CardContent className="px-4 sm:px-6 pb-6 lg:grid lg:grid-cols-5 lg:gap-x-10">
                  {/* DETAILS COLUMN */}
                  <div className="space-y-5 sm:space-y-6 lg:col-span-3">
                  {/* Name */}
                  <FieldWrapper delay={d(1)}>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name" className="text-[#F3F1EA]">
                          First Name
                        </Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          required
                          className="bg-[#0B1410]/60 border-[#F3F1EA]/15 text-[#F3F1EA] placeholder:text-[#5C6B5E] focus-visible:ring-[#3FA637]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name" className="text-[#F3F1EA]">
                          Last Name
                        </Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          required
                          className="bg-[#0B1410]/60 border-[#F3F1EA]/15 text-[#F3F1EA] placeholder:text-[#5C6B5E] focus-visible:ring-[#3FA637]"
                        />
                      </div>
                    </div>
                  </FieldWrapper>

                  {/* Email */}
                  <FieldWrapper delay={d(2)}>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[#F3F1EA]">
                        Email
                      </Label>
                      <div className="relative">
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          className={`bg-[#0B1410]/60 border-[#F3F1EA]/15 text-[#F3F1EA] pr-10 transition-colors duration-300 focus-visible:ring-[#3FA637] ${
                            emailValidated === false
                              ? 'border-red-500 focus-visible:ring-red-500'
                              : emailValidated === true
                              ? 'border-[#3FA637] focus-visible:ring-[#3FA637]'
                              : ''
                          }`}
                        />
                        <ValidationIcon valid={emailValidated === true} show={emailValidated !== null} />
                      </div>
                      <AnimatePresence>
                        {emailValidated === false && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-xs text-red-400 overflow-hidden"
                          >
                            Please enter a valid email address.
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </FieldWrapper>

                  {/* Phone */}
                  <FieldWrapper delay={d(3)}>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-[#F3F1EA]">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          inputMode="numeric"
                          value={phone}
                          maxLength={10}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setPhone(digits);
                            setPhoneTouched(true);
                          }}
                          className={`bg-[#0B1410]/60 border-[#F3F1EA]/15 text-[#F3F1EA] pr-10 transition-colors duration-300 focus-visible:ring-[#3FA637] ${
                            phoneTouched && !phoneValid
                              ? 'border-red-500 focus-visible:ring-red-500'
                              : phoneTouched && phoneValid
                              ? 'border-[#3FA637] focus-visible:ring-[#3FA637]'
                              : ''
                          }`}
                        />
                        <ValidationIcon valid={phoneValid} show={phoneTouched} />
                      </div>
                      <AnimatePresence>
                        {phoneTouched && !phoneValid && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-xs text-red-400 overflow-hidden"
                          >
                            Phone must be exactly 10 digits.
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </FieldWrapper>

                  {/* Address */}
                  <FieldWrapper delay={d(4)}>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-[#F3F1EA]">
                        Address
                      </Label>
                      <Textarea
                        id="address"
                        name="address"
                        required
                        rows={3}
                        className="bg-[#0B1410]/60 border-[#F3F1EA]/15 text-[#F3F1EA] placeholder:text-[#5C6B5E] resize-none focus-visible:ring-[#3FA637]"
                        placeholder="Enter your full address"
                      />
                    </div>
                  </FieldWrapper>
                  <AnimatePresence>
                      {offerActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.4 }}
                        >
                          <div
                            className="rounded-xl px-3 sm:px-4 py-3"
                            style={{ background: 'rgba(232,184,75,0.1)', border: '1px solid rgba(232,184,75,0.3)' }}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#E8B84B]/20 flex-shrink-0">
                                <Timer className="h-4 w-4 text-[#E8B84B]" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm text-[#F3F1EA]">
                                  Early bird price:{' '}
                                  <span className="font-semibold text-[#E8B84B]">₹{pricing.earlyBirdPrice}</span>{' '}
                                  <span className="text-[#6B7A6D] line-through">₹{pricing.normalPrice}</span>
                                </p>
                                <p className="text-xs text-[#8FA391] mt-0.5">Offer ends soon</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {[
                                { label: 'D', value: timeLeft.days },
                                { label: 'H', value: timeLeft.hours },
                                { label: 'M', value: timeLeft.minutes },
                                { label: 'S', value: timeLeft.seconds },
                              ].map((unit, i) => (
                                <div key={unit.label} className="flex items-center gap-1.5 sm:gap-2">
                                  <div
                                    className="tabular flex flex-col items-center justify-center rounded-lg h-10 w-10 sm:h-12 sm:w-12"
                                    style={{ background: 'rgba(11,20,16,0.6)', border: '1px solid rgba(232,184,75,0.25)' }}
                                  >
                                    <motion.span
                                      key={`${unit.label}-${unit.value}`}
                                      initial={{ opacity: 0, y: -6 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="text-sm sm:text-base font-bold text-[#E8B84B]"
                                    >
                                      {pad(unit.value)}
                                    </motion.span>
                                    <span className="text-[8px] sm:text-[9px] text-[#6B7A6D] uppercase tracking-wide">
                                      {unit.label}
                                    </span>
                                  </div>
                                  {i < 3 && <span className="text-[#4E5C50] text-sm">:</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* END DETAILS COLUMN */}

                  {/* ORDER SUMMARY SIDEBAR */}
                  <div className="space-y-5 sm:space-y-6 lg:col-span-2 mt-8 lg:mt-0 lg:pl-8 lg:border-l lg:border-dashed lg:border-white/15">
                    <div className="lg:sticky lg:top-24 space-y-5 sm:space-y-6">
                    {/* EARLY BIRD OFFER COUNTDOWN */}
                    

                    {/* PASS TYPE — styled as a ticket stub, echoing the poster */}
                    <FieldWrapper delay={d(0)}>
                      <div className="space-y-2">
                        <Label className="text-base text-[#F3F1EA]">Pass Type</Label>
                        <div
                          className="relative rounded-xl flex flex-col sm:flex-row lg:flex-col justify-between sm:items-stretch lg:items-stretch overflow-hidden"
                          style={{ background: 'rgba(63,166,55,0.08)', border: '2px solid rgba(63,166,55,0.35)' }}
                        >
                          <div className="p-4">
                            <p className="font-semibold flex items-center gap-2 text-[#F3F1EA]">
                              {offerActive ? 'Early Bird Pass' : 'Normal Pass'}
                              {offerActive && (
                                <span className="text-[10px] font-bold uppercase tracking-wide bg-[#E8B84B] text-[#0B1410] px-2 py-0.5 rounded-full">
                                  Early Bird
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-[#8FA391] mt-0.5">Valid for entry on {EVENT_DATE_LABEL}</p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-center lg:justify-between px-4 sm:px-5 lg:px-4 py-3 sm:py-0 lg:py-3 border-t-2 border-dashed border-white/15 sm:border-t-0 sm:border-l-2 lg:border-l-0 lg:border-t-2 sm:border-dashed lg:border-dashed sm:border-white/15 lg:border-white/15">
                            <span className="text-xs text-[#8FA391] sm:hidden lg:inline">Price</span>
                            <div className="text-right">
                              {offerActive && (
                                <span className="block text-xs text-[#6B7A6D] line-through">
                                  ₹{pricing.normalPrice}
                                </span>
                              )}
                              <span className="tabular text-xl font-bold text-[#3FA637]">₹{unitPrice}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#6B7A6D]">
                          Gate crash passes are ₹{GATE_CRASH_PRICE} at the venue — book online to save.
                        </p>
                      </div>
                    </FieldWrapper>

                  {/* Quantity */}
                  <FieldWrapper delay={d(5)}>
                    <div className="space-y-2">
                      <Label className="text-[#F3F1EA]">Number of Passes</Label>
                      <div className="flex items-center flex-wrap gap-3">
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.88 }}
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          className="h-10 w-10 rounded-lg flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          style={{ background: 'rgba(243,241,234,0.06)', border: '1px solid rgba(243,241,234,0.16)' }}
                        >
                          <Minus className="h-4 w-4 text-[#F3F1EA]" />
                        </motion.button>

                        <motion.div
                          key={quantity}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2, ease: 'backOut' }}
                          className="tabular w-14 text-center text-xl font-bold text-[#F3F1EA]"
                        >
                          {quantity}
                        </motion.div>

                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.88 }}
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= 10}
                          className="h-10 w-10 rounded-lg flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          style={{ background: 'rgba(243,241,234,0.06)', border: '1px solid rgba(243,241,234,0.16)' }}
                        >
                          <Plus className="h-4 w-4 text-[#F3F1EA]" />
                        </motion.button>

                        <span className="text-[#92A395] text-sm ml-1">
                          {quantity === 1 ? 'Pass' : 'Passes'} (max 10)
                        </span>
                      </div>
                    </div>
                  </FieldWrapper>

                  {/* Price Summary */}
                  <FieldWrapper delay={d(6)}>
                    <motion.div
                      layout
                      className="p-4 rounded-lg space-y-2 text-sm"
                      style={{ background: 'rgba(11,20,16,0.5)', border: '1px solid rgba(243,241,234,0.1)' }}
                    >
                      <div className="flex justify-between text-[#F3F1EA]">
                        <span>
                          Subtotal ({quantity} × ₹{unitPrice})
                          {offerActive && (
                            <span className="ml-2 text-[10px] text-[#E8B84B] font-medium">Early bird price</span>
                          )}
                        </span>
                        <motion.span
                          key={subtotal}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25 }}
                          className="tabular"
                        >
                          ₹{subtotal}
                        </motion.span>
                      </div>

                      <div className="flex justify-between text-[#92A395]">
                        <span>Service Fee ({quantity} × ₹{SERVICE_FEE_PER_PASS})</span>
                        <motion.span
                          key={serviceFee}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: 0.05 }}
                          className="tabular"
                        >
                          ₹{serviceFee}
                        </motion.span>
                      </div>

                      <div
                        className="flex justify-between text-lg font-semibold pt-2"
                        style={{ borderTop: '1px solid rgba(243,241,234,0.1)' }}
                      >
                        <span className="text-[#F3F1EA]">Total</span>
                        <motion.span
                          key={total}
                          initial={{ scale: 1.15, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3, ease: 'backOut' }}
                          className="tabular text-[#3FA637]"
                        >
                          ₹{total}
                        </motion.span>
                      </div>
                    </motion.div>
                  </FieldWrapper>

                  {/* Submit */}
                  <motion.div className="w-full">
                    <Button
                      type="submit"
                      className="w-full text-[#0B1410] h-11 sm:h-12 text-base sm:text-lg gap-2 font-semibold active:scale-[0.98] sm:hover:-translate-y-0.5 transition-all duration-200"
                      style={{ background: '#3FA637' }}
                      disabled={loading || !phoneValid || emailValidated !== true}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Proceed to Payment
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                    </div>
                  </div>
                  {/* END ORDER SUMMARY SIDEBAR */}
                </CardContent>
              </form>
            </Card>
          )}
        </motion.div>
      </section>
    </div>
  );
}