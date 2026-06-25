import React, { useEffect, useState, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Plus, Trash2, Upload, ChevronUp, ChevronDown, Save, GripVertical, Image as ImageIcon } from 'lucide-react';

const slugify = (s) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const newLink = () => ({ label: '', href: '', hover_image_url: '' });
const newColumn = () => ({ heading: '', links: [newLink()] });
const newItem = () => ({ id: `item-${Math.random().toString(36).slice(2, 7)}`, label: 'New Item', href: '/', type: 'link', columns: [], featured_image_url: '', featured_label: '', featured_href: '' });

export default function MenuBuilderPage() {
  const { api } = useAdmin();
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [openIdx, setOpenIdx] = useState(0);

  const load = useCallback(() => api('get', '/api/admin/menu').then((r) => setItems(r.data.items || [])), [api]);
  useEffect(() => { load(); }, [load]);

  const upload = (file, cb) => {
    const fd = new FormData();
    fd.append('files', file);
    return api('post', '/api/uploads', fd).then((res) => {
      const u = res.data.files && res.data.files[0];
      if (u) cb(u.url);
    });
  };

  const update = (idx, patch) => setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const move = (idx, dir) => setItems((arr) => {
    const next = [...arr];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return arr;
    [next[idx], next[j]] = [next[j], next[idx]];
    return next;
  });
  const removeItem = (idx) => setItems((arr) => arr.filter((_, i) => i !== idx));
  const addItem = () => { setItems((arr) => [...arr, newItem()]); setOpenIdx(items.length); };

  const save = async () => {
    setSaving(true); setSavedMsg('');
    try {
      const payload = { items: items.map((it) => ({ ...it, id: it.id || slugify(it.label) })) };
      await api('put', '/api/admin/menu', payload);
      setSavedMsg('Menu saved & live ✓');
      setTimeout(() => setSavedMsg(''), 2500);
    } catch { setSavedMsg('Save failed'); } finally { setSaving(false); }
  };

  // column / link helpers
  const setColumns = (idx, columns) => update(idx, { columns });

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--lj-text)' }}>Header / Mega-Menu</h1>
          <p className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>Add navigation items, dropdown links, and the example image that shows when a shopper hovers a link.</p>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-[13px]" style={{ color: 'var(--lj-accent)' }} data-testid="menu-saved-msg">{savedMsg}</span>}
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-medium rounded-lg disabled:opacity-60" style={{ background: 'var(--lj-accent)', color: '#fff' }} data-testid="save-menu-btn"><Save size={15} /> {saving ? 'Saving…' : 'Save & publish'}</button>
        </div>
      </div>

      <div className="space-y-3 mt-5">
        {items.map((it, idx) => (
          <div key={it.id || idx} className="rounded-xl" style={{ border: '1px solid var(--lj-border)', background: 'var(--lj-surface)' }} data-testid={`menu-item-${idx}`}>
            <div className="flex items-center gap-2 p-3">
              <GripVertical size={16} style={{ color: 'var(--lj-muted)' }} />
              <button onClick={() => setOpenIdx(openIdx === idx ? -1 : idx)} className="flex-1 text-left">
                <span className="text-[14px] font-medium" style={{ color: 'var(--lj-text)' }}>{it.label || '(no label)'}</span>
                <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full" style={{ background: it.type === 'mega' ? 'var(--lj-accent)' : 'var(--lj-border)', color: it.type === 'mega' ? '#fff' : 'var(--lj-muted)' }}>{it.type}</span>
              </button>
              <button onClick={() => move(idx, -1)} className="p-1" aria-label="Move up"><ChevronUp size={16} /></button>
              <button onClick={() => move(idx, 1)} className="p-1" aria-label="Move down"><ChevronDown size={16} /></button>
              <button onClick={() => removeItem(idx)} className="p-1" style={{ color: 'var(--lj-danger)' }} data-testid={`remove-menu-item-${idx}`}><Trash2 size={15} /></button>
            </div>

            {openIdx === idx && (
              <div className="p-4 pt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <L label="Label"><input value={it.label} onChange={(e) => update(idx, { label: e.target.value })} className="lj-inp" data-testid={`menu-label-${idx}`} /></L>
                  <L label="Link (href)"><input value={it.href} onChange={(e) => update(idx, { href: e.target.value })} className="lj-inp" placeholder="/collections/..." /></L>
                  <L label="Type"><select value={it.type} onChange={(e) => update(idx, { type: e.target.value, columns: e.target.value === 'mega' && it.columns.length === 0 ? [newColumn()] : it.columns })} className="lj-inp" data-testid={`menu-type-${idx}`}><option value="link">Simple link</option><option value="mega">Mega dropdown</option></select></L>
                </div>

                {it.type === 'mega' && (
                  <>
                    {/* Featured image */}
                    <div className="rounded-lg p-3" style={{ background: 'var(--lj-bg)', border: '1px dashed var(--lj-border)' }}>
                      <div className="text-[12px] font-medium mb-2" style={{ color: 'var(--lj-muted)' }}>Featured (default) image on the right of the dropdown</div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-20 h-16 rounded overflow-hidden flex items-center justify-center" style={{ background: 'var(--lj-surface)' }}>{it.featured_image_url ? <img src={it.featured_image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={18} style={{ color: 'var(--lj-muted)' }} />}</div>
                        <label className="flex items-center gap-1.5 px-3 py-2 text-[13px] rounded-lg cursor-pointer" style={{ border: '1px solid var(--lj-border)' }}><Upload size={14} /> Upload<input type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && upload(e.target.files[0], (url) => update(idx, { featured_image_url: url }))} data-testid={`menu-featured-upload-${idx}`} /></label>
                        <input value={it.featured_label} onChange={(e) => update(idx, { featured_label: e.target.value })} className="lj-inp flex-1 min-w-[140px]" placeholder="Featured label (e.g. Shop all)" />
                        <input value={it.featured_href} onChange={(e) => update(idx, { featured_href: e.target.value })} className="lj-inp flex-1 min-w-[140px]" placeholder="Featured link" />
                      </div>
                    </div>

                    {/* Columns */}
                    <div className="space-y-3">
                      {(it.columns || []).map((col, ci) => (
                        <div key={ci} className="rounded-lg p-3" style={{ border: '1px solid var(--lj-border)' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <input value={col.heading} onChange={(e) => setColumns(idx, it.columns.map((c, k) => (k === ci ? { ...c, heading: e.target.value } : c)))} className="lj-inp" placeholder="Column heading (e.g. Shop by Shape)" data-testid={`menu-col-heading-${idx}-${ci}`} />
                            <button onClick={() => setColumns(idx, it.columns.filter((_, k) => k !== ci))} className="p-1.5" style={{ color: 'var(--lj-danger)' }} aria-label="Remove column"><Trash2 size={14} /></button>
                          </div>
                          <div className="space-y-2">
                            {(col.links || []).map((lnk, li) => (
                              <div key={li} className="flex flex-wrap items-center gap-2">
                                <div className="w-11 h-11 rounded overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: 'var(--lj-surface)' }}>{lnk.hover_image_url ? <img src={lnk.hover_image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={14} style={{ color: 'var(--lj-muted)' }} />}</div>
                                <input value={lnk.label} onChange={(e) => setColumns(idx, it.columns.map((c, k) => (k === ci ? { ...c, links: c.links.map((l, m) => (m === li ? { ...l, label: e.target.value } : l)) } : c)))} className="lj-inp flex-1 min-w-[110px]" placeholder="Link label" data-testid={`menu-link-label-${idx}-${ci}-${li}`} />
                                <input value={lnk.href} onChange={(e) => setColumns(idx, it.columns.map((c, k) => (k === ci ? { ...c, links: c.links.map((l, m) => (m === li ? { ...l, href: e.target.value } : l)) } : c)))} className="lj-inp flex-1 min-w-[110px]" placeholder="/collections/..." />
                                <label className="flex items-center gap-1 px-2.5 py-2 text-[12px] rounded-lg cursor-pointer flex-shrink-0" style={{ border: '1px solid var(--lj-border)' }} title="Hover image"><Upload size={13} /><input type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && upload(e.target.files[0], (url) => setColumns(idx, it.columns.map((c, k) => (k === ci ? { ...c, links: c.links.map((l, m) => (m === li ? { ...l, hover_image_url: url } : l)) } : c))))} data-testid={`menu-link-img-${idx}-${ci}-${li}`} /></label>
                                <button onClick={() => setColumns(idx, it.columns.map((c, k) => (k === ci ? { ...c, links: c.links.filter((_, m) => m !== li) } : c)))} className="p-1.5 flex-shrink-0" style={{ color: 'var(--lj-danger)' }} aria-label="Remove link"><Trash2 size={13} /></button>
                              </div>
                            ))}
                            <button onClick={() => setColumns(idx, it.columns.map((c, k) => (k === ci ? { ...c, links: [...c.links, newLink()] } : c)))} className="flex items-center gap-1 text-[12px] mt-1" style={{ color: 'var(--lj-accent)' }} data-testid={`add-link-${idx}-${ci}`}><Plus size={13} /> Add link</button>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => setColumns(idx, [...(it.columns || []), newColumn()])} className="flex items-center gap-1 text-[13px]" style={{ color: 'var(--lj-accent)' }} data-testid={`add-column-${idx}`}><Plus size={14} /> Add column</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={addItem} className="flex items-center gap-1.5 mt-4 px-4 py-2.5 text-[13px] font-medium rounded-lg" style={{ border: '1px dashed var(--lj-border)', color: 'var(--lj-accent)' }} data-testid="add-menu-item-btn"><Plus size={15} /> Add navigation item</button>

      <style>{`.lj-inp{padding:8px 10px;border:1px solid var(--lj-border);border-radius:8px;font-size:13px;background:#fff;color:var(--lj-text);width:100%}.lj-inp:focus{outline:2px solid var(--lj-accent);outline-offset:-1px}`}</style>
    </div>
  );
}

function L({ label, children }) {
  return <div><div className="text-[12px] font-medium mb-1" style={{ color: 'var(--lj-muted)' }}>{label}</div>{children}</div>;
}
