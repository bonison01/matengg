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
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = "https://api.matengdelivery.com";
// const API_BASE_URL = "http://127.0.0.1:8000";

// --------------- Event details ---------------
const EVENT_DATE_LABEL = "24 July 2026";

// --------------- Booking status ---------------
// Flip this to false to reopen ticket sales.
const BOOKING_CLOSED = true;
const BOOKING_CLOSED_MESSAGE = "Ticket sales for G15 Festival 2026 have closed.";

// --------------- Limited-time offer deadline ---------------
// Offer valid until 15 July 2026, 00:00:00 IST
const OFFER_DEADLINE = new Date('2026-07-15T23:59:59+05:30');

// --------------- Past-event gallery photos ---------------
// Drop your G15 highlight photos into /public/g15-gallery/ named 1.jpg, 2.jpg, etc.
// (or swap these paths for your real filenames)
const GALLERY_IMAGES = [
  '/g15-gallery/1.jpg',
  '/g15-gallery/2.jpg',
  '/g15-gallery/3.jpg',
  '/g15-gallery/4.jpg',
  '/g15-gallery/5.jpg',
  '/g15-gallery/6.jpg',
  '/g15-gallery/7.jpg',
  '/g15-gallery/8.jpg',
];

// --------------- Validation helpers ---------------
const isValidPhone = (val: string) => /^\d{10}$/.test(val);
const isValidEmail = (val: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

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
          <CheckCircle2 className="h-4 w-4 text-green-400" />
        ) : (
          <XCircle className="h-4 w-4 text-red-400" />
        )}
      </motion.span>
    )}
  </AnimatePresence>
);

