//app/(main)/admin/(protected)/blog/editor/page.tsx
'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const CATEGORY_OPTIONS = ['Announcements', 'Events', 'Behind the Scenes', 'Community', 'Product Updates'];

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  padding: 24,
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  fontSize: 13,
  color: '#111827',
};
const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#374151',
  display: 'block',
  marginBottom: 6,
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

function renderMarkdownLite(md: string): string {
  if (!md) return '';
  const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (text: string) => {
    let t = escapeHtml(text);
    t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:12px;margin:14px 0;display:block;" />');
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#059669;text-decoration:underline;">$1</a>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return t;
  };
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let inList = false;
  const closeList = () => { if (inList) { out.push('</ul>'); inList = false; } };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { closeList(); continue; }
    if (line.startsWith('### ')) { closeList(); out.push(`<h3>${inline(line.slice(4))}</h3>`); continue; }
    if (line.startsWith('## ')) { closeList(); out.push(`<h2>${inline(line.slice(3))}</h2>`); continue; }
    if (line.startsWith('# ')) { closeList(); out.push(`<h1>${inline(line.slice(2))}</h1>`); continue; }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${inline(line.slice(2))}</li>`);
      continue;
    }
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return out.join('\n');
}

function EditorInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get('id');

  const [loadingPost, setLoadingPost] = useState(!!postId);
  const [authorized, setAuthorized] = useState(true);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [category, setCategory] = useState('');
  const [pinned, setPinned] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; kind: 'error' | 'success' } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);

  const showMessage = (text: string, kind: 'error' | 'success') => {
    setMessage({ text, kind });
    setTimeout(() => setMessage(null), 4000);
  };

  useEffect(() => {
    if (!postId) { setLoadingPost(false); return; }
    (async () => {
      const res = await fetch(`/api/admin/blog/posts/${postId}`);
      if (res.status === 403) { setAuthorized(false); setLoadingPost(false); return; }
      if (!res.ok) { showMessage('Could not load post.', 'error'); setLoadingPost(false); return; }
      const { data } = await res.json();
      setTitle(data.title);
      setSlug(data.slug);
      setSlugTouched(true);
      setExcerpt(data.excerpt || '');
      setContent(data.content || '');
      setTagsInput((data.tags || []).join(', '));
      setCategory(data.category || '');
      setPinned(!!data.pinned);
      setAuthorName(data.author_name || '');
      setCoverImageUrl(data.cover_image_url);
      setLoadingPost(false);
    })();
  }, [postId]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const insertAtCursor = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) { setContent((c) => c + snippet); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = content.slice(0, start) + snippet + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + snippet.length;
    });
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/blog/upload', { method: 'POST', body: formData });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Upload failed');
    }
    const data = await res.json();
    return data.url as string;
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const url = await uploadFile(file);
      setCoverImageUrl(url);
      showMessage('Cover image uploaded.', 'success');
    } catch (err: any) {
      showMessage(err.message || 'Upload failed.', 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleInlineUpload = async (file: File) => {
    setUploadingInline(true);
    try {
      const url = await uploadFile(file);
      insertAtCursor(`\n![](${url})\n`);
      showMessage('Image inserted.', 'success');
    } catch (err: any) {
      showMessage(err.message || 'Upload failed.', 'error');
    } finally {
      setUploadingInline(false);
    }
  };

  const save = async (status: 'draft' | 'published') => {
    if (!title.trim()) { showMessage('Give the post a title first.', 'error'); return; }
    if (!slug.trim()) { showMessage("Slug can't be empty.", 'error'); return; }
    setSaving(true);
    try {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim() || null,
        content,
        cover_image_url: coverImageUrl,
        tags,
        category: category.trim() || null,
        pinned,
        status,
        author_name: authorName.trim() || null,
      };

      if (postId) {
        const res = await fetch(`/api/admin/blog/posts/${postId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Could not save post.');
        }
      } else {
        const res = await fetch('/api/admin/blog/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Could not save post.');
        }
        const { data } = await res.json();
        router.replace(`/admin/blog/editor?id=${data.id}`);
      }
      showMessage(status === 'published' ? 'Published!' : 'Draft saved.', 'success');
    } catch (err: any) {
      showMessage(err.message || 'Could not save post.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loadingPost) {
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
            Your role doesn't include the Blog section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>
          {postId ? 'Edit post' : 'New post'}
        </h1>
        <button style={secondaryButtonStyle} onClick={() => router.push('/admin/blog')}>
          Close
        </button>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={cardStyle}>
            <label style={labelStyle}>Title</label>
            <input style={inputStyle} value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="A great headline" />

            <label style={{ ...labelStyle, marginTop: 14 }}>
              URL slug — /blog/{slug || 'your-slug'}
            </label>
            <input
              style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12 }}
              value={slug}
              onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }}
            />

            <label style={{ ...labelStyle, marginTop: 14 }}>Excerpt (shown on cards)</label>
            <textarea
              style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="One or two sentences that summarize the post"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
              <div>
                <label style={labelStyle}>Category</label>
                <input
                  list="category-options"
                  style={inputStyle}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Events"
                />
                <datalist id="category-options">
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label style={labelStyle}>Tags (comma separated)</label>
                <input style={inputStyle} value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="events, delivery" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
              <div>
                <label style={labelStyle}>Byline / author name</label>
                <input style={inputStyle} value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <label style={labelStyle}>Featured placement</label>
                <button
                  type="button"
                  onClick={() => setPinned((p) => !p)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: pinned ? '1px solid #E8B84B' : '1px solid #e5e7eb',
                    background: pinned ? '#FFFBEB' : '#fff',
                    color: pinned ? '#92400E' : '#374151',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {pinned ? '📌 Pinned to top of Journal' : 'Pin to top of Journal'}
                </button>
              </div>
            </div>

            <label style={{ ...labelStyle, marginTop: 14 }}>Cover image</label>
            {coverImageUrl && (
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <img src={coverImageUrl} alt="Cover" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10 }} />
                <button
                  type="button"
                  onClick={() => setCoverImageUrl(null)}
                  style={{
                    position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff',
                    border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCoverUpload(file);
                e.target.value = '';
              }}
            />
            <button type="button" style={secondaryButtonStyle} disabled={uploadingCover} onClick={() => coverInputRef.current?.click()}>
              {uploadingCover ? 'Uploading…' : coverImageUrl ? 'Replace cover image' : 'Upload cover image'}
            </button>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Content (markdown)</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" style={{ ...secondaryButtonStyle, padding: '4px 10px', fontSize: 11 }} onClick={() => insertAtCursor('**bold text**')}>B</button>
                <button type="button" style={{ ...secondaryButtonStyle, padding: '4px 10px', fontSize: 11 }} onClick={() => insertAtCursor('*italic text*')}>I</button>
                <button type="button" style={{ ...secondaryButtonStyle, padding: '4px 10px', fontSize: 11 }} onClick={() => insertAtCursor('[link text](https://)')}>Link</button>
                <input
                  ref={inlineInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleInlineUpload(file);
                    e.target.value = '';
                  }}
                />
                <button type="button" style={{ ...secondaryButtonStyle, padding: '4px 10px', fontSize: 11 }} disabled={uploadingInline} onClick={() => inlineInputRef.current?.click()}>
                  {uploadingInline ? '…' : 'Image'}
                </button>
              </div>
            </div>
            <textarea
              ref={textareaRef}
              style={{ ...inputStyle, minHeight: 320, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, resize: 'vertical' }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={'Write your story here...\n\nUse # for headings, **bold**, *italic*, - for bullet lists, and the Image button above.'}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button style={secondaryButtonStyle} disabled={saving} onClick={() => save('draft')}>
              {saving ? 'Saving…' : 'Save draft'}
            </button>
            <button style={buttonStyle} disabled={saving} onClick={() => save('published')}>
              {saving ? 'Saving…' : 'Publish'}
            </button>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Preview</label>
          <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#0B1410' }}>
            {coverImageUrl && <img src={coverImageUrl} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} />}
            <div style={{ padding: 20 }}>
              {category && (
                <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E8B84B', fontWeight: 700 }}>
                  {category}
                </span>
              )}
              <h2 style={{ color: '#F3F1EA', fontSize: 18, fontWeight: 700, margin: '6px 0 0' }}>{title || 'Untitled post'}</h2>
              {excerpt && <p style={{ color: '#92A395', fontSize: 13, marginTop: 8 }}>{excerpt}</p>}
              <div
                style={{ color: '#D2DCD3', fontSize: 13, lineHeight: 1.7, marginTop: 16 }}
                dangerouslySetInnerHTML={{ __html: renderMarkdownLite(content) }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlogEditorPage() {
  return (
    <Suspense fallback={null}>
      <EditorInner />
    </Suspense>
  );
}