"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── TYPES ────────────────────────────────────────────────────────
type CategoryId = "education" | "concerts" | "business" | "medical" | "sports" | "cultural" | "workshops" | "exhibitions";
type EventStatus = "draft" | "upcoming" | "open" | "ongoing" | "past" | "postponed" | "cancelled";
type LineupRole = "artist" | "speaker" | "athlete" | "exhibitor" | "performer" | "judge";

interface LineupEntry { name: string; role: LineupRole; sub_role: string; genre: string; origin: string; company: string; team: string; avatar_initials: string; avatar_color: string; topic: string; upcoming_shows: string; display_order: number; }
interface ScheduleEntry { slot_label: string; title: string; speaker_name: string; display_order: number; }
interface PrizeEntry { rank_label: string; reward: string; cash_amount: string; display_order: number; }

// ─── CATEGORY CONFIG ──────────────────────────────────────────────
const CATEGORY_OPTIONS: { id: CategoryId; label: string; accent: string; icon: string; description: string }[] = [
  { id: "education",   label: "Education",   accent: "#14710f", icon: "🎓", description: "Exams, olympiads, scholarships" },
  { id: "concerts",    label: "Concerts",    accent: "#7c3d94", icon: "🎵", description: "Live music & performances" },
  { id: "business",    label: "Business",    accent: "#1a56a8", icon: "💼", description: "Conferences, summits, networking" },
  { id: "medical",     label: "Medical",     accent: "#b91c1c", icon: "🏥", description: "Health camps, CME, awareness" },
  { id: "sports",      label: "Sports",      accent: "#b45309", icon: "🏆", description: "Tournaments, matches, leagues" },
  { id: "cultural",    label: "Cultural",    accent: "#0e7490", icon: "🎭", description: "Festivals, fairs, traditions" },
  { id: "workshops",   label: "Workshops",   accent: "#c2410c", icon: "🔧", description: "Hands-on training & skill-building" },
  { id: "exhibitions", label: "Exhibitions", accent: "#4338ca", icon: "🖼️", description: "Art, trade shows, galleries" },
];

const CATEGORY_SECTIONS: Record<CategoryId, { showLineup: boolean; showSchedule: boolean; showPrizes: boolean; lineupLabel: string; lineupRoles: LineupRole[] }> = {
  education:   { showLineup: true,  showSchedule: true,  showPrizes: true,  lineupLabel: "Speakers / Judges",   lineupRoles: ["speaker", "judge"] },
  concerts:    { showLineup: true,  showSchedule: true,  showPrizes: false, lineupLabel: "Artists / Performers", lineupRoles: ["artist", "performer"] },
  business:    { showLineup: true,  showSchedule: true,  showPrizes: false, lineupLabel: "Speakers / Panelists", lineupRoles: ["speaker"] },
  medical:     { showLineup: true,  showSchedule: true,  showPrizes: false, lineupLabel: "Doctors / Speakers",   lineupRoles: ["speaker"] },
  sports:      { showLineup: true,  showSchedule: false, showPrizes: true,  lineupLabel: "Athletes / Teams",     lineupRoles: ["athlete"] },
  cultural:    { showLineup: true,  showSchedule: true,  showPrizes: true,  lineupLabel: "Performers / Artists", lineupRoles: ["artist", "performer"] },
  workshops:   { showLineup: true,  showSchedule: true,  showPrizes: false, lineupLabel: "Trainers / Speakers",  lineupRoles: ["speaker"] },
  exhibitions: { showLineup: true,  showSchedule: false, showPrizes: false, lineupLabel: "Exhibitors",           lineupRoles: ["exhibitor"] },
};

const STATUS_OPTIONS: { id: EventStatus; label: string }[] = [
  { id: "draft", label: "Draft (not public)" }, { id: "upcoming", label: "Upcoming" }, { id: "open", label: "Open (registration live)" },
  { id: "ongoing", label: "Ongoing" }, { id: "past", label: "Past" }, { id: "postponed", label: "Postponed" }, { id: "cancelled", label: "Cancelled" },
];

const LINEUP_ROLE_OPTIONS: { id: LineupRole; label: string }[] = [
  { id: "artist", label: "Artist" }, { id: "speaker", label: "Speaker" }, { id: "athlete", label: "Athlete" },
  { id: "exhibitor", label: "Exhibitor" }, { id: "performer", label: "Performer" }, { id: "judge", label: "Judge" },
];

const AVATAR_COLORS = ["#14710f", "#7c3d94", "#1a56a8", "#b91c1c", "#b45309", "#0e7490", "#c2410c", "#4338ca", "#0f766e", "#a21caf"];

// ─── SESSION STORAGE KEY ──────────────────────────────────────────
const STORAGE_KEY = "admin_event_form_draft";

