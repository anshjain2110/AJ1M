import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Mail, Phone, User, Check, Loader2 } from 'lucide-react';
import axios from 'axios';
import { trackEvent } from '../../utils/analytics';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * 3-step "quick quote" modal:
 *   1. Name
 *   2. Email     (copy: "Email me the renders + quote")
 *   3. Phone     (copy: "Call me if you have questions")
 *   → Success   "Your account is ready"
 */
export default function QuickQuoteModal({ onClose, inspirationLink, inspirationFiles, inspirationNotes }) {
  const [step, setStep] = useState(1);                 // 1, 2, 3, 4 (success)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validPhone = phone.replace(/\D/g, '').length >= 10;

  const goNext = () => {
    setError('');
    if (step === 1) {
      if (!name.trim()) { setError('Please tell us your name'); return; }
      trackEvent('tlj_quick_quote_step', { step: 'name_done' });
      setStep(2);
    } else if (step === 2) {
      if (!validEmail) { setError("That email doesn't look right"); return; }
      trackEvent('tlj_quick_quote_step', { step: 'email_done' });
      setStep(3);
    } else if (step === 3) {
      submit();
    }
  };

  const submit = async () => {
    if (!validPhone) { setError('Please enter a valid phone number'); return; }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        inspiration_link: inspirationLink || '',
        inspiration_files: inspirationFiles || [],
        inspiration_notes: inspirationNotes || '',
      };
      const { data } = await axios.post(`${BACKEND_URL}/api/leads/quick`, payload);
      trackEvent('tlj_quick_quote_submit', { lead_id: data.lead_id });
      // Save token for dashboard
      if (data.token) localStorage.setItem('tlj_customer_token', data.token);
      setStep(4);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        data-testid="quick-quote-modal"
        className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8"
        style={{ background: 'rgba(10, 23, 20, 0.62)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md rounded-[20px] overflow-hidden"
          style={{ background: 'var(--lj-bg)', boxShadow: '0 30px 80px rgba(0,0,0,0.35)' }}
          onClick={(e) => e.stopPropagation()}>

          {/* Close */}
          <button onClick={onClose} data-testid="quick-quote-close"
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-[#F4F1EC] z-10"
            style={{ color: 'var(--lj-muted)' }}>
            <X size={18} />
          </button>

          {/* Step indicator */}
          {step < 4 && (
            <div className="px-7 pt-7 pb-2">
              <div className="flex items-center gap-1.5 mb-2" data-testid="quick-quote-stepper">
                {[1, 2, 3].map(s => (
                  <div key={s} className="flex-1 h-1 rounded-full transition-all duration-400"
                    style={{ background: s <= step ? 'var(--lj-accent)' : 'rgba(15,94,76,0.15)' }} />
                ))}
              </div>
              <div className="text-[10.5px] uppercase tracking-[0.16em]" style={{ color: 'var(--lj-muted)' }}>
                Step {step} of 3
              </div>
            </div>
          )}

          <div className="px-7 pt-3 pb-7">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <Step key="1" icon={User}
                  title="What's your name?"
                  sub="So we know who we're designing for."
                  value={name} setValue={setName}
                  placeholder="First name" type="text" inputTestId="quick-quote-name"
                  cta="Continue" onSubmit={goNext} error={error} autoFocus />
              )}
              {step === 2 && (
                <Step key="2" icon={Mail}
                  title="Email me the renders and quote"
                  sub="We'll send your 3D renders and a written quote within 24-48 hours."
                  value={email} setValue={setEmail}
                  placeholder="you@example.com" type="email" inputTestId="quick-quote-email"
                  cta="Continue" onSubmit={goNext} error={error} autoFocus />
              )}
              {step === 3 && (
                <Step key="3" icon={Phone}
                  title="Call me if I have questions"
                  sub="Optional but recommended - we'll only call if you need help or have a question about your design."
                  value={phone} setValue={setPhone}
                  placeholder="(555) 123-4567" type="tel" inputTestId="quick-quote-phone"
                  cta={submitting ? 'Creating your account...' : 'Send me my quote'}
                  onSubmit={goNext} error={error} submitting={submitting} autoFocus />
              )}
              {step === 4 && <SuccessStep key="4" name={name} onClose={onClose} />}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const Step = ({ icon: Icon, title, sub, value, setValue, placeholder, type, inputTestId, cta, onSubmit, error, submitting, autoFocus }) => (
  <motion.div
    initial={{ opacity: 0, x: 12 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -12 }}
    transition={{ duration: 0.25 }}>

    <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-4"
      style={{ background: 'rgba(15,94,76,0.10)' }}>
      <Icon size={20} style={{ color: 'var(--lj-accent)' }} />
    </div>

    <h2 className="text-[24px] sm:text-[26px] leading-[1.2] tracking-[-0.01em] font-semibold mb-1.5"
      style={{ color: 'var(--lj-text)' }}>
      {title}
    </h2>
    <p className="text-[13.5px] leading-[1.5] mb-5" style={{ color: 'var(--lj-muted)' }}>{sub}</p>

    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        type={type}
        data-testid={inputTestId}
        className="w-full min-h-[54px] px-4 rounded-[14px] text-[16px] outline-none transition-colors mb-2"
        style={{ background: 'var(--lj-surface)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }}
      />
      {error && <div className="text-[12.5px] mb-2 px-1" style={{ color: 'var(--lj-danger, #c0392b)' }}>{error}</div>}

      <button
        type="submit"
        disabled={submitting}
        data-testid="quick-quote-step-submit"
        className="mt-3 w-full min-h-[54px] px-6 rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.99] disabled:opacity-70"
        style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}>
        {submitting ? <Loader2 size={18} className="animate-spin" /> : <>{cta} <ArrowRight size={18} /></>}
      </button>
    </form>
  </motion.div>
);

const SuccessStep = ({ name, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    className="text-center py-4">

    <motion.div
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.05 }}
      className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
      style={{ background: 'var(--lj-accent)', boxShadow: '0 10px 28px rgba(15,94,76,0.30)' }}>
      <Check size={26} style={{ color: '#FFFFFF' }} strokeWidth={2.8} />
    </motion.div>

    <h2 className="text-[26px] sm:text-[28px] leading-[1.15] font-semibold tracking-[-0.01em] mb-2"
      style={{ color: 'var(--lj-text)' }}>
      You're all set{name ? `, ${name}` : ''}!
    </h2>
    <p className="text-[14px] leading-[1.55] max-w-sm mx-auto mb-6" style={{ color: 'var(--lj-muted)' }}>
      Your account is ready. Renders + a written quote are heading to your inbox within 24-48 hours.
      Track everything from your dashboard.
    </p>

    <div className="flex flex-col sm:flex-row gap-2.5">
      <a href="/dashboard" data-testid="quick-quote-go-dashboard"
        className="flex-1 min-h-[52px] px-5 rounded-[14px] font-medium text-[15px] inline-flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.99]"
        style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}>
        Go to my dashboard <ArrowRight size={16} />
      </a>
      <button onClick={onClose} data-testid="quick-quote-success-close"
        className="flex-1 min-h-[52px] px-5 rounded-[14px] font-medium text-[15px] transition-colors hover:bg-[#F4F1EC]"
        style={{ background: 'transparent', color: 'var(--lj-text)', border: '1.5px solid var(--lj-border)' }}>
        Keep browsing
      </button>
    </div>
  </motion.div>
);
