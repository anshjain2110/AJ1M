'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { X, ArrowRight, Loader2, Check, Sparkles } from 'lucide-react';

export default function QuickQuoteModal({ onClose }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setErr('Name, email and phone are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post('/api/leads/quick', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        inspiration_notes: form.notes.trim(),
        inspiration_link: '',
        inspiration_files: [],
        metal_preference: '',
        carat_range: '',
      });
      if (res.data?.token) {
        localStorage.setItem('tlj_token', res.data.token);
      }
      setDone(true);
    } catch (e2) {
      setErr(e2?.response?.data?.detail || 'Something went wrong. Please try again or call 585-710-8292.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" data-testid="quick-quote-modal">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div className="relative w-full max-w-[480px] rounded-[22px] p-6 sm:p-8 max-h-[90vh] overflow-auto"
        style={{ background: '#fff', boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }}>
        <button onClick={onClose} aria-label="Close" data-testid="quick-quote-close"
          className="absolute right-4 top-4 w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-[#F4F1EC]" style={{ color: 'var(--lj-muted)' }}>
          <X size={18} />
        </button>

        {done ? (
          <div className="py-6 text-center" data-testid="quick-quote-success">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--lj-accent)' }}>
              <Check size={28} style={{ color: '#fff' }} strokeWidth={2.8} />
            </div>
            <h3 className="text-[24px] font-semibold mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-text)' }}>
              Got it. Talk soon!
            </h3>
            <p className="text-[14.5px] leading-[1.55] mb-5" style={{ color: 'var(--lj-muted)' }}>
              We&apos;ll be in touch within 24-48 hours with your 3D renders and a written quote.
            </p>
            <button onClick={() => { onClose(); router.push('/dashboard'); }}
              className="min-h-[48px] px-6 rounded-[12px] font-medium text-[14.5px] inline-flex items-center gap-2"
              style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}>
              Go to my account <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] mb-3 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(15,94,76,0.08)', color: 'var(--lj-accent)' }}>
              <Sparkles size={11} /> Quick quote
            </div>
            <h2 className="text-[26px] leading-[30px] font-semibold mb-1.5"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-text)' }}>
              Tell us about your piece.
            </h2>
            <p className="text-[14px] leading-[1.5] mb-5" style={{ color: 'var(--lj-muted)' }}>
              We&apos;ll send back 3D renders &amp; a written quote within 24-48 hours.
            </p>

            <form onSubmit={submit} className="space-y-3" data-testid="quick-quote-form">
              <input data-testid="qq-name" type="text" placeholder="Your name *" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full min-h-[48px] px-4 rounded-[12px] text-[15px] outline-none"
                style={{ background: 'var(--lj-surface)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }} />
              <div className="grid sm:grid-cols-2 gap-3">
                <input data-testid="qq-email" type="email" placeholder="Email *" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full min-h-[48px] px-4 rounded-[12px] text-[15px] outline-none"
                  style={{ background: 'var(--lj-surface)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }} />
                <input data-testid="qq-phone" type="tel" placeholder="Phone *" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full min-h-[48px] px-4 rounded-[12px] text-[15px] outline-none"
                  style={{ background: 'var(--lj-surface)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }} />
              </div>
              <textarea data-testid="qq-notes" rows={4} placeholder="Describe your piece — shape, carat, metal, style, or paste a link..." value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-[12px] text-[15px] outline-none resize-none"
                style={{ background: 'var(--lj-surface)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)', fontFamily: 'inherit' }} />
              {err && (
                <div data-testid="qq-error" className="px-3 py-2 rounded-[10px] text-[12.5px]"
                  style={{ background: 'rgba(192,57,43,0.08)', color: '#c0392b', border: '1px solid rgba(192,57,43,0.18)' }}>{err}</div>
              )}
              <button type="submit" disabled={submitting} data-testid="qq-submit"
                className="w-full min-h-[52px] rounded-[12px] font-medium text-[15.5px] inline-flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.99] disabled:opacity-70"
                style={{ background: 'var(--lj-accent)', color: '#FFFFFF', boxShadow: '0 6px 18px rgba(15,94,76,0.22)' }}>
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <>Get my quote <ArrowRight size={16} /></>}
              </button>
              <p className="text-[11.5px] text-center" style={{ color: 'var(--lj-muted)' }}>
                No payment required · Renders in 24-48 hrs · IGI / GIA certified
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
