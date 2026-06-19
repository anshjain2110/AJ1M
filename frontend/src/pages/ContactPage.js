import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Phone, Mail, MapPin, Send, Loader2, Check, MessageCircle } from 'lucide-react';
import axios from 'axios';
import PublicHeader from '../components/PublicHeader';
import { LocalBusinessSchema } from '../utils/seoSchema';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [settings, setSettings] = useState({});

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/admin/settings/public`).then((r) => setSettings(r.data || {})).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setErr('Name, email, and message are required.'); return;
    }
    setSending(true);
    try {
      await axios.post(`${BACKEND_URL}/api/contact`, form);
      setSent(true);
    } catch (e2) {
      setErr(e2?.response?.data?.detail || 'Could not send. Please try again or call us.');
    } finally { setSending(false); }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--lj-bg)' }} data-testid="contact-page">
      <Helmet>
        <title>Contact The Local Jewel — Talk to a Jeweler Today</title>
        <meta name="description" content="Get in touch with The Local Jewel. Call 585-710-8292, email ansh@thelocaljewel.com, or visit our Winter Park, FL studio. Custom engagement rings, lab-grown diamonds, certified." />
        <link rel="canonical" href="https://thelocaljewel.com/contact" />
      </Helmet>
      <LocalBusinessSchema settings={settings} />

      <PublicHeader />

      <section className="px-4 pt-12 pb-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(15,94,76,0.08)', border: '1px solid rgba(15,94,76,0.15)' }}>
            <MessageCircle size={13} style={{ color: 'var(--lj-accent)' }} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--lj-accent)' }}>
              Contact us
            </span>
          </div>
          <h1 className="text-[32px] sm:text-[48px] leading-[1.05] font-semibold tracking-[-0.02em] mb-4"
            style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond","Playfair Display",Georgia,serif)' }}>
            Talk to a jeweler.
          </h1>
          <p className="text-[15px] sm:text-[17px] leading-[1.55] max-w-xl mx-auto" style={{ color: 'var(--lj-muted)' }}>
            Real designers, real answers — usually within a few hours. Drop a message, call, or stop by our Winter Park studio.
          </p>
        </div>
      </section>

      <section className="px-4 pb-16 max-w-5xl w-full mx-auto">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12">
          {/* Contact info */}
          <div className="space-y-4">
            <a href="tel:+15857108292" data-testid="contact-card-phone"
              className="flex items-start gap-4 p-5 rounded-[14px] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(15,94,76,0.10)]"
              style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(15,94,76,0.08)' }}>
                <Phone size={18} style={{ color: 'var(--lj-accent)' }} />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] mb-1" style={{ color: 'var(--lj-muted)' }}>Call</div>
                <div className="text-[18px] font-medium" style={{ color: 'var(--lj-text)' }}>585-710-8292</div>
                <div className="text-[12.5px] mt-1" style={{ color: 'var(--lj-muted)' }}>Mon-Sat · 10am-7pm ET</div>
              </div>
            </a>

            <a href="mailto:ansh@thelocaljewel.com" data-testid="contact-card-email"
              className="flex items-start gap-4 p-5 rounded-[14px] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(15,94,76,0.10)]"
              style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(15,94,76,0.08)' }}>
                <Mail size={18} style={{ color: 'var(--lj-accent)' }} />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] mb-1" style={{ color: 'var(--lj-muted)' }}>Email</div>
                <div className="text-[16px] font-medium" style={{ color: 'var(--lj-text)' }}>ansh@thelocaljewel.com</div>
                <div className="text-[12.5px] mt-1" style={{ color: 'var(--lj-muted)' }}>Replies usually within a few hours</div>
              </div>
            </a>

            <div data-testid="contact-card-location"
              className="flex items-start gap-4 p-5 rounded-[14px]"
              style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(15,94,76,0.08)' }}>
                <MapPin size={18} style={{ color: 'var(--lj-accent)' }} />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] mb-1" style={{ color: 'var(--lj-muted)' }}>Studio</div>
                <div className="text-[16px] font-medium leading-snug" style={{ color: 'var(--lj-text)' }}>480N Orlando Ave<br />Winter Park, FL 32789</div>
                <a href="https://maps.google.com/?q=480N+Orlando+Ave+Winter+Park+FL+32789" target="_blank" rel="noopener noreferrer"
                  className="text-[12.5px] mt-1 inline-block hover:underline" style={{ color: 'var(--lj-accent)' }}>
                  Open in Google Maps →
                </a>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="rounded-[18px] p-5 sm:p-7"
            style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
            {sent ? (
              <div className="py-10 text-center" data-testid="contact-success">
                <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'var(--lj-accent)' }}>
                  <Check size={26} style={{ color: '#FFFFFF' }} strokeWidth={2.8} />
                </div>
                <h3 className="text-[22px] font-semibold mb-2" style={{ color: 'var(--lj-text)' }}>Got it.</h3>
                <p className="text-[14px] leading-[1.55] max-w-sm mx-auto" style={{ color: 'var(--lj-muted)' }}>
                  Thanks for reaching out — we'll get back to you within a few hours. For urgent questions, call <a href="tel:+15857108292" className="underline" style={{ color: 'var(--lj-accent)' }}>585-710-8292</a>.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3" data-testid="contact-form">
                <h3 className="text-[18px] font-semibold mb-3" style={{ color: 'var(--lj-text)' }}>Send us a message</h3>
                <input data-testid="contact-name" type="text" placeholder="Your name *" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full min-h-[48px] px-4 rounded-[12px] text-[15px] outline-none"
                  style={{ background: 'var(--lj-bg)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }} />
                <div className="grid sm:grid-cols-2 gap-3">
                  <input data-testid="contact-email" type="email" placeholder="Email *" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full min-h-[48px] px-4 rounded-[12px] text-[15px] outline-none"
                    style={{ background: 'var(--lj-bg)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }} />
                  <input data-testid="contact-phone" type="tel" placeholder="Phone (optional)" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full min-h-[48px] px-4 rounded-[12px] text-[15px] outline-none"
                    style={{ background: 'var(--lj-bg)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }} />
                </div>
                <input data-testid="contact-subject" type="text" placeholder="Subject (optional)" value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="w-full min-h-[48px] px-4 rounded-[12px] text-[15px] outline-none"
                  style={{ background: 'var(--lj-bg)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }} />
                <textarea data-testid="contact-message" rows={5} placeholder="What's on your mind? *" value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-[12px] text-[15px] outline-none resize-none"
                  style={{ background: 'var(--lj-bg)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)', fontFamily: 'inherit' }} />
                {err && <div data-testid="contact-error" className="px-3 py-2 rounded-[10px] text-[12.5px]"
                  style={{ background: 'rgba(192,57,43,0.08)', color: '#c0392b', border: '1px solid rgba(192,57,43,0.18)' }}>{err}</div>}
                <button type="submit" disabled={sending} data-testid="contact-submit"
                  className="w-full min-h-[52px] rounded-[12px] font-medium text-[15.5px] inline-flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.99] disabled:opacity-70"
                  style={{ background: 'var(--lj-accent)', color: '#FFFFFF', boxShadow: '0 6px 18px rgba(15,94,76,0.22)' }}>
                  {sending ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <><Send size={16} /> Send message</>}
                </button>
                <p className="text-[11.5px] text-center" style={{ color: 'var(--lj-muted)' }}>We never share your info. Real human replies.</p>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="px-4 py-8 text-center mt-auto" style={{ borderTop: '1px solid var(--lj-border)' }}>
        <div className="flex items-center justify-center gap-3 text-[12px] flex-wrap" style={{ color: 'var(--lj-muted)' }}>
          <a href="/" className="hover:underline">Home</a>
          <span>·</span>
          <a href="/projects" className="hover:underline">Projects</a>
          <span>·</span>
          <a href="/blog" className="hover:underline">Journal</a>
          <span>·</span>
          <a href="/privacy" className="hover:underline">Privacy</a>
          <span>·</span>
          <a href="/terms" className="hover:underline">Terms</a>
        </div>
      </footer>
    </div>
  );
}
