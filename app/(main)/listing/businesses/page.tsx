"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";


import debounce from "lodash/debounce";

// ─── ADDRESS AUTOCOMPLETE (OLA MAPS) ──────────────────────────────
function AddressAutocomplete({
  value, onChange, onPlaceSelect, hasError, inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onPlaceSelect: (place: { address: string; mapsUrl: string; city?: string }) => void;
  hasError?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const localRef = useRef<HTMLInputElement>(null);
  const resolvedRef = (inputRef || localRef) as React.RefObject<HTMLInputElement>;

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = useCallback(
    debounce(async (input: string) => {
      if (input.length <= 3) { setSuggestions([]); return; }
      try {
        const res = await fetch(
          `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(input)}&location=24.817,93.936&radius=300000&api_key=${process.env.NEXT_PUBLIC_OLA_API_KEY}`
        );
        const data = await res.json();
        setSuggestions(data.predictions || []);
        setIsOpen(true);
      } catch { setSuggestions([]); }
    }, 500),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    fetchSuggestions(val);
  };

  const handleSelect = async (suggestion: any) => {
    setIsOpen(false);
    setSuggestions([]);
    setQuery(suggestion.description);
    onChange(suggestion.description);
    try {
      const res = await fetch(
        `https://api.olamaps.io/places/v1/details?place_id=${encodeURIComponent(suggestion.place_id)}&api_key=${process.env.NEXT_PUBLIC_OLA_API_KEY}`
      );
      const data = await res.json();
      if (data.status === "ok" && data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        const address = data.result.formatted_address || suggestion.description;
        const cityComp = data.result.address_components?.find((c: any) =>
          c.types?.includes("locality") || c.types?.includes("administrative_area_level_2")
        );
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        setQuery(address);
        onChange(address);
        onPlaceSelect({ address, mapsUrl, city: cityComp?.long_name });
      }
    } catch {
      const coords = suggestion.geometry?.coordinates;
      if (Array.isArray(coords) && coords.length === 2) {
        const [lng, lat] = coords;
        onPlaceSelect({ address: suggestion.description, mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` });
      }
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 15, pointerEvents: "none" }}>📍</span>
        <input
          ref={resolvedRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder="Start typing your address…"
          style={{
            width: "100%", padding: "10px 36px",
            border: `1px solid ${hasError ? "#f87171" : "#e5e7eb"}`,
            borderRadius: 8, fontSize: 14, color: "#111827",
            background: hasError ? "#fff5f5" : "#fff",
            fontFamily: "inherit",
            boxShadow: hasError ? "0 0 0 3px #fee2e2" : "none",
            outline: "none",
          }}
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); onChange(""); setSuggestions([]); }}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 14 }}>✕</button>
        )}
      </div>
      {isOpen && suggestions.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 999, maxHeight: 280, overflowY: "auto", marginTop: 4 }}>
          {suggestions.map((s, i) => (
            <button key={s.place_id || i} type="button" onClick={() => handleSelect(s)}
              style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", borderBottom: i < suggestions.length - 1 ? "1px solid #f3f4f6" : "none", textAlign: "left", cursor: "pointer", fontSize: 13, color: "#111827", display: "flex", alignItems: "flex-start", gap: 8 }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              <span style={{ marginTop: 1, flexShrink: 0 }}>📍</span>
              <span style={{ lineHeight: 1.4 }}>{s.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAP PICKER ───────────────────────────────────────────────────
function MapPicker({ onLocationSelect }: {
  onLocationSelect: (result: { address: string; mapsUrl: string; city?: string; lat: number; lng: number }) => void;
}) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const olaMapsRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pickedAddress, setPickedAddress] = useState<string | null>(null);

  const MANIPUR = { lat: 24.817, lng: 93.936 };

  const reverseGeocode = async (lat: number, lng: number): Promise<{ address: string; city?: string }> => {
    try {
      const res = await fetch(
        `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${lng}&api_key=${process.env.NEXT_PUBLIC_OLA_API_KEY}`
      );
      const data = await res.json();
      if (data.status === "ok" && data.results?.length > 0) {
        const result = data.results[0];
        const cityComp = result.address_components?.find((c: any) =>
          c.types?.includes("locality") || c.types?.includes("administrative_area_level_2")
        );
        return { address: result.formatted_address, city: cityComp?.long_name };
      }
    } catch {}
    return { address: "Unknown Location" };
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { OlaMaps } = await import("olamaps-web-sdk");
        const olaMaps = new OlaMaps({ apiKey: process.env.NEXT_PUBLIC_OLA_API_KEY! });
        olaMapsRef.current = olaMaps;

        const map = olaMaps.init({
          style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
          container: "business-map-picker",
          center: [MANIPUR.lng, MANIPUR.lat],
          zoom: 13,
        });

        map.on("load", () => setIsLoading(false));

        map.on("click", async (e: any) => {
          const { lng, lat } = e.lngLat;

          // Move or create marker
          if (markerRef.current) {
            markerRef.current.setLngLat([lng, lat]);
          } else {
            markerRef.current = olaMaps
              .addMarker({ color: "#6366f1", draggable: true })
              .setLngLat([lng, lat])
              .addTo(map);

            markerRef.current.on("dragend", async () => {
              const pos = markerRef.current.getLngLat();
              const { address, city } = await reverseGeocode(pos.lat, pos.lng);
              const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pos.lat},${pos.lng}`;
              setPickedAddress(address);
              onLocationSelect({ address, mapsUrl, city, lat: pos.lat, lng: pos.lng });
            });
          }

          const { address, city } = await reverseGeocode(lat, lng);
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
          setPickedAddress(address);
          onLocationSelect({ address, mapsUrl, city, lat, lng });
        });

        mapRef.current = map;
      } catch (err) {
        console.error("Map picker init failed:", err);
        setIsLoading(false);
      }
    };
    init();
  }, []);

  return (
    <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb", marginTop: 10 }}>
      {/* Instructions bar */}
      <div style={{ padding: "8px 14px", background: "#f0f9ff", borderBottom: "1px solid #bfdbfe", fontSize: 12, color: "#1e40af", display: "flex", alignItems: "center", gap: 6 }}>
        <span>🖱</span>
        <span>Click anywhere on the map to drop a pin — address auto-fills above. Drag the pin to adjust.</span>
      </div>

      {/* Map container */}
      <div style={{ position: "relative" }}>
        {isLoading && (
          <div style={{ position: "absolute", inset: 0, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, fontSize: 13, color: "#6b7280" }}>
            Loading map…
          </div>
        )}
        <div id="business-map-picker" style={{ width: "100%", height: 300 }} />
      </div>

      {/* Picked address confirmation */}
      {pickedAddress && (
        <div style={{ padding: "8px 14px", background: "#f0fdf4", borderTop: "1px solid #bbf7d0", fontSize: 12, color: "#14710f", display: "flex", alignItems: "center", gap: 6 }}>
          <span>📍</span>
          <span style={{ flex: 1 }}>{pickedAddress}</span>
          <span style={{ fontWeight: 700 }}>✓ Applied</span>
        </div>
      )}
    </div>
  );
}


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── TYPES ────────────────────────────────────────────────────────
type BusinessCategoryId = "retail" | "restaurants" | "healthcare" | "education" | "technology" | "finance" | "beauty" | "automotive" | "realestate" | "hospitality" | "legal" | "fitness" | "arts";
type BusinessStatus = "open" | "closed" | "temporarily_closed" | "coming_soon";
type PriceRange = "budget" | "mid" | "premium" | "luxury";

