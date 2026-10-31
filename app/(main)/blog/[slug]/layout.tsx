// app/(main)/blog/[slug]/layout.tsx — per-post SEO metadata + Article schema
// The post page itself is a client component, so the post is fetched again
// here on the server purely to build the title, description, Open Graph card
// and BlogPosting structured data. Adds no visible markup.
import type { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import { buildMetadata, SITE_NAME } from "@/lib/seo/site";
import { JsonLd, graph, articleSchema, breadcrumbSchema } from "@/lib/seo/jsonLd";

type Props = { params: Promise<{ slug: string }> };

async function getPost(slug: string) {
  const { data } = await supabase
    .from("blog_posts")
    .select("title, excerpt, cover_image_url, published_at, created_at, author_name, status")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
}

/** Trims body/excerpt text down to a clean meta-description length. */
function clamp(text: string, max = 155) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).replace(/[\s,.;:—-]+$/, "")}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    // Unpublished or missing posts must not be indexed.
    return buildMetadata({
      title: "Post not found",
      description: "This article is no longer available.",
      path: `/blog/${slug}`,
      index: false,
    });
  }

  return buildMetadata({
    title: post.title,
    description: clamp(post.excerpt || `${post.title} — from the ${SITE_NAME} Journal.`),
    path: `/blog/${slug}`,
    image: post.cover_image_url || undefined,
    type: "article",
    publishedTime: post.published_at ?? post.created_at ?? undefined,
  });
}

export default async function BlogPostLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  return (
    <>
      {post && (
        <JsonLd
          data={graph(
            articleSchema({
              title: post.title,
              description: clamp(post.excerpt || post.title),
              path: `/blog/${slug}`,
              image: post.cover_image_url,
              publishedTime: post.published_at ?? post.created_at,
              modifiedTime: post.published_at ?? post.created_at,
              authorName: post.author_name,
            }),
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Journal", path: "/blog" },
              { name: post.title, path: `/blog/${slug}` },
            ])
          )}
        />
      )}
      {children}
    </>
  );
}
