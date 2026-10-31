// app/(main)/blog/[slug]/page.tsx
// Server shell for a blog post. The post is fetched here so the full article
// body is in the initial HTML — previously it loaded in a useEffect after
// hydration, which left the page effectively empty to crawlers that do not
// execute JavaScript.
//
// The interactive client component is unchanged apart from accepting the
// fetched post as its initial state, so the rendered page looks identical.
import { supabase } from "@/lib/supabaseClient";
import PostClient from "./PostClient";

// Revalidate hourly: published posts change rarely, and this keeps the HTML
// static and fast rather than hitting the database per request.
export const revalidate = 3600;

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Published posts only. Drafts are intentionally left to the client fetch,
  // where a writer's authenticated session can still preview them.
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return <PostClient initialPost={data ?? null} />;
}
