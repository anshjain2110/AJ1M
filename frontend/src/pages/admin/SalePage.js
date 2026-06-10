import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Tag, Save, Loader2, CheckCircle, Clock } from 'lucide-react';

// Site-wide sale manager — one toggle + percent + end date/time + announcement copy.
// Drives the storefront announcement bar, product countdown timers, and (server-side)
// discounted checkout pricing for every buyable piece.
export default function SalePage() {
  const { api } = useAdmin();
  const [form, setForm] = useState({ enabled: false, percent: '', headline: '', ends_at: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api('get', '/api/admin/sale').then((r) => {
      const d = r.data || {};
      setForm({
        enabled: !!d.enabled,
        percent: d.percent ? String(d.percent) : '',
        headline: d.headline || '',
        ends_at: d.ends_at ? String(d.ends_at).slice(0, 16) : '',
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, [api]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      const payload = {
        enabled: !!form.enabled,
        percent: Number(form.percent) || 0,
        headline: form.headline || '',
        ends_at: form.ends_at || '',
      };
      await api('put', '/api/admin/sale', payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); window.alert('Could not save sale'); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--lj-accent)' }} /></div>;

  const live = form.enabled && Number(form.percent) > 0;

  return (
    <div className="max-w-2xl" data-testid="admin-sale-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-semibold flex items-center gap-2" style={{ color: 'var(--lj-text)' }}><Tag size={24} style={{ color: 'var(--lj-accent)' }} /> Sale &amp; Promotions</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--lj-muted)' }}>One site-wide sale across every buyable piece. Shows in the announcement bar + a countdown timer on each product.</p>
        </div>
        <button onClick={save} disabled={saving} data-testid="admin-sale-save" className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14px] font-medium" style={{ background: saved ? 'var(--lj-success,#15803D)' : 'var(--lj-accent)', color: '#fff' }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <><CheckCircle size={16} /> Saved</> : <><Save size={16} /> Save</>}
        </button>
      </div>

      {/* Live preview */}
      <div className="mb-5 rounded-[12px] overflow-hidden" style={{ border: '1px solid var(--lj-border)' }}>
        <div className="text-center text-[12px] tracking-[0.16em] uppercase py-2.5 px-3" style={{ background: 'var(--lj-accent)', color: '#fff', opacity: live ? 1 : 0.5 }}>
          {live ? (form.headline || `${Math.round(Number(form.percent))}% off everything`) : 'Sale is off — default announcement showing'}
        </div>
      </div>

      <div className="p-5 rounded-[14px] space-y-4" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[14px] font-medium" style={{ color: 'var(--lj-text)' }}>Sale enabled</div>
            <div className="text-[12px]" style={{ color: 'var(--lj-muted)' }}>Turn the whole sale on or off instantly.</div>
          </div>
          <button onClick={() => update('enabled', !form.enabled)} data-testid="admin-sale-toggle" className="w-12 h-7 rounded-full relative transition-colors" style={{ background: form.enabled ? 'var(--lj-accent)' : 'var(--lj-border)' }}>
            <div className="w-6 h-6 rounded-full absolute top-0.5 transition-all" style={{ background: '#fff', left: form.enabled ? '22px' : '2px' }} />
          </button>
        </div>

        <Field label="Discount percent (%)">
          <input type="number" min="0" max="90" step="1" value={form.percent} onChange={(e) => update('percent', e.target.value)} placeholder="e.g. 20" className="input" data-testid="admin-sale-percent" />
        </Field>

        <Field label="Announcement bar text">
          <input type="text" value={form.headline} onChange={(e) => update('headline', e.target.value)} placeholder="🔥 Summer Sale — 20% off everything, ends Sunday" className="input" data-testid="admin-sale-headline" />
        </Field>

        <Field label="Sale ends at (drives the countdown timer)">
          <div className="flex items-center gap-2">
            <Clock size={16} style={{ color: 'var(--lj-muted)' }} />
            <input type="datetime-local" value={form.ends_at} onChange={(e) => update('ends_at', e.target.value)} className="input" data-testid="admin-sale-ends-at" />
          </div>
          <p className="text-[11.5px] mt-1" style={{ color: 'var(--lj-muted)' }}>Leave blank for no end time (no countdown shown). The sale auto-ends once this time passes.</p>
        </Field>
      </div>

      <style>{`
        .input { width: 100%; padding: 9px 11px; border-radius: 10px; border: 1px solid var(--lj-border); background: var(--lj-bg); font-size: 14px; color: var(--lj-text); outline: none; }
        .input:focus { border-color: var(--lj-accent); box-shadow: 0 0 0 2px rgba(15,94,76,0.1); }
      `}</style>
    </div>
  );
}

const Field = ({ label, children }) => (
  <div>
    <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: 'var(--lj-muted)' }}>{label}</label>
    {children}
  </div>
);
