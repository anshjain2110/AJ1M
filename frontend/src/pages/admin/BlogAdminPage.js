import React, { useEffect, useState, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Plus, Trash2, Edit2, Loader2, ArrowLeft, Upload, Star, X, Eye, EyeOff } from 'lucide-react';
import BlogEditor from '../../components/admin/BlogEditor';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const toSlug = (s) =>
  (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const EMPTY = {
  slug: '',
  title: '',
  subtitle: '',
  excerpt: '',
  hero_image_url: '',
  content_html: '',
  category: '',
  tags: [],
  author_name: 'The Local Jewel',
  meta_title: '',
  meta_description: '',
  published: false,
  featured: false,
  position: 0,
};

export default function BlogAdminPage() {
  const { api } = useAdmin();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [uploadingHero, setUploadingHero] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api('get', '/api/admin/blog');
      setPosts(res.data.posts || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append('files', file);
    const res = await api('post', '/api/uploads', fd);
    return res.data.files?.[0]?.url || '';
  };

  const handleHeroUpload = async (file) => {
    if (!file) return;
    setUploadingHero(true);
    try { const url = await uploadFile(file); if (url) setForm(f => ({ ...f, hero_image_url: url })); }
    catch (e) { setErr('Hero upload failed'); }
    finally { setUploadingHero(false); }
  };

  const startCreate = () => { setEditing(null); setForm({ ...EMPTY }); setErr(''); setView('form'); };
  const startEdit = (p) => {
    setEditing(p); setForm({ ...EMPTY, ...p, tags: p.tags || [] }); setErr(''); setView('form');
  };

  const save = async () => {
    setErr('');
    if (!form.title.trim()) { setErr('Title is required'); return; }
    if (!form.slug.trim()) { setErr('Slug is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, slug: toSlug(form.slug), position: Number(form.position) || 0 };
      if (editing) await api('put', `/api/admin/blog/${editing.post_id}`, payload);
      else await api('post', '/api/admin/blog', payload);
      await fetchPosts();
      setView('list'); setEditing(null);
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Save failed');
    } finally { setSaving(false); }
  };

  const removePost = async (p) => {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try { await api('delete', `/api/admin/blog/${p.post_id}`); await fetchPosts(); }
    catch (e) { window.alert('Delete failed'); }
  };

  if (view === 'form') {
    return (
      <div data-testid="admin-blog-form" className="max-w-4xl">
        <button onClick={() => setView('list')} data-testid="admin-blog-back"
          className="inline-flex items-center gap-1.5 text-[14px] mb-4" style={{ color: 'var(--lj-accent)' }}>
          <ArrowLeft size={16} /> Back to posts
        </button>
        <h1 className="text-[22px] font-semibold mb-1" style={{ color: 'var(--lj-text)' }}>{editing ? 'Edit post' : 'New post'}</h1>
        <p className="text-[13px] mb-6" style={{ color: 'var(--lj-muted)' }}>Rich text editor — paste, format, embed images. Drafts only go live when Published is on.</p>

        {err && <div className="mb-4 p-3 rounded-[10px] text-[13px]" style={{ background: '#FEE', color: '#A33', border: '1px solid #FCC' }}>{err}</div>}

        <Card title="Basics">
          <Field label="Title">
            <input data-testid="admin-blog-title" type="text" value={form.title}
              onChange={e => { const t = e.target.value; setForm(f => ({ ...f, title: t, slug: editing || f.slug ? f.slug : toSlug(t) })); }}
              className="input" placeholder="The 4 Cs of lab-grown diamonds — what actually matters" />
          </Field>
          <Field label="Slug (URL: /blog/your-slug)">
            <input data-testid="admin-blog-slug" type="text" value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: toSlug(e.target.value) }))}
              className="input" />
          </Field>
          <Field label="Subtitle (small caption under title)">
            <input type="text" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} className="input" />
          </Field>
          <Field label="Excerpt (shown on listing pages)">
            <textarea data-testid="admin-blog-excerpt" rows={3} value={form.excerpt}
              onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} className="input" />
          </Field>
          <Field label="Hero image">
            <div className="flex items-center gap-3">
              {form.hero_image_url ? (
                <div className="relative w-28 h-20 rounded-[10px] overflow-hidden" style={{ border: '1px solid var(--lj-border)' }}>
                  <img src={form.hero_image_url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setForm(f => ({ ...f, hero_image_url: '' }))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}><X size={12} /></button>
                </div>
              ) : (
                <label className="cursor-pointer w-28 h-20 rounded-[10px] flex items-center justify-center"
                  style={{ background: 'var(--lj-bg)', border: '1.5px dashed var(--lj-border)' }} data-testid="admin-blog-hero-upload">
                  {uploadingHero ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} style={{ color: 'var(--lj-muted)' }} />}
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleHeroUpload(e.target.files?.[0])} />
                </label>
              )}
            </div>
          </Field>
        </Card>

        <Card title="Content">
          <BlogEditor
            value={form.content_html}
            onChange={(html) => setForm(f => ({ ...f, content_html: html }))}
            onImageUpload={uploadFile}
          />
        </Card>

        <Card title="Categorization & SEO">
          <Field label="Category">
            <input data-testid="admin-blog-category" type="text" value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="input" placeholder="e.g. Diamond Guides" />
          </Field>
          <Field label="Author">
            <input type="text" value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} className="input" />
          </Field>
          <Field label="SEO meta title (defaults to title)">
            <input type="text" value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} className="input" />
          </Field>
          <Field label="SEO meta description (~155 chars)">
            <textarea rows={2} value={form.meta_description}
              onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} className="input" />
          </Field>
        </Card>

        <Card title="Publish">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="inline-flex items-center gap-2 text-[14px] cursor-pointer" style={{ color: 'var(--lj-text)' }}>
              <input data-testid="admin-blog-published" type="checkbox" checked={!!form.published}
                onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} /> Published
            </label>
            <label className="inline-flex items-center gap-2 text-[14px] cursor-pointer" style={{ color: 'var(--lj-text)' }}>
              <input data-testid="admin-blog-featured" type="checkbox" checked={!!form.featured}
                onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} /> Featured on /blog
            </label>
            <Field label="Position">
              <input type="number" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className="input w-24" />
            </Field>
          </div>
        </Card>

        <div className="sticky bottom-0 pt-4 pb-4 -mx-4 px-4 flex items-center gap-3" style={{ background: 'var(--lj-bg)' }}>
          <button onClick={save} disabled={saving} data-testid="admin-blog-save"
            className="inline-flex items-center gap-2 px-5 min-h-[44px] rounded-[10px] text-[14px] font-medium" style={{ background: 'var(--lj-accent)', color: '#fff' }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {editing ? 'Update post' : 'Create post'}
          </button>
          <button onClick={() => setView('list')} className="px-4 py-2 rounded-[10px] text-[14px]" style={{ color: 'var(--lj-muted)' }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="admin-blog-list">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-semibold" style={{ color: 'var(--lj-text)' }}>Journal (Blog)</h1>
        <button onClick={startCreate} data-testid="admin-blog-new"
          className="inline-flex items-center gap-2 px-4 min-h-[40px] rounded-[10px] text-[14px] font-medium"
          style={{ background: 'var(--lj-accent)', color: '#fff' }}>
          <Plus size={16} /> New post
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center" style={{ color: 'var(--lj-muted)' }}>
          <Loader2 size={20} className="animate-spin mr-2" /> Loading…
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)', color: 'var(--lj-muted)' }}>
          <p className="text-[15px] mb-2">No blog posts yet.</p>
          <button onClick={startCreate} className="text-[14px] underline" style={{ color: 'var(--lj-accent)' }}>
            Write your first post →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(p => (
            <div key={p.post_id} data-testid={`admin-blog-row-${p.post_id}`}
              className="flex items-center gap-4 p-3 rounded-[12px] transition-colors hover:bg-[var(--lj-surface)]"
              style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
              {p.hero_image_url && <img src={p.hero_image_url} alt="" className="w-14 h-14 rounded-[8px] object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[15px] font-medium truncate" style={{ color: 'var(--lj-text)' }}>{p.title}</h3>
                  {p.featured && <Star size={12} fill="var(--lj-accent)" style={{ color: 'var(--lj-accent)' }} />}
                </div>
                <div className="text-[12px] flex items-center gap-2" style={{ color: 'var(--lj-muted)' }}>
                  <span>/{p.slug}</span>
                  {p.category && <><span>·</span><span>{p.category}</span></>}
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    {p.published ? <><Eye size={11} /> Published</> : <><EyeOff size={11} /> Draft</>}
                  </span>
                </div>
              </div>
              <button onClick={() => startEdit(p)} className="p-2 rounded-[8px] transition-colors hover:bg-[var(--lj-bg)]" style={{ color: 'var(--lj-muted)' }} data-testid={`admin-blog-edit-${p.post_id}`}>
                <Edit2 size={15} />
              </button>
              <button onClick={() => removePost(p)} className="p-2 rounded-[8px] transition-colors hover:bg-[#FEE]" style={{ color: '#A33' }} data-testid={`admin-blog-delete-${p.post_id}`}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`.input { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--lj-border); background: var(--lj-bg); color: var(--lj-text); font-size: 14px; outline: none; font-family: inherit; }`}</style>
    </div>
  );
}

const Card = ({ title, children }) => (
  <div className="rounded-[14px] p-5 mb-5" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
    <h3 className="text-[14px] font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: 'var(--lj-muted)' }}>{title}</h3>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <label className="block mb-3">
    <span className="block text-[12px] mb-1.5" style={{ color: 'var(--lj-muted)' }}>{label}</span>
    {children}
  </label>
);
