'use client';
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const TOKEN_KEY = 'tlj_pitch_token';

export default function PitchLoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (typeof window !== 'undefined' && localStorage.getItem(TOKEN_KEY)) {
    return <Navigate to="/pitch" replace />;
  }

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    if (!password) { setError('Password is required'); return; }
    setLoading(true);
    try {
      const res = await axios.post(BACKEND_URL + '/api/pitch/verify', { password });
      localStorage.setItem(TOKEN_KEY, res.data.token);
      navigate('/pitch');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Incorrect password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'radial-gradient(ellipse at top, #0F5E4C 0%, #0A3D31 35%, #061F19 100%)',
      }}
      data-testid="pitch-login-page"
    >
      {/* subtle noise + grid backdrop */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div
          className="rounded-[24px] p-8 sm:p-10"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-3 mb-7">
            <div className="w-11 h-11 rounded-[14px] flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <Lock size={18} style={{ color: '#E8F5F0' }} />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Confidential · Investor Brief
              </div>
              <div className="text-[20px] font-semibold mt-0.5" style={{ color: '#FFFFFF', fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif' }}>
                The Local Jewel
              </div>
            </div>
          </div>

          <h1
            className="text-[28px] sm:text-[32px] leading-[1.1] font-semibold mb-2 tracking-[-0.02em]"
            style={{ color: '#FFFFFF', fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif' }}
          >
            Enter the room.
          </h1>
          <p className="text-[14px] leading-[1.5] mb-7" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Access requires the shared password. This page contains confidential business, financial, and operational details intended for prospective investors only.
          </p>

          <form onSubmit={handleSubmit}>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Access password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                data-testid="pitch-password-input"
                className="w-full px-4 py-3.5 pr-12 rounded-[12px] text-[15px] focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid ' + (error ? 'rgba(255,120,120,0.5)' : 'rgba(255,255,255,0.18)'),
                  color: '#FFFFFF',
                }}
              />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-opacity hover:opacity-100"
                style={{ color: 'rgba(255,255,255,0.55)' }} aria-label="Toggle password visibility">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div data-testid="pitch-login-error" className="mt-3 text-[13px] leading-[1.4]" style={{ color: '#FFB4B4' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              data-testid="pitch-login-submit"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 min-h-[52px] px-6 rounded-[12px] font-medium text-[15px] transition-all duration-300 active:scale-[0.99]"
              style={{
                background: '#FFFFFF', color: '#0F5E4C',
                boxShadow: '0 8px 22px rgba(255,255,255,0.18)',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Open the brief <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-6 text-[11px] leading-[1.5] text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
            By continuing you agree to keep the contents of this document confidential.
          </p>
        </div>

        <div className="mt-5 text-center text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
          © {new Date().getFullYear()} The Local Jewel · Confidential
        </div>
      </div>
    </div>
  );
}