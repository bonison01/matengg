//app/(main)/admin/(protected)/blog/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  author_name: string | null;
  category: string | null;
  pinned: boolean;
  updated_at: string;
  created_at: string;
}

type DateFilter = 'all' | '7d' | '30d' | 'year';

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  padding: 24,
};
const buttonStyle: React.CSSProperties = {
  padding: '9px 16px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  background: '#111827',
  color: '#fff',
  fontWeight: 700,
  fontSize: 13,
};
const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: '#fff',
  color: '#374151',
  border: '1px solid #e5e7eb',
};
const chipStyle: React.CSSProperties = {
  fontSize: 11,
  padding: '3px 9px',
  borderRadius: 999,
  fontWeight: 600,
};
const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  fontSize: 13,
  color: '#111827',
};

function matchesDateFilter(dateStr: string, filter: DateFilter) {
  if (filter === 'all') return true;
  const date = new Date(dateStr).getTime();
  const now = Date.now();
  if (filter === '7d') return now - date <= 7 * 24 * 60 * 60 * 1000;
  if (filter === '30d') return now - date <= 30 * 24 * 60 * 60 * 1000;
  if (filter === 'year') return now - date <= 365 * 24 * 60 * 60 * 1000;
  return true;
}

export default function BlogAdminPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; kind: 'error' | 'success' } | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const showMessage = (text: string, kind: 'error' | 'success') => {
    setMessage({ text, kind });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadPosts = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/blog/posts');
    if (res.status === 403) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setPosts(data.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const toggleStatus = async (post: BlogPost) => {
    setBusyId(post.id);
    const nextStatus = post.status === 'published' ? 'draft' : 'published';
    const res = await fetch(`/api/admin/blog/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showMessage(data.message || 'Failed to update post.', 'error');
    } else {
      setPosts((rows) => rows.map((p) => (p.id === post.id ? { ...p, status: nextStatus } : p)));
      showMessage(nextStatus === 'published' ? 'Published.' : 'Moved to draft.', 'success');
    }
    setBusyId(null);
  };

  const togglePinned = async (post: BlogPost) => {
    setBusyId(post.id);
    const nextPinned = !post.pinned;
    const res = await fetch(`/api/admin/blog/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: nextPinned }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showMessage(data.message || 'Failed to update post.', 'error');
    } else {
      setPosts((rows) => rows.map((p) => (p.id === post.id ? { ...p, pinned: nextPinned } : p)));
      showMessage(nextPinned ? 'Pinned to top.' : 'Unpinned.', 'success');
    }
    setBusyId(null);
  };

  const deletePost = async (post: BlogPost) => {
    if (!confirm(`Delete "${post.title}"? This can't be undone.`)) return;
    setBusyId(post.id);
    const res = await fetch(`/api/admin/blog/posts/${post.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showMessage(data.message || 'Failed to delete post.', 'error');
    } else {
      setPosts((rows) => rows.filter((p) => p.id !== post.id));
      showMessage('Post deleted.', 'success');
    }
    setBusyId(null);
  };

  const categories = useMemo(
    () => Array.from(new Set(posts.map((p) => p.category).filter(Boolean))) as string[],
    [posts]
  );

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts
      .filter((p) => (q ? p.title.toLowerCase().includes(q) || (p.author_name || '').toLowerCase().includes(q) : true))
      .filter((p) => (categoryFilter === 'all' ? true : p.category === categoryFilter))
      .filter((p) => matchesDateFilter(p.updated_at, dateFilter))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }, [posts, search, categoryFilter, dateFilter]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p style={{ color: '#6b7280', fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div style={cardStyle}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Not authorized</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
            Your role doesn't include the Blog section. Ask an admin to grant it in Staff &amp; Roles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Blog</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Write and publish posts for the Mateng Journal.</p>
        </div>
        <button style={buttonStyle} onClick={() => router.push('/admin/blog/editor')}>
          + New post
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <input
          style={{ ...inputStyle, flex: '1 1 220px' }}
          placeholder="Search by title or author…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={inputStyle} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select style={inputStyle} value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)}>
          <option value="all">All time</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="year">This year</option>
        </select>
      </div>

      {message && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 13,
            background: message.kind === 'error' ? '#fee2e2' : '#ecfdf5',
            color: message.kind === 'error' ? '#991b1b' : '#065f46',
          }}
        >
          {message.text}
        </div>
      )}

      {filteredPosts.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
          {posts.length === 0 ? 'No posts yet — click "New post" to write your first one.' : 'No posts match your filters.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              style={{
                ...cardStyle,
                padding: '14px 18px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                borderColor: post.pinned ? '#E8B84B' : '#e5e7eb',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {post.pinned && <span title="Pinned">📌</span>}
                  <span
                    style={{
                      ...chipStyle,
                      background: post.status === 'published' ? '#ecfdf5' : '#fffbeb',
                      color: post.status === 'published' ? '#065f46' : '#92400e',
                    }}
                  >
                    {post.status}
                  </span>
                  {post.category && (
                    <span style={{ ...chipStyle, background: '#eef2ff', color: '#3730a3' }}>{post.category}</span>
                  )}
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: '#111827', margin: 0 }}>{post.title}</p>
                </div>
                <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>
                  Updated {new Date(post.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {post.author_name ? ` · ${post.author_name}` : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                {post.status === 'published' && (
                  <Link href={`/blog/${post.slug}`} target="_blank">
                    <button style={secondaryButtonStyle}>View</button>
                  </Link>
                )}
                <button style={secondaryButtonStyle} disabled={busyId === post.id} onClick={() => togglePinned(post)}>
                  {post.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button style={secondaryButtonStyle} disabled={busyId === post.id} onClick={() => toggleStatus(post)}>
                  {post.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button style={secondaryButtonStyle} onClick={() => router.push(`/admin/blog/editor?id=${post.id}`)}>
                  Edit
                </button>
                <button
                  style={{ ...secondaryButtonStyle, color: '#991b1b' }}
                  disabled={busyId === post.id}
                  onClick={() => deletePost(post)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}