interface PhotoUpload {
  file?: File;
  url: string;           // local blob URL for preview OR remote URL if already uploaded
  caption: string;
  is_cover: boolean;
  display_order: number;
  uploaded?: boolean;    // true once persisted to storage
  uploading?: boolean;
}

interface TeamMemberEntry {
  name: string;
  role: string;
  bio: string;
  photo_url: string;
  avatar_initials: string;
  avatar_color: string;
}

interface HourEntry {
  day: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

// ─── CONSTANTS ────────────────────────────────────────────────────
const CATEGORY_OPTIONS: { id: BusinessCategoryId; label: string; accent: string; icon: string; description: string }[] = [
  { id: "retail",      label: "Retail",         accent: "#0e7490", icon: "🛍",  description: "Shops, stores, boutiques" },
  { id: "restaurants", label: "Restaurants",    accent: "#b45309", icon: "🍽",  description: "Restaurants, cafés, food stalls" },
  { id: "healthcare",  label: "Healthcare",     accent: "#b91c1c", icon: "⚕️",  description: "Clinics, hospitals, pharmacies" },
  { id: "education",   label: "Education",      accent: "#14710f", icon: "📚",  description: "Schools, coaching, institutes" },
  { id: "technology",  label: "Technology",     accent: "#4338ca", icon: "💻",  description: "IT firms, apps, software" },
  { id: "finance",     label: "Finance",        accent: "#1a56a8", icon: "💰",  description: "Banks, insurance, accounting" },
  { id: "beauty",      label: "Beauty & Salon", accent: "#a21caf", icon: "✨",  description: "Salons, spas, grooming" },
  { id: "automotive",  label: "Automotive",     accent: "#374151", icon: "🚗",  description: "Garages, dealers, car wash" },
  { id: "realestate",  label: "Real Estate",    accent: "#0f766e", icon: "🏠",  description: "Agents, builders, property" },
  { id: "hospitality", label: "Hospitality",    accent: "#c2410c", icon: "🏨",  description: "Hotels, guesthouses, resorts" },
  { id: "legal",       label: "Legal",          accent: "#1e40af", icon: "⚖️",  description: "Lawyers, notaries, consultants" },
  { id: "fitness",     label: "Fitness",        accent: "#15803d", icon: "💪",  description: "Gyms, yoga studios, sports" },
  { id: "arts",        label: "Arts & Crafts",  accent: "#7c3d94", icon: "🎨",  description: "Galleries, craftsmen, studios" },
];

const STATUS_OPTIONS: { id: BusinessStatus; label: string }[] = [
  { id: "open",               label: "Open" },
  { id: "closed",             label: "Closed" },
  { id: "temporarily_closed", label: "Temporarily Closed" },
  { id: "coming_soon",        label: "Coming Soon" },
];

const PRICE_OPTIONS: { id: PriceRange; label: string }[] = [
  { id: "budget",  label: "₹ Budget" },
  { id: "mid",     label: "₹₹ Mid-range" },
  { id: "premium", label: "₹₹₹ Premium" },
  { id: "luxury",  label: "₹₹₹₹ Luxury" },
];

const AVATAR_COLORS = ["#14710f", "#7c3d94", "#1a56a8", "#b91c1c", "#b45309", "#0e7490", "#c2410c", "#4338ca", "#0f766e", "#a21caf"];
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const STORAGE_KEY = "admin_business_form_draft";

const emptyTeamMember = (): TeamMemberEntry => ({ name: "", role: "", bio: "", photo_url: "", avatar_initials: "", avatar_color: AVATAR_COLORS[0] });
const defaultHours = (): HourEntry[] => DAYS_OF_WEEK.map(day => ({ day, open_time: "09:00", close_time: "18:00", is_closed: day === "Sunday" }));

// ─── REUSABLE COMPONENTS ──────────────────────────────────────────
function Field({ label, hint, children, fieldRef, hasError }: { label: string; hint?: string; children: React.ReactNode; fieldRef?: React.RefObject<HTMLDivElement | null>; hasError?: boolean }) {
  return (
    <div ref={fieldRef} style={{ marginBottom: 20, scrollMarginTop: 80 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: hasError ? "#991b1b" : "#374151", marginBottom: 6 }}>
        {label}{hasError && <span style={{ marginLeft: 6, fontSize: 11, color: "#ef4444", fontWeight: 600 }}>← required</span>}
      </label>
      {hint && <p style={{ margin: "0 0 6px", fontSize: 11, color: "#9ca3af" }}>{hint}</p>}
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", required = false, hasError = false, inputRef }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean; hasError?: boolean; inputRef?: React.RefObject<HTMLInputElement | null> }) {
  return (
    <input ref={inputRef} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
      style={{ width: "100%", padding: "10px 12px", border: `1px solid ${hasError ? "#f87171" : "#e5e7eb"}`, borderRadius: 8, fontSize: 14, color: "#111827", background: hasError ? "#fff5f5" : "#fff", fontFamily: "inherit", boxShadow: hasError ? "0 0 0 3px #fee2e2" : "none", transition: "border-color 0.15s, box-shadow 0.15s" }} />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3, hasError = false, inputRef }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; hasError?: boolean; inputRef?: React.RefObject<HTMLTextAreaElement | null> }) {
  return (
    <textarea ref={inputRef} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: "100%", padding: "10px 12px", border: `1px solid ${hasError ? "#f87171" : "#e5e7eb"}`, borderRadius: 8, fontSize: 14, color: "#111827", background: hasError ? "#fff5f5" : "#fff", fontFamily: "inherit", resize: "vertical", boxShadow: hasError ? "0 0 0 3px #fee2e2" : "none" }} />
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

function SectionHeader({ title, count, onAdd, addLabel }: { title: string; count?: number; onAdd: () => void; addLabel: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</h3>
        {count !== undefined && count > 0 && <span style={{ padding: "1px 8px", borderRadius: 999, background: "#f3f4f6", fontSize: 12, fontWeight: 600, color: "#6b7280" }}>{count}</span>}
      </div>
      <button type="button" onClick={onAdd} style={{ padding: "6px 14px", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ {addLabel}</button>
    </div>
  );
}

// ─── PHOTO UPLOAD COMPONENT ───────────────────────────────────────
function PhotoUploader({ photos, setPhotos, accentColor, businessId }: {
  photos: PhotoUpload[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoUpload[]>>;
  accentColor: string;
  businessId?: string;  // set after first save — used to store in the right path
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!arr.length) return;
    const newPhotos: PhotoUpload[] = arr.map((file, i) => ({
      file,
      url: URL.createObjectURL(file),
      caption: "",
      is_cover: photos.length === 0 && i === 0,
      display_order: photos.length + i,
      uploaded: false,
    }));
    setPhotos(p => [...p, ...newPhotos]);
    setUploadErrors([]);
  }, [photos.length, setPhotos]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const uploadToSupabase = async (photo: PhotoUpload, index: number) => {
    if (!photo.file) return photo;
    setPhotos(prev => prev.map((p, i) => i === index ? { ...p, uploading: true } : p));
    const ext = photo.file.name.split(".").pop();
    const path = `businesses/${businessId || "pending"}/${Date.now()}_${index}.${ext}`;
    const { error, data } = await supabase.storage.from("business-photos").upload(path, photo.file, { upsert: true });
    if (error) {
      setUploadErrors(prev => [...prev, `Failed to upload ${photo.file!.name}: ${error.message}`]);
      setPhotos(prev => prev.map((p, i) => i === index ? { ...p, uploading: false } : p));
      return photo;
    }
    const { data: { publicUrl } } = supabase.storage.from("business-photos").getPublicUrl(path);
    const updated = { ...photo, url: publicUrl, uploaded: true, uploading: false, file: undefined };
    setPhotos(prev => prev.map((p, i) => i === index ? updated : p));
    return updated;
  };

  const uploadAll = async () => {
    const pending = photos.filter(p => !p.uploaded && p.file);
    for (let i = 0; i < photos.length; i++) {
      if (!photos[i].uploaded && photos[i].file) {
        await uploadToSupabase(photos[i], i);
      }
    }
  };

  const setCover = (index: number) => {
    setPhotos(prev => prev.map((p, i) => ({ ...p, is_cover: i === index })));
  };

  const removePhoto = (index: number) => {
    const p = photos[index];
    if (p.url.startsWith("blob:")) URL.revokeObjectURL(p.url);
    setPhotos(prev => prev.filter((_, i) => i !== index).map((p, i) => ({ ...p, display_order: i, is_cover: i === 0 ? true : p.is_cover })));
  };

  const movePhoto = (from: number, to: number) => {
    setPhotos(prev => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr.map((p, i) => ({ ...p, display_order: i }));
    });
  };

  const pendingCount = photos.filter(p => !p.uploaded && p.file).length;

  return (
    <div>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        style={{ border: `2px dashed ${dragOver ? accentColor : "#d1d5db"}`, borderRadius: 12, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: dragOver ? accentColor + "06" : "#fafafa", transition: "all 0.15s", marginBottom: 16 }}>
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => e.target.files && addFiles(e.target.files)} />
        <div style={{ fontSize: 28, marginBottom: 8 }}>📸</div>
        <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#374151" }}>Click to upload or drag & drop</p>
        <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>JPG, PNG, WebP up to 10MB each — multiple files supported</p>
      </div>

      {uploadErrors.length > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
          {uploadErrors.map((e, i) => <p key={i} style={{ margin: 0, fontSize: 12, color: "#991b1b" }}>{e}</p>)}
        </div>
      )}

      {photos.length > 0 && (
        <>
          {pendingCount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "8px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: "#92400e" }}>{pendingCount} photo{pendingCount > 1 ? "s" : ""} ready to upload to Supabase storage</span>
              <button type="button" onClick={uploadAll} style={{ padding: "5px 12px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Upload All ↑</button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {photos.map((photo, i) => (
              <div key={i} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: photo.is_cover ? `2px solid ${accentColor}` : "2px solid #e5e7eb", background: "#f3f4f6" }}>
                <img src={photo.url} alt="" style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />

                {/* Uploading indicator */}
                {photo.uploading && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>Uploading…</span>
                  </div>
                )}

                {/* Cover badge */}
                {photo.is_cover && <div style={{ position: "absolute", top: 5, left: 5, background: accentColor, color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 999 }}>COVER</div>}

                {/* Uploaded badge */}
                {photo.uploaded && !photo.uploading && <div style={{ position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,0.6)", color: "#6ee7b7", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 999 }}>✓</div>}

                <div style={{ padding: "8px" }}>
                  <input value={photo.caption} onChange={e => setPhotos(prev => prev.map((p, idx) => idx === i ? { ...p, caption: e.target.value } : p))}
                    placeholder="Caption…" style={{ width: "100%", padding: "4px 6px", fontSize: 11, border: "1px solid #e5e7eb", borderRadius: 5, fontFamily: "inherit" }} />

                  <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                    {!photo.is_cover && <button type="button" onClick={() => setCover(i)} style={{ flex: 1, padding: "3px", fontSize: 9, fontWeight: 700, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 4, cursor: "pointer", color: "#14710f" }}>Set Cover</button>}
                    {i > 0 && <button type="button" onClick={() => movePhoto(i, i - 1)} style={{ padding: "3px 6px", fontSize: 10, background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 4, cursor: "pointer", color: "#6b7280" }}>←</button>}
                    {i < photos.length - 1 && <button type="button" onClick={() => movePhoto(i, i + 1)} style={{ padding: "3px 6px", fontSize: 10, background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 4, cursor: "pointer", color: "#6b7280" }}>→</button>}
                    {!photo.uploaded && photo.file && <button type="button" onClick={() => uploadToSupabase(photo, i)} style={{ padding: "3px 5px", fontSize: 9, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 4, cursor: "pointer", color: "#1a56a8", fontWeight: 700 }}>↑</button>}
                    <button type="button" onClick={() => removePhoto(i)} style={{ padding: "3px 5px", fontSize: 10, background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 4, cursor: "pointer", color: "#991b1b" }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── CATEGORY PICKER ──────────────────────────────────────────────
function CategoryPicker({ onSelect }: { onSelect: (cat: BusinessCategoryId) => void }) {
  const [hovered, setHovered] = useState<BusinessCategoryId | null>(null);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#111827" }}>What kind of business are you listing?</h2>
        <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>Choose a category — the form will adapt to your business type.</p>
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
            <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: cat.accent, opacity: hovered === cat.id ? 1 : 0, transition: "opacity 0.15s" }}>Select →</div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function AdminBusinessUploadPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const ownerRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const nameFieldRef = useRef<HTMLDivElement>(null);
  const descriptionFieldRef = useRef<HTMLDivElement>(null);
  const ownerFieldRef = useRef<HTMLDivElement>(null);
  const addressFieldRef = useRef<HTMLDivElement>(null);

  const [hydrated, setHydrated] = useState(false);
  const [category, setCategory] = useState<BusinessCategoryId | null>(null);
  const [activeSection, setActiveSection] = useState<"basic" | "contact" | "photos" | "services" | "team" | "hours" | "preview">("basic");

  // Basic
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [status, setStatus] = useState<BusinessStatus>("open");
  const [priceRange, setPriceRange] = useState<PriceRange>("mid");
  const [featured, setFeatured] = useState(false);
  const [accentColor, setAccentColor] = useState("#0e7490");
  const [description, setDescription] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [establishedYear, setEstablishedYear] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [certificationsInput, setCertificationsInput] = useState("");

  // Contact
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Imphal");
  const [showMapPicker, setShowMapPicker] = useState(false); // ✅ ADD THIS
  const [state, setState] = useState("Manipur");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");

  // Photos
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);

  // Services
  const [servicesInput, setServicesInput] = useState("");

  // Team
  const [team, setTeam] = useState<TeamMemberEntry[]>([]);

  // Hours
  const [hours, setHours] = useState<HourEntry[]>(defaultHours());

  // Hydrate from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.category)          setCategory(d.category);
        if (d.activeSection)     setActiveSection(d.activeSection);
        if (d.name)              setName(d.name);
        if (d.tagline)           setTagline(d.tagline);
        if (d.status)            setStatus(d.status);
        if (d.priceRange)        setPriceRange(d.priceRange);
        if (d.featured !== undefined) setFeatured(d.featured);
        if (d.accentColor)       setAccentColor(d.accentColor);
        if (d.description)       setDescription(d.description);
        if (d.ownerName)         setOwnerName(d.ownerName);
        if (d.establishedYear)   setEstablishedYear(d.establishedYear);
        if (d.employeeCount)     setEmployeeCount(d.employeeCount);
        if (d.tagsInput)         setTagsInput(d.tagsInput);
        if (d.certificationsInput) setCertificationsInput(d.certificationsInput);
        if (d.address)           setAddress(d.address);
        if (d.city)              setCity(d.city);
        if (d.state)             setState(d.state);
        if (d.phone)             setPhone(d.phone);
        if (d.email)             setEmail(d.email);
        if (d.website)           setWebsite(d.website);
        if (d.mapsUrl)           setMapsUrl(d.mapsUrl);
        if (d.whatsapp)          setWhatsapp(d.whatsapp);
        if (d.instagram)         setInstagram(d.instagram);
        if (d.facebook)          setFacebook(d.facebook);
        if (d.servicesInput)     setServicesInput(d.servicesInput);
        if (d.team)              setTeam(d.team);
        if (d.hours)             setHours(d.hours);
        // Photos: only restore already-uploaded ones (blob URLs don't survive reload)
        if (d.photos)            setPhotos(d.photos.filter((p: PhotoUpload) => p.uploaded));
      }
    } catch (_) {}
    setHydrated(true);
  }, []);