// ─── HELPERS ──────────────────────────────────────────────────────
const emptyLineup = (): LineupEntry => ({ name: "", role: "artist", sub_role: "", genre: "", origin: "", company: "", team: "", avatar_initials: "", avatar_color: AVATAR_COLORS[0], topic: "", upcoming_shows: "", display_order: 0 });
const emptySchedule = (): ScheduleEntry => ({ slot_label: "", title: "", speaker_name: "", display_order: 0 });
const emptyPrize = (): PrizeEntry => ({ rank_label: "", reward: "", cash_amount: "", display_order: 0 });

// ─── FIELD WRAPPER with ref support ───────────────────────────────
function Field({
  label,
  hint,
  children,
  fieldRef,
  hasError
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  fieldRef?: React.RefObject<HTMLDivElement | null>; // ✅ FIX
  hasError?: boolean;
}) {
  return (
    <div ref={fieldRef} style={{ marginBottom: 20, scrollMarginTop: 80 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: hasError ? "#991b1b" : "#374151", marginBottom: 6 }}>{label}{hasError && <span style={{ marginLeft: 6, fontSize: 11, color: "#ef4444", fontWeight: 600 }}>← required</span>}</label>
      {hint && <p style={{ margin: "0 0 6px", fontSize: 11, color: "#9ca3af" }}>{hint}</p>}
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  hasError = false,
  inputRef
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hasError?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>; // ✅ FIX
}){
  return (
    <input
      ref={inputRef}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      style={{
        width: "100%", padding: "10px 12px",
        border: `1px solid ${hasError ? "#f87171" : "#e5e7eb"}`,
        borderRadius: 8, fontSize: 14, color: "#111827", background: hasError ? "#fff5f5" : "#fff",
        fontFamily: "inherit",
        boxShadow: hasError ? "0 0 0 3px #fee2e2" : "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  hasError = false,
  inputRef
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  hasError?: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>; // ✅ FIX
}){
  return (
    <textarea
      ref={inputRef}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%", padding: "10px 12px",
        border: `1px solid ${hasError ? "#f87171" : "#e5e7eb"}`,
        borderRadius: 8, fontSize: 14, color: "#111827",
        background: hasError ? "#fff5f5" : "#fff",
        fontFamily: "inherit", resize: "vertical",
        boxShadow: hasError ? "0 0 0 3px #fee2e2" : "none",
      }}
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { id: string; label: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, color: "#111827", background: "#fff", fontFamily: "inherit" }}>
      {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  );
}

function SectionHeader({ title, count, onAdd, addLabel }: { title: string; count: number; onAdd: () => void; addLabel: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</h3>
        {count > 0 && <span style={{ padding: "1px 8px", borderRadius: 999, background: "#f3f4f6", fontSize: 12, fontWeight: 600, color: "#6b7280" }}>{count}</span>}
      </div>
      <button type="button" onClick={onAdd} style={{ padding: "6px 14px", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ {addLabel}</button>
    </div>
  );
}

// ─── CATEGORY PICKER ──────────────────────────────────────────────
function CategoryPicker({ onSelect }: { onSelect: (cat: CategoryId) => void }) {
  const [hovered, setHovered] = useState<CategoryId | null>(null);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#111827" }}>What kind of event are you adding?</h2>
        <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>Choose a category — fields will adapt to what matters for that event type.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
        {CATEGORY_OPTIONS.map(cat => (
          <motion.button key={cat.id} type="button" onClick={() => onSelect(cat.id)}
            onMouseEnter={() => setHovered(cat.id)} onMouseLeave={() => setHovered(null)}
            whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.97 }}
            style={{ padding: "20px 18px", background: hovered === cat.id ? cat.accent + "08" : "#fff", border: `1.5px solid ${hovered === cat.id ? cat.accent + "60" : "#e5e7eb"}`, borderRadius: 14, cursor: "pointer", textAlign: "left", transition: "background 0.15s, border-color 0.15s", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 26 }}>{cat.icon}</span>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.accent }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 3 }}>{cat.label}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.4 }}>{cat.description}</div>
            </div>
            <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: cat.accent, display: "flex", alignItems: "center", gap: 4, opacity: hovered === cat.id ? 1 : 0, transition: "opacity 0.15s" }}>Select →</div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── MAIN FORM ────────────────────────────────────────────────────
