'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Plus, Edit2, Trash2, X, Upload, Sparkles } from 'lucide-react';

const slugify = (s) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const emptyForm = () => ({ slug: '', title: '', subtitle: '', description: '', parent_slug: '', image_url: '', hero_image_url: '', published: true, featured: false, position: 0, meta_title: '', meta_description: '' });

export default function CollectionsAdminPage() {
  const { api } = useAdmin();
  const [collections, setCollections] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(() => api('get', '/api/admin/collections').then((r) => setCollections(r.data.collections || [])), [api]);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(emptyForm()); setEditing('new'); setErr(''); };
  const openEdit = (id) => {
    setErr('');
    return api('get', `/api/admin/collections/${id}`).then((r) => { setForm({ ...emptyForm(), ...r.data }); setEditing(id); });
  };

  const uploadFile = async (file, key) => {
    const fd = new FormData();
    fd.append('files', file);
    const res = await api('post', '/api/uploads', fd);
    const u = res.data.files && res.data.files[0];
    if (u) setForm((s) => ({ ...s, [key]: u.url }));
  };

  const save = async () => {
    setSaving(true); setErr('');
    try {
      const payload = { ...form, slug: form.slug || slugify(form.title), position: parseInt(form.position) || 0 };
      if (editing === 'new') await api('post', '/api/admin/collections', payload);
      else await api('put', `/api/admin/collections/${editing}`, payload);
      setEditing(null); await load();
    } catch (e) { setErr(e?.response?.data?.detail || 'Save failed'); } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this collection? Products will be unlinked.')) return;
    await api('delete', `/api/admin/collections/${id}`); await load();
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--lj-text)' }}>Collections</h1>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-lg" style={{ background: 'var(--lj-accent)', color: '#fff' }} data-testid="new-collection-btn"><Plus size={16} /> New collection</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((c) => (
          <div key={c.collection_id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--lj-border)', background: 'var(--lj-surface)' }} data-testid={`admin-collection-${c.slug}`}>
            <div className="relative" style={{ aspectRatio: '16/9', background: '#eee' }}>
              {c.image_url && <img src={c.image_url} alt={c.title} className="w-full h-full object-cover" />}
              {!c.published && <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] rounded" style={{ background: 'var(--lj-muted)', color: '#fff' }}>Draft</span>}
              {c.featured && <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] rounded inline-flex items-center gap-1" style={{ background: 'var(--lj-accent)', color: '#fff' }}><Sparkles size={10} /> Featured</span>}
            </div>
            <div className="p-3">
              <div className="text-[14px] font-medium" style={{ color: 'var(--lj-text)' }}>{c.title}</div>
              <div className="text-[12px]" style={{ color: 'var(--lj-muted)' }}>/{c.slug} · {c.product_count} products</div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => openEdit(c.collection_id)} className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] rounded-lg" style={{ border: '1px solid var(--lj-border)' }} data-testid={`edit-collection-${c.slug}`}><Edit2 size={13} /> Edit</button>
                <button onClick={() => del(c.collection_id)} className="ml-auto p-1.5 rounded-lg" style={{ color: 'var(--lj-danger)' }} data-testid={`delete-collection-${c.slug}`}><Trash2 size={15} /></button>
              </div>
            </div>
          </div>
        ))}
        {collections.length === 0 && <p className="text-[14px] col-span-full py-10 text-center" style={{ color: 'var(--lj-muted)' }}>No collections yet.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-[520px] overflow-auto p-5" style={{ background: 'var(--lj-bg)' }} data-testid="collection-editor">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--lj-text)' }}>{editing === 'new' ? 'New collection' : 'Edit collection'}</h2>
              <button onClick={() => setEditing(null)}><X size={22} /></button>
            </div>
            {err && <p className="text-[13px] mb-3" style={{ color: 'var(--lj-danger)' }}>{err}</p>}
            <div className="space-y-3.5">
              <F label="Title"><input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value, slug: editing === 'new' && !s.slug ? slugify(e.target.value) : s.slug }))} className="lj-inp" data-testid="collection-title-input" /></F>
              <F label="Slug"><input value={form.slug} onChange={(e) => setForm((s) => ({ ...s, slug: slugify(e.target.value) }))} className="lj-inp" data-testid="collection-slug-input" /></F>
              <F label="Subtitle"><input value={form.subtitle} onChange={(e) => setForm((s) => ({ ...s, subtitle: e.target.value }))} className="lj-inp" /></F>
              <F label="Description"><textarea rows={3} value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} className="lj-inp" /></F>
              <div className="grid grid-cols-2 gap-3">
                <F label="Card image">
                  <div className="flex items-center gap-2">
                    {form.image_url && <img src={form.image_url} alt="" className="w-12 h-12 object-cover rounded" />}
                    <label className="flex items-center gap-1.5 px-3 py-2 text-[13px] rounded-lg cursor-pointer" style={{ border: '1px solid var(--lj-border)' }}><Upload size={14} /> Upload<input type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0], 'image_url')} data-testid="collection-image-upload" /></label>
                  </div>
                </F>
                <F label="Hero image">
                  <div className="flex items-center gap-2">
                    {form.hero_image_url && <img src={form.hero_image_url} alt="" className="w-12 h-12 object-cover rounded" />}
                    <label className="flex items-center gap-1.5 px-3 py-2 text-[13px] rounded-lg cursor-pointer" style={{ border: '1px solid var(--lj-border)' }}><Upload size={14} /> Upload<input type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0], 'hero_image_url')} /></label>
                  </div>
                </F>
              </div>
              <F label="Position"><input type="number" value={form.position} onChange={(e) => setForm((s) => ({ ...s, position: e.target.value }))} className="lj-inp" /></F>
              <F label="Meta title"><input value={form.meta_title} onChange={(e) => setForm((s) => ({ ...s, meta_title: e.target.value }))} className="lj-inp" /></F>
              <F label="Meta description"><textarea rows={2} value={form.meta_description} onChange={(e) => setForm((s) => ({ ...s, meta_description: e.target.value }))} className="lj-inp" /></F>
              <div className="flex items-center gap-5 pt-1">
                <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={form.published} onChange={(e) => setForm((s) => ({ ...s, published: e.target.checked }))} data-testid="collection-published" /> Published</label>
                <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((s) => ({ ...s, featured: e.target.checked }))} /> Featured</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={save} disabled={saving} className="flex-1 py-3 text-[14px] font-medium rounded-lg disabled:opacity-60" style={{ background: 'var(--lj-accent)', color: '#fff' }} data-testid="save-collection-btn">{saving ? 'Saving…' : 'Save collection'}</button>
              <button onClick={() => setEditing(null)} className="px-5 py-3 text-[14px] rounded-lg" style={{ border: '1px solid var(--lj-border)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <style>{`.lj-inp{width:100%;padding:9px 11px;border:1px solid var(--lj-border);border-radius:9px;font-size:13.5px;background:#fff;color:var(--lj-text)}.lj-inp:focus{outline:2px solid var(--lj-accent);outline-offset:-1px}`}</style>
    </div>
  );
}

function F({ label, children }) {
  return <div><div className="text-[12px] font-medium mb-1" style={{ color: 'var(--lj-muted)' }}>{label}</div>{children}</div>;
}