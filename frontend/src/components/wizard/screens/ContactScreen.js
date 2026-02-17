import React, { useState } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { ArrowRight, Loader2, Lock, User, Mail, Phone as PhoneIcon, MessageSquare } from 'lucide-react';
import { trackEvent } from '../../../utils/analytics';

export default function ContactScreen() {
  const { state, submitLead } = useWizard();
  const [form, setForm] = useState({
    first_name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'Please enter your name';
    if (!form.email.trim()) {
      errs.email = 'Please enter your email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email';
    }
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      trackEvent('tlj_contact_submit_attempt', { validation_errors_count: Object.keys(errs).length }, { lead_id: state.leadId });
      return;
    }
    
    trackEvent('tlj_contact_submit_attempt', { validation_errors_count: 0 }, { lead_id: state.leadId });
    setSubmitError('');
    
    try {
      await submitLead(form);
    } catch (err) {
      setSubmitError('Something went wrong. Please try again.');
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-6 max-w-[520px] mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-[22px] leading-[28px] font-medium tracking-[-0.005em] mb-2" style={{ color: 'var(--lj-text)' }}>
          Almost there! How should we reach you?
        </h2>
        <p className="text-[13px] leading-[18px]" style={{ color: 'var(--lj-muted)' }}>
          We'll personally reach out within 24 hours
        </p>
      </div>

      <div className="space-y-4 flex-1">
        {/* First Name */}
        <div>
          <label className="text-[13px] leading-[18px] mb-1.5 block font-medium" style={{ color: 'var(--lj-muted)' }}>
            First Name *
          </label>
          <div className="relative">
            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--lj-muted)' }} />
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              placeholder="Your first name"
              data-testid="contact-form-name-input"
              className="w-full min-h-[48px] pl-11 pr-4 py-3 rounded-[10px] text-[16px] transition-colors duration-300"
              style={{
                background: 'var(--lj-surface)',
                border: `1.5px solid ${errors.first_name ? 'var(--lj-danger)' : 'var(--lj-border)'}`,
                color: 'var(--lj-text)',
              }}
            />
          </div>
          {errors.first_name && <p className="mt-1 text-[13px]" style={{ color: 'var(--lj-danger)' }} data-testid="contact-form-error-text">{errors.first_name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="text-[13px] leading-[18px] mb-1.5 block font-medium" style={{ color: 'var(--lj-muted)' }}>
            Email *
          </label>
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--lj-muted)' }} />
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="your@email.com"
              data-testid="contact-form-email-input"
              className="w-full min-h-[48px] pl-11 pr-4 py-3 rounded-[10px] text-[16px] transition-colors duration-300"
              style={{
                background: 'var(--lj-surface)',
                border: `1.5px solid ${errors.email ? 'var(--lj-danger)' : 'var(--lj-border)'}`,
                color: 'var(--lj-text)',
              }}
            />
          </div>
          {errors.email && <p className="mt-1 text-[13px]" style={{ color: 'var(--lj-danger)' }} data-testid="contact-form-error-text">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="text-[13px] leading-[18px] mb-1.5 block font-medium" style={{ color: 'var(--lj-muted)' }}>
            Phone <span style={{ color: 'var(--lj-muted)' }}>(optional)</span>
          </label>
          <div className="relative">
            <PhoneIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--lj-muted)' }} />
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="For faster responses via text"
              data-testid="contact-form-phone-input"
              className="w-full min-h-[48px] pl-11 pr-4 py-3 rounded-[10px] text-[16px] transition-colors duration-300"
              style={{
                background: 'var(--lj-surface)',
                border: '1.5px solid var(--lj-border)',
                color: 'var(--lj-text)',
              }}
            />
          </div>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--lj-muted)' }}>For faster responses via text</p>
        </div>

        {/* Notes */}
        <div>
          <label className="text-[13px] leading-[18px] mb-1.5 block font-medium" style={{ color: 'var(--lj-muted)' }}>
            Anything else we should know?
          </label>
          <div className="relative">
            <MessageSquare size={18} className="absolute left-4 top-4" style={{ color: 'var(--lj-muted)' }} />
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Timeline, specific requests, questions..."
              rows={3}
              data-testid="contact-form-notes-input"
              className="w-full min-h-[80px] pl-11 pr-4 py-3 rounded-[10px] text-[16px] resize-none transition-colors duration-300"
              style={{
                background: 'var(--lj-surface)',
                border: '1.5px solid var(--lj-border)',
                color: 'var(--lj-text)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="sticky bottom-0 pt-4 pb-6 mt-6" style={{ background: 'var(--lj-bg)' }}>
        {submitError && (
          <p className="mb-3 text-[13px] text-center" style={{ color: 'var(--lj-danger)' }}>{submitError}</p>
        )}
        
        <button
          onClick={handleSubmit}
          disabled={state.isSubmitting}
          data-testid="contact-form-submit-button"
          className="w-full min-h-[52px] px-6 rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.99]"
          style={{ 
            background: 'var(--lj-accent)', 
            color: '#0B0B0C',
            boxShadow: '0 4px 20px rgba(201, 168, 106, 0.25)',
            opacity: state.isSubmitting ? 0.7 : 1,
          }}
        >
          {state.isSubmitting ? (
            <><Loader2 size={18} className="animate-spin" /> Submitting...</>
          ) : (
            <><span>Get My Free Quote</span><ArrowRight size={18} /></>
          )}
        </button>
        
        {/* Trust text */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <Lock size={14} style={{ color: 'var(--lj-muted)' }} />
          <p className="text-[13px] leading-[18px] text-center" style={{ color: 'var(--lj-muted)' }}>
            Your info stays private. No spam, ever. I'll personally reach out within 24 hours. \u2014 AJ
          </p>
        </div>
      </div>
    </div>
  );
}
