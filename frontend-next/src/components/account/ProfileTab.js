'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Save, CheckCircle2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const Field = ({ label, value, onChange, placeholder, type = 'text', testid, disabled }) => (
  <div>
    <label className="text-[12px] uppercase tracking-wider font-semibold block mb-1.5" style={{ color: '#6B746F' }}>{label}</label>
    <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} data-testid={testid}
      className="w-full min-h-[44px] px-3.5 rounded-[12px] text-[15px] outline-none disabled:opacity-60"
      style={{ background: '#FBF7F0', border: '1.5px solid #E5E0D7', color: '#1A2520' }} />
  </div>
);

export default function ProfileTab({ headers, onUserUpdated }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [provider, setProvider] = useState('');

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/me`, { headers })
      .then((r) => {
        const u = r.data.user || {};
        setProvider(u.auth_provider || '');
        setForm({
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          email: u.email || '',
          phone: u.phone || '',
          ring_size: u.ring_size || '',
          address: {
            line1: u.address?.line1 || '', line2: u.address?.line2 || '',
            city: u.address?.city || '', state: u.address?.state || '',
            zip: u.address?.zip || '', country: u.address?.country || 'United States',
          },
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setAddr = (k, v) => setForm((p) => ({ ...p, address: { ...p.address, [k]: v } }));

  const save = async () => {
    setSaving(true); setSaved(false); setError('');
    try {
      const r = await axios.put(`${BACKEND_URL}/api/me/profile`, form, { headers });
      localStorage.setItem('tlj_user', JSON.stringify(r.data.user));
      onUserUpdated && onUserUpdated(r.data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not save your profile');
    }
    setSaving(false);
  };

  if (loading || !form) return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin" style={{ color: '#0F5E4C' }} /></div>;

  return (
    <div className="max-w-2xl space-y-5" data-testid="profile-tab">
      <div className="p-6 rounded-[16px]" style={{ background: '#fff', border: '1px solid #E5E0D7' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[17px] font-semibold" style={{ color: '#1A2520' }}>Personal details</h3>
          {provider === 'google' && (
            <span className="text-[11.5px] px-2.5 py-1 rounded-full font-medium" style={{ background: '#F0EBE0', color: '#3F4A45' }}>Signed in with Google</span>
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="First name" value={form.first_name} onChange={(v) => set('first_name', v)} testid="profile-first-name" />
          <Field label="Last name" value={form.last_name} onChange={(v) => set('last_name', v)} testid="profile-last-name" />
          <Field label="Email" type="email" value={form.email} onChange={(v) => set('email', v)} testid="profile-email" />
          <Field label="Phone" value={form.phone} onChange={(v) => set('phone', v)} placeholder="+1 ..." testid="profile-phone" />
          <Field label="Ring size" value={form.ring_size} onChange={(v) => set('ring_size', v)} placeholder="e.g. 6.5" testid="profile-ring-size" />
        </div>
      </div>

      <div className="p-6 rounded-[16px]" style={{ background: '#fff', border: '1px solid #E5E0D7' }}>
        <h3 className="text-[17px] font-semibold mb-5" style={{ color: '#1A2520' }}>Shipping address</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><Field label="Address line 1" value={form.address.line1} onChange={(v) => setAddr('line1', v)} testid="profile-addr-line1" /></div>
          <div className="sm:col-span-2"><Field label="Address line 2" value={form.address.line2} onChange={(v) => setAddr('line2', v)} placeholder="Apt, suite (optional)" testid="profile-addr-line2" /></div>
          <Field label="City" value={form.address.city} onChange={(v) => setAddr('city', v)} testid="profile-addr-city" />
          <Field label="State" value={form.address.state} onChange={(v) => setAddr('state', v)} testid="profile-addr-state" />
          <Field label="ZIP" value={form.address.zip} onChange={(v) => setAddr('zip', v)} testid="profile-addr-zip" />
          <Field label="Country" value={form.address.country} onChange={(v) => setAddr('country', v)} testid="profile-addr-country" />
        </div>
      </div>

      {error && <p className="text-[13.5px]" style={{ color: '#B14B3B' }} data-testid="profile-error">{error}</p>}

      <button onClick={save} disabled={saving} data-testid="profile-save-button"
        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[14px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: saved ? '#16A34A' : '#0F5E4C', color: '#fff' }}>
        {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
        {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
      </button>
    </div>
  );
}