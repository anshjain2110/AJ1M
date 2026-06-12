import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Handles the return leg of Emergent Google Auth.
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    const hash = window.location.hash || '';
    const match = hash.match(/session_id=([^&]+)/);
    const sessionId = match ? match[1] : '';
    if (!sessionId) { navigate('/login', { replace: true }); return; }
    axios.post(`${BACKEND_URL}/api/auth/google/session`, {}, {
      headers: { 'X-Session-ID': sessionId },
      withCredentials: true,
    })
      .then((r) => {
        localStorage.setItem('tlj_token', r.data.token);
        localStorage.setItem('tlj_user', JSON.stringify(r.data.user));
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/dashboard', { replace: true });
      })
      .catch(() => setError('We could not complete your Google sign-in. Please try again.'));
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#FBF7F0', fontFamily: "'Outfit', Inter, system-ui, sans-serif" }} data-testid="auth-callback">
      {error ? (
        <div className="text-center">
          <p className="text-[15px] mb-4" style={{ color: '#B14B3B' }} data-testid="auth-callback-error">{error}</p>
          <button onClick={() => navigate('/login', { replace: true })} className="px-6 py-3 rounded-full text-[14px] font-semibold" style={{ background: '#0F5E4C', color: '#fff' }}>
            Back to login
          </button>
        </div>
      ) : (
        <div className="text-center">
          <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: '#0F5E4C' }} />
          <p className="text-[14px]" style={{ color: '#6B746F' }}>Signing you in…</p>
        </div>
      )}
    </div>
  );
}
