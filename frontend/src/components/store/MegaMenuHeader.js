import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingBag, Menu, X, ChevronDown, ChevronRight, User, Phone, Search } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import CartDrawer from './CartDrawer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function MegaMenuHeader() {
  const navigate = useNavigate();
  const { count, openCart } = useCart();
  const [menu, setMenu] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [activeImg, setActiveImg] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpand, setMobileExpand] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef(null);
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('tlj_token');

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/menu`).then((r) => setMenu(r.data.items || [])).catch(() => setMenu([]));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (href) => {
    setOpenId(null);
    setMobileOpen(false);
    if (!href) return;
    if (href.startsWith('http')) { window.location.href = href; return; }
    navigate(href);
  };

  const enterItem = (item) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (item.type === 'mega') {
      setOpenId(item.id);
      setActiveImg(item.featured_image_url || null);
    } else {
      setOpenId(null);
    }
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenId(null), 120);
  };
  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };

  const activeItem = menu.find((m) => m.id === openId);

  return (
    <div className="store" style={{ fontFamily: "'Outfit', Inter, sans-serif" }}>
      {/* Announcement bar */}
      <div className="w-full text-center text-[11px] sm:text-[12px] tracking-[0.18em] uppercase py-2 px-3"
        style={{ background: 'var(--lj-accent)', color: '#fff' }} data-testid="announcement-bar">
        Hand-crafted · Lab-grown &amp; conflict-free · Free design consultation
      </div>

      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{ background: 'rgba(253,251,247,0.92)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--lj-border)' }}
        onMouseLeave={scheduleClose}
      >
        <div className={`max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between transition-all duration-300 ${scrolled ? 'py-2.5' : 'py-4'}`}>
          {/* Left: mobile toggle + logo */}
          <div className="flex items-center gap-2">
            <button className="lg:hidden p-1.5 -ml-1.5" onClick={() => setMobileOpen(true)} aria-label="Open menu" data-testid="mobile-menu-toggle">
              <Menu size={22} style={{ color: 'var(--lj-text)' }} />
            </button>
            <button onClick={() => go('/')} aria-label="Home" data-testid="header-logo">
              <img src="/logo-main.png" alt="The Local Jewel" className={`object-contain transition-all duration-300 ${scrolled ? 'h-9' : 'h-11'}`} />
            </button>
          </div>

          {/* Center: desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" onMouseEnter={cancelClose}>
            {menu.map((item) => (
              <div key={item.id} onMouseEnter={() => enterItem(item)} className="relative">
                <button
                  onClick={() => go(item.href)}
                  data-testid={`mega-menu-item-${item.id}`}
                  className="flex items-center gap-1 px-3.5 py-2 text-[13px] tracking-wide font-medium transition-colors"
                  style={{ color: openId === item.id ? 'var(--lj-accent)' : 'var(--lj-text)' }}
                >
                  {item.label}
                  {item.type === 'mega' && <ChevronDown size={13} className={`transition-transform duration-200 ${openId === item.id ? 'rotate-180' : ''}`} />}
                </button>
              </div>
            ))}
          </nav>

          {/* Right: actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => go('/collections')} aria-label="Search" className="p-2 hidden sm:block transition-colors hover:opacity-70" data-testid="header-search">
              <Search size={19} style={{ color: 'var(--lj-text)' }} />
            </button>
            <a href="tel:+15857108292" aria-label="Call" className="p-2 hidden sm:block transition-colors hover:opacity-70" data-testid="header-call">
              <Phone size={19} style={{ color: 'var(--lj-text)' }} />
            </a>
            <button onClick={() => go(isLoggedIn ? '/dashboard' : '/login')} aria-label="Account" className="p-2 transition-colors hover:opacity-70" data-testid="header-account">
              <User size={19} style={{ color: 'var(--lj-text)' }} />
            </button>
            <button onClick={openCart} aria-label="Cart" className="relative p-2 transition-colors hover:opacity-70" data-testid="header-cart-button">
              <ShoppingBag size={20} style={{ color: 'var(--lj-text)' }} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 flex items-center justify-center text-[10px] font-semibold rounded-full"
                  style={{ background: 'var(--lj-accent)', color: '#fff' }} data-testid="cart-count-badge">{count}</span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop mega dropdown */}
        {activeItem && activeItem.type === 'mega' && (
          <div
            className="hidden lg:block absolute left-0 right-0 top-full"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            data-testid={`mega-panel-${activeItem.id}`}
            style={{ background: 'var(--lj-bg)', borderBottom: '1px solid var(--lj-border)', boxShadow: '0 24px 48px rgba(0,0,0,0.10)' }}
          >
            <div className="max-w-7xl mx-auto px-8 py-9 grid grid-cols-12 gap-10">
              <div className="col-span-8 grid grid-cols-2 gap-x-10 gap-y-2">
                {(activeItem.columns || []).map((col, ci) => (
                  <div key={ci}>
                    {col.heading && (
                      <div className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--lj-muted)' }}>{col.heading}</div>
                    )}
                    <ul className="space-y-1">
                      {(col.links || []).map((lnk, li) => (
                        <li key={li}>
                          <button
                            onMouseEnter={() => setActiveImg(lnk.hover_image_url || activeItem.featured_image_url)}
                            onClick={() => go(lnk.href)}
                            data-testid="mega-menu-link"
                            className="group flex items-center gap-1.5 py-1.5 text-[15px] transition-colors"
                            style={{ color: 'var(--lj-text)' }}
                          >
                            <span className="border-b border-transparent group-hover:border-[var(--lj-accent)] transition-colors" style={{ color: 'inherit' }}>{lnk.label}</span>
                            <ChevronRight size={13} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" style={{ color: 'var(--lj-accent)' }} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="col-span-4">
                <button onClick={() => go(activeItem.featured_href || activeItem.href)} className="block w-full text-left group" data-testid="mega-menu-featured">
                  <div className="relative overflow-hidden" style={{ aspectRatio: '4/3', background: 'var(--lj-surface)' }}>
                    {(activeImg || activeItem.featured_image_url) && (
                      <img
                        key={activeImg || activeItem.featured_image_url}
                        src={activeImg || activeItem.featured_image_url}
                        alt={activeItem.featured_label || activeItem.label}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        style={{ animation: 'ljFade 350ms ease' }}
                      />
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[14px] font-medium" style={{ color: 'var(--lj-accent)' }}>
                    {activeItem.featured_label || `Shop all ${activeItem.label}`}
                    <ChevronRight size={15} />
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile slide-out */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]" data-testid="mobile-menu-overlay">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[84%] max-w-[360px] flex flex-col store" style={{ background: 'var(--lj-bg)' }}>
            <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid var(--lj-border)' }}>
              <img src="/logo-main.png" alt="The Local Jewel" className="h-9" />
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" data-testid="mobile-menu-close"><X size={22} style={{ color: 'var(--lj-text)' }} /></button>
            </div>
            <div className="flex-1 overflow-auto py-2">
              {menu.map((item) => (
                <div key={item.id} style={{ borderBottom: '1px solid var(--lj-border)' }}>
                  {item.type === 'mega' && (item.columns || []).length > 0 ? (
                    <>
                      <button
                        onClick={() => setMobileExpand(mobileExpand === item.id ? null : item.id)}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-[16px]"
                        style={{ color: 'var(--lj-text)' }}
                        data-testid={`mobile-item-${item.id}`}
                      >
                        {item.label}
                        <ChevronDown size={17} className={`transition-transform ${mobileExpand === item.id ? 'rotate-180' : ''}`} style={{ color: 'var(--lj-muted)' }} />
                      </button>
                      {mobileExpand === item.id && (
                        <div className="pb-2">
                          <button onClick={() => go(item.featured_href || item.href)} className="w-full text-left px-6 py-2 text-[14px] font-medium" style={{ color: 'var(--lj-accent)' }}>
                            {item.featured_label || `Shop all ${item.label}`}
                          </button>
                          {(item.columns || []).map((col, ci) => (
                            <div key={ci} className="px-6 py-1">
                              {col.heading && <div className="text-[11px] uppercase tracking-[0.18em] mt-2 mb-1" style={{ color: 'var(--lj-muted)' }}>{col.heading}</div>}
                              {(col.links || []).map((lnk, li) => (
                                <button key={li} onClick={() => go(lnk.href)} className="block w-full text-left py-2 text-[15px]" style={{ color: 'var(--lj-text)' }}>{lnk.label}</button>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <button onClick={() => go(item.href)} className="w-full flex items-center justify-between px-4 py-3.5 text-[16px]" style={{ color: 'var(--lj-text)' }} data-testid={`mobile-item-${item.id}`}>
                      {item.label}<ChevronRight size={16} style={{ color: 'var(--lj-muted)' }} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="px-4 py-4 flex items-center gap-4" style={{ borderTop: '1px solid var(--lj-border)' }}>
              <a href="tel:+15857108292" className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--lj-accent)' }}><Phone size={16} /> Call</a>
              <button onClick={() => go(isLoggedIn ? '/dashboard' : '/login')} className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--lj-accent)' }}><User size={16} /> {isLoggedIn ? 'Account' : 'Login'}</button>
            </div>
          </div>
        </div>
      )}

      <CartDrawer />
    </div>
  );
}
