import React, { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Plus, Trash2, Edit2, Loader2, Image, ArrowLeft, Upload, Star, X, Film, ArrowUp, ArrowDown, Eye, Maximize2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Auto-generate URL-safe slug from a title
const toSlug = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const TAG_PRESETS = [
  'engagement_ring', 'wedding_band', 'tennis_bracelet', 'necklace', 'earrings',
  'oval', 'radiant', 'emerald', 'cushion', 'princess', 'pear', 'round', 'asscher', 'marquise', 'heart',
  'hidden_halo', 'solitaire', 'side_stones', 'three_stone', 'pave',
  'lab_grown', 'natural',
  'igi_certified', 'gia_certified',
  'white_gold', 'yellow_gold', 'rose_gold', 'platinum',
  '1ct', '2ct', '3ct', '4ct', '5ct',
];

const EMPTY = {
  slug: '',
  title: '',
  subtitle: '',
  hero_image_url: '',
  gallery: [],
  specs: { carat: '', shape: '', setting_style: '', metal: '', color: '', clarity: '', certification: '', cert_number: '', cert_link: '' },
  journey: [],
  customer_story: { name: '', location: '', quote: '', date: '' },
  tags: [],
  description: '',
  meta_title: '',
  meta_description: '',
  seo_phrases: [],
  published: true,
  featured: false,
  position: 0,
  // Pricing
  price: '',
  price_prefix: 'Starting at',
  price_currency: 'USD',
};

export default function ProjectsAdminPage() {
  const { api } = useAdmin();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [uploadingField, setUploadingField] = useState('');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api('get', '/api/admin/projects');
      setProjects(res.data.projects || []);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  }, [api]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // ── File upload to R2 via /api/uploads ─────────────────
  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append('files', file);
    const res = await api('post', '/api/uploads', fd);
    const item = res.data.files?.[0];
    if (!item) return null;
    return {
      url: item.url,
      media_type: item.media_type || ((file.type || '').startsWith('video/') ? 'video' : 'image'),
    };
  };

  const handleHeroUpload = async (file) => {
    if (!file) return;
    setUploadingField('hero');
    try { const u = await uploadFile(file); if (u) setForm(f => ({ ...f, hero_image_url: u.url })); }
    catch (e) { setErr('Hero upload failed'); }
    finally { setUploadingField(''); }
  };

  const handleGalleryAdd = async (file, type = 'final') => {
    if (!file) return;
    setUploadingField('gallery');
    try {
      const u = await uploadFile(file);
      if (u) setForm(f => ({ ...f, gallery: [...f.gallery, { url: u.url, caption: '', type, media_type: u.media_type }] }));
    } catch (e) { setErr('Gallery upload failed'); }
    finally { setUploadingField(''); }
  };

  // Append one media item to a journey step's media[] array (multi-media)
  const handleJourneyMediaAdd = async (idx, file) => {
    if (!file) return;
    setUploadingField(`journey-${idx}`);
    try {
      const u = await uploadFile(file);
      if (!u) return;
      setForm(f => {
        const journey = [...f.journey];
        const existing = journey[idx].media || (journey[idx].image_url ? [{ url: journey[idx].image_url, media_type: 'image', caption: '' }] : []);
        journey[idx] = { ...journey[idx], media: [...existing, { url: u.url, media_type: u.media_type, caption: '' }], image_url: '' };
        return { ...f, journey };
      });
    } catch (e) { setErr('Journey media upload failed'); }
    finally { setUploadingField(''); }
  };

  const removeJourneyMedia = (stepIdx, mediaIdx) => {
    setForm(f => {
      const journey = [...f.journey];
      const media = [...(journey[stepIdx].media || [])];
      media.splice(mediaIdx, 1);
      journey[stepIdx] = { ...journey[stepIdx], media };
      return { ...f, journey };
    });
  };

  // ── Form handlers ──────────────────────────────────────
  const updateField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updateSpec = (k, v) => setForm(f => ({ ...f, specs: { ...f.specs, [k]: v } }));
  const updateStory = (k, v) => setForm(f => ({ ...f, customer_story: { ...f.customer_story, [k]: v } }));

  // ── Reorder helpers ────────────────────────────────────
  const moveItem = (arr, fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= arr.length) return arr;
    const next = [...arr];
    const [m] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, m);
    return next;
  };
  const reorderGallery = (fromIdx, toIdx) =>
    setForm(f => ({ ...f, gallery: moveItem(f.gallery, fromIdx, toIdx) }));
  const reorderJourneyMedia = (stepIdx, fromIdx, toIdx) =>
    setForm(f => {
      const journey = [...f.journey];
      const media = moveItem(journey[stepIdx].media || [], fromIdx, toIdx);
      journey[stepIdx] = { ...journey[stepIdx], media };
      return { ...f, journey };
    });
  const reorderJourneySteps = (fromIdx, toIdx) =>
    setForm(f => ({ ...f, journey: moveItem(f.journey, fromIdx, toIdx) }));

  // ── Media preview lightbox ─────────────────────────────
  const [preview, setPreview] = useState(null);  // { url, media_type, caption } | null
  const openPreview = (m) => setPreview(m);
  const closePreview = () => setPreview(null);

  const startCreate = () => { setEditing(null); setForm({ ...EMPTY, gallery: [], journey: [], tags: [] }); setErr(''); setView('form'); };
  const startEdit = (p) => {
    setEditing(p);
    setForm({
      ...EMPTY,
      ...p,
      specs: { ...EMPTY.specs, ...(p.specs || {}) },
      customer_story: { ...EMPTY.customer_story, ...(p.customer_story || {}) },
      gallery: p.gallery || [],
      journey: p.journey || [],
      tags: p.tags || [],
    });
    setErr('');
    setView('form');
  };

  const handleSave = async () => {
    setErr('');
    if (!form.title.trim()) { setErr('Title is required'); return; }
    if (!form.slug.trim()) { setErr('Slug is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: toSlug(form.slug),
        position: Number(form.position) || 0,
        price: form.price === '' || form.price === null ? null : Number(form.price),
      };
      if (editing) {
        await api('put', `/api/admin/projects/${editing.project_id}`, payload);
      } else {
        await api('post', '/api/admin/projects', payload);
      }
      await fetchProjects();
      setView('list');
      setEditing(null);
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      await api('delete', `/api/admin/projects/${p.project_id}`);
      await fetchProjects();
    } catch (e) {
      window.alert('Delete failed');
    }
  };

  // ─── RENDER ─────────────────────────────────────────────

  if (view === 'form') {
    return (
      <div data-testid="admin-projects-form" className="max-w-4xl">
        {/* Media preview lightbox */}
        {preview && <MediaPreview media={preview} onClose={closePreview} />}
        <button onClick={() => setView('list')} className="inline-flex items-center gap-1.5 text-[14px] mb-4" style={{ color: 'var(--lj-accent)' }} data-testid="admin-projects-back">
          <ArrowLeft size={16} /> Back to projects
        </button>
        <h1 className="text-[22px] font-semibold mb-1" style={{ color: 'var(--lj-text)' }}>{editing ? 'Edit project' : 'New project'}</h1>
        <p className="text-[13px] mb-6" style={{ color: 'var(--lj-muted)' }}>All fields support rich content. Images upload to Cloudflare R2.</p>

        {err && <div className="mb-4 p-3 rounded-[10px] text-[13px]" style={{ background: '#FEE', color: '#A33', border: '1px solid #FCC' }}>{err}</div>}

        {/* Basic info */}
        <Card title="Basics">
          <Field label="Title">
            <input
              data-testid="admin-projects-title"
              type="text" value={form.title}
              onChange={e => {
                const t = e.target.value;
                updateField('title', t);
                if (!editing && !form.slug) updateField('slug', toSlug(t));
              }}
              className="input" placeholder="e.g. 4.41 Carat Radiant Hidden Halo Engagement Ring"
            />
          </Field>
          <Field label="Slug (URL path: /projects/your-slug)">
            <input
              data-testid="admin-projects-slug"
              type="text" value={form.slug}
              onChange={e => updateField('slug', toSlug(e.target.value))}
              className="input" placeholder="4-41-carat-radiant-hidden-halo-engagement-ring"
            />
          </Field>
          <Field label="Subtitle (small caption under title)">
            <input type="text" value={form.subtitle} onChange={e => updateField('subtitle', e.target.value)} className="input" />
          </Field>
          <Field label="Hero image">
            <div className="flex items-center gap-3">
              {form.hero_image_url ? (
                <div className="relative w-24 h-24 rounded-[10px] overflow-hidden group" style={{ border: '1px solid var(--lj-border)' }} data-testid="admin-hero-thumb">
                  <img src={form.hero_image_url} alt="hero" className="w-full h-full object-cover" />
                  <div className="absolute top-0.5 right-0.5 flex gap-0.5">
                    <button onClick={() => openPreview({ url: form.hero_image_url, media_type: 'image' })} title="Preview"
                      data-testid="admin-hero-preview"
                      className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                      <Eye size={11} />
                    </button>
                    <button onClick={() => updateField('hero_image_url', '')} className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}><X size={12} /></button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer w-24 h-24 rounded-[10px] flex items-center justify-center" style={{ background: 'var(--lj-bg)', border: '1.5px dashed var(--lj-border)' }} data-testid="admin-projects-hero-upload">
                  {uploadingField === 'hero' ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} style={{ color: 'var(--lj-muted)' }} />}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleHeroUpload(e.target.files?.[0])} />
                </label>
              )}
              <div className="text-[12px]" style={{ color: 'var(--lj-muted)' }}>
                The main image shown on the project card and detail page.
              </div>
            </div>
          </Field>
          <Field label="Story / description">
            <textarea value={form.description} onChange={e => updateField('description', e.target.value)} className="input" rows={4} placeholder="Tell the story behind this piece — brief, customer ask, choices, the result." />
          </Field>
          {/* Pricing */}
          <div className="grid grid-cols-3 gap-3 mt-1">
            <Field label="Price (USD)">
              <input data-testid="admin-projects-price" type="number" min="0" step="50"
                value={form.price === null || form.price === undefined ? '' : form.price}
                onChange={e => updateField('price', e.target.value)}
                className="input" placeholder="e.g. 2850" />
            </Field>
            <Field label="Price prefix">
              <select data-testid="admin-projects-price-prefix" value={form.price_prefix || ''}
                onChange={e => updateField('price_prefix', e.target.value)}
                className="input">
                <option value="Starting at">Starting at</option>
                <option value="From">From</option>
                <option value="">No prefix</option>
              </select>
            </Field>
            <Field label="Currency">
              <select value={form.price_currency || 'USD'}
                onChange={e => updateField('price_currency', e.target.value)} className="input">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </Field>
          </div>
          <p className="text-[11.5px] mt-1" style={{ color: 'var(--lj-muted)' }}>
            Leave price blank to hide the price tag entirely.
          </p>
        </Card>

        {/* Specs */}
        <Card title="Specifications">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { k: 'carat', l: 'Carat', ph: 'e.g. 4.41 ct' },
              { k: 'shape', l: 'Shape', ph: 'Oval / Radiant / Emerald…' },
              { k: 'setting_style', l: 'Setting style', ph: 'Hidden Halo / Solitaire…' },
              { k: 'metal', l: 'Metal', ph: '14K White Gold / Platinum…' },
              { k: 'color', l: 'Color', ph: 'D / E / F…' },
              { k: 'clarity', l: 'Clarity', ph: 'VVS1 / VS1 / VS2…' },
              { k: 'certification', l: 'Certification body', ph: 'IGI / GIA' },
              { k: 'cert_number', l: 'Certificate number', ph: 'LG687583822' },
              { k: 'cert_link', l: 'Certificate link (URL)', ph: 'https://… or /file.pdf' },
            ].map(f => (
              <Field key={f.k} label={f.l}>
                <input type="text" value={form.specs[f.k] || ''} onChange={e => updateSpec(f.k, e.target.value)} className="input" placeholder={f.ph} />
              </Field>
            ))}
          </div>
        </Card>

        {/* Gallery */}
        <Card title={`Gallery (${form.gallery.length})`}>
          <p className="text-[12px] mb-3" style={{ color: 'var(--lj-muted)' }}>
            Add multiple images <strong>or videos</strong>. Mark each as <strong>render</strong> or <strong>final</strong> so the page can tag the 3D-render thumbnails.
          </p>
          <div className="flex gap-2 mb-4 flex-wrap">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] font-medium cursor-pointer" style={{ background: 'var(--lj-accent)', color: '#fff' }} data-testid="admin-projects-gallery-add-final">
              {uploadingField === 'gallery' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add final photo / video
              <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleGalleryAdd(e.target.files?.[0], 'final')} />
            </label>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] font-medium cursor-pointer" style={{ background: 'var(--lj-bg)', color: 'var(--lj-accent)', border: '1px solid var(--lj-border)' }} data-testid="admin-projects-gallery-add-render">
              {uploadingField === 'gallery' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add 3D render / animation
              <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleGalleryAdd(e.target.files?.[0], 'render')} />
            </label>
          </div>
          {form.gallery.length === 0 ? (
            <div className="py-6 text-center text-[13px]" style={{ color: 'var(--lj-muted)' }}>No media yet</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {form.gallery.map((g, i) => (
                <div key={i} className="relative rounded-[10px] overflow-hidden group" style={{ border: '1px solid var(--lj-border)' }} data-testid={`admin-gallery-item-${i}`}>
                  <div className="aspect-square" style={{ background: 'var(--lj-bg)' }}>
                    {g.media_type === 'video' ? (
                      <video src={g.url} muted playsInline className="w-full h-full object-cover" preload="metadata" />
                    ) : (
                      <img src={g.url} alt={g.caption || `Image ${i + 1}`} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <span className="absolute top-1.5 left-1.5 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: g.type === 'render' ? 'rgba(15,94,76,0.85)' : 'rgba(0,0,0,0.55)', color: '#fff' }}>{g.type}</span>
                  {g.media_type === 'video' && (
                    <span className="absolute bottom-9 left-1.5 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
                      <Film size={8} /> Video
                    </span>
                  )}
                  {/* Top-right cluster: preview + delete */}
                  <div className="absolute top-1 right-1 flex gap-1">
                    <button
                      onClick={() => openPreview(g)}
                      title="Preview"
                      data-testid={`admin-gallery-preview-${i}`}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                      style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                      <Eye size={12} />
                    </button>
                    <button
                      onClick={() => setForm(f => ({ ...f, gallery: f.gallery.filter((_, idx) => idx !== i) }))}
                      title="Delete"
                      data-testid={`admin-gallery-delete-${i}`}
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                      <X size={12} />
                    </button>
                  </div>
                  {/* Reorder cluster (bottom-left of image) */}
                  <div className="absolute bottom-9 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => reorderGallery(i, i - 1)} disabled={i === 0}
                      title="Move left"
                      data-testid={`admin-gallery-move-up-${i}`}
                      className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30"
                      style={{ background: 'rgba(0,0,0,0.65)', color: '#fff' }}>
                      <ArrowUp size={11} />
                    </button>
                    <button
                      onClick={() => reorderGallery(i, i + 1)} disabled={i === form.gallery.length - 1}
                      title="Move right"
                      data-testid={`admin-gallery-move-down-${i}`}
                      className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30"
                      style={{ background: 'rgba(0,0,0,0.65)', color: '#fff' }}>
                      <ArrowDown size={11} />
                    </button>
                  </div>
                  <input type="text" placeholder="Caption (optional)" value={g.caption || ''}
                    onChange={e => setForm(f => { const gg = [...f.gallery]; gg[i] = { ...gg[i], caption: e.target.value }; return { ...f, gallery: gg }; })}
                    className="w-full text-[11px] px-2 py-1.5" style={{ background: 'var(--lj-surface)', borderTop: '1px solid var(--lj-border)' }} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Journey */}
        <Card title={`The Journey (${form.journey.length} steps)`}>
          <p className="text-[12px] mb-3" style={{ color: 'var(--lj-muted)' }}>
            Build the timeline shown on the project page (Brief → 3D render → Stone selection → Setting → Final). Each step supports <strong>multiple images and videos</strong>.
          </p>
          {form.journey.map((step, i) => {
            // Back-compat: if step still uses image_url, surface it as the first media item
            const stepMedia = (step.media && step.media.length > 0)
              ? step.media
              : (step.image_url ? [{ url: step.image_url, media_type: 'image', caption: '' }] : []);
            return (
            <div key={i} className="p-4 rounded-[12px] mb-3" style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--lj-accent)' }}>Step {i + 1}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => reorderJourneySteps(i, i - 1)} disabled={i === 0}
                    title="Move step up"
                    data-testid={`admin-journey-step-up-${i}`}
                    className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30"
                    style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)', color: 'var(--lj-text)' }}>
                    <ArrowUp size={11} />
                  </button>
                  <button onClick={() => reorderJourneySteps(i, i + 1)} disabled={i === form.journey.length - 1}
                    title="Move step down"
                    data-testid={`admin-journey-step-down-${i}`}
                    className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30"
                    style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)', color: 'var(--lj-text)' }}>
                    <ArrowDown size={11} />
                  </button>
                  <button onClick={() => setForm(f => ({ ...f, journey: f.journey.filter((_, idx) => idx !== i) }))} className="text-[12px] ml-1" style={{ color: '#C44' }}>Remove</button>
                </div>
              </div>
              <input type="text" placeholder="Step label (e.g. 3D Render)" value={step.label}
                onChange={e => setForm(f => { const j = [...f.journey]; j[i] = { ...j[i], label: e.target.value }; return { ...f, journey: j }; })}
                className="input mb-2" />
              <textarea placeholder="Description (what happened in this step)" value={step.description || ''}
                onChange={e => setForm(f => { const j = [...f.journey]; j[i] = { ...j[i], description: e.target.value }; return { ...f, journey: j }; })}
                className="input" rows={2} />

              {/* Media grid */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11.5px] font-medium" style={{ color: 'var(--lj-text)' }}>Media ({stepMedia.length})</span>
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[11.5px] font-medium cursor-pointer" data-testid={`admin-projects-journey-${i}-add-media`}
                    style={{ background: 'var(--lj-accent)', color: '#fff' }}>
                    {uploadingField === `journey-${i}` ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    Add image or video
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleJourneyMediaAdd(i, e.target.files?.[0])} />
                  </label>
                </div>
                {stepMedia.length === 0 ? (
                  <div className="text-[11px] py-3 text-center" style={{ color: 'var(--lj-muted)' }}>No media yet — add images or videos for this step</div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {stepMedia.map((m, mi) => (
                      <div key={mi} className="relative rounded-[8px] overflow-hidden aspect-square group" style={{ border: '1px solid var(--lj-border)' }} data-testid={`admin-journey-${i}-media-${mi}`}>
                        {m.media_type === 'video' ? (
                          <video src={m.url} muted playsInline className="w-full h-full object-cover" preload="metadata" />
                        ) : (
                          <img src={m.url} alt={step.label} className="w-full h-full object-cover" />
                        )}
                        {m.media_type === 'video' && (
                          <span className="absolute bottom-1 left-1 text-[8.5px] uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-0.5" style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
                            <Film size={8} /> Video
                          </span>
                        )}
                        {/* Preview + delete (top-right) */}
                        <div className="absolute top-0.5 right-0.5 flex gap-0.5">
                          <button onClick={() => openPreview(m)} title="Preview"
                            data-testid={`admin-journey-${i}-media-${mi}-preview`}
                            className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                            <Eye size={10} />
                          </button>
                          <button onClick={() => removeJourneyMedia(i, mi)} title="Delete"
                            data-testid={`admin-journey-${i}-media-${mi}-delete`}
                            className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                            <X size={11} />
                          </button>
                        </div>
                        {/* Reorder (bottom-right, on hover) */}
                        <div className="absolute bottom-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => reorderJourneyMedia(i, mi, mi - 1)} disabled={mi === 0}
                            title="Move left"
                            data-testid={`admin-journey-${i}-media-${mi}-up`}
                            className="w-5 h-5 rounded flex items-center justify-center disabled:opacity-30" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                            <ArrowUp size={10} />
                          </button>
                          <button onClick={() => reorderJourneyMedia(i, mi, mi + 1)} disabled={mi === stepMedia.length - 1}
                            title="Move right"
                            data-testid={`admin-journey-${i}-media-${mi}-down`}
                            className="w-5 h-5 rounded flex items-center justify-center disabled:opacity-30" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                            <ArrowDown size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            );
          })}
          <button
            onClick={() => setForm(f => ({ ...f, journey: [...f.journey, { label: '', description: '', media: [], image_url: '' }] }))}
            data-testid="admin-projects-add-step"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-medium"
            style={{ background: 'var(--lj-bg)', color: 'var(--lj-accent)', border: '1px solid var(--lj-border)' }}>
            <Plus size={14} /> Add step
          </button>
        </Card>

        {/* Customer story */}
        <Card title="Customer story (testimonial)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Name"><input type="text" value={form.customer_story.name || ''} onChange={e => updateStory('name', e.target.value)} className="input" /></Field>
            <Field label="Location"><input type="text" value={form.customer_story.location || ''} onChange={e => updateStory('location', e.target.value)} className="input" placeholder="Orlando, FL" /></Field>
            <Field label="Date"><input type="text" value={form.customer_story.date || ''} onChange={e => updateStory('date', e.target.value)} className="input" placeholder="Jun 20, 2025" /></Field>
          </div>
          <Field label="Quote">
            <textarea value={form.customer_story.quote || ''} onChange={e => updateStory('quote', e.target.value)} className="input" rows={3} />
          </Field>
        </Card>

        {/* Tags */}
        <Card title="Tags (SEO categorization)">
          <p className="text-[12px] mb-3" style={{ color: 'var(--lj-muted)' }}>
            Pick all that apply. These power the projects index filter and (later) the SEO category pages.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TAG_PRESETS.map(t => {
              const on = form.tags.includes(t);
              return (
                <button key={t}
                  onClick={() => setForm(f => ({ ...f, tags: on ? f.tags.filter(x => x !== t) : [...f.tags, t] }))}
                  className="text-[12px] px-2.5 py-1 rounded-full transition-colors"
                  style={{
                    background: on ? 'var(--lj-accent)' : 'var(--lj-bg)',
                    color: on ? '#fff' : 'var(--lj-text)',
                    border: '1px solid ' + (on ? 'var(--lj-accent)' : 'var(--lj-border)'),
                  }}>
                  {t}
                </button>
              );
            })}
          </div>
        </Card>

        {/* SEO */}
        <Card title="SEO">
          <Field label="Meta title (page <title>)"><input type="text" value={form.meta_title} onChange={e => updateField('meta_title', e.target.value)} className="input" /></Field>
          <Field label="Meta description"><textarea value={form.meta_description} onChange={e => updateField('meta_description', e.target.value)} className="input" rows={3} /></Field>

          {/* Buyer-intent phrases */}
          <Field label="Buyer-intent phrases (shown on the project page as 'People also search for')">
            <p className="text-[11.5px] mb-2" style={{ color: 'var(--lj-muted)' }}>
              Add phrases real buyers Google before they land. e.g. <em>"2 carat oval lab grown engagement ring under $3000"</em>. These render as clickable chips at the bottom of the project page and feed Google indexing.
            </p>
            <PhraseEditor
              value={form.seo_phrases || []}
              onChange={(next) => updateField('seo_phrases', next)}
            />
          </Field>
        </Card>

        {/* Publish */}
        <Card title="Publishing">
          <div className="flex flex-wrap items-center gap-5">
            <label className="inline-flex items-center gap-2 text-[14px]" style={{ color: 'var(--lj-text)' }}>
              <input type="checkbox" checked={form.published} onChange={e => updateField('published', e.target.checked)} /> Published
            </label>
            <label className="inline-flex items-center gap-2 text-[14px]" style={{ color: 'var(--lj-text)' }}>
              <input type="checkbox" checked={form.featured} onChange={e => updateField('featured', e.target.checked)} /> Featured
            </label>
            <Field label="Position (sort order, smaller = first)">
              <input type="number" value={form.position} onChange={e => updateField('position', e.target.value)} className="input" style={{ maxWidth: 120 }} />
            </Field>
          </div>
        </Card>

        {/* Actions */}
        <div className="sticky bottom-0 mt-6 -mx-4 lg:-mx-6 px-4 lg:px-6 py-4 flex items-center justify-between gap-3"
          style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(10px)', borderTop: '1px solid var(--lj-border)' }}>
          <button onClick={() => setView('list')} className="px-4 py-2.5 rounded-[10px] text-[14px] font-medium" style={{ color: 'var(--lj-muted)' }}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            data-testid="admin-projects-save"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[14px] font-medium"
            style={{ background: 'var(--lj-accent)', color: '#fff', opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {editing ? 'Save changes' : 'Create project'}
          </button>
        </div>

        <style>{`
          .input {
            width: 100%;
            padding: 8px 10px;
            border-radius: 8px;
            border: 1px solid var(--lj-border);
            background: var(--lj-surface, #fff);
            font-size: 14px;
            color: var(--lj-text);
            outline: none;
          }
          .input:focus { border-color: var(--lj-accent); box-shadow: 0 0 0 2px rgba(15,94,76,0.1); }
        `}</style>
      </div>
    );
  }

  // ── LIST view ───────────────────────────────────────────
  return (
    <div data-testid="admin-projects-list">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold" style={{ color: 'var(--lj-text)' }}>Projects</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--lj-muted)' }}>Past custom work showcase — powers <code>/projects</code> and <code>/projects/&#123;slug&#125;</code></p>
        </div>
        <button
          onClick={startCreate}
          data-testid="admin-projects-new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[14px] font-medium"
          style={{ background: 'var(--lj-accent)', color: '#fff' }}>
          <Plus size={16} /> New project
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center" style={{ color: 'var(--lj-muted)' }}>
          <Loader2 size={20} className="animate-spin mr-2" /> Loading…
        </div>
      ) : projects.length === 0 ? (
        <div className="py-12 text-center rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
          <Image size={36} style={{ color: 'var(--lj-muted)', opacity: 0.5 }} className="mx-auto mb-3" />
          <p className="text-[14px] mb-3" style={{ color: 'var(--lj-text)' }}>No projects yet</p>
          <button onClick={startCreate} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-medium" style={{ background: 'var(--lj-accent)', color: '#fff' }}>
            <Plus size={14} /> Create your first project
          </button>
        </div>
      ) : (
        <div className="rounded-[14px] overflow-hidden" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
          {projects.map((p, i) => (
            <div key={p.project_id} className="flex items-center gap-4 p-4" style={{ borderTop: i === 0 ? 'none' : '1px solid var(--lj-border)' }}>
              <div className="w-16 h-16 rounded-[10px] overflow-hidden flex-shrink-0" style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)' }}>
                {p.hero_image_url ? <img src={p.hero_image_url} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Image size={18} style={{ color: 'var(--lj-muted)', opacity: 0.5 }} /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[14px] font-semibold truncate" style={{ color: 'var(--lj-text)' }}>{p.title}</span>
                  {p.featured && <Star size={13} fill="var(--lj-accent)" style={{ color: 'var(--lj-accent)' }} />}
                  {!p.published && <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ background: '#FEE', color: '#A33' }}>Draft</span>}
                </div>
                <div className="text-[12px] truncate" style={{ color: 'var(--lj-muted)' }}>/projects/{p.slug}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(p.tags || []).slice(0, 4).map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--lj-bg)', color: 'var(--lj-muted)' }}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href={`/projects/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-[12px] px-2.5 py-1 rounded-[8px]" style={{ color: 'var(--lj-accent)', border: '1px solid var(--lj-border)' }}>View</a>
                <button onClick={() => startEdit(p)} data-testid={`admin-projects-edit-${p.slug}`} className="p-2 rounded-[8px] hover:bg-[#EDEDEB]" style={{ color: 'var(--lj-accent)' }}><Edit2 size={15} /></button>
                <button onClick={() => handleDelete(p)} className="p-2 rounded-[8px] hover:bg-[#EDEDEB]" style={{ color: '#C44' }}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ─────────────────────────────────────────
const Card = ({ title, children }) => (
  <div className="mb-5 rounded-[14px] p-5" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
    <h2 className="text-[15px] font-semibold mb-3" style={{ color: 'var(--lj-text)' }}>{title}</h2>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div className="mb-3">
    <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--lj-muted)' }}>{label}</label>
    {children}
  </div>
);

const PhraseEditor = ({ value, onChange }) => {
  const [draft, setDraft] = React.useState('');
  const phrases = Array.isArray(value) ? value : [];

  // Split a freeform input on commas / newlines / pipes, trim, dedupe vs existing
  const splitPhrases = (raw) => raw
    .split(/[,\n|]+/)
    .map(s => s.trim())
    .filter(Boolean);

  const add = () => {
    const incoming = splitPhrases(draft);
    if (incoming.length === 0) return;
    const next = [...phrases];
    let added = 0;
    incoming.forEach(p => { if (!next.includes(p)) { next.push(p); added++; } });
    onChange(next);
    setDraft('');
  };

  const handlePaste = (e) => {
    const txt = (e.clipboardData || window.clipboardData).getData('text');
    if (!txt) return;
    if (/[,\n|]/.test(txt)) {
      e.preventDefault();
      const incoming = splitPhrases(txt);
      const next = [...phrases];
      incoming.forEach(p => { if (!next.includes(p)) next.push(p); });
      onChange(next);
      setDraft('');
    }
  };

  const remove = (i) => onChange(phrases.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2" data-testid="seo-phrases-list">
        {phrases.length === 0 ? (
          <span className="text-[11.5px]" style={{ color: 'var(--lj-muted)' }}>No phrases yet</span>
        ) : phrases.map((p, i) => (
          <span key={i} data-testid={`seo-phrase-chip-${i}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px]"
            style={{ background: 'var(--lj-bg)', color: 'var(--lj-text)', border: '1px solid var(--lj-border)' }}>
            {p}
            <button type="button" onClick={() => remove(i)} data-testid={`seo-phrase-remove-${i}`} className="opacity-60 hover:opacity-100" aria-label="Remove">
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder='Add one or paste a list: "2ct oval engagement ring, hidden halo, lab grown..."'
          data-testid="seo-phrase-input"
          className="input flex-1"
        />
        <button type="button" onClick={add} data-testid="seo-phrase-add"
          className="px-3 rounded-[10px] text-[12.5px] font-medium"
          style={{ background: 'var(--lj-accent)', color: '#fff' }}>
          Add
        </button>
      </div>
      <p className="mt-1.5 text-[10.5px]" style={{ color: 'var(--lj-muted)' }}>
        Tip: separate multiple phrases with commas, new lines, or pipes — they'll be added together.
      </p>
    </div>
  );
};


/* ─────────── Media Preview Lightbox ─────────── */
const MediaPreview = ({ media, onClose }) => {
  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!media) return null;
  const isVideo = media.media_type === 'video';

  return (
    <div data-testid="admin-media-preview" onClick={onClose}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-8"
      style={{ background: 'rgba(8, 18, 16, 0.86)', backdropFilter: 'blur(6px)' }}>
      <button data-testid="admin-media-preview-close"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.10)', color: '#fff' }}>
        <X size={18} />
      </button>
      <div onClick={(e) => e.stopPropagation()} className="relative max-w-5xl w-full max-h-full">
        <div className="rounded-[12px] overflow-hidden flex items-center justify-center"
          style={{ background: '#0a0a0c', maxHeight: '85vh' }}>
          {isVideo ? (
            <video
              src={media.url}
              controls autoPlay
              data-testid="admin-media-preview-video"
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          ) : (
            <img
              src={media.url}
              alt={media.caption || 'Preview'}
              data-testid="admin-media-preview-image"
              className="w-full h-auto max-h-[85vh] object-contain"
              draggable="false"
            />
          )}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 px-1 text-[12px]" style={{ color: 'rgba(255,255,255,0.78)' }}>
          <div className="truncate">{media.caption || (isVideo ? 'Video preview' : 'Image preview')}</div>
          <a href={media.url} target="_blank" rel="noopener noreferrer"
            data-testid="admin-media-preview-open-new"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.10)' }}>
            <Maximize2 size={11} /> Open full size
          </a>
        </div>
      </div>
    </div>
  );
};

