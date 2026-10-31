// app/(main)/blog/page.tsx
// Server shell for the Journal index. Posts are fetched here so post titles,
// excerpts and links are in the initial HTML — they previously loaded after
// hydration, so crawlers saw an empty list and never followed through to the
// individual articles.
import { supabase } from "@/lib/supabaseClient";
import BlogListClient from "./BlogListClient";

export const revalidate = 3600;

export default async function BlogPage() {
  const { data } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, cover_image_url, tags, category, pinned, author_name, published_at, created_at, status"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  return <BlogListClient initialPosts={data ?? []} />;
}
