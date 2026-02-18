import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Activity, Save, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function TrackingPage() {
  const { api } = useAdmin();
  const [tracking, setTracking] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      api('get', '/api/admin/tracking'),
      api('get', '/api/admin/tracking/verify'),
    ]).then(([tr, ev]) => {
      setTracking(tr.data); setEvents(ev.data.events);
    }).catch(console.error).finally(() => setLoading(false));
  }, [api]);

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      const res = await api('patch', '/api/admin/tracking', tracking);
      setTracking(res.data); setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--lj-accent)' }} /></div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-semibold" style={{ color: 'var(--lj-text)' }}>Tracking & Analytics</h1>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14px] font-medium" style={{ background: saved ? 'var(--lj-success)' : 'var(--lj-accent)', color: '#0B0B0C' }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <><CheckCircle size={16} /> Saved</> : <><Save size={16} /> Save</>}
        </button>
      </div>

      {/* Pixel IDs */}
      <div className="p-5 rounded-[14px] mb-6" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
        <h3 className="text-[16px] font-medium mb-4" style={{ color: 'var(--lj-text)' }}>Tracking Codes</h3>
        <div className="space-y-3">
          {[{ key: 'meta_pixel_id', label: 'Meta Pixel ID' }, { key: 'google_ads_tag', label: 'Google Ads Tag' }, { key: 'tiktok_pixel_id', label: 'TikTok Pixel ID' }, { key: 'google_analytics_id', label: 'Google Analytics ID' }].map(f => (
            <div key={f.key}>
              <label className="text-[13px] block mb-1" style={{ color: 'var(--lj-muted)' }}>{f.label}</label>
              <input value={tracking?.[f.key] || ''} onChange={e => setTracking(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={`Enter ${f.label}`} className="w-full min-h-[40px] px-3 rounded-[10px] text-[14px] font-mono" style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)', color: 'var(--lj-text)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Event Verification */}
      <div className="p-5 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
        <h3 className="text-[16px] font-medium mb-4" style={{ color: 'var(--lj-text)' }}>Event Verification</h3>
        <div className="space-y-2">
          {events.map(ev => (
            <div key={ev.event} className="flex items-center justify-between px-3 py-2.5 rounded-[10px]" style={{ background: 'var(--lj-bg)' }}>
              <div className="flex items-center gap-2">
                {ev.total_count > 0 ? <CheckCircle size={16} style={{ color: 'var(--lj-success)' }} /> : <AlertCircle size={16} style={{ color: 'var(--lj-danger)' }} />}
                <span className="text-[13px] font-mono" style={{ color: 'var(--lj-text)' }}>{ev.event}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium" style={{ color: ev.total_count > 0 ? 'var(--lj-success)' : 'var(--lj-muted)' }}>{ev.total_count}</span>
                <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--lj-muted)' }}>
                  <Clock size={10} /> {ev.last_seen === 'never' ? 'Never' : new Date(ev.last_seen).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
