import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Activity, Save, Loader2, CheckCircle, AlertCircle, Clock, FlaskConical } from 'lucide-react';

export default function TrackingPage() {
  const { api } = useAdmin();
  const [tracking, setTracking] = useState(null);
  const [events, setEvents] = useState([]);
  const [abtest, setAbtest] = useState(null);
  const [abResults, setAbResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      api('get', '/api/admin/tracking'),
      api('get', '/api/admin/tracking/verify'),
      api('get', '/api/admin/abtest'),
      api('get', '/api/admin/abtest/results'),
    ]).then(([tr, ev, ab, abr]) => {
      setTracking(tr.data); setEvents(ev.data.events); setAbtest(ab.data); setAbResults(abr.data);
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
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14px] font-medium" style={{ background: saved ? 'var(--lj-success)' : 'var(--lj-accent)', color: '#FFFFFF' }}>
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

      {/* A/B Test Section */}
      {abtest && (
        <div className="p-5 rounded-[14px] mt-6" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
          <h3 className="text-[16px] font-medium mb-4 flex items-center gap-2" style={{ color: 'var(--lj-text)' }}>
            <FlaskConical size={18} style={{ color: 'var(--lj-accent)' }} /> A/B Test: Lead Capture
          </h3>
          <div className="mb-4">
            <label className="text-[13px] block mb-2" style={{ color: 'var(--lj-muted)' }}>Mode</label>
            <div className="flex gap-2">
              {[{ val: 'auto', label: 'Auto (50/50)' }, { val: 'variant_a', label: 'Force A (Button)' }, { val: 'variant_b', label: 'Force B (Popup)' }].map(m => (
                <button key={m.val} onClick={async () => { await api('patch', '/api/admin/abtest', { lead_capture_mode: m.val }); const r = await api('get', '/api/admin/abtest'); setAbtest(r.data); }}
                  className="flex-1 px-3 py-2 rounded-[10px] text-[13px] font-medium transition-all"
                  style={{ background: abtest.lead_capture_mode === m.val ? 'rgba(15,94,76,0.08)' : 'var(--lj-bg)', border: `1.5px solid ${abtest.lead_capture_mode === m.val ? 'var(--lj-accent)' : 'var(--lj-border)'}`, color: abtest.lead_capture_mode === m.val ? 'var(--lj-accent)' : 'var(--lj-muted)' }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          {abResults && (
            <div className="space-y-3">
              <p className="text-[13px] font-medium" style={{ color: 'var(--lj-muted)' }}>Conversion Results</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-[10px]" style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)' }}>
                  <p className="text-[12px] font-medium mb-1" style={{ color: 'var(--lj-muted)' }}>Variant A (Button)</p>
                  <p className="text-[22px] font-bold" style={{ color: 'var(--lj-text)' }}>{abResults.variant_a.conversion_rate}%</p>
                  <p className="text-[11px]" style={{ color: 'var(--lj-muted)' }}>{abResults.variant_a.completed}/{abResults.variant_a.shown} completed</p>
                  {abResults.variant_a.avg_time_to_submit_sec > 0 && <p className="text-[11px]" style={{ color: 'var(--lj-muted)' }}>Avg: {abResults.variant_a.avg_time_to_submit_sec}s</p>}
                </div>
                <div className="p-3 rounded-[10px]" style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)' }}>
                  <p className="text-[12px] font-medium mb-1" style={{ color: 'var(--lj-muted)' }}>Variant B (Popup)</p>
                  <p className="text-[22px] font-bold" style={{ color: 'var(--lj-text)' }}>{abResults.variant_b.conversion_rate}%</p>
                  <p className="text-[11px]" style={{ color: 'var(--lj-muted)' }}>{abResults.variant_b.completed}/{abResults.variant_b.shown} completed</p>
                  {abResults.variant_b.avg_time_to_submit_sec > 0 && <p className="text-[11px]" style={{ color: 'var(--lj-muted)' }}>Avg: {abResults.variant_b.avg_time_to_submit_sec}s</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