  // Persist (excluding File objects and blob URLs)
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        category, activeSection, name, tagline, status, priceRange, featured, accentColor,
        description, ownerName, establishedYear, employeeCount, tagsInput, certificationsInput,
        address, city, state, phone, email, website, mapsUrl, whatsapp, instagram, facebook,
        servicesInput, team, hours,
        photos: photos.filter(p => p.uploaded).map(({ file: _, ...rest }) => rest),
      }));
    } catch (_) {}
  }, [hydrated, category, activeSection, name, tagline, status, priceRange, featured, accentColor, description, ownerName, establishedYear, employeeCount, tagsInput, certificationsInput, address, city, state, phone, email, website, mapsUrl, whatsapp, instagram, facebook, servicesInput, team, hours, photos]);

  const clearError = (field: string) => setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });

  const updateTeam = (i: number, field: keyof TeamMemberEntry, val: string) => setTeam(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  const updateHours = (i: number, field: keyof HourEntry, val: string | boolean) => setHours(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const handleCategorySelect = (cat: BusinessCategoryId) => {
    setCategory(cat);
    setAccentColor(CATEGORY_OPTIONS.find(c => c.id === cat)!.accent);
    setActiveSection("basic");
  };

  const SECTIONS = [
    { id: "basic",    label: "Basic Info",   icon: "◎" },
    { id: "contact",  label: "Contact",      icon: "📞" },
    { id: "photos",   label: "Photos",       icon: "📸" },
    { id: "services", label: "Services",     icon: "✦" },
    // { id: "team",     label: "Team",         icon: "👥" },
    { id: "hours",    label: "Hours",        icon: "🕐" },
    { id: "preview",  label: "Preview",      icon: "👁" },
  ] as const;

  const validateAndFocus = useCallback((): boolean => {
    const errors: Record<string, boolean> = {};
    let firstErrorSection: string | null = null;
    let firstFocusFn: (() => void) | null = null;

    if (!name) { errors.name = true; if (!firstErrorSection) { firstErrorSection = "basic"; firstFocusFn = () => { nameRef.current?.focus(); nameFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }; } }
    if (!description) { errors.description = true; if (!firstErrorSection) { firstErrorSection = "basic"; firstFocusFn = () => { descriptionRef.current?.focus(); descriptionFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }; } }
    if (!ownerName) { errors.ownerName = true; if (!firstErrorSection) { firstErrorSection = "basic"; firstFocusFn = () => { ownerRef.current?.focus(); ownerFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }; } }
    if (!address) { errors.address = true; if (!firstErrorSection) { firstErrorSection = "contact"; firstFocusFn = () => { addressRef.current?.focus(); addressFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }; } }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      if (firstErrorSection && firstErrorSection !== activeSection) {
        setActiveSection(firstErrorSection as any);
        setTimeout(() => firstFocusFn?.(), 150);
      } else firstFocusFn?.();
      return false;
    }
    return true;
  }, [name, description, ownerName, address, activeSection]);

  const handleSave = useCallback(async () => {
    if (!category) return;
    setSaveError(null);
    if (!validateAndFocus()) { setSaveError("Please fill in all required fields."); return; }

      // ✅ ADD THIS
  const customerId = localStorage.getItem("customer_id");
if (!customerId) {
  setSaveError("You must be logged in to list a business.");
  return;
}
    setSaving(true);
    try {
      const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
      const certifications = certificationsInput.split(",").map(c => c.trim()).filter(Boolean);
      const services = servicesInput.split(",").map(s => s.trim()).filter(Boolean);
      const coverPhoto = photos.find(p => p.is_cover);

      const { data: bizData, error: bizErr } = await supabase.from("businesses").insert({
        name, tagline: tagline || null, category, status, featured, accent_color: accentColor,
        description, owner_name: ownerName, price_range: priceRange,
        established_year: establishedYear ? parseInt(establishedYear) : null,
        employee_count: employeeCount || null,
        tags, certifications, services,
        address, city, state,
        phone: phone || null, email: email || null, website: website || null,
        maps_url: mapsUrl || null, whatsapp: whatsapp || null,
        instagram: instagram || null, facebook: facebook || null,
        cover_photo_url: coverPhoto?.url || null,
        rating: null, review_count: 0,
          customer_id: customerId || null,   // ✅ ADD THIS LINE
        verified: false,
      }).select("id").single();
      if (bizErr) throw bizErr;
      const businessId = bizData.id;
      setSavedId(businessId);

      // Upload any pending photos now that we have the businessId
      const uploadedPhotos: PhotoUpload[] = [];
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        if (p.uploaded) { uploadedPhotos.push(p); continue; }
        if (p.file) {
          const ext = p.file.name.split(".").pop();
          const path = `businesses/${businessId}/${Date.now()}_${i}.${ext}`;
          const { error: upErr } = await supabase.storage.from("business-photos").upload(path, p.file, { upsert: true });
          if (!upErr) {
            const { data: { publicUrl } } = supabase.storage.from("business-photos").getPublicUrl(path);
            uploadedPhotos.push({ ...p, url: publicUrl, uploaded: true });
          }
        }
      }

      if (uploadedPhotos.length > 0) {
        const { error: photoErr } = await supabase.from("business_photos").insert(
          uploadedPhotos.map((p, i) => ({ business_id: businessId, url: p.url, caption: p.caption || null, is_cover: p.is_cover, display_order: i }))
        );
        if (photoErr) throw photoErr;
        // Update cover photo URL on business
        const cover = uploadedPhotos.find(p => p.is_cover);
        if (cover) await supabase.from("businesses").update({ cover_photo_url: cover.url }).eq("id", businessId);
      }

      if (team.length > 0) {
        const { error: teamErr } = await supabase.from("business_team").insert(
          team.map((m, i) => ({ business_id: businessId, name: m.name, role: m.role, bio: m.bio || null, photo_url: m.photo_url || null, avatar_initials: m.avatar_initials || m.name.slice(0, 2).toUpperCase(), avatar_color: m.avatar_color, display_order: i }))
        );
        if (teamErr) throw teamErr;
      }

      if (hours.length > 0) {
        const { error: hoursErr } = await supabase.from("business_hours").insert(
          hours.map(h => ({ business_id: businessId, day: h.day, open_time: h.open_time, close_time: h.close_time, is_closed: h.is_closed }))
        );
        if (hoursErr) throw hoursErr;
      }

      sessionStorage.removeItem(STORAGE_KEY);
      setSaved(true);
      setTimeout(() => router.push("/businesses"), 1800);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }, [category, name, tagline, status, priceRange, featured, accentColor, description, ownerName, establishedYear, employeeCount, tagsInput, certificationsInput, servicesInput, address, city, state, phone, email, website, mapsUrl, whatsapp, instagram, facebook, photos, team, hours, router, validateAndFocus]);

  const selectedCat = CATEGORY_OPTIONS.find(c => c.id === category);

  if (!hydrated) return null;

  return (
    <>
      <style>{`* { box-sizing: border-box; } input, textarea, select { outline: none; transition: border-color 0.15s, box-shadow 0.15s; } input:focus, textarea:focus, select:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px #eef2ff !important; } button { font-family: inherit; }`}</style>
      <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

        {/* Top bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => category ? setCategory(null) : router.push("/businesses")} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 20, padding: 4 }}>←</button>
              <div>
                <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>{category ? `List ${selectedCat?.label} Business` : "List New Business"}</h1>
                <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
                  {category
                    ? <span>Category: <span style={{ color: accentColor, fontWeight: 700 }}>{selectedCat?.icon} {selectedCat?.label}</span> · <button type="button" onClick={() => setCategory(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 11, padding: 0, textDecoration: "underline" }}>Change</button></span>
                    : "Admin · Business Directory · Step 1 of 2"}
                </p>
              </div>
            </div>
            {category && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} />Draft saved
                </span>
                <button type="button" onClick={handleSave} disabled={saving || saved}
                  style={{ padding: "7px 20px", borderRadius: 8, background: saved ? "#14710f" : saving ? "#6b7280" : "#111827", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", minWidth: 110 }}>
                  {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Business"}
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
                        {sec.id === "photos" && photos.length > 0 && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 999, background: accentColor + "18", color: accentColor }}>{photos.length}</span>}
                        {sec.id === "services" && team.length > 0 && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 999, background: "#f3f4f6", color: "#6b7280" }}>{team.length}</span>}
                      </button>
                    ))}
                  </div>

                  <button type="button" onClick={() => { if (confirm("Clear all draft data and start over?")) { sessionStorage.removeItem(STORAGE_KEY); window.location.reload(); }}}
                    style={{ marginTop: 10, width: "100%", padding: "8px", background: "none", border: "1px dashed #e5e7eb", borderRadius: 8, color: "#9ca3af", fontSize: 11, cursor: "pointer" }}>🗑 Clear draft</button>
                </div>

                {/* Main content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {saveError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#991b1b", fontSize: 13 }}>{saveError}</div>}
                  {saved && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#14710f", fontSize: 13, fontWeight: 600 }}>✓ Business saved! Redirecting…</div>}

                  <AnimatePresence mode="wait">

                    {/* ── BASIC INFO ── */}
                    {activeSection === "basic" && (
                      <motion.div key="basic" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px" }}>
                        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#111827" }}>Basic Information</h2>
                        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#9ca3af" }}>Core details about your {selectedCat?.label.toLowerCase()} business.</p>

                        <Field label="Business Name *" fieldRef={nameFieldRef} hasError={fieldErrors.name}>
                          <Input value={name} onChange={v => { setName(v); clearError("name"); }} placeholder={`e.g. Kanglei ${selectedCat?.label} Centre`} required hasError={fieldErrors.name} inputRef={nameRef} />
                        </Field>

                        <Field label="Tagline / Slogan">
                          <Input value={tagline} onChange={setTagline} placeholder="A short memorable line" />
                        </Field>

                        {/* <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <Field label="Status">
                            <Select value={status} onChange={v => setStatus(v as BusinessStatus)} options={STATUS_OPTIONS} />
                          </Field>
                          <Field label="Price Range">
                            <Select value={priceRange} onChange={v => setPriceRange(v as PriceRange)} options={PRICE_OPTIONS} />
                          </Field>
                        </div> */}

                        <Field label="Your Full Name *" fieldRef={ownerFieldRef} hasError={fieldErrors.ownerName}>
                          <Input value={ownerName} onChange={v => { setOwnerName(v); clearError("ownerName"); }} placeholder="Full name of owner" required hasError={fieldErrors.ownerName} inputRef={ownerRef} />
                        </Field>

                        <Field label="Description *" hint="Full description shown to customers" fieldRef={descriptionFieldRef} hasError={fieldErrors.description}>
                          <Textarea value={description} onChange={v => { setDescription(v); clearError("description"); }} placeholder="Tell customers about your business, what makes it special…" rows={5} hasError={fieldErrors.description} inputRef={descriptionRef} />
                        </Field>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <Field label="Year Established">
                            <Input type="number" value={establishedYear} onChange={setEstablishedYear} placeholder="2010" />
                          </Field>
                          {/* <Field label="Team Size">
                            <Input value={employeeCount} onChange={setEmployeeCount} placeholder="1–5, 10–50, 50+" />
                          </Field> */}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <Field label="Tags" hint="Comma-separated">
                            <Input value={tagsInput} onChange={setTagsInput} placeholder="Organic, Delivery, 24/7" />
                          </Field>
                          <Field label="Certifications" hint="Comma-separated">
                            <Input value={certificationsInput} onChange={setCertificationsInput} placeholder="ISO 9001, FSSAI, GST Registered" />
                          </Field>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <Field label="Accent Color">
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: 40, height: 36, border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", padding: 2 }} />
                              <Input value={accentColor} onChange={setAccentColor} placeholder="#0e7490" />
                            </div>
                            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                              {AVATAR_COLORS.map(c => <button key={c} type="button" onClick={() => setAccentColor(c)} style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: accentColor === c ? "2px solid #111827" : "2px solid transparent", cursor: "pointer", padding: 0 }} />)}
                            </div>
                          </Field>
                          <Field label="Featured Listing">
                            <div style={{ display: "flex", alignItems: "center", gap: 10, height: 36 }}>
                              <button type="button" onClick={() => setFeatured(!featured)} style={{ width: 44, height: 24, borderRadius: 12, background: featured ? "#14710f" : "#d1d5db", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: featured ? 22 : 4, transition: "left 0.2s" }} />
                              </button>
                              <span style={{ fontSize: 13, color: "#374151" }}>{featured ? "Featured" : "Standard"}</span>
                            </div>
                          </Field>
                        </div>
                      </motion.div>
                    )}

                    {/* ── CONTACT & LOCATION ── */}
                    {activeSection === "contact" && (
                      <motion.div key="contact" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px" }}>
                        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#111827" }}>Contact & Location</h2>
                        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#9ca3af" }}>How customers can find and contact you.</p>

                        <Field label="Address *" fieldRef={addressFieldRef} hasError={fieldErrors.address}>
  <AddressAutocomplete
    value={address}
    onChange={v => { setAddress(v); clearError("address"); }}
    onPlaceSelect={({ address: a, mapsUrl: m, city: c }) => {
      setAddress(a);
      setMapsUrl(m);
      if (c) setCity(c);
      clearError("address");
    }}
    hasError={fieldErrors.address}
    inputRef={addressRef}
  />

  {/* ✅ ADD: Toggle map picker */}
  <button
    type="button"
    onClick={() => setShowMapPicker(p => !p)}
    style={{
      marginTop: 8,
      padding: "6px 14px",
      background: showMapPicker ? "#eff6ff" : "#f3f4f6",
      border: `1px solid ${showMapPicker ? "#bfdbfe" : "#e5e7eb"}`,
      borderRadius: 7,
      fontSize: 12,
      fontWeight: 600,
      color: showMapPicker ? "#1e40af" : "#374151",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
    }}
  >
    🗺 {showMapPicker ? "Hide Map" : "Select from Map"}
  </button>

  {/* ✅ ADD: Map picker panel */}
  {showMapPicker && (
    <MapPicker
      onLocationSelect={({ address: a, mapsUrl: m, city: c }) => {
        setAddress(a);
        setMapsUrl(m);
        if (c) setCity(c);
        clearError("address");
      }}
    />
  )}
</Field>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <Field label="City *">
                            <Input value={city} onChange={setCity} placeholder="Imphal" />
                          </Field>
                          <Field label="State">
                            <Input value={state} onChange={setState} placeholder="Manipur" />
                          </Field>
                        </div>

                        <Field label="Google Maps URL">
                          <Input value={mapsUrl} onChange={setMapsUrl} placeholder="https://maps.google.com/…" />
                        </Field>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 8 }}>
                          <Field label="Phone Number">
                            <Input type="tel" value={phone} onChange={setPhone} placeholder="+91 98765 43210" />
                          </Field>
                          <Field label="WhatsApp Number" hint="Digits only, with country code">
                            <Input value={whatsapp} onChange={setWhatsapp} placeholder="919876543210" />
                          </Field>
                          <Field label="Email Address">
                            <Input type="email" value={email} onChange={setEmail} placeholder="hello@business.com" />
                          </Field>
                          <Field label="Website URL">
                            <Input value={website} onChange={setWebsite} placeholder="https://yourbusiness.com" />
                          </Field>
                          <Field label="Instagram Handle" hint="Without @">
                            <Input value={instagram} onChange={setInstagram} placeholder="yourbusiness" />
                          </Field>
                          <Field label="Facebook Page" hint="Page username or URL">
                            <Input value={facebook} onChange={setFacebook} placeholder="yourbusiness" />
                          </Field>
                        </div>
                      </motion.div>
                    )}

                    {/* ── PHOTOS ── */}
                    {activeSection === "photos" && (
                      <motion.div key="photos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px" }}>
                        <div style={{ marginBottom: 16 }}>
                          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#111827" }}>Business Photos</h2>
                          <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>Upload high-quality photos — storefront, interior, products, team. The cover photo appears on the listing card.</p>
                        </div>

                        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 14px", marginBottom: 18, fontSize: 12, color: "#1e40af" }}>
                          <strong>Tip:</strong> Upload photos before saving — they'll be stored in Supabase Storage under <code>business-photos/</code>. Click "Upload All" to push pending files, or save to auto-upload everything.
                        </div>

                        <PhotoUploader photos={photos} setPhotos={setPhotos} accentColor={accentColor} businessId={savedId || undefined} />
                      </motion.div>
                    )}

                    {/* ── SERVICES ── */}
                    {activeSection === "services" && (
                      <motion.div key="services" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px" }}>
                        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#111827" }}>Services Offered</h2>
                        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#9ca3af" }}>List what your business offers — shown as tags on the listing.</p>

                        <Field label="Services" hint="Enter one per line, or comma-separated">
                          <Textarea value={servicesInput} onChange={setServicesInput}
                            placeholder={
                              category === "restaurants" ? "Dine-in, Takeaway, Home Delivery, Catering" :
                              category === "healthcare" ? "General Consultation, Lab Tests, Home Visits, Emergency Care" :
                              category === "beauty" ? "Haircut, Facial, Manicure, Bridal Makeup, Keratin Treatment" :
                              "Service 1, Service 2, Service 3"
                            }
                            rows={6} />
                        </Field>

                        {servicesInput && (
                          <div style={{ marginTop: 12 }}>
                            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Preview</p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {servicesInput.split(/[,\n]/).filter(s => s.trim()).map((s, i) => (
                                <span key={i} style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: accentColor + "14", color: accentColor }}>{s.trim()}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* ── TEAM ── */}
                    {activeSection === "team" && (
                      <motion.div key="team" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px" }}>
                        <SectionHeader title="Team Members" count={team.length} onAdd={() => setTeam(p => [...p, emptyTeamMember()])} addLabel="Add Member" />
                        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6b7280" }}>Add key staff or team members to showcase on your profile.</p>
                        {team.length === 0 && <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af", fontSize: 14 }}>No team members yet.</div>}
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          {team.map((member, i) => (
                            <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px", background: "#fafafa", position: "relative" }}>
                              <button type="button" onClick={() => setTeam(p => p.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: 10, right: 10, padding: "2px 8px", fontSize: 11, background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 4, cursor: "pointer", color: "#991b1b" }}>Remove</button>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <Field label="Name *"><Input value={member.name} onChange={v => updateTeam(i, "name", v)} placeholder="Full name" /></Field>
                                <Field label="Role / Title"><Input value={member.role} onChange={v => updateTeam(i, "role", v)} placeholder="Manager, Chef, Doctor…" /></Field>
                                <Field label="Photo URL" hint="Direct link to photo"><Input value={member.photo_url} onChange={v => updateTeam(i, "photo_url", v)} placeholder="https://…" /></Field>
                                <Field label="Bio"><Input value={member.bio} onChange={v => updateTeam(i, "bio", v)} placeholder="Short bio" /></Field>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "auto auto 1fr", gap: 12, alignItems: "end", marginTop: 4 }}>
                                <Field label="Initials"><Input value={member.avatar_initials} onChange={v => updateTeam(i, "avatar_initials", v)} placeholder={member.name ? member.name.slice(0, 2).toUpperCase() : "AB"} /></Field>
                                <Field label="Avatar Color">
                                  <div style={{ display: "flex", gap: 4 }}>
                                    <input type="color" value={member.avatar_color} onChange={e => updateTeam(i, "avatar_color", e.target.value)} style={{ width: 36, height: 36, border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", padding: 2 }} />
                                    {AVATAR_COLORS.map(c => <button key={c} type="button" onClick={() => updateTeam(i, "avatar_color", c)} style={{ width: 18, height: 18, borderRadius: "50%", background: c, border: member.avatar_color === c ? "2px solid #111827" : "2px solid transparent", cursor: "pointer", padding: 0 }} />)}
                                  </div>
                                </Field>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 2 }}>
                                  {member.photo_url ? (
                                    <img src={member.photo_url} alt="" style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }} />
                                  ) : (
                                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: member.avatar_color + "22", border: `1.5px solid ${member.avatar_color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: member.avatar_color }}>
                                      {member.avatar_initials || member.name.slice(0, 2).toUpperCase() || "?"}
                                    </div>
                                  )}
                                  <span style={{ fontSize: 12, color: "#6b7280" }}>Preview</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* ── HOURS ── */}
                    {activeSection === "hours" && (
                      <motion.div key="hours" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px" }}>
                        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#111827" }}>Business Hours</h2>
                        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#9ca3af" }}>Set your opening hours for each day of the week.</p>

                        {/* Quick presets */}
                        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                          {[
                            { label: "Mon–Sat 9–6", fn: () => setHours(prev => prev.map(h => ({ ...h, open_time: "09:00", close_time: "18:00", is_closed: h.day === "Sunday" }))) },
                            { label: "Mon–Sun 9–9", fn: () => setHours(prev => prev.map(h => ({ ...h, open_time: "09:00", close_time: "21:00", is_closed: false }))) },
                            { label: "24/7", fn: () => setHours(prev => prev.map(h => ({ ...h, open_time: "00:00", close_time: "23:59", is_closed: false }))) },
                          ].map(preset => (
                            <button key={preset.label} type="button" onClick={preset.fn} style={{ padding: "5px 12px", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer" }}>{preset.label}</button>
                          ))}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {hours.map((h, i) => (
                            <div key={h.day} style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr auto", gap: 10, alignItems: "center", padding: "10px 12px", background: "#fafafa", borderRadius: 10, border: "1px solid #f3f4f6" }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{h.day.slice(0, 3)}</span>
                              <input type="time" value={h.open_time} disabled={h.is_closed} onChange={e => updateHours(i, "open_time", e.target.value)} style={{ padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, color: h.is_closed ? "#9ca3af" : "#111827", background: h.is_closed ? "#f9fafb" : "#fff" }} />
                              <input type="time" value={h.close_time} disabled={h.is_closed} onChange={e => updateHours(i, "close_time", e.target.value)} style={{ padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, color: h.is_closed ? "#9ca3af" : "#111827", background: h.is_closed ? "#f9fafb" : "#fff" }} />
                              <button type="button" onClick={() => updateHours(i, "is_closed", !h.is_closed)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: h.is_closed ? "#fee2e2" : "#f0fdf4", color: h.is_closed ? "#991b1b" : "#14710f", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                                {h.is_closed ? "Closed" : "Open"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* ── PREVIEW ── */}
                    {activeSection === "preview" && (
                      <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px" }}>
                        <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#111827" }}>Listing Preview</h2>
                        <div style={{ background: "#f9fafb", borderRadius: 12, overflow: "hidden", border: `2px solid ${accentColor}30` }}>
                          {/* Cover */}
                          <div style={{ height: 140, background: accentColor + "18", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                            {photos.length > 0 ? (
                              <img src={photos.find(p => p.is_cover)?.url || photos[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                            ) : (
                              <span style={{ fontSize: 44 }}>{selectedCat?.icon}</span>
                            )}
                            {featured && <div style={{ position: "absolute", top: 8, left: 8, padding: "2px 8px", borderRadius: 999, background: "rgba(0,0,0,0.6)", color: "#fbbf24", fontSize: 10, fontWeight: 700 }}>★ Featured</div>}
                            <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>{{ budget: "₹", mid: "₹₹", premium: "₹₹₹", luxury: "₹₹₹₹" }[priceRange]}</div>
                          </div>
                          <div style={{ padding: "14px 16px" }}>
                            <div style={{ fontSize: 9, fontWeight: 800, color: accentColor, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{selectedCat?.label}</div>
                            <h3 style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 800, color: "#111827" }}>{name || "Business Name"}</h3>
                            {tagline && <p style={{ margin: "0 0 8px", fontSize: 12, color: "#6b7280" }}>{tagline}</p>}
                            {description && <p style={{ margin: "0 0 10px", fontSize: 12, color: "#374151", lineHeight: 1.6 }}>{description.slice(0, 160)}{description.length > 160 ? "…" : ""}</p>}
                            {address && <div style={{ display: "flex", gap: 5, marginBottom: 4 }}><span style={{ fontSize: 11 }}>📍</span><span style={{ fontSize: 11, color: "#6b7280" }}>{address}, {city}</span></div>}
                            {phone && <div style={{ display: "flex", gap: 5, marginBottom: 8 }}><span style={{ fontSize: 11 }}>📞</span><span style={{ fontSize: 11, color: "#6b7280" }}>{phone}</span></div>}
                            {servicesInput && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {servicesInput.split(/[,\n]/).filter(s => s.trim()).slice(0, 4).map((s, i) => (
                                  <span key={i} style={{ padding: "2px 7px", borderRadius: 999, fontSize: 9, fontWeight: 600, background: accentColor + "12", color: accentColor }}>{s.trim()}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ marginTop: 16, padding: 14, background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
                          <p style={{ margin: 0, fontSize: 13, color: "#14710f", fontWeight: 600 }}>
                            ✓ {photos.length} photo{photos.length !== 1 ? "s" : ""} · {servicesInput.split(/[,\n]/).filter(s => s.trim()).length} services · {team.length} team member{team.length !== 1 ? "s" : ""} · Hours configured
                          </p>
                          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#14710f" }}>Looks good? Click "Save Business" in the top bar to publish.</p>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>

                  {/* Section nav */}
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