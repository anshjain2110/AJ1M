import React, { useEffect, useState, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Plus, Edit2, Trash2, X, Upload, Eye, EyeOff, Star, Sparkles } from 'lucide-react';

const slugify = (s) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const BADGES = ['', 'Best Seller', 'New', 'Sale'];
const emptyForm = () => ({
  slug: '', title: '', subtitle: '', description_html: '', price: 0, compare_at_price: '', currency: 'USD',
  hero_image_url: '', images: [], metals: '', carats: '', sizes: '', collections: [], tags: '',
  badge: '', rating: '', review_count: 0, in_stock: true, published: true, featured: false, position: 0,
  meta_title: '', meta_description: '',
});

export default function ProductsAdminPage() {
  const { api } = useAdmin();
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | product_id
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('all');

  const load = useCallback(() => {
    return Promise.all([
      api('get', '/api/admin/products'),
      api('get', '/api/admin/collections'),
      api('get', '/api/admin/projects'),
    ]).then(([p, c, pr]) => {
      setProducts(p.data.products || []);
      setCollections(c.data.collections || []);
      setProjects(pr.data.projects || []);
    });
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(emptyForm()); setEditing('new'); setErr(''); };
  const openEdit = (id) => {
    setErr('');
    return api('get', `/api/admin/products/${id}`).then((r) => {
      const p = r.data;
      setForm({
        ...emptyForm(), ...p,
        compare_at_price: p.compare_at_price ?? '',
        rating: p.rating ?? '',
        metals: (p.metals || []).join(', '), carats: (p.carats || []).join(', '),
        sizes: (p.sizes || []).join(', '), tags: (p.tags || []).join(', '),
        collections: p.collections || [],
      });
      setEditing(id);
    });
  };

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append('files', file);
    const res = await api('post', '/api/uploads', fd);
    return res.data.files && res.data.files[0];
  };

  const onHero = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const u = await uploadFile(f); if (u) setForm((s) => ({ ...s, hero_image_url: u.url }));
  };
  const onGallery = async (e) => {
    const files = Array.from(e.target.files); if (!files.length) return;
    for (const f of files) {
      const u = await uploadFile(f);
      if (u) setForm((s) => ({ ...s, images: [...s.images, { url: u.url, alt: '' }] }));
    }
  };

  const save = async () => {
    setSaving(true); setErr('');
    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.title),
        price: parseFloat(form.price) || 0,
        compare_at_price: form.compare_at_price === '' ? null : parseFloat(form.compare_at_price),
        rating: form.rating === '' ? null : parseFloat(form.rating),
        review_count: parseInt(form.review_count) || 0,
        position: parseInt(form.position) || 0,
        metals: form.metals.split(',').map((x) => x.trim()).filter(Boolean),
        carats: form.carats.split(',').map((x) => x.trim()).filter(Boolean),
        sizes: form.sizes.split(',').map((x) => x.trim()).filter(Boolean),
        tags: form.tags.split(',').map((x) => x.trim()).filter(Boolean),
        specs: form.specs || {},
      };
      if (editing === 'new') await api('post', '/api/admin/products', payload);
      else await api('put', `/api/admin/products/${editing}`, payload);
      setEditing(null); await load();
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Save failed');
    } finally { setSaving(false); }
  };

  const togglePublish = async (p) => {
    await api('put', `/api/admin/products/${p.product_id}`, {
      ...p, compare_at_price: p.compare_at_price ?? null, rating: p.rating ?? null,
    });
    await load();
  };

  const del = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await api('delete', `/api/admin/products/${id}`); await load();
  };

  const fromProject = async (e) => {
    const pid = e.target.value; if (!pid) return;
    const r = await api('post', `/api/admin/products/from-project/${pid}`);
    e.target.value = '';
    await load();
    if (r.data && r.data.product_id) openEdit(r.data.product_id);
  };

  const filtered = products.filter((p) => tab === 'all' || (tab === 'published' ? p.published : !p.published));

  const toggleCollection = (slug) => setForm((s) => ({
    ...s, collections: s.collections.includes(slug) ? s.collections.filter((x) => x !== slug) : [...s.collections, slug],
  }));

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--lj-text)' }}>Products</h1>
        <div className="flex items-center gap-2">
          <select onChange={fromProject} defaultValue="" className="text-[13px] px-3 py-2 rounded-lg" style={{ border: '1px solid var(--lj-border)' }} data-testid="from-project-select">
            <option value="">+ From a Project…</option>
            {projects.map((p) => <option key={p.project_id} value={p.project_id}>{p.title}</option>)}
          </select>
          <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-lg" style={{ background: 'var(--lj-accent)', color: '#fff' }} data-testid="new-product-btn">
            <Plus size={16} /> New product
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {['all', 'published', 'drafts'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className="px-3.5 py-1.5 text-[13px] rounded-full capitalize" style={{ background: tab === t ? 'var(--lj-accent)' : 'transparent', color: tab === t ? '#fff' : 'var(--lj-muted)', border: '1px solid var(--lj-border)' }} data-testid={`product-tab-${t}`}>{t}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div key={p.product_id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--lj-border)', background: 'var(--lj-surface)' }} data-testid={`admin-product-${p.slug}`}>
            <div className="relative" style={{ aspectRatio: '4/3', background: '#eee' }}>
              {p.hero_image_url && <img src={p.hero_image_url} alt={p.title} className="w-full h-full object-cover" />}
              {!p.published && <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] rounded" style={{ background: 'var(--lj-muted)', color: '#fff' }}>Draft</span>}
              {p.badge && <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] rounded" style={{ background: 'var(--lj-accent)', color: '#fff' }}>{p.badge}</span>}
            </div>
            <div className="p-3">
              <div className="text-[14px] font-medium truncate" style={{ color: 'var(--lj-text)' }}>{p.title}</div>
              <div className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>${p.price} {p.rating ? <span className="inline-flex items-center gap-0.5">· <Star size={11} fill="currentColor" /> {p.rating}</span> : null}</div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => openEdit(p.product_id)} className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] rounded-lg" style={{ border: '1px solid var(--lj-border)' }} data-testid={`edit-product-${p.slug}`}><Edit2 size={13} /> Edit</button>
                <button onClick={() => togglePublish(p)} className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] rounded-lg" style={{ border: '1px solid var(--lj-border)' }} data-testid={`toggle-product-${p.slug}`}>{p.published ? <EyeOff size={13} /> : <Eye size={13} />}{p.published ? 'Unpublish' : 'Publish'}</button>
                <button onClick={() => del(p.product_id)} className="ml-auto p-1.5 rounded-lg" style={{ color: 'var(--lj-danger)' }} data-testid={`delete-product-${p.slug}`}><Trash2 size={15} /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-[14px] col-span-full py-10 text-center" style={{ color: 'var(--lj-muted)' }}>No products yet. Create one or import from a Project.</p>}
      </div>

      {/* Editor slide-over */}
      {editing && (
        <div className="fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-[560px] overflow-auto p-5" style={{ background: 'var(--lj-bg)' }} data-testid="product-editor">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--lj-text)' }}>{editing === 'new' ? 'New product' : 'Edit product'}</h2>
              <button onClick={() => setEditing(null)}><X size={22} /></button>
            </div>
            {err && <p className="text-[13px] mb-3" style={{ color: 'var(--lj-danger)' }}>{err}</p>}

            <div className="space-y-3.5">
              <Field label="Title"><input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value, slug: editing === 'new' && !s.slug ? slugify(e.target.value) : s.slug }))} className="lj-inp" data-testid="product-title-input" /></Field>
              <Field label="Slug"><input value={form.slug} onChange={(e) => setForm((s) => ({ ...s, slug: slugify(e.target.value) }))} className="lj-inp" data-testid="product-slug-input" /></Field>
              <Field label="Subtitle"><input value={form.subtitle} onChange={(e) => setForm((s) => ({ ...s, subtitle: e.target.value }))} className="lj-inp" /></Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Price ($)"><input type="number" value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))} className="lj-inp" data-testid="product-price-input" /></Field>
                <Field label="Compare-at ($)"><input type="number" value={form.compare_at_price} onChange={(e) => setForm((s) => ({ ...s, compare_at_price: e.target.value }))} className="lj-inp" /></Field>
                <Field label="Position"><input type="number" value={form.position} onChange={(e) => setForm((s) => ({ ...s, position: e.target.value }))} className="lj-inp" /></Field>
              </div>

              <Field label="Hero image">
                <div className="flex items-center gap-3">
                  {form.hero_image_url && <img src={form.hero_image_url} alt="" className="w-16 h-16 object-cover rounded-lg" />}
                  <label className="flex items-center gap-1.5 px-3 py-2 text-[13px] rounded-lg cursor-pointer" style={{ border: '1px solid var(--lj-border)' }}><Upload size={14} /> Upload<input type="file" accept="image/*" hidden onChange={onHero} data-testid="product-hero-upload" /></label>
                </div>
              </Field>

              <Field label="Gallery images">
                <div className="flex flex-wrap gap-2 items-center">
                  {form.images.map((im, i) => (
                    <div key={i} className="relative w-14 h-14"><img src={im.url} alt="" className="w-full h-full object-cover rounded-lg" /><button onClick={() => setForm((s) => ({ ...s, images: s.images.filter((_, j) => j !== i) }))} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--lj-danger)', color: '#fff' }}><X size={11} /></button></div>
                  ))}
                  <label className="flex items-center gap-1.5 px-3 py-2 text-[13px] rounded-lg cursor-pointer" style={{ border: '1px solid var(--lj-border)' }}><Upload size={14} /> Add<input type="file" accept="image/*" multiple hidden onChange={onGallery} /></label>
                </div>
              </Field>

              <Field label="Metals (comma-separated)"><input value={form.metals} onChange={(e) => setForm((s) => ({ ...s, metals: e.target.value }))} className="lj-inp" placeholder="14K White Gold, Platinum" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Carats (comma-sep)"><input value={form.carats} onChange={(e) => setForm((s) => ({ ...s, carats: e.target.value }))} className="lj-inp" placeholder="1.0ct, 1.5ct" /></Field>
                <Field label="Sizes (comma-sep)"><input value={form.sizes} onChange={(e) => setForm((s) => ({ ...s, sizes: e.target.value }))} className="lj-inp" placeholder="5, 6, 7" /></Field>
              </div>

              <Field label="Collections">
                <div className="flex flex-wrap gap-2">
                  {collections.map((c) => (
                    <button key={c.slug} onClick={() => toggleCollection(c.slug)} className="px-2.5 py-1 text-[12px] rounded-full" style={{ border: '1px solid var(--lj-border)', background: form.collections.includes(c.slug) ? 'var(--lj-accent)' : 'transparent', color: form.collections.includes(c.slug) ? '#fff' : 'var(--lj-text)' }} data-testid={`product-collection-${c.slug}`}>{c.title}</button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Badge"><select value={form.badge} onChange={(e) => setForm((s) => ({ ...s, badge: e.target.value }))} className="lj-inp">{BADGES.map((b) => <option key={b} value={b}>{b || 'None'}</option>)}</select></Field>
                <Field label="Rating"><input type="number" step="0.1" value={form.rating} onChange={(e) => setForm((s) => ({ ...s, rating: e.target.value }))} className="lj-inp" /></Field>
                <Field label="# Reviews"><input type="number" value={form.review_count} onChange={(e) => setForm((s) => ({ ...s, review_count: e.target.value }))} className="lj-inp" /></Field>
              </div>

              <Field label="Description (HTML)"><textarea value={form.description_html} onChange={(e) => setForm((s) => ({ ...s, description_html: e.target.value }))} rows={3} className="lj-inp" /></Field>
              <Field label="Tags (comma-sep)"><input value={form.tags} onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))} className="lj-inp" /></Field>

              <div className="flex items-center gap-5 pt-1">
                <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={form.published} onChange={(e) => setForm((s) => ({ ...s, published: e.target.checked }))} data-testid="product-published" /> Published</label>
                <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((s) => ({ ...s, featured: e.target.checked }))} /> <Sparkles size={13} /> Featured</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 sticky bottom-0 py-3" style={{ background: 'var(--lj-bg)' }}>
              <button onClick={save} disabled={saving} className="flex-1 py-3 text-[14px] font-medium rounded-lg disabled:opacity-60" style={{ background: 'var(--lj-accent)', color: '#fff' }} data-testid="save-product-btn">{saving ? 'Saving…' : 'Save product'}</button>
              <button onClick={() => setEditing(null)} className="px-5 py-3 text-[14px] rounded-lg" style={{ border: '1px solid var(--lj-border)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.lj-inp{width:100%;padding:9px 11px;border:1px solid var(--lj-border);border-radius:9px;font-size:13.5px;background:#fff;color:var(--lj-text)}.lj-inp:focus{outline:2px solid var(--lj-accent);outline-offset:-1px}`}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[12px] font-medium mb-1" style={{ color: 'var(--lj-muted)' }}>{label}</div>
      {children}
    </div>
  );
}
