import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, X, MessageCircle, Loader2, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Marketplace-style chat for project detail pages AND embedded inside cards.
 * Renders a sticky "Send seller a message" box with an editable pre-filled bubble.
 * On send → opens a sheet that captures name/email/phone in one step (Q1.a),
 * fires /api/projects/{slug}/inquire, saves JWT, then shows a success/chat view.
 *
 * Props:
 *   compact: bool — render slimmer (no header/footnote) for grid cards
 */
export default function ProjectInquiryChat({ project, defaultMessage = "Hi - is this available?", compact = false }) {
  const [message, setMessage] = useState(defaultMessage);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [contact, setContact] = useState({ name: '', email: '', phone: '' });
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState(null);
  const inputRef = useRef(null);

  // If a user JWT already exists, pre-fill from localStorage user
  useEffect(() => {
    try {
      const u = localStorage.getItem('tlj_user');
      if (u) {
        const parsed = JSON.parse(u);
        setContact(c => ({
          name: parsed.first_name || parsed.name || c.name,
          email: parsed.email || c.email,
          phone: parsed.phone || c.phone,
        }));
      }
    } catch (e) {}
  }, []);

  const openSheet = () => {
    if (!message.trim()) { inputRef.current?.focus(); return; }
    setErr('');
    setSheetOpen(true);
  };

  const send = async (e) => {
    if (e) e.preventDefault();
    setErr('');
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim());
    const validPhone = contact.phone.replace(/\D/g, '').length >= 10;
    if (!contact.name.trim()) { setErr('Please tell us your name'); return; }
    if (!validEmail) { setErr("That email doesn't look right"); return; }
    if (!validPhone) { setErr('Please enter a valid phone number (10+ digits)'); return; }
    setSending(true);
    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/projects/${project.slug}/inquire`, {
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        message: message.trim(),
      });
      if (data.token) {
        localStorage.setItem('tlj_token', data.token);
        localStorage.setItem('tlj_user', JSON.stringify({ user_id: data.user_id, first_name: contact.name, email: contact.email, phone: contact.phone }));
      }
      setSuccess({ thread_id: data.thread_id });
    } catch (e2) {
      setErr(e2?.response?.data?.detail || 'Could not send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Inline send-message bar (looks like Facebook marketplace) */}
      <div data-testid="project-inquiry-bar"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className={compact ? "rounded-[14px] p-2.5" : "rounded-[16px] p-4"}
        style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
        {!compact && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(15,94,76,0.10)' }}>
              <MessageCircle size={14} style={{ color: 'var(--lj-accent)' }} />
            </div>
            <div className="text-[14px] font-medium" style={{ color: 'var(--lj-text)' }}>Send the jeweler a message</div>
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); openSheet(); }} className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            data-testid="project-inquiry-input"
            placeholder="Hi - is this available?"
            className={(compact ? "min-h-[38px] text-[13.5px] px-3 " : "min-h-[44px] text-[14.5px] px-4 ") + "flex-1 rounded-full outline-none transition-colors"}
            style={{ background: 'var(--lj-bg)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }}
          />
          <button
            type="submit"
            data-testid="project-inquiry-send"
            disabled={!message.trim()}
            aria-label="Send message"
            className={(compact ? "w-9 h-9" : "w-11 h-11") + " rounded-full flex-shrink-0 flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50"}
            style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}
          >
            <Send size={compact ? 14 : 16} />
          </button>
        </form>
        {!compact && (
          <p className="mt-2 text-[11.5px]" style={{ color: 'var(--lj-muted)' }}>
            Real human reply — usually within a few hours.
          </p>
        )}
      </div>

      {/* Contact-gate sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            data-testid="project-inquiry-sheet"
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center px-0 sm:px-4 py-0 sm:py-8 overflow-y-auto"
            style={{ background: 'rgba(10,23,20,0.55)', backdropFilter: 'blur(6px)' }}
            onClick={() => !sending && setSheetOpen(false)}>
            <motion.div
              initial={{ y: 32, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="w-full sm:max-w-md rounded-t-[22px] sm:rounded-[20px] overflow-hidden"
              style={{ background: 'var(--lj-bg)', boxShadow: '0 30px 80px rgba(0,0,0,0.35)' }}
              onClick={(e) => e.stopPropagation()}>

              {!success ? (
                <>
                  <div className="p-5 sm:p-6 flex items-start justify-between"
                    style={{ borderBottom: '1px solid var(--lj-border)' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      {project.hero_image_url && (
                        <img src={project.hero_image_url} alt="" className="w-11 h-11 rounded-[10px] object-cover flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--lj-muted)' }}>Sending message about</div>
                        <div className="text-[14.5px] font-medium truncate" style={{ color: 'var(--lj-text)' }}>{project.title}</div>
                      </div>
                    </div>
                    <button onClick={() => !sending && setSheetOpen(false)} aria-label="Close" data-testid="inquiry-sheet-close"
                      className="ml-2 w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-[#F4F1EC]" style={{ color: 'var(--lj-muted)' }}>
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={send} className="p-5 sm:p-6 space-y-3">
                    {/* Message preview (editable) */}
                    <div className="rounded-[14px] p-3" style={{ background: 'rgba(15,94,76,0.04)', border: '1px solid rgba(15,94,76,0.14)' }}>
                      <div className="text-[10.5px] uppercase tracking-[0.12em] mb-1.5" style={{ color: 'var(--lj-accent)' }}>Your message</div>
                      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2}
                        data-testid="inquiry-sheet-message"
                        className="w-full text-[14px] leading-[1.5] outline-none resize-none bg-transparent" style={{ color: 'var(--lj-text)', fontFamily: 'inherit' }} />
                    </div>

                    <input data-testid="inquiry-sheet-name" type="text" value={contact.name}
                      onChange={(e) => setContact({ ...contact, name: e.target.value })}
                      placeholder="Your name *" autoFocus
                      className="w-full min-h-[48px] px-4 rounded-[12px] text-[15px] outline-none"
                      style={{ background: 'var(--lj-surface)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }} />

                    <input data-testid="inquiry-sheet-email" type="email" value={contact.email}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                      placeholder="Email *"
                      className="w-full min-h-[48px] px-4 rounded-[12px] text-[15px] outline-none"
                      style={{ background: 'var(--lj-surface)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }} />

                    <input data-testid="inquiry-sheet-phone" type="tel" value={contact.phone}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                      placeholder="Phone (for fastest reply) *"
                      className="w-full min-h-[48px] px-4 rounded-[12px] text-[15px] outline-none"
                      style={{ background: 'var(--lj-surface)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }} />

                    {err && (
                      <div data-testid="inquiry-sheet-error" className="px-3 py-2 rounded-[10px] text-[12.5px]"
                        style={{ background: 'rgba(192,57,43,0.08)', color: '#c0392b', border: '1px solid rgba(192,57,43,0.18)' }}>{err}</div>
                    )}

                    <button type="submit" disabled={sending} data-testid="inquiry-sheet-submit"
                      className="w-full min-h-[52px] rounded-[12px] font-medium text-[15.5px] inline-flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70"
                      style={{ background: 'var(--lj-accent)', color: '#FFFFFF', boxShadow: '0 6px 18px rgba(15,94,76,0.22)' }}>
                      {sending ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <><Send size={16} /> Send message</>}
                    </button>

                    <p className="text-[11.5px] text-center" style={{ color: 'var(--lj-muted)' }}>
                      We'll only contact you about this piece. No spam, ever.
                    </p>
                  </form>
                </>
              ) : (
                <div className="p-7 sm:p-9 text-center" data-testid="inquiry-sheet-success">
                  <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: 'var(--lj-accent)' }}>
                    <Check size={26} style={{ color: '#FFFFFF' }} strokeWidth={2.8} />
                  </div>
                  <h3 className="text-[22px] font-semibold mb-2" style={{ color: 'var(--lj-text)' }}>Sent!</h3>
                  <p className="text-[14px] leading-[1.55] max-w-sm mx-auto mb-6" style={{ color: 'var(--lj-muted)' }}>
                    A jeweler will reply within a few hours — by email, text, or right here in your account.
                  </p>
                  <a href="/dashboard" data-testid="inquiry-sheet-dashboard"
                    className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-[12px] font-medium text-[15px] transition-all active:scale-[0.99]"
                    style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}>
                    View my messages <ArrowRight size={16} />
                  </a>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
