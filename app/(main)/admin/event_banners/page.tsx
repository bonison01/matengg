//app/(main)/admin/event_banners/page.tsx

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Banner {
  id: string; title: string; subtitle?: string; image_url: string;
  link_href?: string; link_label?: string; bg_color: string;
  display_order: number; is_active: boolean;
  created_at?: string; updated_at?: string;
}

const BG_PRESETS = [
  { label: "Dark Slate",  value: "#0f172a" },
  { label: "Forest",      value: "#0f1f0d" },
  { label: "Deep Purple", value: "#1a0a2e" },
  { label: "Ocean",       value: "#0a1628" },
  { label: "Teal Dark",   value: "#0a1e1f" },
  { label: "Maroon",      value: "#1f0a0a" },
];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 5 }}>{label}</label>
      {hint && <p style={{ margin: "0 0 5px", fontSize: 11, color: "#9ca3af" }}>{hint}</p>}
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#111827", background: "#fff", fontFamily: "inherit" }} />;
}

// ─── BANNER PREVIEW ───────────────────────────────────────────────
function BannerPreview({ banner }: { banner: Partial<Banner> }) {
  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: banner.bg_color || "#0f172a", minHeight: 140 }}>
      {banner.image_url && (
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${banner.image_url})`, backgroundSize: "cover", backgroundPosition: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(0,0,0,0.72) 0%,rgba(0,0,0,0.28) 60%,transparent 100%)" }} />
        </div>
      )}
      <div style={{ position: "relative", padding: "24px 22px", zIndex: 1 }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>{banner.title || "Banner Title"}</h3>
        {banner.subtitle && <p style={{ margin: "0 0 12px", fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{banner.subtitle}</p>}
        {banner.link_href && (
          <span style={{ display: "inline-block", padding: "7px 16px", background: "#6ee7b7", color: "#064e3b", borderRadius: 7, fontWeight: 700, fontSize: 12 }}>{banner.link_label || "Learn More"} →</span>
        )}
      </div>
    </div>
  );
}

// ─── BANNER FORM ──────────────────────────────────────────────────
function BannerForm({ banner, onSave, onCancel }: { banner: Partial<Banner>; onSave: (b: Partial<Banner>) => Promise<void>; onCancel: () => void; }) {
  const [form, setForm] = useState<Partial<Banner>>(banner);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof Banner, val: any) => setForm(p => ({ ...p, [key]: val }));

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `banners/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("event-assets").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("event-assets").getPublicUrl(path);
      set("image_url", data.publicUrl);
    } catch (e: any) {
      setError("Image upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title) { setError("Title is required."); return; }
    setSaving(true); setError(null);
    try { await onSave(form); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "flex-start" }}>
      {/* Form */}
      <div>
        <Field label="Banner Title *"><Input value={form.title || ""} onChange={v => set("title", v)} placeholder="Mateng EduFest 2026" /></Field>
        <Field label="Subtitle"><Input value={form.subtitle || ""} onChange={v => set("subtitle", v)} placeholder="Register before April 4th" /></Field>

        <Field label="Banner Image" hint="Upload a high-quality image (1200×400px recommended). Or paste a URL below.">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImageUpload(f); }}
              style={{ border: "2px dashed #d1d5db", borderRadius: 10, padding: "20px 16px", textAlign: "center", cursor: "pointer", background: "#fafafa", transition: "border-color 0.15s" }}
            >
              {uploading ? (
                <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Uploading…</p>
              ) : form.image_url ? (
                <div>
                  <img src={form.image_url} alt="" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 6, marginBottom: 6 }} />
                  <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>Click or drag to replace</p>
                </div>
              ) : (
                <>
                  <p style={{ margin: "0 0 4px", fontSize: 24, color: "#d1d5db" }}>⬆</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Click to upload or drag & drop</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>PNG, JPG, WebP · Max 5MB</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
            </div>
            <Input value={form.image_url || ""} onChange={v => set("image_url", v)} placeholder="https://… or /banners/edufest.jpg" />
          </div>
        </Field>

        <Field label="Fallback Background Color" hint="Shown while image loads or if no image">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input type="color" value={form.bg_color || "#0f172a"} onChange={e => set("bg_color", e.target.value)} style={{ width: 36, height: 36, border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", padding: 2 }} />
            {BG_PRESETS.map(p => (
              <button key={p.value} type="button" onClick={() => set("bg_color", p.value)}
                style={{ padding: "4px 10px", borderRadius: 6, border: `1.5px solid ${form.bg_color === p.value ? "#111827" : "#e5e7eb"}`, background: p.value, color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{p.label}</button>
            ))}
          </div>
        </Field>

        <Field label="CTA Link"><Input value={form.link_href || ""} onChange={v => set("link_href", v)} placeholder="/preneet or https://…" /></Field>
        <Field label="CTA Button Label"><Input value={form.link_label || ""} onChange={v => set("link_label", v)} placeholder="Register Now" /></Field>
        <Field label="Display Order" hint="Lower number = shown first"><Input type="number" value={String(form.display_order ?? 1)} onChange={v => set("display_order", parseInt(v) || 1)} /></Field>

        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14, color: "#991b1b", fontSize: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={handleSave} disabled={saving}
            style={{ flex: 1, padding: "10px 20px", background: "#111827", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {saving ? "Saving…" : (banner.id ? "Update Banner" : "Create Banner")}
          </button>
          <button type="button" onClick={onCancel} style={{ padding: "10px 18px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        </div>
      </div>

      {/* Live preview */}
      <div>
        <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>Live Preview</p>
        <BannerPreview banner={form} />
        <p style={{ margin: "8px 0 0", fontSize: 11, color: "#9ca3af" }}>Preview updates as you type. The actual carousel auto-advances every 5 seconds.</p>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function AdminBannersPage() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Banner> | null>(null);
  const [previewIdx, setPreviewIdx] = useState(0);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("banners").select("*").order("display_order", { ascending: true });
    if (error) setError(error.message);
    else setBanners(data as Banner[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const handleSave = async (form: Partial<Banner>) => {
    if (form.id) {
      const { error } = await supabase.from("banners").update({ ...form, updated_at: new Date().toISOString() }).eq("id", form.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("banners").insert({ ...form, is_active: true });
      if (error) throw error;
    }
    setEditing(null);
    await fetchBanners();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("banners").update({ is_active: !current }).eq("id", id);
    setBanners(p => p.map(b => b.id === id ? { ...b, is_active: !current } : b));
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Delete this banner? This cannot be undone.")) return;
    await supabase.from("banners").delete().eq("id", id);
    setBanners(p => p.filter(b => b.id !== id));
  };

  const moveOrder = async (id: string, dir: "up" | "down") => {
    const idx = banners.findIndex(b => b.id === id);
    if (dir === "up" && idx === 0) return;
    if (dir === "down" && idx === banners.length - 1) return;
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    const newBanners = [...banners];
    const a = newBanners[idx], b = newBanners[swapIdx];
    await supabase.from("banners").update({ display_order: b.display_order }).eq("id", a.id);
    await supabase.from("banners").update({ display_order: a.display_order }).eq("id", b.id);
    newBanners[idx] = { ...a, display_order: b.display_order };
    newBanners[swapIdx] = { ...b, display_order: a.display_order };
    setBanners(newBanners.sort((x, y) => x.display_order - y.display_order));
  };

  const activeBanners = banners.filter(b => b.is_active);

  return (
    <>
      <style>{`*{box-sizing:border-box} input,select{outline:none;transition:border-color 0.15s} input:focus,select:focus{border-color:#6366f1!important} button{font-family:inherit}`}</style>
      <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

        {/* Top bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => router.push("/events")} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 20, padding: 4 }}>←</button>
              <div>
                <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>Banner Management</h1>
                <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>Admin · Discovery Page Banners</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>{activeBanners.length} active / {banners.length} total</span>
              <button onClick={() => setEditing({ title: "", bg_color: "#0f172a", display_order: banners.length + 1, link_label: "Learn More" })}
                style={{ padding: "7px 18px", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                + New Banner
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 24px 64px" }}>

          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#991b1b", fontSize: 13 }}>Error: {error}</div>}

          {/* Create / Edit form */}
          <AnimatePresence>
            {editing !== null && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                style={{ background: "#fff", border: "2px solid #6366f1", borderRadius: 16, padding: "24px", marginBottom: 28, boxShadow: "0 8px 32px rgba(99,102,241,0.12)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>{editing.id ? "Edit Banner" : "Create New Banner"}</h2>
                  <button onClick={() => setEditing(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
                <BannerForm banner={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live carousel preview */}
          {activeBanners.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>Carousel Preview ({activeBanners.length} active)</p>
                <div style={{ display: "flex", gap: 6 }}>
                  {activeBanners.map((_, i) => (
                    <button key={i} onClick={() => setPreviewIdx(i)}
                      style={{ width: i === previewIdx ? 20 : 8, height: 8, borderRadius: 999, background: i === previewIdx ? "#6366f1" : "#d1d5db", border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s" }} />
                  ))}
                </div>
              </div>
              <BannerPreview banner={activeBanners[previewIdx] || activeBanners[0]} />
            </div>
          )}

          {/* Banner list */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>All Banners</h2>
              <span style={{ fontSize: 12, color: "#6b7280" }}>Drag rows or use arrows to reorder</span>
            </div>

            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>Loading banners…</div>
            ) : banners.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center" }}>
                <p style={{ fontSize: 32, margin: "0 0 12px" }}>🖼</p>
                <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#111827" }}>No banners yet</h3>
                <p style={{ margin: "0 0 16px", color: "#6b7280", fontSize: 13 }}>Create your first banner to feature it on the discovery page.</p>
                <button onClick={() => setEditing({ title: "", bg_color: "#0f172a", display_order: 1, link_label: "Learn More" })}
                  style={{ padding: "10px 22px", background: "#111827", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Create Banner</button>
              </div>
            ) : (
              <div>
                {banners.map((banner, idx) => (
                  <motion.div key={banner.id} layout
                    style={{ padding: "14px 20px", borderBottom: "1px solid #f9fafb", display: "flex", alignItems: "center", gap: 14, background: banner.is_active ? "#fff" : "#fafafa" }}>

                    {/* Order controls */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                      <button onClick={() => moveOrder(banner.id, "up")} disabled={idx === 0}
                        style={{ padding: "2px 6px", fontSize: 10, background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 4, cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? "#d1d5db" : "#6b7280" }}>▲</button>
                      <button onClick={() => moveOrder(banner.id, "down")} disabled={idx === banners.length - 1}
                        style={{ padding: "2px 6px", fontSize: 10, background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 4, cursor: idx === banners.length - 1 ? "default" : "pointer", color: idx === banners.length - 1 ? "#d1d5db" : "#6b7280" }}>▼</button>
                    </div>

                    {/* Thumbnail */}
                    <div style={{ width: 64, height: 40, borderRadius: 6, overflow: "hidden", background: banner.bg_color || "#0f172a", flexShrink: 0, position: "relative" }}>
                      {banner.image_url && <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${banner.image_url})`, backgroundSize: "cover", backgroundPosition: "center" }} />}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{banner.title}</p>
                        <span style={{ padding: "1px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: banner.is_active ? "#f0fdf4" : "#f3f4f6", color: banner.is_active ? "#14710f" : "#9ca3af", flexShrink: 0, border: `1px solid ${banner.is_active ? "#bbf7d0" : "#e5e7eb"}` }}>
                          {banner.is_active ? "Active" : "Hidden"}
                        </span>
                      </div>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>
                        Order: {banner.display_order}
                        {banner.link_href && <span> · CTA: {banner.link_href}</span>}
                        {banner.subtitle && <span> · "{banner.subtitle.slice(0, 40)}{banner.subtitle.length > 40 ? "…" : ""}"</span>}
                      </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => { setPreviewIdx(banners.filter(b=>b.is_active).findIndex(b=>b.id===banner.id)); }}
                        style={{ padding: "5px 10px", background: "#f0f9ff", color: "#1a56a8", border: "1px solid #bfdbfe", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Preview</button>
                      <button onClick={() => toggleActive(banner.id, banner.is_active)}
                        style={{ padding: "5px 10px", background: banner.is_active ? "#fffbeb" : "#f0fdf4", color: banner.is_active ? "#92400e" : "#14710f", border: `1px solid ${banner.is_active ? "#fde68a" : "#bbf7d0"}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        {banner.is_active ? "Hide" : "Show"}
                      </button>
                      <button onClick={() => setEditing(banner)}
                        style={{ padding: "5px 10px", background: "#f9fafb", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                      <button onClick={() => deleteBanner(banner.id)}
                        style={{ padding: "5px 10px", background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Delete</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Tips */}
          <div style={{ marginTop: 24, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "16px 20px" }}>
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#92400e" }}>Tips for great banners</p>
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                "Use landscape images at 1200×400px or wider for best results.",
                "Keep titles short and punchy — 5 words or fewer work best.",
                "Set a fallback background colour that matches your image tone.",
                "Use 'Hide' to temporarily remove a banner without deleting it.",
                "The carousel auto-advances every 5 seconds on the discovery page.",
                "Upload images to Supabase Storage bucket named 'event-assets'.",
              ].map((tip, i) => <li key={i} style={{ fontSize: 12, color: "#92400e" }}>{tip}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}