//app/(main)/blog/[slug]/PostClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { supabase } from "@/lib/supabaseClient";
import { renderMarkdownLite } from "@/lib/markdownLite";
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
  content: string;
  cover_image_url: string | null;
  tags: string[];
  status: "draft" | "published";
  author_name: string | null;
  published_at: string | null;
  created_at: string;
}

function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

export default function PostClient({
  initialPost = null,
}: {
  /**
   * The published post, fetched on the server so the article body is present
   * in the initial HTML for crawlers. When it is null the component falls
   * back to its original client-side fetch — which is also what lets a
   * signed-in writer preview an unpublished draft, since RLS only returns
   * drafts to an authenticated session the server render does not have.
   */
  initialPost?: BlogPost | null;
}) {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(initialPost);
  // Server-rendered posts are already on screen, so skip the loading skeleton.
  const [loading, setLoading] = useState(!initialPost);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      // Only show the skeleton when there is nothing to display yet.
      if (!initialPost) setLoading(true);
      // RLS shows published posts to everyone, and drafts too if the
      // visitor is signed in as a writer — handy for previewing.
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error || !data) {
        // Never blank out a post the server already rendered.
        if (!initialPost) setNotFound(true);
      } else {
        setPost(data as BlogPost);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return (
    <div
      className={`${fraunces.variable} ${inter.variable} ${mono.variable} w-full min-h-screen flex flex-col`}
      style={{ background: "#0B1410", color: "#F3F1EA", fontFamily: "var(--font-body)", position: "relative", zIndex: 1 }}
    >
      <style jsx global>{`
        .eyebrow { font-family: var(--font-mono); letter-spacing: 0.18em; text-transform: uppercase; }
        .post-body p { margin: 0 0 18px; line-height: 1.85; color: #D2DCD3; font-size: 15.5px; }
        .post-body h1, .post-body h2, .post-body h3 {
          font-family: var(--font-display); font-weight: 600; color: #F3F1EA;
          margin: 32px 0 14px; line-height: 1.3;
        }
        .post-body h1 { font-size: 28px; }
        .post-body h2 { font-size: 23px; }
        .post-body h3 { font-size: 19px; }
        .post-body ul { margin: 0 0 18px; padding-left: 22px; color: #D2DCD3; }
        .post-body li { margin-bottom: 8px; line-height: 1.7; }
        .post-body img { max-width: 100%; border-radius: 14px; }
      `}</style>

      <div className="flex-grow px-6 pt-24 pb-16 max-w-2xl mx-auto w-full">
        <Link href="/blog" className="eyebrow text-[10px] text-[#8FA391] hover:text-[#3FA637] transition-colors">
          ← All stories
        </Link>

        {loading ? (
          <div className="mt-10 space-y-4">
            <div className="h-8 w-2/3 rounded animate-pulse" style={{ background: "rgba(243,241,234,0.06)" }} />
            <div className="h-56 w-full rounded-2xl animate-pulse" style={{ background: "rgba(243,241,234,0.06)" }} />
          </div>
        ) : notFound || !post ? (
          <div className="mt-16 text-center py-20 rounded-2xl" style={{ border: "1px dashed rgba(243,241,234,0.16)" }}>
            <p className="text-[#92A395]">This story doesn't exist or isn't published yet.</p>
            <button
              onClick={() => router.push("/blog")}
              className="mt-4 px-5 py-2 rounded-full font-semibold text-[#0B1410] text-sm"
              style={{ background: "#3FA637" }}
            >
              Back to Journal
            </button>
          </div>
        ) : (
          <article className="mt-8">
            {post.status === "draft" && (
              <div
                className="mb-6 px-4 py-2 rounded-lg eyebrow text-[10px] text-center"
                style={{ background: "rgba(232,184,75,0.12)", color: "#E8B84B", border: "1px solid rgba(232,184,75,0.3)" }}
              >
                Draft preview — only visible to writers
              </div>
            )}

            <span className="eyebrow text-[10px] text-[#8FA391]">
              {formatDate(post.published_at || post.created_at)}
              {post.author_name ? ` · ${post.author_name}` : ""}
            </span>
            <h1
              className="mt-3 text-3xl sm:text-4xl leading-tight"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              {post.title}
            </h1>

            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="eyebrow text-[9px] px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(243,241,234,0.06)", color: "#8FA391" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {post.cover_image_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={post.cover_image_url}
                alt={post.title}
                width={1200}
                height={420}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full rounded-2xl mt-8 mb-2 object-cover"
                style={{ maxHeight: 420 }}
              />
            )}

            <div
              className="post-body mt-8"
              dangerouslySetInnerHTML={{ __html: renderMarkdownLite(post.content) }}
            />
          </article>
        )}
      </div>

      <footer className="w-full mt-10">
        <Footer />
      </footer>
    </div>
  );
}