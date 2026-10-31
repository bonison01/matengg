"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { entitySlug } from "@/lib/seo/slug";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type BusinessCategoryId =
  | "all" | "retail" | "restaurants" | "healthcare" | "education"
  | "technology" | "finance" | "beauty" | "automotive" | "realestate"
  | "hospitality" | "legal" | "fitness" | "arts";

export type BusinessStatus = "open" | "closed" | "temporarily_closed" | "coming_soon";

export interface BusinessPhoto {
  id: string;
  business_id: string;
  url: string;
  caption?: string;
  is_cover: boolean;
  display_order: number;
}

export interface BusinessReview {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface BusinessHour {
  day: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  photo_url?: string;
  avatar_initials?: string;
  avatar_color?: string;
}

export interface DBBusiness {
  id: string;
  name: string;
  tagline?: string;
  category: BusinessCategoryId;
  status: BusinessStatus;
  tags: string[];
  featured: boolean;
  accent_color: string;
  description: string;
  owner_name: string;
  established_year?: number;
  address: string;
  city: string;
  state: string;
  phone?: string;
  email?: string;
  website?: string;
  maps_url?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  price_range: "budget" | "mid" | "premium" | "luxury";
  rating?: number;
  review_count?: number;
  employee_count?: string;
  certifications: string[];
  services: string[];
  photos: BusinessPhoto[];
  team: TeamMember[];
  hours: BusinessHour[];
  cover_photo_url?: string;
  verified: boolean;
}

export const BUSINESS_CATEGORIES: { id: BusinessCategoryId; label: string; icon: string; accent: string }[] = [
  { id: "all", label: "All Businesses", icon: "◈", accent: "#374151" },
  { id: "retail", label: "Retail", icon: "🛍", accent: "#0e7490" },
  { id: "restaurants", label: "Restaurants", icon: "🍽", accent: "#b45309" },
  { id: "healthcare", label: "Healthcare", icon: "⚕️", accent: "#b91c1c" },
  { id: "education", label: "Education", icon: "📚", accent: "#14710f" },
  { id: "technology", label: "Technology", icon: "💻", accent: "#4338ca" },
  { id: "finance", label: "Finance", icon: "💰", accent: "#1a56a8" },
  { id: "beauty", label: "Beauty & Salon", icon: "✨", accent: "#a21caf" },
  { id: "automotive", label: "Automotive", icon: "🚗", accent: "#374151" },
  { id: "realestate", label: "Real Estate", icon: "🏠", accent: "#0f766e" },
  { id: "hospitality", label: "Hospitality", icon: "🏨", accent: "#c2410c" },
  { id: "legal", label: "Legal", icon: "⚖️", accent: "#1e40af" },
  { id: "fitness", label: "Fitness", icon: "💪", accent: "#15803d" },
  { id: "arts", label: "Arts & Crafts", icon: "🎨", accent: "#7c3d94" },
];

const PRICE_LABELS: Record<string, string> = {
  budget: "₹", mid: "₹₹", premium: "₹₹₹", luxury: "₹₹₹₹"
};

function statusConfig(s: BusinessStatus) {
  return ({
    open: { label: "Open Now", color: "#14710f", bg: "#f0fdf4" },
    closed: { label: "Closed", color: "#6b7280", bg: "#f9fafb" },
    temporarily_closed: { label: "Temp. Closed", color: "#92400e", bg: "#fffbeb" },
    coming_soon: { label: "Coming Soon", color: "#1a56a8", bg: "#eff6ff" },
  } as any)[s] ?? { label: s, color: "#6b7280", bg: "#f9fafb" };
}

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= Math.round(rating) ? "#f59e0b" : "#d1d5db" }}>★</span>
      ))}
    </div>
  );
}

