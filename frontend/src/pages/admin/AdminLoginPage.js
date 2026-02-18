import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { Lock, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const { login } = useAdmin();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--lj-bg)' }}>
      <form onSubmit={handleLogin} className="w-full max-w-[400px] p-6 rounded-[18px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
        <div className="flex items-center gap-3 mb-6">
          <Lock size={20} style={{ color: 'var(--lj-accent)' }} />
          <h2 className="text-[22px] font-medium" style={{ color: 'var(--lj-text)' }}>Admin Login</h2>
        </div>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Admin email" data-testid="admin-email-input"
          className="w-full mb-3 min-h-[48px] px-4 py-3 rounded-[10px] text-[16px]" style={{ background: 'var(--lj-bg)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }} />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" data-testid="admin-password-input"
          className="w-full mb-3 min-h-[48px] px-4 py-3 rounded-[10px] text-[16px]" style={{ background: 'var(--lj-bg)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }} />
        {error && <p className="mb-3 text-[13px]" style={{ color: 'var(--lj-danger)' }}>{error}</p>}
        <button type="submit" disabled={loading} data-testid="admin-login-button"
          className="w-full min-h-[48px] rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2"
          style={{ background: 'var(--lj-accent)', color: '#0B0B0C' }}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