// --------------- Past-event photo gallery with lightbox ---------------
function EventGallery({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const showPrev = useCallback(
    () => setActiveIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length]
  );
  const showNext = useCallback(
    () => setActiveIndex((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, close, showPrev, showNext]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((src, i) => (
          <motion.button
            key={src}
            type="button"
            onClick={() => setActiveIndex(i)}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: (i % 4) * 0.06 }}
            className="relative aspect-square rounded-xl overflow-hidden group border border-white/10 hover:border-green-400/40 transition-colors"
          >
            <Image
              src={src}
              alt={`G15 Festival highlight ${i + 1}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4"
            onClick={close}
          >
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                showPrev();
              }}
              aria-label="Previous photo"
              className="absolute left-3 sm:left-6 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-3xl aspect-video rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[activeIndex]}
                alt={`G15 Festival highlight ${activeIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </motion.div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                showNext();
              }}
              aria-label="Next photo"
              className="absolute right-3 sm:right-6 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <span className="absolute bottom-5 text-xs text-zinc-400 tabular-nums">
              {activeIndex + 1} / {images.length}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function TicketRegistrationPage() {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const [phone, setPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const phoneValid = isValidPhone(phone);

  const [email, setEmail] = useState('');
  const [emailValidated, setEmailValidated] = useState<boolean | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEmailChange = useCallback((val: string) => {
    setEmail(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setEmailValidated(val.length > 0 ? isValidEmail(val) : null);
    }, 500);
  }, []);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  // --------------- Countdown state ---------------
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(OFFER_DEADLINE));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(OFFER_DEADLINE));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const offerActive = !timeLeft.expired;

  const prices = { earlyBird: 299, normal: 399, limitedTime: 349 };
  const SERVICE_FEE_PER_TICKET = 7;

  const passType = offerActive ? 'limited_time_offer' : 'normal';
  const unitPrice = offerActive ? prices.limitedTime : prices.normal;

  const subtotal = unitPrice * quantity;
  const serviceFee = SERVICE_FEE_PER_TICKET * quantity;
  const total = subtotal + serviceFee;

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(10, prev + delta)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (BOOKING_CLOSED) return;
    if (!phoneValid || emailValidated !== true) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);

    const payload = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      address: formData.get('address') as string,
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
        alert(error.detail?.[0]?.msg || 'Something went wrong');
        return;
      }

      const data = await res.json();

      // -------- SAVE merchant_order_id COOKIE --------
      if (data.merchant_order_id) {
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 180);

        document.cookie = `merchant_order_id=${data.merchant_order_id}; path=/; expires=${expiry.toUTCString()}; SameSite=Lax`;
      }

      // Redirect to PhonePe
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
    <div className="relative min-h-screen w-full text-white overflow-hidden">

      {/* FULL-BLEED BACKGROUND */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/g15-festival.png"
          alt="G15 Festival"
          fill
          priority
          className="object-cover"
        />
        {/* Dark gradient overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0620]/90 via-transparent to-[#0b0620]/60" />
      </div>

      {/* CENTERED CONTENT */}
      <div className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 gap-8">

        {/* TITLE */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold tracking-tight bg-gradient-to-r from-[#50C273] to-[#E2DE59] bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)]">
            G15 Festival 2026
          </h1>
          <p className="mt-2 text-zinc-200 text-sm md:text-base xl:text-lg drop-shadow-md">
            Experience the ultimate vibe
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-green-500/15 border border-green-500/30 px-3 py-1 text-xs font-medium text-green-300 backdrop-blur-sm">
            <CalendarDays className="h-3.5 w-3.5" />
            {EVENT_DATE_LABEL}
          </span>
        </motion.div>

        {/* CENTER CARD */}
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          {BOOKING_CLOSED ? (
            <Card className="bg-zinc-950/60 border-zinc-700/60 backdrop-blur-xl shadow-2xl shadow-black/50">
              <CardHeader className="items-center text-center">
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-red-500/15 border border-red-500/30 mb-2">
                  <Lock className="h-6 w-6 text-red-300" />
                </div>
                <CardTitle className="text-2xl">Booking Closed</CardTitle>
                <CardDescription className="text-zinc-400 max-w-xs">
                  {BOOKING_CLOSED_MESSAGE}
                </CardDescription>
              </CardHeader>

              <CardFooter>
                <Button
                  type="button"
                  disabled
                  className="w-full bg-zinc-800 text-zinc-400 h-12 text-base gap-2 cursor-not-allowed opacity-70"
                >
                  <Tickets className="h-4 w-4" />
                  Booking Closed
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="bg-zinc-950/60 border-zinc-700/60 backdrop-blur-xl shadow-2xl shadow-black/50">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Tickets className="h-6 w-6" />
                  Get Your Pass
                </CardTitle>
                <CardDescription className="text-zinc-400 flex items-center gap-2 flex-wrap">
                  <span>Secure your spot at G15 Festival</span>
                </CardDescription>
              </CardHeader>

              {/* LIMITED-TIME OFFER COUNTDOWN */}
              <AnimatePresence>
                {offerActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="px-6 pb-2"
                  >
                    <div className="rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-500/15 to-yellow-500/10 px-4 py-3">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-400/20 flex-shrink-0">
                          <Timer className="h-4 w-4 text-amber-300" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-zinc-200">
                            Limited-time price:{' '}
                            <span className="font-semibold text-amber-300">₹{prices.limitedTime}</span>{' '}
                            <span className="text-zinc-500 line-through">₹{prices.normal}</span>
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5">Offer ends 15 July, midnight</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {[
                          { label: 'D', value: timeLeft.days },
                          { label: 'H', value: timeLeft.hours },
                          { label: 'M', value: timeLeft.minutes },
                          { label: 'S', value: timeLeft.seconds },
                        ].map((unit, i) => (
                          <div key={unit.label} className="flex items-center gap-2">
                            <div className="flex flex-col items-center justify-center bg-zinc-900/70 border border-amber-400/20 rounded-lg h-12 w-12">
                              <motion.span
                                key={`${unit.label}-${unit.value}`}
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-base font-bold tabular-nums text-amber-300"
                              >
                                {pad(unit.value)}
                              </motion.span>
                              <span className="text-[9px] text-zinc-500 uppercase tracking-wide">{unit.label}</span>
                            </div>
                            {i < 3 && <span className="text-zinc-600 text-sm">:</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">

                  {/* PASS TYPE */}
                  <FieldWrapper delay={d(0)}>
                    <div className="space-y-2">
                      <Label className="text-base">Pass Type</Label>
                      <div className="rounded-xl border-2 border-stone-600 bg-stone-600/30 p-4 flex justify-between items-center">
                        <div>
                          <p className="font-semibold flex items-center gap-2">
                            Normal Pass
                            {offerActive && (
                              <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-400 text-zinc-900 px-2 py-0.5 rounded-full">
                                Limited Offer
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-stone-400">
                            Valid for entry on {EVENT_DATE_LABEL}
                          </p>
                        </div>
                        <div className="text-right">
                          {offerActive && (
                            <span className="block text-xs text-stone-400 line-through">₹{prices.normal}</span>
                          )}
                          <span className="text-xl font-bold">₹{unitPrice}</span>
                        </div>
                      </div>
                    </div>
                  </FieldWrapper>

                 {/* Name */}
                  <FieldWrapper delay={d(1)}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input id="first_name" name="first_name" required className="bg-zinc-900 border-zinc-700" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input id="last_name" name="last_name" required className="bg-zinc-900 border-zinc-700" />
                      </div>
                    </div>
                  </FieldWrapper>

                  {/* Email */}
                  <FieldWrapper delay={d(2)}>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          className={`bg-zinc-900 border-zinc-700 pr-10 transition-colors duration-300 ${
                            emailValidated === false
                              ? 'border-red-500 focus-visible:ring-red-500'
                              : emailValidated === true
                              ? 'border-green-500 focus-visible:ring-green-500'
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
                      <Label htmlFor="phone">Phone Number</Label>
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
                            // Only allow digits, max 10
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setPhone(digits);
                            setPhoneTouched(true);
                          }}
                          className={`bg-zinc-900 border-zinc-700 pr-10 transition-colors duration-300 ${
                            phoneTouched && !phoneValid
                              ? 'border-red-500 focus-visible:ring-red-500'
                              : phoneTouched && phoneValid
                              ? 'border-green-500 focus-visible:ring-green-500'
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

                  {/* Address — Textarea */}
                  <FieldWrapper delay={d(4)}>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        name="address"
                        required
                        rows={3}
                        className="bg-zinc-900 border-zinc-700 resize-none"
                        placeholder="Enter your full address"
                      />
                    </div>
                  </FieldWrapper>

                  {/* Quantity — +/- input */}
                  <FieldWrapper delay={d(5)}>
                    <div className="space-y-2">
                      <Label>Number of Passes</Label>
                      <div className="flex items-center gap-3">
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.88 }}
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          className="h-10 w-10 rounded-lg border border-zinc-600 bg-zinc-800 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </motion.button>

                        <motion.div
                          key={quantity}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2, ease: 'backOut' }}
                          className="w-14 text-center text-xl font-bold tabular-nums"
                        >
                          {quantity}
                        </motion.div>

                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.88 }}
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= 10}
                          className="h-10 w-10 rounded-lg border border-zinc-600 bg-zinc-800 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </motion.button>

                        <span className="text-zinc-400 text-sm ml-1">
                          {quantity === 1 ? 'Pass' : 'Passes'} (max 10)
                        </span>
                      </div>
                    </div>
                  </FieldWrapper>

                  {/* Price Summary */}
                  <FieldWrapper delay={d(6)}>
                    <motion.div
                      layout
                      className="bg-zinc-900/70 p-4 rounded-lg border border-zinc-800 space-y-2 text-sm"
                    >
                      <div className="flex justify-between">
                        <span>
                          Subtotal ({quantity} × ₹{unitPrice})
                          {offerActive && (
                            <span className="ml-2 text-[10px] text-amber-300 font-medium">Offer price</span>
                          )}
                        </span>
                        <motion.span
                          key={subtotal}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          ₹{subtotal}
                        </motion.span>
                      </div>

                      <div className="flex justify-between text-zinc-400">
                        <span>Service Fee ({quantity} × ₹{SERVICE_FEE_PER_TICKET})</span>
                        <motion.span
                          key={serviceFee}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: 0.05 }}
                        >
                          ₹{serviceFee}
                        </motion.span>
                      </div>

                      <div className="flex justify-between text-lg font-semibold pt-2 border-t border-zinc-800">
                        <span>Total</span>
                        <motion.span
                          key={total}
                          initial={{ scale: 1.15, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3, ease: 'backOut' }}
                          className="text-stone-400"
                        >
                          ₹{total}
                        </motion.span>
                      </div>
                    </motion.div>
                  </FieldWrapper>

                </CardContent>

                <CardFooter>
                  <motion.div className="w-full mt-4">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-tr from-green-600 to-green-800 hover:from-green-800 hover:to-green-600 text-white h-12 text-lg gap-2"
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
                </CardFooter>
              </form>
            </Card>
          )}
        </motion.div>

        {/* PAST EVENT GALLERY — shown alongside the closed-booking message so
            visitors who land here after sales close still get something:
            a look back at how the festival went. Also useful as a teaser
            for the next edition. */}
        <motion.div
          className="w-full max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="text-center mb-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 border border-green-500/30 px-3 py-1 text-xs font-medium text-green-300 backdrop-blur-sm mb-3">
              Highlights
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              Relive G15 Festival 2026
            </h2>
          </div>
          <EventGallery images={GALLERY_IMAGES} />
        </motion.div>

      </div>
    </div>
  );
}