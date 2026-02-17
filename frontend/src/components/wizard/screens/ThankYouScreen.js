import React from 'react';
import { useWizard } from '../../../context/WizardContext';
import { CheckCircle, ExternalLink, Instagram, Phone, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ThankYouScreen() {
  const { state } = useWizard();
  const navigate = useNavigate();
  const firstName = state.submitResult?.first_name || 'there';

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 max-w-[520px] mx-auto w-full text-center">
      {/* Success Icon */}
      <div 
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ 
          background: 'rgba(86, 194, 113, 0.1)',
          border: '2px solid rgba(86, 194, 113, 0.3)',
        }}
      >
        <CheckCircle size={40} style={{ color: 'var(--lj-success)' }} />
      </div>

      {/* Confirmation */}
      <h2 
        className="text-[28px] leading-[34px] font-semibold mb-3"
        style={{ color: 'var(--lj-text)' }}
      >
        You're all set!
      </h2>
      
      <p 
        className="text-[16px] leading-[24px] mb-8 max-w-sm"
        style={{ color: 'var(--lj-muted)' }}
      >
        Thanks {firstName}! I'll personally review your request and reach out within 24 hours.
      </p>

      {/* AJ Card */}
      <div 
        className="w-full p-5 rounded-[14px] mb-8 flex items-center gap-4"
        style={{ 
          background: 'var(--lj-surface)', 
          border: '1px solid var(--lj-border)',
        }}
      >
        <div 
          className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-[20px] font-bold"
          style={{ 
            background: 'rgba(201, 168, 106, 0.15)',
            color: 'var(--lj-accent)',
            border: '1px solid rgba(201, 168, 106, 0.2)',
          }}
        >
          AJ
        </div>
        <div className="text-left">
          <p className="text-[16px] font-medium" style={{ color: 'var(--lj-text)' }}>Ansh</p>
          <p className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>The Local Jewel</p>
        </div>
      </div>

      {/* Account created notice */}
      <div 
        className="w-full px-4 py-3 rounded-[10px] mb-6 text-[13px]"
        style={{ 
          background: 'rgba(86, 194, 113, 0.08)',
          border: '1px solid rgba(86, 194, 113, 0.15)',
          color: 'var(--lj-success)',
        }}
      >
        Your account has been created. You can log in anytime to check your quote status.
      </div>

      {/* In the meantime */}
      <p className="text-[13px] uppercase tracking-widest mb-4 font-medium" style={{ color: 'var(--lj-muted)' }}>
        In the Meantime
      </p>

      <div className="w-full space-y-3">
        <a
          href="https://thelocaljewel.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[48px] px-6 rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2 transition-all duration-300"
          style={{ 
            background: 'var(--lj-accent)', 
            color: '#0B0B0C',
          }}
        >
          Browse Ready-to-Ship Pieces
          <ExternalLink size={16} />
        </a>
        
        <a
          href="https://instagram.com/thelocaljewel"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[48px] px-6 rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2 transition-all duration-300"
          style={{ 
            background: 'var(--lj-surface)', 
            color: 'var(--lj-text)',
            border: '1px solid var(--lj-border)',
          }}
        >
          <Instagram size={18} />
          Follow us on Instagram
        </a>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full min-h-[48px] px-6 rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2 transition-all duration-300"
          style={{ 
            background: 'transparent', 
            color: 'var(--lj-accent)',
            border: '1px solid var(--lj-border)',
          }}
        >
          Go to Dashboard
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Contact */}
      <div className="mt-8 flex items-center gap-2">
        <Phone size={14} style={{ color: 'var(--lj-muted)' }} />
        <a href="tel:+1234567890" className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>
          Questions? Call or text us
        </a>
      </div>
    </div>
  );
}
