import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Settings, Save, Loader2, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const { api } = useAdmin();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api('get', '/api/admin/settings').then(res => setSettings(res.data)).catch(console.error).finally(() => setLoading(false));
  }, [api]);

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      const res = await api('patch', '/api/admin/settings', settings);
      setSettings(res.data); setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const updateField = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--lj-accent)' }} /></div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-semibold" style={{ color: 'var(--lj-text)' }}>Site Settings</h1>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14px] font-medium transition-all" style={{ background: saved ? 'var(--lj-success)' : 'var(--lj-accent)', color: '#0B0B0C' }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <><CheckCircle size={16} /> Saved</> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      <div className="space-y-6">
        {/* Contact */}
        <Section title="Contact Information">
          <Field label="Phone Number" value={settings?.phone_number || ''} onChange={v => updateField('phone_number', v)} />
          <Field label="WhatsApp Link" value={settings?.whatsapp_link || ''} onChange={v => updateField('whatsapp_link', v)} />
        </Section>

        {/* Toggles */}
        <Section title="Visibility Toggles">
          <Toggle label="Live Chat Enabled" checked={settings?.live_chat_enabled} onChange={v => updateField('live_chat_enabled', v)} />
          <Toggle label="GIA Logo Visible" checked={settings?.gia_logo_visible} onChange={v => updateField('gia_logo_visible', v)} />
          <Toggle label="IGI Logo Visible" checked={settings?.igi_logo_visible} onChange={v => updateField('igi_logo_visible', v)} />
        </Section>

        {/* Social Proof */}
        <Section title="Social Proof Numbers">
          <Field label="Reviews Count" value={settings?.reviews_count || ''} onChange={v => updateField('reviews_count', v)} placeholder="e.g. 70+" />
          <Field label="Customers Count" value={settings?.customers_count || ''} onChange={v => updateField('customers_count', v)} placeholder="e.g. 100+" />
          <Field label="Avg Savings" value={settings?.avg_savings || ''} onChange={v => updateField('avg_savings', v)} placeholder="e.g. $5,000" />
        </Section>

        {/* Notifications */}
        <Section title="Email Notifications">
          <Toggle label="New Lead Alert" checked={settings?.email_notify_new_lead} onChange={v => updateField('email_notify_new_lead', v)} />
          <Toggle label="Quote Alert" checked={settings?.email_notify_quote} onChange={v => updateField('email_notify_quote', v)} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="p-5 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
      <h3 className="text-[16px] font-medium mb-4" style={{ color: 'var(--lj-text)' }}>{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-[13px] block mb-1" style={{ color: 'var(--lj-muted)' }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full min-h-[40px] px-3 rounded-[10px] text-[14px]" style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)', color: 'var(--lj-text)' }} />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[14px]" style={{ color: 'var(--lj-text)' }}>{label}</span>
      <button onClick={() => onChange(!checked)} className="w-11 h-6 rounded-full relative transition-colors" style={{ background: checked ? 'var(--lj-accent)' : 'var(--lj-border)' }}>
        <div className="w-5 h-5 rounded-full absolute top-0.5 transition-all" style={{ background: '#fff', left: checked ? '22px' : '2px' }} />
      </button>
    </div>
  );
}
