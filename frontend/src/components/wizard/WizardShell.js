import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Phone, User, Menu, X, FolderOpen, BookOpen, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWizard } from '../../context/WizardContext';
import { getCurrentStepNumber } from '../../utils/wizardConfig';

const NAV_LINKS = [
  { to: '/projects', label: 'Projects', icon: FolderOpen },
  { to: '/blog', label: 'Journal', icon: BookOpen },
  { to: '/contact', label: 'Contact', icon: MessageCircle },
];

export default function WizardShell({ children, showBack = true, showProgress = true }) {
  const { state, goBack, dispatch } = useWizard();
  const navigate = useNavigate();
  const { currentScreen, answers, frozenStepTotal } = state;
  const currentStep = getCurrentStepNumber(currentScreen, answers);
  const totalSteps = frozenStepTotal || 12;
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  const isWizardScreen = currentScreen !== 'landing' && currentScreen !== 'how_it_works' && currentScreen !== 'thank_you';
  const isLoggedIn = !!localStorage.getItem('tlj_token');
  const canGoBack = isWizardScreen && currentScreen !== 'product_type';
  const showPublicNav = currentScreen === 'landing';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--lj-bg)' }}>
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between" style={{ background: 'var(--lj-bg)', borderBottom: '1px solid var(--lj-border)' }}>
        <div className="flex items-center gap-3">
          {showBack && canGoBack && (
            <button onClick={goBack} data-testid="wizard-back-button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[14px] font-medium transition-colors duration-300 hover:bg-[#F0F0EE]"
              style={{ color: 'var(--lj-accent)' }} aria-label="Go back">
              <ArrowLeft size={18} /><span>Back</span>
            </button>
          )}
          <button onClick={() => { dispatch({ type: 'RESET' }); navigate('/'); }} className="cursor-pointer">
            <img src="/logo-main.png" alt="The Local Jewel" className="h-10 object-contain" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {showPublicNav && (
            <>
              {/* Desktop links (≥sm) */}
              <nav className="hidden sm:flex items-center gap-1">
                {NAV_LINKS.map(l => (
                  <button key={l.to} onClick={() => navigate(l.to)}
                    data-testid={`header-${l.label.toLowerCase()}-link`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors duration-300 hover:bg-[#F0F0EE]"
                    style={{ color: 'var(--lj-accent)' }}>
                    <l.icon size={15} /> {l.label}
                  </button>
                ))}
              </nav>
              {/* Mobile menu (< sm) */}
              <div className="sm:hidden relative" ref={menuRef}>
                <button onClick={() => setMenuOpen(v => !v)} aria-label="Open menu" aria-expanded={menuOpen}
                  data-testid="header-mobile-menu"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors duration-300 hover:bg-[#F0F0EE]"
                  style={{ color: 'var(--lj-accent)' }}>
                  {menuOpen ? <X size={16} /> : <Menu size={16} />} Menu
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 min-w-[180px] rounded-[12px] overflow-hidden z-50"
                    data-testid="header-mobile-menu-panel"
                    style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)', boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}>
                    {NAV_LINKS.map(l => (
                      <button key={l.to} onClick={() => { setMenuOpen(false); navigate(l.to); }}
                        data-testid={`header-mobile-menu-${l.label.toLowerCase()}`}
                        className="w-full text-left px-4 py-3 text-[14px] flex items-center gap-2.5 transition-colors hover:bg-[var(--lj-surface)]"
                        style={{ color: 'var(--lj-text)' }}>
                        <l.icon size={15} style={{ color: 'var(--lj-accent)' }} /> {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          <a href="tel:+15857108292" data-testid="landing-click-to-call-button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-colors duration-300 hover:bg-[#F0F0EE]"
            style={{ color: 'var(--lj-accent)' }}>
            <Phone size={15} /><span className="hidden sm:inline">Call</span>
          </a>
          <button onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
            data-testid="header-login-button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors duration-300 hover:bg-[#F0F0EE]"
            style={{ color: 'var(--lj-accent)' }}>
            <User size={15} />
            <span className="hidden sm:inline">{isLoggedIn ? 'Account' : 'Login'}</span>
          </button>
        </div>
      </header>

      {showProgress && isWizardScreen && currentScreen !== 'thank_you' && (
        <div className="px-4 pt-2 pb-1">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: '#EDEDEB' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(progress, 100)}%`, background: 'var(--lj-accent)', transition: 'width 500ms var(--lj-ease)' }} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