function AvatarCircle({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color + "22", border: `1.5px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size * 0.33), fontWeight: 700, color, flexShrink: 0 }}>
      {initials || "?"}
    </div>
  );
}

function StatusPill({ status }: { status: BusinessStatus }) {
  const cfg = statusConfig(status);
  return (
    <span style={{ padding: "2px 9px", borderRadius: 999, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, border: `1px solid ${cfg.color}33`, display: "inline-flex", alignItems: "center", gap: 4 }}>
      {status === "open" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, display: "inline-block", animation: "pulse 2s infinite" }} />}
      {cfg.label}
    </span>
  );
}

function PhotoGallery({ photos, accent }: { photos: BusinessPhoto[]; accent: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  if (!photos.length) {
    return (
      <div style={{ width: "100%", height: 200, background: accent + "12", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 32 }}>📷</span>
        <span style={{ fontSize: 13, color: "#9ca3af" }}>No photos yet</span>
      </div>
    );
  }
  const sorted = [...photos].sort((a, b) => a.display_order - b.display_order);
  return (
    <div>
      <div style={{ position: "relative", width: "100%", height: 260, borderRadius: 12, overflow: "hidden", background: "#f3f4f6", marginBottom: 8 }}>
        <AnimatePresence mode="wait">
          <motion.img key={activeIdx} src={sorted[activeIdx].url} alt={sorted[activeIdx].caption || "Business photo"}
            initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
        </AnimatePresence>
        {sorted[activeIdx].caption && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.6))", padding: "20px 14px 10px", color: "#fff", fontSize: 12 }}>
            {sorted[activeIdx].caption}
          </div>
        )}
        {sorted.length > 1 && (
          <>
            <button onClick={() => setActiveIdx(p => (p - 1 + sorted.length) % sorted.length)} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", color: "#fff", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
            <button onClick={() => setActiveIdx(p => (p + 1) % sorted.length)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", color: "#fff", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
          </>
        )}
        <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999 }}>{activeIdx + 1}/{sorted.length}</div>
      </div>
      {sorted.length > 1 && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {sorted.map((p, i) => (
            <button key={i} onClick={() => setActiveIdx(i)} style={{ flexShrink: 0, width: 54, height: 42, borderRadius: 7, overflow: "hidden", border: i === activeIdx ? `2px solid ${accent}` : "2px solid transparent", padding: 0, cursor: "pointer" }}>
              <img src={p.url} alt={p.caption || `Photo ${i + 1}`} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BusinessCard({ business, onSelect }: { business: DBBusiness; onSelect: (b: DBBusiness) => void }) {
  const cat = BUSINESS_CATEGORIES.find(c => c.id === business.category);
  const cover = business.cover_photo_url || business.photos?.find(p => p.is_cover)?.url || business.photos?.[0]?.url;

  return (
    <div onClick={() => onSelect(business)} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer" }}>

      {/* Photo */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "3/2.4", overflow: "hidden", background: "#f3f4f6" }}>
        {cover
          ? <img src={cover} alt={`${business.name} — ${business.category} in ${business.city || "Imphal"}`} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>{cat?.icon}</div>
        }
        {business.tags?.[0] && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(90,50,180,0.88)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "5px 10px", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#c4b5fd", flexShrink: 0 }} />
            {business.tags[0]}
          </div>
        )}
      </div>

      {/* Info row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px 6px" }}>
        <div style={{ width: 38, height: 38, borderRadius: 8, border: "1px solid #e5e7eb", flexShrink: 0, background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#9ca3af" }}>
          {business.name.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <Link
              href={`/businesses/${entitySlug(business.name, business.id)}`}
              onClick={e => e.stopPropagation()}
              style={{ color: "#111827", textDecoration: "none", font: "inherit" }}
            >
              {business.name}
            </Link>
          </h3>
          <p style={{ margin: 0, fontSize: 11, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{business.address}, {business.city}</p>
        </div>
      </div>

      {/* ✅ Services tags */}
      {(business.services || []).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "0 12px 8px" }}>
          {business.services.slice(0, 4).map(s => (
            <span key={s} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, border: "1px solid #e5e7eb", color: "#6b7280", background: "#f9fafb", whiteSpace: "nowrap" }}>{s}</span>
          ))}
          {business.services.length > 4 && (
            <span style={{ fontSize: 10, color: "#9ca3af", padding: "2px 4px" }}>+{business.services.length - 4}</span>
          )}
        </div>
      )}

      {/* ✅ Icon-only action buttons */}
      <div style={{ display: "flex", borderTop: "1px solid #f3f4f6", marginTop: "auto" }}>
        {/* Call */}
        {business.phone ? (
          <a href={`tel:${business.phone}`} onClick={e => e.stopPropagation()}
            title="Call"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 0", borderRight: "1px solid #f3f4f6", color: "#6b7280", textDecoration: "none" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2.5c0-.3.2-.5.5-.5h2.1l1 2.5-1.4 1a7.5 7.5 0 003 3l1-1.4 2.5 1V11c0 .3-.2.5-.5.5C6.4 11.5 3 8 3 3.5z" />
            </svg>
          </a>
        ) : (
          <span style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 0", borderRight: "1px solid #f3f4f6", color: "#d1d5db" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2.5c0-.3.2-.5.5-.5h2.1l1 2.5-1.4 1a7.5 7.5 0 003 3l1-1.4 2.5 1V11c0 .3-.2.5-.5.5C6.4 11.5 3 8 3 3.5z" />
            </svg>
          </span>
        )}

        {/* Directions */}
        {business.maps_url ? (
          <a href={business.maps_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
            title="Directions"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 0", borderRight: "1px solid #f3f4f6", color: "#6b7280", textDecoration: "none" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 1.5C5.8 1.5 4 3.3 4 5.5c0 3.2 4 9 4 9s4-5.8 4-9c0-2.2-1.8-4-4-4z" fill="currentColor" stroke="none" />
              <circle cx="8" cy="5.5" r="1.5" fill="white" stroke="none" />
            </svg>
          </a>
        ) : (
          <span style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 0", borderRight: "1px solid #f3f4f6", color: "#d1d5db" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 1.5C5.8 1.5 4 3.3 4 5.5c0 3.2 4 9 4 9s4-5.8 4-9c0-2.2-1.8-4-4-4z" fill="currentColor" stroke="none" />
              <circle cx="8" cy="5.5" r="1.5" fill="white" stroke="none" />
            </svg>
          </span>
        )}

        {/* Share */}
        <button onClick={e => { e.stopPropagation(); navigator.share?.({ title: business.name, url: `${window.location.origin}/businesses/${entitySlug(business.name, business.id)}` }); }}
          title="Share"
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 0", background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="3" r="1.5" />
            <circle cx="12" cy="13" r="1.5" />
            <circle cx="4" cy="8" r="1.5" />
            <line x1="10.6" y1="3.7" x2="5.4" y2="7.3" />
            <line x1="10.6" y1="12.3" x2="5.4" y2="8.7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function HoursDisplay({ hours }: { hours: BusinessHour[] }) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const now = new Date();
  const todayName = days[now.getDay() === 0 ? 6 : now.getDay() - 1];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {hours.map(h => (
        <div key={h.day} style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", borderRadius: 7, background: h.day === todayName ? "#f0fdf4" : "transparent", border: h.day === todayName ? "1px solid #bbf7d0" : "1px solid transparent" }}>
          <span style={{ fontSize: 13, fontWeight: h.day === todayName ? 700 : 500, color: h.day === todayName ? "#14710f" : "#374151" }}>{h.day.slice(0, 3)}</span>
          <span style={{ fontSize: 13, color: h.is_closed ? "#9ca3af" : (h.day === todayName ? "#14710f" : "#6b7280"), fontWeight: h.day === todayName ? 700 : 400 }}>
            {h.is_closed ? "Closed" : `${h.open_time} – ${h.close_time}`}
          </span>
        </div>
      ))}
    </div>
  );
}

function DetailModal({ business, onClose }: { business: DBBusiness; onClose: () => void }) {
  type TabId = "overview" | "photos" | "services" | "team" | "hours";
  const [tab, setTab] = useState<TabId>("overview");
  const cat = BUSINESS_CATEGORIES.find(c => c.id === business.category);
  const photos = business.photos || [];
  const team = business.team || [];
  const hours = business.hours || [];
  const tabs = [
    { id: "overview" as TabId, label: "Overview" },
    ...(photos.length > 0 ? [{ id: "photos" as TabId, label: `Photos (${photos.length})` }] : []),
    ...((business.services || []).length > 0 ? [{ id: "services" as TabId, label: "Services" }] : []),
    ...(team.length > 0 ? [{ id: "team" as TabId, label: "Team" }] : []),
    ...(hours.length > 0 ? [{ id: "hours" as TabId, label: "Hours" }] : []),
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.58)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(3px)" }}>
      <motion.div initial={{ opacity: 0, y: 28, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.22 }}
        style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 660, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.25)" }}>

        {/* Header */}
        <div style={{ padding: "20px 22px 0", position: "sticky", top: 0, background: "#fff", zIndex: 10, borderRadius: "20px 20px 0 0", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 10, fontWeight: 800, background: business.accent_color + "18", color: business.accent_color, border: `1px solid ${business.accent_color}28`, letterSpacing: "0.06em" }}>{cat?.label?.toUpperCase()}</span>
                <StatusPill status={business.status} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{PRICE_LABELS[business.price_range]}</span>
              </div>
              <h2 style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 800, color: "#111827" }}>{business.name}</h2>
              {business.tagline && <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{business.tagline}</p>}
              {(business.rating !== undefined && business.rating !== null) && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                  <StarRating rating={business.rating} size={14} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{business.rating.toFixed(1)}</span>
                  {business.review_count !== undefined && <span style={{ fontSize: 12, color: "#9ca3af" }}>({business.review_count} reviews)</span>}
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 14px", background: "none", border: "none", borderBottom: tab === t.id ? `2px solid ${business.accent_color}` : "2px solid transparent", color: tab === t.id ? business.accent_color : "#6b7280", fontWeight: tab === t.id ? 700 : 500, fontSize: 13, cursor: "pointer", marginBottom: -1, whiteSpace: "nowrap" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "20px 22px" }}>
          {tab === "overview" && (
            <>
              {/* Cover photo */}
              {(business.cover_photo_url || photos.length > 0) && (
                <div style={{ marginBottom: 18, borderRadius: 12, overflow: "hidden", height: 180 }}>
                  <img src={business.cover_photo_url || photos[0]?.url} alt={`${business.name} — ${business.city || "Imphal"}, ${business.state || "Manipur"}`} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}

              <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.78, color: "#374151" }}>{business.description}</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {([
                  ["Address", `${business.address}, ${business.city}, ${business.state}`],
                  business.phone ? ["Phone", business.phone] : null,
                  business.email ? ["Email", business.email] : null,
                  business.website ? ["Website", business.website] : null,
                  business.owner_name ? ["Owner", business.owner_name] : null,
                  business.established_year ? ["Established", String(business.established_year)] : null,
                  business.employee_count ? ["Team Size", business.employee_count] : null,
                ] as ([string, string] | null)[]).filter((x): x is [string, string] => x !== null).map(([k, v]) => (
                  <div key={k} style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 12px" }}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>{k}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 13, fontWeight: 600, color: "#111827", wordBreak: "break-word" }}>{v}</p>
                  </div>
                ))}
              </div>

              {/* Social / Contact links */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {business.whatsapp && <a href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noreferrer" style={{ padding: "7px 14px", borderRadius: 8, background: "#dcfce7", color: "#14532d", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>💬 WhatsApp</a>}
                {business.instagram && <a href={`https://instagram.com/${business.instagram}`} target="_blank" rel="noreferrer" style={{ padding: "7px 14px", borderRadius: 8, background: "#fdf2f8", color: "#701a75", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>📸 Instagram</a>}
                {business.facebook && <a href={`https://facebook.com/${business.facebook}`} target="_blank" rel="noreferrer" style={{ padding: "7px 14px", borderRadius: 8, background: "#eff6ff", color: "#1e3a8a", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>👤 Facebook</a>}
                {business.maps_url && <a href={business.maps_url} target="_blank" rel="noreferrer" style={{ padding: "7px 14px", borderRadius: 8, background: "#fef3c7", color: "#78350f", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>🗺 Get Directions</a>}
              </div>

              {(business.certifications || []).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>Certifications & Associations</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {business.certifications.map(c => <span key={c} style={{ padding: "4px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, fontSize: 12, color: "#14710f", fontWeight: 600 }}>✓ {c}</span>)}
                  </div>
                </div>
              )}

              {(business.tags || []).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {business.tags.map(t => <span key={t} style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: business.accent_color + "14", color: business.accent_color }}>{t}</span>)}
                </div>
              )}
            </>
          )}

          {tab === "photos" && <PhotoGallery photos={photos} accent={business.accent_color} />}

          {tab === "services" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {(business.services || []).map((s, i) => (
                <div key={i} style={{ padding: "12px 14px", background: "#f9fafb", borderRadius: 10, border: `1px solid ${business.accent_color}20`, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: business.accent_color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{s}</span>
                </div>
              ))}
            </div>
          )}

          {tab === "team" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {team.map((member, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, background: "#f9fafb", borderRadius: 12, padding: "12px 16px" }}>
                  {member.photo_url ? (
                    <img src={member.photo_url} alt={member.name} loading="lazy" decoding="async" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <AvatarCircle initials={member.avatar_initials || member.name.slice(0, 2).toUpperCase()} color={member.avatar_color || business.accent_color} size={48} />
                  )}
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#111827" }}>{member.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: business.accent_color, fontWeight: 600 }}>{member.role}</p>
                    {member.bio && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{member.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "hours" && hours.length > 0 && <HoursDisplay hours={hours} />}
        </div>

        <div style={{ padding: "14px 22px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", position: "sticky", bottom: 0, background: "#fff" }}>
          {business.phone && <a href={`tel:${business.phone}`} style={{ padding: "11px 22px", background: business.accent_color, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none", flex: 1, textAlign: "center" }}>📞 Call Now</a>}
          {business.whatsapp && <a href={`https://wa.me/${business.whatsapp}`} style={{ padding: "11px 18px", background: "#dcfce7", color: "#14532d", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>💬</a>}
          <button onClick={onClose} style={{ padding: "11px 18px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Close</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ height: 140, background: "#f3f4f6", animation: "shimmer 1.5s infinite" }} />
      <div style={{ padding: "14px 16px" }}>
        {[60, 140, 80, 40, 40].map((w, i) => <div key={i} style={{ height: i === 1 ? 18 : 12, width: `${w}%`, background: "#f3f4f6", borderRadius: 6, marginBottom: 10, animation: "shimmer 1.5s infinite" }} />)}
      </div>
    </div>
  );
}
function HeroSlideshow({ businesses }: { businesses: DBBusiness[] }) {
  const [idx, setIdx] = useState(0);

  const slides = businesses.map(b => ({
    img: b.cover_photo_url || b.photos?.[0]?.url || "",
    name: b.name,
    category: BUSINESS_CATEGORIES.find(c => c.id === b.category)?.label || "",
    city: b.city,
    accent: b.accent_color,
  })).filter(s => s.img);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIdx(p => (p + 1) % slides.length), 3500);
    return () => clearInterval(t);
  }, [slides.length]);

  if (!slides.length) return null;

  const slide = slides[idx];

  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", height: 240, background: "#1e293b" }}>
      <AnimatePresence mode="wait">
        <motion.img
          key={idx}
          src={slide.img}
          alt={slide.name}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
        />
      </AnimatePresence>

      {/* Gradient overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)" }} />

      {/* Business info */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 16px" }}>
        <div style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, background: slide.accent + "cc", fontSize: 10, fontWeight: 700, color: "#fff", marginBottom: 5, letterSpacing: "0.06em" }}>
          {slide.category.toUpperCase()}
        </div>
        <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: "#fff" }}>{slide.name}</p>
        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{slide.city}</p>
      </div>

      {/* Dot indicators */}
      <div style={{ position: "absolute", top: 10, right: 12, display: "flex", gap: 5 }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            style={{ width: i === idx ? 16 : 6, height: 6, borderRadius: 3, background: i === idx ? "#fff" : "rgba(255,255,255,0.4)", border: "none", cursor: "pointer", padding: 0, transition: "width 0.3s, background 0.3s" }}
          />
        ))}
      </div>

      {/* Prev / Next arrows */}
      {slides.length > 1 && (
        <>
          <button onClick={() => setIdx(p => (p - 1 + slides.length) % slides.length)}
            style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <button onClick={() => setIdx(p => (p + 1) % slides.length)}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
        </>
      )}
    </div>
  );
}
export default function BusinessesClient({
  initialBusinesses = [],
}: {
  /**
   * Verified businesses fetched on the server so the directory is present in
   * the initial HTML rather than appearing only after hydration.
   */
  initialBusinesses?: DBBusiness[];
}) {
  const [activeCategory, setActiveCategory] = useState<BusinessCategoryId>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BusinessStatus | "all">("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "rating" | "newest">("rating");
  const [selectedBusiness, setSelectedBusiness] = useState<DBBusiness | null>(null);
  const [businesses, setBusinesses] = useState<DBBusiness[]>(initialBusinesses);
  const [loading, setLoading] = useState(initialBusinesses.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [showCompactSearch, setShowCompactSearch] = useState(false);
  const [expandSearch, setExpandSearch] = useState(false);

  useEffect(() => {
    // The server already fetched this list; refetching would only duplicate it.
    if (initialBusinesses.length > 0) return;

    setLoading(true);
    setError(null);

    supabase
      .from("businesses_full")
      .select("*")
      .eq("verified", true)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setBusinesses((data || []) as DBBusiness[]);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowCompactSearch(true);
      } else {
        setShowCompactSearch(false);
        setExpandSearch(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);



  const filtered = useMemo(() => {
    let res = businesses.filter(b => {
      const matchCat = activeCategory === "all" || b.category === activeCategory;
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      const matchPrice = priceFilter === "all" || b.price_range === priceFilter;
      const q = search.toLowerCase();
      const matchSearch = !q || [b.name, b.tagline || "", b.description, b.city, b.owner_name, ...(b.services || []), ...(b.tags || [])].some(s => s.toLowerCase().includes(q));
      return matchCat && matchStatus && matchPrice && matchSearch;
    });
    if (sortBy === "rating") res = res.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sortBy === "name") res = res.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "newest") res = res.sort((a, b) => (b.established_year ?? 0) - (a.established_year ?? 0));
    // Featured always first
    res = [...res.filter(b => b.featured), ...res.filter(b => !b.featured)];
    return res;
  }, [businesses, activeCategory, search, statusFilter, priceFilter, sortBy]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: businesses.length };
    BUSINESS_CATEGORIES.forEach(cat => { c[cat.id] = businesses.filter(b => b.category === cat.id).length; });
    return c;
  }, [businesses]);

  const featured = businesses.filter(b => b.featured).slice(0, 5);

  return (
    <>
      <style>{`
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.5)}}
  @keyframes shimmer{0%,100%{opacity:1}50%{opacity:.5}}
  *{box-sizing:border-box}
  ::-webkit-scrollbar{width:5px}
  ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:4px}
  input:focus,select:focus{outline:none}

  /* ✅ ADD THIS */
  .business-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 640px) {
    .business-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }
  }
      /* PLACEHOLDER */
  .search-input::placeholder {
    color: #9ca3af;
    opacity: 1;
  }
`}</style>
      <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", position: "relative", zIndex: 1 }}>

        {/* HERO */}
        <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "48px 24px 36px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 36, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 380px" }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
                  <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 999, background: "rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 14 }}>MANIPUR BUSINESS DISCOVERY</span>
                  <h1 style={{ margin: "0 0 12px", fontSize: "clamp(24px,4vw,40px)", fontWeight: 900, color: "#fff", lineHeight: 1.12, letterSpacing: "-0.03em" }}>Every Business.<br /><span style={{ color: "#6ee7b7" }}>One Directory.</span></h1>
                  <p style={{ margin: "0 0 24px", fontSize: 15, color: "#94a3b8", lineHeight: 1.65, maxWidth: 420 }}>Restaurants, shops, clinics, tech firms, salons, gyms and more — find and connect with local businesses across Manipur.</p>

                  <div style={{ display: "flex", gap: 28, flexWrap: "wrap", marginBottom: 28 }}>
                    {([[businesses.length, "Businesses"], [businesses.filter(b => b.status === "open").length, "Open Now"], [BUSINESS_CATEGORIES.length - 1, "Categories"]] as [number, string][]).map(([n, l]) => (
                      <div key={l}><p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#fff" }}>{n}</p><p style={{ margin: 0, fontSize: 11, color: "#64748b", fontWeight: 600 }}>{l}</p></div>
                    ))}
                  </div>
                  {/* ✅ Quick action buttons */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <a href="/events" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none", backdropFilter: "blur(4px)" }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="12" height="11" rx="2" />
                        <line x1="2" y1="7" x2="14" y2="7" />
                        <line x1="5" y1="1.5" x2="5" y2="4.5" />
                        <line x1="11" y1="1.5" x2="11" y2="4.5" />
                      </svg>
                      Events
                    </a>
                    {/* <a href="/delivery-rates" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#6ee7b7", border: "1px solid transparent", borderRadius: 10, color: "#064e3b", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="6" width="10" height="7" rx="1" />
                        <path d="M11 8h2.2l1.8 3v2h-4V8z" />
                        <circle cx="4" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
                      </svg>
                      Delivery Service
                    </a> */}
                  </div>
                  {/* <div style={{ position: "relative", maxWidth: 480 }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "#94a3b8" }}>🔍</span>
                    <input type="text" placeholder="Search businesses, services, locations…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "13px 40px 13px 44px", fontSize: 14, border: "1.5px solid transparent", borderRadius: 12, background: "#fff", color: "#111827", boxShadow: "0 4px 18px rgba(0,0,0,0.18)" }} />
                    {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 16 }}>✕</button>}
                  </div> */}
                </motion.div>
              </div>

              {featured.length > 0 && (
                <div style={{ flex: "0 0 300px", maxWidth: "100%" }}>
                  <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, color: "#64748b", letterSpacing: "0.1em" }}>FEATURED BUSINESSES</p>
                  {/* ✅ Hero photo slideshow */}
                  <div style={{ flex: "0 0 320px", maxWidth: "100%" }}>
                    <HeroSlideshow businesses={businesses.filter(b => b.cover_photo_url || b.photos?.length > 0).slice(0, 6)} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>



        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 200,
            background: "#fff",
            borderBottom: "1px solid #e5e7eb"
          }}
        >
          {/* SEARCH BAR */}
          {/* 🔥 STICKY SEARCH + CATEGORY */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 200,
              background: "#fff",
              borderBottom: "1px solid #e5e7eb"
            }}
          >
            {/* SEARCH BAR */}
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 500,
                background: "#fff",
                borderBottom: "1px solid #e5e7eb"
              }}
            >
              {/* SEARCH BAR */}
              <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 16px" }}>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 15,
                      color: "#9ca3af"
                    }}
                  >
                    🔍
                  </span>

                  <input
                    className="search-input"
                    type="text"
                    placeholder="Search businesses..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 40px",
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      fontSize: 14
                    }}
                  />
                </div>
              </div>

              {/* CATEGORY TABS */}
              <div style={{ overflowX: "auto" }}>
                <div
                  style={{
                    maxWidth: 1100,
                    margin: "0 auto",
                    display: "flex",
                    padding: "0 16px"
                  }}
                >
                  {BUSINESS_CATEGORIES.map(cat => {
                    const active = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        style={{
                          padding: "12px 10px",
                          border: "none",
                          background: "none",
                          borderBottom: active
                            ? `2px solid ${cat.accent}`
                            : "2px solid transparent",
                          color: active ? cat.accent : "#6b7280",
                          fontWeight: active ? 700 : 500,
                          fontSize: 12,
                          cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>



        {/* BODY */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 64px" }}>
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "14px 18px", marginBottom: 20, color: "#991b1b", fontSize: 14 }}>Failed to load: {error}</div>}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, gap: 10, flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}><strong style={{ color: "#111827" }}>{filtered.length}</strong> businesses{activeCategory !== "all" && ` · ${BUSINESS_CATEGORIES.find(c => c.id === activeCategory)?.label}`}</p>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              {/* {(["all", "open", "closed", "coming_soon"] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "5px 11px", borderRadius: 999, border: `1px solid ${statusFilter === s ? "#111827" : "#e5e7eb"}`, background: statusFilter === s ? "#111827" : "#fff", color: statusFilter === s ? "#fff" : "#6b7280", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  {s === "all" ? "All Status" : s === "coming_soon" ? "Coming Soon" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))} */}
              {/* <select value={priceFilter} onChange={e => setPriceFilter(e.target.value)} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, color: "#374151", fontWeight: 600, cursor: "pointer" }}>
                <option value="all">All Prices</option>
                <option value="budget">Budget (₹)</option>
                <option value="mid">Mid (₹₹)</option>
                <option value="premium">Premium (₹₹₹)</option>
                <option value="luxury">Luxury (₹₹₹₹)</option>
              </select> */}
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, color: "#374151", fontWeight: 600, cursor: "pointer" }}>
                <option value="rating">Top Rated</option>
                <option value="name">Name A–Z</option>
                <option value="newest">Newest</option>
              </select>
              {(activeCategory !== "all" || statusFilter !== "all" || priceFilter !== "all" || search) && (
                <button onClick={() => { setActiveCategory("all"); setStatusFilter("all"); setPriceFilter("all"); setSearch(""); }} style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: "#fee2e2", color: "#991b1b", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Clear</button>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 18 }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.length > 0 ? (
                // <motion.div layout style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 18 }}>
                <motion.div
                  layout
                  className="business-grid"
                  style={{
                    display: "grid",
                    gap: 12
                  }}
                >
                  {filtered.map(biz => <BusinessCard key={biz.id} business={biz} onSelect={setSelectedBusiness} />)}
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "80px 24px" }}>
                  <p style={{ fontSize: 44, margin: "0 0 12px" }}>🔍</p>
                  <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "#111827" }}>No businesses found</h3>
                  <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>Try adjusting filters or clear your search.</p>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ marginTop: 48, background: "#0f172a", borderRadius: 20, padding: "36px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#fff" }}>Own a business in Manipur?</h2>
              <p style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>List your business and reach thousands of customers across Northeast India.</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href="/admin/businesses/new" style={{ display: "inline-block", padding: "12px 22px", background: "#6ee7b7", color: "#064e3b", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>List Your Business →</a>
              <a href="/businesses/advertise" style={{ display: "inline-block", padding: "12px 22px", background: "rgba(255,255,255,0.07)", color: "#fff", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none", border: "1px solid rgba(255,255,255,0.18)" }}>Advertise with Us</a>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>{selectedBusiness && <DetailModal business={selectedBusiness} onClose={() => setSelectedBusiness(null)} />}</AnimatePresence>

        <footer style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "20px 24px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}>© 2026 Justmateng Service Pvt. Ltd. · Business Discovery Platform</footer>
      </div>
    </>
  );
}