export default function AdminEventUploadPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  // ── Field refs for focus-on-error ──
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const organizerRef = useRef<HTMLInputElement>(null);
  const dateStartRef = useRef<HTMLInputElement>(null);
  const venueRef = useRef<HTMLInputElement>(null);

  const titleFieldRef = useRef<HTMLDivElement>(null);
  const descriptionFieldRef = useRef<HTMLDivElement>(null);
  const organizerFieldRef = useRef<HTMLDivElement>(null);
  const dateFieldRef = useRef<HTMLDivElement>(null);
  const venueFieldRef = useRef<HTMLDivElement>(null);

  // ── State: initialize from sessionStorage ──
  const [hydrated, setHydrated] = useState(false);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [activeSection, setActiveSection] = useState<"basic" | "details" | "lineup" | "schedule" | "prizes" | "preview">("basic");

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [status, setStatus] = useState<EventStatus>("draft");
  const [featured, setFeatured] = useState(false);
  const [accentColor, setAccentColor] = useState("#14710f");
  const [description, setDescription] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [sponsorsInput, setSponsorsInput] = useState("");
  const [registerHref, setRegisterHref] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("Imphal");
  const [mapsUrl, setMapsUrl] = useState("");
  const [feeLabel, setFeeLabel] = useState("");
  const [feeMin, setFeeMin] = useState("0");
  const [feeMax, setFeeMax] = useState("");
  const [capacity, setCapacity] = useState("");
  const [lineup, setLineup] = useState<LineupEntry[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [prizes, setPrizes] = useState<PrizeEntry[]>([]);

  // ── HYDRATE from sessionStorage on mount ──
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.category)       setCategory(d.category);
        if (d.activeSection)  setActiveSection(d.activeSection);
        if (d.title)          setTitle(d.title);
        if (d.subtitle)       setSubtitle(d.subtitle);
        if (d.status)         setStatus(d.status);
        if (d.featured !== undefined) setFeatured(d.featured);
        if (d.accentColor)    setAccentColor(d.accentColor);
        if (d.description)    setDescription(d.description);
        if (d.organizerName)  setOrganizerName(d.organizerName);
        if (d.tagsInput)      setTagsInput(d.tagsInput);
        if (d.sponsorsInput)  setSponsorsInput(d.sponsorsInput);
        if (d.registerHref)   setRegisterHref(d.registerHref);
        if (d.dateStart)      setDateStart(d.dateStart);
        if (d.dateEnd)        setDateEnd(d.dateEnd);
        if (d.timeStart)      setTimeStart(d.timeStart);
        if (d.venue)          setVenue(d.venue);
        if (d.city)           setCity(d.city);
        if (d.mapsUrl)        setMapsUrl(d.mapsUrl);
        if (d.feeLabel)       setFeeLabel(d.feeLabel);
        if (d.feeMin !== undefined) setFeeMin(d.feeMin);
        if (d.feeMax)         setFeeMax(d.feeMax);
        if (d.capacity)       setCapacity(d.capacity);
        if (d.lineup)         setLineup(d.lineup);
        if (d.schedule)       setSchedule(d.schedule);
        if (d.prizes)         setPrizes(d.prizes);
      }
    } catch (_) {}
    setHydrated(true);
  }, []);

  // ── PERSIST to sessionStorage on every change ──
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        category, activeSection, title, subtitle, status, featured, accentColor,
        description, organizerName, tagsInput, sponsorsInput, registerHref,
        dateStart, dateEnd, timeStart, venue, city, mapsUrl, feeLabel, feeMin, feeMax, capacity,
        lineup, schedule, prizes,
      }));
    } catch (_) {}
  }, [hydrated, category, activeSection, title, subtitle, status, featured, accentColor, description, organizerName, tagsInput, sponsorsInput, registerHref, dateStart, dateEnd, timeStart, venue, city, mapsUrl, feeLabel, feeMin, feeMax, capacity, lineup, schedule, prizes]);

  const updateLineup   = (i: number, field: keyof LineupEntry, val: string | number)   => setLineup(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  const updateSchedule = (i: number, field: keyof ScheduleEntry, val: string | number) => setSchedule(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  const updatePrize    = (i: number, field: keyof PrizeEntry, val: string | number)    => setPrizes(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const handleCategorySelect = (cat: CategoryId) => {
    setCategory(cat);
    setAccentColor(CATEGORY_OPTIONS.find(c => c.id === cat)!.accent);
    setActiveSection("basic");
  };

  const catConfig = category ? CATEGORY_SECTIONS[category] : null;
  const SECTIONS = [
    { id: "basic",    label: "Basic Info",   icon: "◎" },
    { id: "details",  label: "Date & Venue", icon: "📍" },
    ...(catConfig?.showLineup   ? [{ id: "lineup",   label: catConfig.lineupLabel, icon: "♪" }] : []),
    ...(catConfig?.showSchedule ? [{ id: "schedule", label: "Schedule",            icon: "📅" }] : []),
    ...(catConfig?.showPrizes   ? [{ id: "prizes",   label: "Prizes",              icon: "🏆" }] : []),
    { id: "preview",  label: "Preview",      icon: "👁" },
  ] as const;

  // ── VALIDATE & focus first missing field ──────────────────────
  const validateAndFocus = useCallback((): boolean => {
    const errors: Record<string, boolean> = {};
    let firstErrorSection: string | null = null;
    let firstFocusFn: (() => void) | null = null;

    if (!title) {
      errors.title = true;
      if (!firstErrorSection) { firstErrorSection = "basic"; firstFocusFn = () => { titleRef.current?.focus(); titleFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }; }
    }
    if (!description) {
      errors.description = true;
      if (!firstErrorSection) { firstErrorSection = "basic"; firstFocusFn = () => { descriptionRef.current?.focus(); descriptionFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }; }
    }
    if (!organizerName) {
      errors.organizerName = true;
      if (!firstErrorSection) { firstErrorSection = "basic"; firstFocusFn = () => { organizerRef.current?.focus(); organizerFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }; }
    }
    if (!dateStart) {
      errors.dateStart = true;
      if (!firstErrorSection) { firstErrorSection = "details"; firstFocusFn = () => { dateStartRef.current?.focus(); dateFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }; }
    }
    if (!venue) {
      errors.venue = true;
      if (!firstErrorSection) { firstErrorSection = "details"; firstFocusFn = () => { venueRef.current?.focus(); venueFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }; }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Navigate to the section with the first error, then focus
      if (firstErrorSection && firstErrorSection !== activeSection) {
        setActiveSection(firstErrorSection as any);
        // Wait for section render before scrolling/focusing
        setTimeout(() => { firstFocusFn?.(); }, 150);
      } else {
        firstFocusFn?.();
      }
      return false;
    }
    return true;
  }, [title, description, organizerName, dateStart, venue, activeSection]);

  // ── SAVE ──────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!category) return;
    setSaveError(null);

    if (!validateAndFocus()) {
      setSaveError("Please fill in all required fields highlighted below.");
      return;
    }

    setSaving(true);
    try {
      const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
      const sponsors = sponsorsInput.split(",").map(s => s.trim()).filter(Boolean);

      const { data: evData, error: evErr } = await supabase.from("events").insert({
        title, subtitle: subtitle || null, category, status, featured, accent_color: accentColor,
        description, organizer_name: organizerName, tags, sponsors,
        date_start: dateStart, date_end: dateEnd || null, time_start: timeStart || null,
        venue, city, maps_url: mapsUrl || null,
        fee_label: feeLabel || "Free", fee_min: parseInt(feeMin) || 0, fee_max: feeMax ? parseInt(feeMax) : null,
        capacity: capacity ? parseInt(capacity) : null,
        register_href: registerHref || null,
      }).select("id").single();
      if (evErr) throw evErr;
      const eventId = evData.id;

      if (lineup.length > 0) {
        const { error: luErr } = await supabase.from("event_lineup").insert(
          lineup.map((l, i) => ({ event_id: eventId, name: l.name, role: l.role, sub_role: l.sub_role || null, genre: l.genre || null, origin: l.origin || null, company: l.company || null, team: l.team || null, avatar_initials: l.avatar_initials || l.name.slice(0, 2).toUpperCase(), avatar_color: l.avatar_color, topic: l.topic || null, upcoming_shows: l.upcoming_shows ? parseInt(l.upcoming_shows) : null, display_order: i }))
        );
        if (luErr) throw luErr;
      }
      if (schedule.length > 0) {
        const { error: scErr } = await supabase.from("event_schedule").insert(
          schedule.map((s, i) => ({ event_id: eventId, slot_label: s.slot_label, title: s.title, speaker_name: s.speaker_name || null, display_order: i }))
        );
        if (scErr) throw scErr;
      }
      if (prizes.length > 0) {
        const { error: prErr } = await supabase.from("event_prizes").insert(
          prizes.map((p, i) => ({ event_id: eventId, rank_label: p.rank_label, reward: p.reward, cash_amount: p.cash_amount ? parseInt(p.cash_amount) : null, display_order: i }))
        );
        if (prErr) throw prErr;
      }

      // Clear draft after successful save
      sessionStorage.removeItem(STORAGE_KEY);
      setSaved(true);
      setTimeout(() => router.push("/events"), 1800);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save. Check console.");
    } finally {
      setSaving(false);
    }
  }, [title, subtitle, category, status, featured, accentColor, description, organizerName, tagsInput, sponsorsInput, registerHref, dateStart, dateEnd, timeStart, venue, city, mapsUrl, feeLabel, feeMin, feeMax, capacity, lineup, schedule, prizes, router, validateAndFocus]);

  // Clear field error when user starts typing
  const clearError = (field: string) => setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });

  const selectedCat = CATEGORY_OPTIONS.find(c => c.id === category);

  if (!hydrated) return null; // Prevent flash before sessionStorage loads

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        input, textarea, select { outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
        input:focus, textarea:focus, select:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px #eef2ff !important; }
        button { font-family: inherit; }
      `}</style>
      <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

        {/* Top bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => category ? setCategory(null) : router.push("/events")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 20, lineHeight: 1, padding: 4 }}>←</button>
              <div>
                <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>
                  {category ? `New ${selectedCat?.label} Event` : "Upload New Event"}
                </h1>
                <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
                  {category
                    ? <span>Category: <span style={{ color: accentColor, fontWeight: 700 }}>{selectedCat?.icon} {selectedCat?.label}</span> · <button type="button" onClick={() => setCategory(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 11, padding: 0, textDecoration: "underline" }}>Change</button></span>
                    : "Admin · Event Management · Step 1 of 2"}
                </p>
              </div>
            </div>
            {category && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* Draft indicator */}
                <span style={{ fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} />
                  Draft saved
                </span>
                <button type="button" onClick={() => setStatus(status === "draft" ? "upcoming" : "draft")}
                  style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: status === "draft" ? "#f9fafb" : "#f0fdf4", color: status === "draft" ? "#6b7280" : "#14710f", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {status === "draft" ? "Draft" : "Published"}
                </button>
                <button type="button" onClick={handleSave} disabled={saving || saved}
                  style={{ padding: "7px 20px", borderRadius: 8, background: saved ? "#14710f" : saving ? "#6b7280" : "#111827", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", minWidth: 100 }}>
                  {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Event"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 64px" }}>
          <AnimatePresence mode="wait">

            {!category && (
              <motion.div key="picker" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <CategoryPicker onSelect={handleCategorySelect} />
              </motion.div>
            )}

            {category && (
              <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

                {/* Sidebar */}
                <div style={{ flex: "0 0 190px", position: "sticky", top: 76 }}>
                  <div style={{ background: accentColor + "12", border: `1px solid ${accentColor}30`, borderRadius: 12, padding: "12px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{selectedCat?.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: accentColor }}>{selectedCat?.label}</div>
                      <button type="button" onClick={() => setCategory(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 10, padding: 0, textDecoration: "underline" }}>Change category</button>
                    </div>
                  </div>
                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                    {SECTIONS.map(sec => (
                      <button key={sec.id} type="button" onClick={() => setActiveSection(sec.id as any)}
                        style={{ width: "100%", padding: "11px 16px", background: activeSection === sec.id ? "#f0f9ff" : "none", border: "none", borderLeft: activeSection === sec.id ? "3px solid #6366f1" : "3px solid transparent", color: activeSection === sec.id ? "#4338ca" : "#6b7280", fontWeight: activeSection === sec.id ? 700 : 500, fontSize: 13, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }}>
                        <span style={{ fontSize: 14 }}>{sec.icon}</span>{sec.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "12px 14px" }}>
                    <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>Entry Count</p>
                    {([["Lineup", lineup.length], ["Schedule", schedule.length], ["Prizes", prizes.length]] as [string, number][]).map(([l, n]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>{l}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: n > 0 ? "#111827" : "#d1d5db" }}>{n}</span>
                      </div>
                    ))}
                  </div>

                  {/* Clear draft button */}
                  <button type="button" onClick={() => { if (confirm("Clear all draft data and start over?")) { sessionStorage.removeItem(STORAGE_KEY); window.location.reload(); }}}
                    style={{ marginTop: 10, width: "100%", padding: "8px", background: "none", border: "1px dashed #e5e7eb", borderRadius: 8, color: "#9ca3af", fontSize: 11, cursor: "pointer" }}>
                    🗑 Clear draft
                  </button>
                </div>

                {/* Main content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {saveError && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#991b1b", fontSize: 13 }}>
                      {saveError}
                    </div>
                  )}
                  {saved && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#14710f", fontSize: 13, fontWeight: 600 }}>✓ Event saved! Redirecting…</div>}

                  <AnimatePresence mode="wait">

                    {/* ── BASIC INFO ── */}
                    {activeSection === "basic" && (
                      <motion.div key="basic" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px" }}>
                        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#111827" }}>Basic Information</h2>
                        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#9ca3af" }}>Core details about your {selectedCat?.label.toLowerCase()} event.</p>

                        <Field label="Event Title *" fieldRef={titleFieldRef} hasError={fieldErrors.title}>
                          <Input value={title} onChange={v => { setTitle(v); clearError("title"); }} placeholder={`e.g. Sangai ${selectedCat?.label} Fest 2026`} required hasError={fieldErrors.title} inputRef={titleRef} />
                        </Field>

                        <Field label="Subtitle / Tagline">
                          <Input value={subtitle} onChange={setSubtitle} placeholder="A short punchy line describing the event" />
                        </Field>

                        <Field label="Status">
                          <Select value={status} onChange={v => setStatus(v as EventStatus)} options={STATUS_OPTIONS} />
                        </Field>

                        <Field label="Organiser Name *" fieldRef={organizerFieldRef} hasError={fieldErrors.organizerName}>
                          <Input value={organizerName} onChange={v => { setOrganizerName(v); clearError("organizerName"); }} placeholder="e.g. Justmateng Service Pvt. Ltd." required hasError={fieldErrors.organizerName} inputRef={organizerRef} />
                        </Field>

                        <Field label="Description *" hint="Full description shown in the event detail modal" fieldRef={descriptionFieldRef} hasError={fieldErrors.description}>
                          <Textarea value={description} onChange={v => { setDescription(v); clearError("description"); }} placeholder="Describe the event in detail…" rows={5} hasError={fieldErrors.description} inputRef={descriptionRef} />
                        </Field>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <Field label="Tags" hint="Comma-separated">
                            <Input value={tagsInput} onChange={setTagsInput} placeholder={category === "education" ? "NEET, Scholarship, Quiz" : category === "concerts" ? "Folk, Live, Outdoor" : "Tag1, Tag2"} />
                          </Field>
                          <Field label="Sponsors" hint="Comma-separated names">
                            <Input value={sponsorsInput} onChange={setSponsorsInput} placeholder="Kanglei Solutions, NEFSA" />
                          </Field>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <Field label="Accent Color">
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: 40, height: 36, border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", padding: 2 }} />
                              <Input value={accentColor} onChange={setAccentColor} placeholder="#14710f" />
                            </div>
                            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                              {AVATAR_COLORS.map(c => <button key={c} type="button" onClick={() => setAccentColor(c)} style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: accentColor === c ? "2px solid #111827" : "2px solid transparent", cursor: "pointer", padding: 0 }} />)}
                            </div>
                          </Field>
                          <Field label="Featured Event">
                            <div style={{ display: "flex", alignItems: "center", gap: 10, height: 36 }}>
                              <button type="button" onClick={() => setFeatured(!featured)}
                                style={{ width: 44, height: 24, borderRadius: 12, background: featured ? "#14710f" : "#d1d5db", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: featured ? 22 : 4, transition: "left 0.2s" }} />
                              </button>
                              <span style={{ fontSize: 13, color: "#374151" }}>{featured ? "Yes — shown in featured strip" : "No"}</span>
                            </div>
                          </Field>
                        </div>

                        <Field label="Registration Link">
                          <Input value={registerHref} onChange={setRegisterHref} placeholder="/register or https://forms.example.com" />
                        </Field>
                      </motion.div>
                    )}

                    {/* ── DATE & VENUE ── */}
                    {activeSection === "details" && (
                      <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px" }}>
                        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#111827" }}>Date, Venue & Fees</h2>
                        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#9ca3af" }}>When and where the event takes place.</p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <Field label="Start Date *" fieldRef={dateFieldRef} hasError={fieldErrors.dateStart}>
                            <Input type="date" value={dateStart} onChange={v => { setDateStart(v); clearError("dateStart"); }} required hasError={fieldErrors.dateStart} inputRef={dateStartRef} />
                          </Field>
                          <Field label="End Date (optional)">
                            <Input type="date" value={dateEnd} onChange={setDateEnd} />
                          </Field>
                          <Field label="Start Time">
                            <Input type="time" value={timeStart} onChange={setTimeStart} />
                          </Field>
                        </div>

                        <Field label="Venue *" fieldRef={venueFieldRef} hasError={fieldErrors.venue}>
                          <Input value={venue} onChange={v => { setVenue(v); clearError("venue"); }} placeholder="Manipur University, Imphal" required hasError={fieldErrors.venue} inputRef={venueRef} />
                        </Field>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <Field label="City *">
                            <Input value={city} onChange={setCity} placeholder="Imphal" />
                          </Field>
                          <Field label="Google Maps URL">
                            <Input value={mapsUrl} onChange={setMapsUrl} placeholder="https://maps.google.com/…" />
                          </Field>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                          <Field label="Fee Label">
                            <Input value={feeLabel} onChange={setFeeLabel} placeholder={category === "concerts" ? "₹500 – ₹2000" : "Free or ₹200"} />
                          </Field>
                          <Field label="Min Fee (₹)">
                            <Input type="number" value={feeMin} onChange={setFeeMin} placeholder="0" />
                          </Field>
                          <Field label="Max Fee (₹)">
                            <Input type="number" value={feeMax} onChange={setFeeMax} placeholder="500" />
                          </Field>
                        </div>
                        <Field label="Capacity">
                          <Input type="number" value={capacity} onChange={setCapacity} placeholder="2000" />
                        </Field>
                      </motion.div>
                    )}

                    {/* ── LINEUP ── */}
                    {activeSection === "lineup" && catConfig?.showLineup && (
                      <motion.div key="lineup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px" }}>
                        <SectionHeader title={catConfig.lineupLabel} count={lineup.length} onAdd={() => setLineup(p => [...p, { ...emptyLineup(), role: catConfig.lineupRoles[0] }])} addLabel="Add Person" />
                        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6b7280" }}>
                          {category === "concerts" ? "Add artists and performers appearing at this event." : category === "sports" ? "Add athletes or teams participating." : category === "exhibitions" ? "Add exhibitors and their booths." : "Add speakers, judges, or key participants."}
                        </p>
                        {lineup.length === 0 && <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af", fontSize: 14 }}>No entries yet. Click "+ Add Person" to start.</div>}
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          {lineup.map((item, i) => (
                            <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px", background: "#fafafa", position: "relative" }}>
                              <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6 }}>
                                {i > 0 && <button type="button" onClick={() => setLineup(p => { const n = [...p]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })} style={{ padding: "2px 8px", fontSize: 11, background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 4, cursor: "pointer", color: "#6b7280" }}>↑</button>}
                                <button type="button" onClick={() => setLineup(p => p.filter((_, idx) => idx !== i))} style={{ padding: "2px 8px", fontSize: 11, background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 4, cursor: "pointer", color: "#991b1b" }}>Remove</button>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                                <Field label="Name *"><Input value={item.name} onChange={v => updateLineup(i, "name", v)} placeholder="Full name" /></Field>
                                <Field label="Role"><Select value={item.role} onChange={v => updateLineup(i, "role", v)} options={LINEUP_ROLE_OPTIONS.filter(r => catConfig.lineupRoles.includes(r.id))} /></Field>
                                <Field label="Sub-role / Title"><Input value={item.sub_role} onChange={v => updateLineup(i, "sub_role", v)} placeholder={category === "concerts" ? "Headliner, Opening Act" : "Keynote, Panelist"} /></Field>
                                {category === "concerts" && <Field label="Genre"><Input value={item.genre} onChange={v => updateLineup(i, "genre", v)} placeholder="Folk, Classical, Pop…" /></Field>}
                                {category === "sports" && <Field label="Team"><Input value={item.company} onChange={v => updateLineup(i, "company", v)} placeholder="Team name" /></Field>}
                                {(category === "business" || category === "education" || category === "workshops" || category === "medical") && <Field label="Organisation"><Input value={item.company} onChange={v => updateLineup(i, "company", v)} placeholder="Company or institution" /></Field>}
                                {(category === "business" || category === "workshops" || category === "medical") && <Field label="Talk / Session Topic"><Input value={item.topic} onChange={v => updateLineup(i, "topic", v)} placeholder="Topic of session" /></Field>}
                                <Field label="Origin / City"><Input value={item.origin} onChange={v => updateLineup(i, "origin", v)} placeholder="Imphal, Delhi…" /></Field>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "auto auto 1fr", gap: 12, alignItems: "end" }}>
                                <Field label="Avatar Initials"><Input value={item.avatar_initials} onChange={v => updateLineup(i, "avatar_initials", v)} placeholder={item.name ? item.name.slice(0, 2).toUpperCase() : "AB"} /></Field>
                                <Field label="Avatar Color">
                                  <div style={{ display: "flex", gap: 4 }}>
                                    <input type="color" value={item.avatar_color} onChange={e => updateLineup(i, "avatar_color", e.target.value)} style={{ width: 36, height: 36, border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", padding: 2 }} />
                                    {AVATAR_COLORS.map(c => <button key={c} type="button" onClick={() => updateLineup(i, "avatar_color", c)} style={{ width: 18, height: 18, borderRadius: "50%", background: c, border: item.avatar_color === c ? "2px solid #111827" : "2px solid transparent", cursor: "pointer", padding: 0 }} />)}
                                  </div>
                                </Field>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 2 }}>
                                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: item.avatar_color + "22", border: `1.5px solid ${item.avatar_color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: item.avatar_color }}>
                                    {item.avatar_initials || item.name.slice(0, 2).toUpperCase() || "?"}
                                  </div>
                                  <span style={{ fontSize: 12, color: "#6b7280" }}>Preview</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* ── SCHEDULE ── */}
                    {activeSection === "schedule" && catConfig?.showSchedule && (
                      <motion.div key="schedule" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px" }}>
                        <SectionHeader title="Schedule / Agenda" count={schedule.length} onAdd={() => setSchedule(p => [...p, emptySchedule()])} addLabel="Add Item" />
                        {schedule.length === 0 && <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af", fontSize: 14 }}>No schedule yet. Click "+ Add Item" to build the agenda.</div>}
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {schedule.map((item, i) => (
                            <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px", background: "#fafafa", display: "flex", gap: 12, alignItems: "flex-start" }}>
                              <div style={{ width: 24, height: 24, borderRadius: "50%", background: `${accentColor}20`, border: `1.5px solid ${accentColor}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: accentColor, flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
                              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr", gap: 10, flex: 1 }}>
                                <div><label style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", display: "block", marginBottom: 4 }}>Time Label</label><Input value={item.slot_label} onChange={v => updateSchedule(i, "slot_label", v)} placeholder="9:00 AM" /></div>
                                <div><label style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", display: "block", marginBottom: 4 }}>Session Title *</label><Input value={item.title} onChange={v => updateSchedule(i, "title", v)} placeholder="Keynote: Opening Address" /></div>
                                <div><label style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", display: "block", marginBottom: 4 }}>Speaker (optional)</label><Input value={item.speaker_name} onChange={v => updateSchedule(i, "speaker_name", v)} placeholder="Dr. Singh" /></div>
                              </div>
                              <button type="button" onClick={() => setSchedule(p => p.filter((_, idx) => idx !== i))} style={{ padding: "2px 8px", fontSize: 11, background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 4, cursor: "pointer", color: "#991b1b", flexShrink: 0 }}>✕</button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* ── PRIZES ── */}
                    {activeSection === "prizes" && catConfig?.showPrizes && (
                      <motion.div key="prizes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px" }}>
                        <SectionHeader title="Prizes & Awards" count={prizes.length} onAdd={() => setPrizes(p => [...p, emptyPrize()])} addLabel="Add Prize" />
                        {prizes.length === 0 && <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af", fontSize: 14 }}>No prizes yet. Click "+ Add Prize" to add award tiers.</div>}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {prizes.map((item, i) => (
                            <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", background: "#fafafa", display: "flex", gap: 12, alignItems: "center" }}>
                              <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? "#fbbf24" : i === 1 ? "#d1d5db" : i === 2 ? "#fb923c" : accentColor + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: i === 0 ? "#92400e" : i === 1 ? "#374151" : i === 2 ? "#9a3412" : accentColor, flexShrink: 0 }}>{i + 1}</div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: 10, flex: 1 }}>
                                <div><label style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", display: "block", marginBottom: 4 }}>Rank Label</label><Input value={item.rank_label} onChange={v => updatePrize(i, "rank_label", v)} placeholder="1st Prize" /></div>
                                <div><label style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", display: "block", marginBottom: 4 }}>Reward</label><Input value={item.reward} onChange={v => updatePrize(i, "reward", v)} placeholder="₹30,000 + Certificate" /></div>
                                <div><label style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", display: "block", marginBottom: 4 }}>Cash (₹)</label><Input type="number" value={item.cash_amount} onChange={v => updatePrize(i, "cash_amount", v)} placeholder="30000" /></div>
                              </div>
                              <button type="button" onClick={() => setPrizes(p => p.filter((_, idx) => idx !== i))} style={{ padding: "2px 8px", fontSize: 11, background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 4, cursor: "pointer", color: "#991b1b", flexShrink: 0 }}>✕</button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* ── PREVIEW ── */}
                    {activeSection === "preview" && (
                      <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px" }}>
                        <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#111827" }}>Event Preview</h2>
                        <div style={{ background: "#f9fafb", borderRadius: 12, padding: "20px", border: `2px solid ${accentColor}30` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: accentColor + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{selectedCat?.icon}</div>
                            <div>
                              <span style={{ fontSize: 9, fontWeight: 800, color: accentColor, letterSpacing: "0.08em", textTransform: "uppercase" }}>{selectedCat?.label}</span>
                              {featured && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: "#d97706" }}>★ Featured</span>}
                            </div>
                            <span style={{ marginLeft: "auto", padding: "2px 9px", borderRadius: 999, background: "#eff6ff", color: "#1a56a8", fontSize: 11, fontWeight: 700 }}>{STATUS_OPTIONS.find(s => s.id === status)?.label}</span>
                          </div>
                          <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#111827" }}>{title || "Event Title"}</h3>
                          <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6b7280" }}>{subtitle || "Subtitle will appear here"}</p>
                          {description && <p style={{ margin: "0 0 14px", fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{description.slice(0, 200)}{description.length > 200 ? "…" : ""}</p>}
                          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                            {dateStart && <div style={{ display: "flex", gap: 7 }}><span style={{ fontSize: 12 }}>📅</span><span style={{ fontSize: 12, color: "#374151" }}>{dateStart}{dateEnd ? ` – ${dateEnd}` : ""}</span></div>}
                            {venue && <div style={{ display: "flex", gap: 7 }}><span style={{ fontSize: 12 }}>📍</span><span style={{ fontSize: 12, color: "#374151" }}>{venue}</span></div>}
                            {feeLabel && <div style={{ display: "flex", gap: 7 }}><span style={{ fontSize: 12 }}>🎟</span><span style={{ fontSize: 12, color: "#374151" }}>{feeLabel}</span></div>}
                          </div>
                          {lineup.length > 0 && (
                            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ display: "flex" }}>
                                {lineup.slice(0, 5).map((l, i) => (
                                  <div key={i} style={{ marginLeft: i === 0 ? 0 : -8, borderRadius: "50%", border: "2px solid #f9fafb", width: 26, height: 26, background: l.avatar_color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: l.avatar_color }}>
                                    {l.avatar_initials || l.name.slice(0, 2).toUpperCase() || "?"}
                                  </div>
                                ))}
                              </div>
                              <span style={{ fontSize: 11, color: "#6b7280" }}>{lineup.length} in lineup</span>
                            </div>
                          )}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {tagsInput.split(",").filter(t => t.trim()).slice(0, 4).map(t => (
                              <span key={t} style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 600, background: accentColor + "12", color: accentColor }}>{t.trim()}</span>
                            ))}
                          </div>
                        </div>
                        <div style={{ marginTop: 20, padding: 16, background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
                          <p style={{ margin: 0, fontSize: 13, color: "#14710f", fontWeight: 600 }}>✓ Preview looks good? Click "Save Event" in the top bar to publish.</p>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>

                  {/* Section nav buttons */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                    <button type="button"
                      onClick={() => { const idx = SECTIONS.findIndex(s => s.id === activeSection); if (idx > 0) setActiveSection(SECTIONS[idx - 1].id as any); }}
                      style={{ padding: "9px 20px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>← Previous</button>
                    <button type="button"
                      onClick={() => { const idx = SECTIONS.findIndex(s => s.id === activeSection); if (idx < SECTIONS.length - 1) setActiveSection(SECTIONS[idx + 1].id as any); }}
                      style={{ padding: "9px 20px", background: "#111827", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Next →</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}