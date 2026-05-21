import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, User, Image as ImageIcon } from 'lucide-react';

// Shared lightweight header for standalone public pages (Projects, etc.)
// Mimics WizardShell's visual style but is router-aware, with no wizard state.
export default function PublicHeader() {
  const navigate = useNavigate();
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('tlj_token');

  return (
    <header
      className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
      style={{ background: 'var(--lj-bg)', borderBottom: '1px solid var(--lj-border)' }}
    >
      <button onClick={() => navigate('/')} className="cursor-pointer" aria-label="Home" data-testid="public-header-home">
        <img src="/logo-main.png" alt="The Local Jewel" className="h-10 object-contain" />
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/projects')}
          data-testid="public-header-projects"
          className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors duration-300 hover:bg-[#F0F0EE]"
          style={{ color: 'var(--lj-accent)' }}
        >
          <ImageIcon size={16} />
          <span className="hidden sm:inline">Projects</span>
        </button>
        <a
          href="tel:+15857108292"
          data-testid="public-header-call"
          className="flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-colors duration-300 hover:bg-[#F0F0EE]"
          style={{ color: 'var(--lj-accent)' }}
        >
          <Phone size={16} /><span className="hidden sm:inline">Call Us</span>
        </a>
        <button
          onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
          data-testid="public-header-account"
          className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors duration-300 hover:bg-[#F0F0EE]"
          style={{ color: 'var(--lj-accent)' }}
        >
          <User size={16} />
          <span className="hidden sm:inline">{isLoggedIn ? 'My Account' : 'Login'}</span>
        </button>
      </div>
    </header>
  );
}
