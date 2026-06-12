import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, KeyRound } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('identifier');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [shownOtp, setShownOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleGoogle = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const finishLogin = (res) => {
    localStorage.setItem('tlj_token', res.data.token);
    localStorage.setItem('tlj_user', JSON.stringify(res.data.user));
    navigate('/dashboard');
  };

  const handleSendOtp = async () => {
    if (!identifier.trim()) { setError('Please enter your email or phone'); return; }
    setError(''); setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/request-otp`, { identifier: identifier.trim() });
      setShownOtp(res.data.otp || '');
      setStep('otp');
      setCooldown(60);
      const iv = setInterval(() => setCooldown(p => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; }), 1000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate code');
    } finally { setLoading(false); }
  };

  const verify = async (code) => {
    setError(''); setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/verify-otp`, { identifier: identifier.trim(), otp_code: code });
      finishLogin(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid code');
      setLoading(false);
    }
  };

  const handleOtpChange = (val) => {
    const c = val.replace(/\D/g, '').slice(0, 6);
    setOtp(c);
    if (c.length === 6) setTimeout(() => verify(c), 150);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FBF7F0', fontFamily: "'Outfit', Inter, system-ui, sans-serif" }}>
      <header className="px-4 py-3 flex items-center" style={{ borderBottom: '1px solid #E5E0D7' }}>
        <a href="/"><img src="/logo-main.png" alt="The Local Jewel" className="h-10 object-contain" /></a>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[420px]">
          <div className="p-7 rounded-[18px]" style={{ background: '#fff', border: '1px solid #E5E0D7', boxShadow: '0 8px 30px rgba(26,37,32,0.06)' }}>
            {step === 'identifier' ? (<>
              <h1 className="text-[30px] leading-[34px] mb-1.5" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#1A2520' }}>Your account</h1>
              <p className="text-[13.5px] leading-[19px] mb-6" style={{ color: '#6B746F' }}>Track your orders, quotes and messages.</p>

              <button onClick={handleGoogle} data-testid="google-login-button"
                className="w-full min-h-[48px] px-6 rounded-full font-medium text-[15px] flex items-center justify-center gap-2.5 transition-colors hover:bg-[#F7F7F5]"
                style={{ background: '#fff', color: '#1A2520', border: '1.5px solid #D3CDC1' }}>
                <GoogleG /> Continue with Google
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ background: '#E5E0D7' }} />
                <span className="text-[11px] uppercase tracking-wider" style={{ color: '#9AA39E' }}>or use a code</span>
                <div className="flex-1 h-px" style={{ background: '#E5E0D7' }} />
              </div>

              <div className="relative mb-4">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#9AA39E' }} />
                <input type="text" value={identifier} onChange={e => { setIdentifier(e.target.value); setError(''); }}
                  placeholder="Email or phone number" data-testid="otp-login-phone-input"
                  className="w-full min-h-[48px] pl-11 pr-4 py-3 rounded-[12px] text-[16px] outline-none"
                  style={{ background: '#FBF7F0', border: '1.5px solid #E5E0D7', color: '#1A2520' }}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()} />
              </div>
              {error && <p className="mb-3 text-[13px]" style={{ color: '#B14B3B' }} data-testid="login-error">{error}</p>}
              <button onClick={handleSendOtp} disabled={loading} data-testid="otp-login-send-otp-button"
                className="w-full min-h-[48px] px-6 rounded-full font-semibold text-[15px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: '#0F5E4C', color: '#FFFFFF' }}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send code'}
              </button>
              <p className="mt-4 text-[12px] text-center leading-[1.5]" style={{ color: '#9AA39E' }}>
                New here? Entering your email or phone creates your account instantly.
              </p>
            </>) : (<>
              <button onClick={() => { setStep('identifier'); setOtp(''); setShownOtp(''); setError(''); }} className="inline-flex items-center gap-1.5 text-[13px] mb-4" style={{ color: '#6B746F' }}>
                <ArrowLeft size={14} /> {identifier}
              </button>
              <h1 className="text-[26px] leading-[30px] mb-1.5" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#1A2520' }}>Enter your code</h1>

              {shownOtp ? (
                <div className="mt-4 mb-5 p-4 rounded-[14px] text-center" style={{ background: '#E9F5EE', border: '1.5px dashed #0F5E4C' }} data-testid="otp-display-code">
                  <p className="text-[11px] uppercase tracking-[0.14em] font-semibold mb-1" style={{ color: '#0F5E4C' }}>Your verification code</p>
                  <p className="text-[32px] font-bold font-mono leading-none" style={{ color: '#0F5E4C', letterSpacing: '0.3em', textIndent: '0.3em' }}>{shownOtp}</p>
                  <p className="text-[12px] mt-2" style={{ color: '#3F4A45' }}>Type this code below to sign in</p>
                </div>
              ) : (
                <p className="text-[13px] leading-[18px] mt-1 mb-5" style={{ color: '#6B746F' }}>We sent a 6-digit code to {identifier}</p>
              )}

              <div className="relative mb-4">
                <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#9AA39E' }} />
                <input type="text" inputMode="numeric" value={otp} onChange={e => handleOtpChange(e.target.value)}
                  placeholder="000000" maxLength={6} data-testid="otp-login-otp-input"
                  className="w-full min-h-[48px] pl-11 pr-4 py-3 rounded-[12px] text-[18px] text-center tracking-[0.5em] font-mono outline-none"
                  style={{ background: '#FBF7F0', border: '1.5px solid #E5E0D7', color: '#1A2520' }} autoFocus />
              </div>
              {error && <p className="mb-3 text-[13px]" style={{ color: '#B14B3B' }} data-testid="login-error">{error}</p>}
              <button onClick={() => verify(otp)} disabled={loading || otp.length !== 6} data-testid="otp-login-verify-button"
                className="w-full min-h-[48px] px-6 rounded-full font-semibold text-[15px] flex items-center justify-center gap-2 mb-4 transition-opacity"
                style={{ background: otp.length === 6 ? '#0F5E4C' : '#E5E0D7', color: otp.length === 6 ? '#FFFFFF' : '#9AA39E' }}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign in'}
              </button>
              <button onClick={handleSendOtp} disabled={cooldown > 0} className="w-full text-[13px] text-center" style={{ color: cooldown > 0 ? '#9AA39E' : '#0F5E4C' }}>
                {cooldown > 0 ? `Get a new code in ${cooldown}s` : 'Get a new code'}
              </button>
            </>)}
          </div>
          <div className="text-center mt-6 space-y-3">
            <button onClick={() => navigate('/')} className="text-[13px] block w-full" style={{ color: '#6B746F' }}>← Back to home</button>
            <button onClick={() => navigate('/admin/login')} className="text-[13px] block w-full" style={{ color: '#6B746F', opacity: 0.6 }}>Admin Login</button>
          </div>
        </div>
      </div>
    </div>
  );
}
