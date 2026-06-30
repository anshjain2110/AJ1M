'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, User, Menu, X, FolderOpen, BookOpen, MessageCircle, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import CartDrawer from './store/CartDrawer';

const NAV_LINKS = [
  { to: '/projects', label: 'Projects', icon: FolderOpen },
  { to: '/blog', label: 'Journal', icon: BookOpen },
  { to: '/contact', label: 'Contact', icon: MessageCircle },
];

// Shared lightweight header for standalone public pages (Projects, Blog, Contact)
export default function PublicHeader() {
  const navigate = useNavigate();
  const { count, openCart } = useCart();
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('tlj_token');
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
    <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
      style={{ background: 'var(--lj-bg)', borderBottom: '1px solid var(--lj-border)' }}>
      <button onClick={() => navigate('/')} className="cursor-pointer" aria-label="Home" data-testid="public-header-home">
        <img src="/logo-main.png" alt="The Local Jewel" className="h-10 object-contain" />
      </button>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Desktop nav (≥sm) */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map(l => (
            <button key={l.to} onClick={() => navigate(l.to)}
              data-testid={`public-header-${l.label.toLowerCase()}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors duration-300 hover:bg-[#F0F0EE]"
              style={{ color: 'var(--lj-accent)' }}>
              <l.icon size={15} /> {l.label}
            </button>
          ))}
        </nav>

        {/* Mobile menu trigger (< sm) */}
        <div className="sm:hidden relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(v => !v)} aria-label="Open menu"
            aria-expanded={menuOpen}
            data-testid="public-header-menu"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors duration-300 hover:bg-[#F0F0EE]"
            style={{ color: 'var(--lj-accent)' }}>
            {menuOpen ? <X size={16} /> : <Menu size={16} />} Menu
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 min-w-[180px] rounded-[12px] overflow-hidden z-50"
              data-testid="public-header-menu-panel"
              style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)', boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}>
              {NAV_LINKS.map(l => (
                <button key={l.to} onClick={() => { setMenuOpen(false); navigate(l.to); }}
                  data-testid={`public-header-menu-${l.label.toLowerCase()}`}
                  className="w-full text-left px-4 py-3 text-[14px] flex items-center gap-2.5 transition-colors hover:bg-[var(--lj-surface)]"
                  style={{ color: 'var(--lj-text)' }}>
                  <l.icon size={15} style={{ color: 'var(--lj-accent)' }} /> {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <a href="tel:+15857108292" data-testid="public-header-call"
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-colors duration-300 hover:bg-[#F0F0EE]"
          style={{ color: 'var(--lj-accent)' }}>
          <Phone size={15} /><span className="hidden sm:inline">Call</span>
        </a>
        <button onClick={openCart} aria-label="Cart" data-testid="public-header-cart"
          className="relative flex items-center px-3 py-2 rounded-full text-sm transition-colors duration-300 hover:bg-[#F0F0EE]"
          style={{ color: 'var(--lj-accent)' }}>
          <ShoppingBag size={16} />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0 min-w-[16px] h-[16px] px-1 flex items-center justify-center text-[10px] font-semibold rounded-full"
              style={{ background: 'var(--lj-accent)', color: '#fff' }} data-testid="public-header-cart-count">{count}</span>
          )}
        </button>
        <button onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
          data-testid="public-header-account"
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors duration-300 hover:bg-[#F0F0EE]"
          style={{ color: 'var(--lj-accent)' }}>
          <User size={15} />
          <span className="hidden sm:inline">{isLoggedIn ? 'Account' : 'Login'}</span>
        </button>
      </div>
      <CartDrawer />
    </header>
  );
}