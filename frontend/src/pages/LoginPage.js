import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Mail, KeyRound } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('identifier'); // 'identifier' or 'otp'
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleSendOtp = async () => {
    if (!identifier.trim()) {
      setError('Please enter your email or phone');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/auth/request-otp`, { identifier: identifier.trim() });
      setStep('otp');
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/verify-otp`, {
        identifier: identifier.trim(),
        otp_code: otp,
      });
      localStorage.setItem('tlj_token', res.data.token);
      localStorage.setItem('tlj_user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    setOtp(cleaned);
    if (cleaned.length === 6) {
      // Auto-submit
      setTimeout(() => {
        setError('');
        setLoading(true);
        axios.post(`${BACKEND_URL}/api/auth/verify-otp`, {
          identifier: identifier.trim(),
          otp_code: cleaned,
        }).then(res => {
          localStorage.setItem('tlj_token', res.data.token);
          localStorage.setItem('tlj_user', JSON.stringify(res.data.user));
          navigate('/dashboard');
        }).catch(err => {
          setError(err.response?.data?.detail || 'Invalid OTP');
          setLoading(false);
        });
      }, 200);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--lj-bg)' }}>
      {/* Header */}
      <header className="px-4 py-3 flex items-center" style={{ borderBottom: '1px solid var(--lj-border)' }}>
        <img src="/logo-main.png" alt="The Local Jewel" className="h-8 object-contain" />
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px]">
          <div 
            className="p-6 rounded-[18px]"
            style={{ 
              background: 'var(--lj-surface)', 
              border: '1px solid var(--lj-border)',
              boxShadow: 'var(--lj-shadow-2)',
            }}
          >
            {step === 'identifier' ? (
              <>
                <h2 className="text-[22px] leading-[28px] font-medium mb-2" style={{ color: 'var(--lj-text)' }}>
                  Welcome back
                </h2>
                <p className="text-[13px] leading-[18px] mb-6" style={{ color: 'var(--lj-muted)' }}>
                  Enter your email or phone to log in
                </p>

                <div className="relative mb-4">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--lj-muted)' }} />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                    placeholder="Email or phone number"
                    data-testid="otp-login-phone-input"
                    className="w-full min-h-[48px] pl-11 pr-4 py-3 rounded-[10px] text-[16px] transition-colors duration-300"
                    style={{ background: 'var(--lj-bg)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  />
                </div>

                {error && <p className="mb-3 text-[13px]" style={{ color: 'var(--lj-danger)' }}>{error}</p>}

                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  data-testid="otp-login-send-otp-button"
                  className="w-full min-h-[48px] px-6 rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2 transition-all duration-300"
                  style={{ background: 'var(--lj-accent)', color: '#0B0B0C' }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send OTP'}
                </button>
              </>
            ) : (
              <>
                <h2 className="text-[22px] leading-[28px] font-medium mb-2" style={{ color: 'var(--lj-text)' }}>
                  Enter verification code
                </h2>
                <p className="text-[13px] leading-[18px] mb-6" style={{ color: 'var(--lj-muted)' }}>
                  We sent a 6-digit code to {identifier}
                </p>

                <div className="relative mb-4">
                  <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--lj-muted)' }} />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => handleOtpChange(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    data-testid="otp-login-otp-input"
                    className="w-full min-h-[48px] pl-11 pr-4 py-3 rounded-[10px] text-[16px] text-center tracking-[0.5em] font-mono transition-colors duration-300"
                    style={{ background: 'var(--lj-bg)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }}
                    autoFocus
                  />
                </div>

                {error && <p className="mb-3 text-[13px]" style={{ color: 'var(--lj-danger)' }}>{error}</p>}

                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  data-testid="otp-login-verify-button"
                  className="w-full min-h-[48px] px-6 rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2 transition-all duration-300 mb-4"
                  style={{ 
                    background: otp.length === 6 ? 'var(--lj-accent)' : '#2A2A2E', 
                    color: otp.length === 6 ? '#0B0B0C' : 'var(--lj-muted)',
                  }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Verify'}
                </button>

                <button
                  onClick={handleSendOtp}
                  disabled={cooldown > 0}
                  className="w-full text-[13px] text-center transition-colors duration-300"
                  style={{ color: cooldown > 0 ? 'var(--lj-muted)' : 'var(--lj-accent)' }}
                >
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                </button>
              </>
            )}
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/')}
              className="text-[13px] transition-colors duration-300"
              style={{ color: 'var(--lj-muted)' }}
            >
              \u2190 Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
