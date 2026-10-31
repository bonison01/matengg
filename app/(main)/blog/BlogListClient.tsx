//app/(main)/blog/BlogListClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { supabase } from "@/lib/supabaseClient";
import Footer from "@/components/footer/Footer";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[];
  category: string | null;
  pinned: boolean;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
  status: string;
}

type DateFilter = "all" | "7d" | "30d" | "year";

function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function matchesDateFilter(dateStr: string | null, filter: DateFilter) {
  if (filter === "all" || !dateStr) return true;
  const date = new Date(dateStr).getTime();
  const now = Date.now();
  if (filter === "7d") return now - date <= 7 * 24 * 60 * 60 * 1000;
  if (filter === "30d") return now - date <= 30 * 24 * 60 * 60 * 1000;
  if (filter === "year") return now - date <= 365 * 24 * 60 * 60 * 1000;
  return true;
}

export default function BlogListClient({
  initialPosts = [],
}: {
  /** Published posts fetched on the server so the list is in the initial HTML. */
  initialPosts?: BlogPost[];
}) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  // Already have server-rendered posts? Then there is nothing to wait for.
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  useEffect(() => {
    (async () => {
      // Refresh in the background; only show the skeleton on a cold start.
      if (initialPosts.length === 0) setLoading(true);
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, cover_image_url, tags, category, pinned, author_name, published_at, created_at, status")
        .order("published_at", { ascending: false, nullsFirst: false });
      if (!error && data) {
        setPosts((data as any[]).filter((p) => p.status === "published"));
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags || [])));
  const allCategories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean))) as string[];

  const pinnedPosts = useMemo(() => posts.filter((p) => p.pinned), [posts]);
  const heroPost = pinnedPosts[0];
  const secondaryPinned = pinnedPosts.slice(1, 3);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts
      .filter((p) => !p.pinned) // pinned stories already shown up top
      .filter((p) => (activeTag ? (p.tags || []).includes(activeTag) : true))
      .filter((p) => (activeCategory ? p.category === activeCategory : true))
      .filter((p) => (q ? p.title.toLowerCase().includes(q) || (p.excerpt || "").toLowerCase().includes(q) : true))
      .filter((p) => matchesDateFilter(p.published_at || p.created_at, dateFilter));
  }, [posts, activeTag, activeCategory, search, dateFilter]);

  const noFiltersActive = !activeTag && !activeCategory && !search && dateFilter === "all";

  return (
    <div
      className={`${fraunces.variable} ${inter.variable} ${mono.variable} w-full min-h-screen flex flex-col`}
      style={{ background: "#0B1410", color: "#F3F1EA", fontFamily: "var(--font-body)", position: "relative", zIndex: 1 }}
    >
      <style jsx global>{`
        .eyebrow { font-family: var(--font-mono); letter-spacing: 0.18em; text-transform: uppercase; }
        .tabular { font-family: var(--font-mono); font-feature-settings: "tnum" 1; }
        .blog-card {
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease;
        }
        .blog-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 60px -28px rgba(63,166,55,0.45);
        }
        .hero-card {
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1);
        }
        .hero-card:hover {
          transform: scale(1.01);
        }
        .filter-input::placeholder { color: #6B7A6C; }
      `}</style>

      <div className="flex-grow px-6 pt-24 pb-16 max-w-6xl mx-auto w-full">
        <div className="flex flex-col items-center text-center mb-14">
          <span className="eyebrow text-[11px] text-[#E8B84B] mb-3">The Mateng Journal</span>
          <h1
            className="text-4xl sm:text-5xl leading-tight"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Stories, updates & <em style={{ fontStyle: "italic", color: "#3FA637" }}>behind the scenes</em>
          </h1>
          <p className="text-[#92A395] mt-4 max-w-xl text-sm sm:text-base">
            Notes from events, delivery routes, and the local businesses we work with.
          </p>
        </div>

        {/* Search + date filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl mx-auto">
          <input
            className="filter-input flex-1 rounded-full px-5 py-2.5 text-sm"
            style={{ background: "rgba(243,241,234,0.06)", border: "1px solid rgba(243,241,234,0.14)", color: "#F3F1EA" }}
            placeholder="Search stories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-full px-4 py-2.5 text-sm eyebrow"
            style={{ background: "rgba(243,241,234,0.06)", border: "1px solid rgba(243,241,234,0.14)", color: "#D2DCD3", letterSpacing: "0.04em" }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
          >
            <option value="all">All time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="year">This year</option>
          </select>
        </div>

        {/* Category chips */}
        {allCategories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <button
              onClick={() => setActiveCategory(null)}
              className="eyebrow text-[10px] px-3 py-1.5 rounded-full border transition-colors"
              style={{
                borderColor: activeCategory === null ? "#E8B84B" : "rgba(243,241,234,0.18)",
                color: activeCategory === null ? "#E8B84B" : "#8FA391",
              }}
            >
              All categories
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="eyebrow text-[10px] px-3 py-1.5 rounded-full border transition-colors"
                style={{
                  borderColor: activeCategory === cat ? "#E8B84B" : "rgba(243,241,234,0.18)",
                  color: activeCategory === cat ? "#E8B84B" : "#8FA391",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Tag chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <button
              onClick={() => setActiveTag(null)}
              className="eyebrow text-[10px] px-3 py-1.5 rounded-full border transition-colors"
              style={{
                borderColor: activeTag === null ? "#3FA637" : "rgba(243,241,234,0.18)",
                color: activeTag === null ? "#3FA637" : "#8FA391",
              }}
            >
              All tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className="eyebrow text-[10px] px-3 py-1.5 rounded-full border transition-colors"
                style={{
                  borderColor: activeTag === tag ? "#3FA637" : "rgba(243,241,234,0.18)",
                  color: activeTag === tag ? "#3FA637" : "#8FA391",
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl h-72 animate-pulse" style={{ background: "rgba(243,241,234,0.05)" }} />
            ))}
          </div>
        ) : (
          <>
            {/* Featured / pinned story — full storytelling treatment */}
            {noFiltersActive && heroPost && (
              <div className="mb-16">
                <span className="eyebrow text-[10px] text-[#3FA637] block mb-4 text-center">📌 Featured story</span>
                <Link href={`/blog/${heroPost.slug}`} className="block">
                  <article
                    className="hero-card rounded-3xl overflow-hidden grid md:grid-cols-2"
                    style={{ background: "#111812", border: "1px solid rgba(232,184,75,0.35)" }}
                  >
                    <div className="relative h-64 md:h-full">
                      {heroPost.cover_image_url ? (
                        <img src={heroPost.cover_image_url} alt={heroPost.title} width={800} height={512} loading="eager" fetchPriority="high" decoding="async" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #17240F, #0F550C)" }}>
                          <span className="eyebrow text-[10px] text-[#D7E4D8]">Mateng Journal</span>
                        </div>
                      )}
                    </div>
                    <div className="p-8 md:p-10 flex flex-col justify-center">
                      {heroPost.category && (
                        <span className="eyebrow text-[10px] text-[#E8B84B] mb-3">{heroPost.category}</span>
                      )}
                      <h2
                        className="text-2xl md:text-3xl leading-tight mb-4"
                        style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "#F3F1EA" }}
                      >
                        {heroPost.title}
                      </h2>
                      {heroPost.excerpt && (
                        <p className="text-[#B9C7BA] text-sm md:text-base leading-relaxed mb-5">{heroPost.excerpt}</p>
                      )}
                      <span className="eyebrow text-[9px] text-[#8FA391] mb-5">
                        {formatDate(heroPost.published_at || heroPost.created_at)}
                        {heroPost.author_name ? ` · ${heroPost.author_name}` : ""}
                      </span>
                      {heroPost.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {heroPost.tags.map((t) => (
                            <span key={t} className="eyebrow text-[9px] px-2.5 py-1 rounded-full" style={{ background: "rgba(243,241,234,0.06)", color: "#8FA391" }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="text-sm font-semibold" style={{ color: "#3FA637" }}>
                        Read the full story →
                      </span>
                    </div>
                  </article>
                </Link>

                {secondaryPinned.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-5 mt-5">
                    {secondaryPinned.map((post) => (
                      <Link key={post.id} href={`/blog/${post.slug}`} className="block">
                        <article
                          className="blog-card rounded-2xl overflow-hidden h-full flex"
                          style={{ background: "#111812", border: "1px solid rgba(232,184,75,0.25)" }}
                        >
                          <div className="w-32 flex-shrink-0">
                            {post.cover_image_url ? (
                              <img src={post.cover_image_url} alt={post.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #17240F, #0F550C)" }} />
                            )}
                          </div>
                          <div className="p-4 flex flex-col justify-center min-w-0">
                            <span className="eyebrow text-[8px] text-[#E8B84B]">📌 {post.category || "Featured"}</span>
                            <h3 className="mt-1 text-sm font-semibold truncate" style={{ color: "#F3F1EA" }}>
                              {post.title}
                            </h3>
                            <span className="eyebrow text-[8px] text-[#8FA391] mt-1">
                              {formatDate(post.published_at || post.created_at)}
                            </span>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!noFiltersActive && <div className="mb-6" />}

            <h3 className="eyebrow text-[10px] text-[#8FA391] mb-5 text-center">
              {noFiltersActive ? "Latest stories" : `${filtered.length} ${filtered.length === 1 ? "story" : "stories"}`}
            </h3>

            {filtered.length === 0 ? (
              <div
                className="text-center py-24 rounded-2xl"
                style={{ border: "1px dashed rgba(243,241,234,0.16)", background: "rgba(243,241,234,0.03)" }}
              >
                <p className="text-[#92A395]">No stories match — try a different search or filter.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="block">
                    <article
                      className="blog-card rounded-2xl overflow-hidden h-full flex flex-col"
                      style={{ background: "#111812", border: "1px solid rgba(243,241,234,0.08)" }}
                    >
                      <div className="relative w-full h-44">
                        {post.cover_image_url ? (
                          <img src={post.cover_image_url} alt={post.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #17240F, #0F550C)" }}
                          >
                            <span className="eyebrow text-[10px] text-[#D7E4D8]">Mateng Journal</span>
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <span className="eyebrow text-[9px] text-[#8FA391]">
                          {post.category ? `${post.category} · ` : ""}
                          {formatDate(post.published_at || post.created_at)}
                          {post.author_name ? ` · ${post.author_name}` : ""}
                        </span>
                        <h2
                          className="mt-2 text-lg leading-snug"
                          style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "#F3F1EA" }}
                        >
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className="mt-2 text-sm text-[#92A395] leading-relaxed line-clamp-3">{post.excerpt}</p>
                        )}
                        <span className="mt-auto pt-4 text-sm font-semibold" style={{ color: "#3FA637" }}>
                          Read more →
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <footer className="w-full">
        <Footer />
      </footer>
    </div>
  );
}