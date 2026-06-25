'use client';

import { useState } from 'react';
import axios from 'axios';
import { Send, Loader2, Check } from 'lucide-react';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setErr('Name, email, and message are required.');
      return;
    }
    setSending(true);
    try {
      await axios.post('/api/contact', form);
      setSent(true);
    } catch (e2) {
      setErr(e2?.response?.data?.detail || 'Could not send. Please try again or call us.');
    } finally { setSending(false); }
  };

  return (
    <div className="rounded-[18px] p-5 sm:p-7" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
      {sent ? (
        <div className="py-10 text-center" data-testid="contact-success">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--lj-accent)' }}>
            <Check size={26} style={{ color: '#FFFFFF' }} strokeWidth={2.8} />
          </div>
          <h3 className="text-[22px] font-semibold mb-2" style={{ color: 'var(--lj-text)' }}>Got it.</h3>
          <p className="text-[14px] leading-[1.55] max-w-sm mx-auto" style={{ color: 'var(--lj-muted)' }}>
            Thanks for reaching out — we&apos;ll get back to you within a few hours. For urgent questions, call <a href="tel:+15857108292" className="underline" style={{ color: 'var(--lj-accent)' }}>585-710-8292</a>.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3" data-testid="contact-form">
          <h3 className="text-[18px] font-semibold mb-3" style={{ color: 'var(--lj-text)' }}>Send us a message</h3>
          <input data-testid="contact-name" type="text" placeholder="Your name *" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full min-h-[48px] px-4 rounded-[12px] text-[15px] outline-none"
            style={{ background: 'var(--lj-bg)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }} />
          <div className="grid sm:grid-cols-2 gap-3">
            <input data-testid="contact-email" type="email" placeholder="Email *" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full min-h-[48px] px-4 rounded-[12px] text-[15px] outline-none"
              style={{ background: 'var(--lj-bg)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }} />
            <input data-testid="contact-phone" type="tel" placeholder="Phone (optional)" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full min-h-[48px] px-4 rounded-[12px] text-[15px] outline-none"
              style={{ background: 'var(--lj-bg)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }} />
          </div>
          <input data-testid="contact-subject" type="text" placeholder="Subject (optional)" value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full min-h-[48px] px-4 rounded-[12px] text-[15px] outline-none"
            style={{ background: 'var(--lj-bg)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }} />
          <textarea data-testid="contact-message" rows={5} placeholder="What's on your mind? *" value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full px-4 py-3 rounded-[12px] text-[15px] outline-none resize-none"
            style={{ background: 'var(--lj-bg)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)', fontFamily: 'inherit' }} />
          {err && (
            <div data-testid="contact-error" className="px-3 py-2 rounded-[10px] text-[12.5px]"
              style={{ background: 'rgba(192,57,43,0.08)', color: '#c0392b', border: '1px solid rgba(192,57,43,0.18)' }}>{err}</div>
          )}
          <button type="submit" disabled={sending} data-testid="contact-submit"
            className="w-full min-h-[52px] rounded-[12px] font-medium text-[15.5px] inline-flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.99] disabled:opacity-70"
            style={{ background: 'var(--lj-accent)', color: '#FFFFFF', boxShadow: '0 6px 18px rgba(15,94,76,0.22)' }}>
            {sending ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <><Send size={16} /> Send message</>}
          </button>
          <p className="text-[11.5px] text-center" style={{ color: 'var(--lj-muted)' }}>We never share your info. Real human replies.</p>
        </form>
      )}
    </div>
  );
}
