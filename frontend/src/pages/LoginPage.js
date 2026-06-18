import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, KeyRound } from 'lucide-react';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('identifier');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [shownOtp, setShownOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [googleCfg, setGoogleCfg] = useState(null);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/auth/google/config`)
      .then((r) => setGoogleCfg(r.data))
      .catch(() => setGoogleCfg({ enabled: false, client_id: '' }));
  }, []);

  const finishLogin = (res) => {
    localStorage.setItem('tlj_token', res.data.token);
    localStorage.setItem('tlj_user', JSON.stringify(res.data.user));
    navigate('/dashboard');
  };

  const handleGoogleSuccess = async (response) => {
    setError(''); setLoading(true);
    try {
      const r = await axios.post(`${BACKEND_URL}/api/auth/google`, { credential: response.credential });
      finishLogin(r);
    } catch (err) {
      setError(err.response?.data?.detail || 'Google sign-in failed');
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!identifier.trim()) { setError('Please enter your email or phone'); return; }
    setError(''); setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/request-otp`, { identifier: identifier.trim() });
      setShownOtp(res.data.otp || '');
      setStep('otp');
      setCooldown(60);
      const iv = setInterval(() => setCooldown((p) => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; }), 1000);
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

  const googleButton = (googleCfg && googleCfg.enabled) ? (
    <GoogleOAuthProvider clientId={googleCfg.client_id}>
      <div className="w-full flex justify-center" data-testid="google-login-button">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google sign-in was cancelled')}
          theme="outline"
          size="large"
          shape="pill"
          width="356"
          text="continue_with"
        />
      </div>
    </GoogleOAuthProvider>
  ) : null;

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

              {googleButton}

              {googleButton && (
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px" style={{ background: '#E5E0D7' }} />
                  <span className="text-[11px] uppercase tracking-wider" style={{ color: '#9AA39E' }}>or use a code</span>
                  <div className="flex-1 h-px" style={{ background: '#E5E0D7' }} />
                </div>
              )}

              <div className="relative mb-4">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#9AA39E' }} />
                <input type="text" value={identifier} onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                  placeholder="Email or phone number" data-testid="otp-login-phone-input"
                  className="w-full min-h-[48px] pl-11 pr-4 py-3 rounded-[12px] text-[16px] outline-none"
                  style={{ background: '#FBF7F0', border: '1.5px solid #E5E0D7', color: '#1A2520' }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()} />
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
                <input type="text" inputMode="numeric" value={otp} onChange={(e) => handleOtpChange(e.target.value)}
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
