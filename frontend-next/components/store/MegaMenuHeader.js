'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { ShoppingBag, Menu, X, ChevronDown, ChevronRight, User, Phone, Search } from 'lucide-react';
import { useCart } from '../CartContext';
import SaleAnnouncementBar from '../SaleAnnouncementBar';

// External anchor when href starts with http/tel/mailto, otherwise Next Link.
const NavAnchor = ({ href, onClick, children, className, style, testid, ...rest }) => {
  if (!href) return <a className={className} style={style} data-testid={testid} onClick={onClick} {...rest}>{children}</a>;
  if (/^(https?:|tel:|mailto:)/i.test(href)) {
    return <a href={href} className={className} style={style} data-testid={testid} onClick={onClick} {...rest}>{children}</a>;
  }
  return <Link href={href} className={className} style={style} data-testid={testid} onClick={onClick} {...rest}>{children}</Link>;
};

export default function MegaMenuHeader() {
  const { count, openCart } = useCart();
  const [menu, setMenu] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [activeImg, setActiveImg] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpand, setMobileExpand] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const closeTimer = useRef(null);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('tlj_token'));
    axios.get('/api/menu').then((r) => setMenu(r.data.items || [])).catch(() => setMenu([]));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenus = () => { setOpenId(null); setMobileOpen(false); };

  const enterItem = (item) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (item.type === 'mega') { setOpenId(item.id); setActiveImg(item.featured_image_url || null); }
    else setOpenId(null);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenId(null), 120);
  };
  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };

  const activeItem = menu.find((m) => m.id === openId);
  const accountHref = isLoggedIn ? '/dashboard' : '/login';

  return (
    <div className="store" style={{ fontFamily: "'Outfit', Inter, sans-serif" }}>
      <SaleAnnouncementBar />

      <header className="sticky top-0 z-50 transition-all duration-300" style={{ background: 'rgba(253,251,247,0.92)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--lj-border)' }} onMouseLeave={scheduleClose}>
        <div className={`max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between transition-all duration-300 ${scrolled ? 'py-2.5' : 'py-4'}`}>
          <div className="flex items-center gap-2">
            <button className="lg:hidden p-1.5 -ml-1.5" onClick={() => setMobileOpen(true)} aria-label="Open menu" data-testid="mobile-menu-toggle">
              <Menu size={22} style={{ color: 'var(--lj-text)' }} />
            </button>
            <NavAnchor href="/" onClick={closeMenus} testid="header-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-main.png" alt="The Local Jewel" className={`object-contain transition-all duration-300 ${scrolled ? 'h-9' : 'h-11'}`} />
            </NavAnchor>
          </div>

          <nav className="hidden lg:flex items-center gap-1" onMouseEnter={cancelClose}>
            {menu.map((item) => (
              <div key={item.id} onMouseEnter={() => enterItem(item)} className="relative">
                <NavAnchor href={item.href} onClick={closeMenus} testid={`mega-menu-item-${item.id}`} className="flex items-center gap-1 px-3.5 py-2 text-[13px] tracking-wide font-medium transition-colors no-underline" style={{ color: openId === item.id ? 'var(--lj-accent)' : 'var(--lj-text)' }}>
                  {item.label}
                  {item.type === 'mega' && <ChevronDown size={13} className={`transition-transform duration-200 ${openId === item.id ? 'rotate-180' : ''}`} />}
                </NavAnchor>
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <NavAnchor href="/collections" aria-label="Search" className="p-2 hidden sm:block transition-colors hover:opacity-70" testid="header-search">
              <Search size={19} style={{ color: 'var(--lj-text)' }} />
            </NavAnchor>
            <a href="tel:+15857108292" aria-label="Call" className="p-2 hidden sm:block transition-colors hover:opacity-70" data-testid="header-call">
              <Phone size={19} style={{ color: 'var(--lj-text)' }} />
            </a>
            <NavAnchor href={accountHref} aria-label="Account" className="p-2 transition-colors hover:opacity-70" testid="header-account">
              <User size={19} style={{ color: 'var(--lj-text)' }} />
            </NavAnchor>
            <button onClick={openCart} aria-label="Cart" className="relative p-2 transition-colors hover:opacity-70" data-testid="header-cart-button">
              <ShoppingBag size={20} style={{ color: 'var(--lj-text)' }} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 flex items-center justify-center text-[10px] font-semibold rounded-full" style={{ background: 'var(--lj-accent)', color: '#fff' }} data-testid="cart-count-badge">{count}</span>
              )}
            </button>
          </div>
        </div>

        {activeItem && activeItem.type === 'mega' && (
          <div className="hidden lg:block absolute left-0 right-0 top-full" onMouseEnter={cancelClose} onMouseLeave={scheduleClose} data-testid={`mega-panel-${activeItem.id}`} style={{ background: 'var(--lj-bg)', borderBottom: '1px solid var(--lj-border)', boxShadow: '0 24px 48px rgba(0,0,0,0.10)' }}>
            <div className="max-w-7xl mx-auto px-8 py-9 grid grid-cols-12 gap-10">
              <div className="col-span-8 grid grid-cols-2 gap-x-10 gap-y-2">
                {(activeItem.columns || []).map((col, ci) => (
                  <div key={ci}>
                    {col.heading && <div className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--lj-muted)' }}>{col.heading}</div>}
                    <ul className="space-y-1">
                      {(col.links || []).map((lnk, li) => (
                        <li key={li}>
                          <NavAnchor href={lnk.href} onClick={closeMenus} onMouseEnter={() => setActiveImg(lnk.hover_image_url || activeItem.featured_image_url)} className="group flex items-center gap-1.5 py-1.5 text-[15px] no-underline" style={{ color: 'var(--lj-text)' }}>
                            <span className="border-b border-transparent group-hover:border-[var(--lj-accent)] transition-colors" style={{ color: 'inherit' }}>{lnk.label}</span>
                            <ChevronRight size={13} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" style={{ color: 'var(--lj-accent)' }} />
                          </NavAnchor>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="col-span-4">
                <NavAnchor href={activeItem.featured_href || activeItem.href} onClick={closeMenus} className="block w-full text-left group no-underline" style={{ color: 'inherit' }} testid="mega-menu-featured">
                  <div className="relative overflow-hidden" style={{ aspectRatio: '4/3', background: 'var(--lj-surface)' }}>
                    {(activeImg || activeItem.featured_image_url) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={activeImg || activeItem.featured_image_url} src={activeImg || activeItem.featured_image_url} alt={activeItem.featured_label || activeItem.label} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ animation: 'ljFade 350ms ease' }} />
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[14px] font-medium" style={{ color: 'var(--lj-accent)' }}>
                    {activeItem.featured_label || `Shop all ${activeItem.label}`}
                    <ChevronRight size={15} />
                  </div>
                </NavAnchor>
              </div>
            </div>
          </div>
        )}
      </header>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]" data-testid="mobile-menu-overlay">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[84%] max-w-[360px] flex flex-col store" style={{ background: 'var(--lj-bg)' }}>
            <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid var(--lj-border)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-main.png" alt="The Local Jewel" className="h-9" />
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" data-testid="mobile-menu-close"><X size={22} style={{ color: 'var(--lj-text)' }} /></button>
            </div>
            <div className="flex-1 overflow-auto py-2">
              {menu.map((item) => (
                <div key={item.id} style={{ borderBottom: '1px solid var(--lj-border)' }}>
                  {item.type === 'mega' && (item.columns || []).length > 0 ? (
                    <>
                      <button onClick={() => setMobileExpand(mobileExpand === item.id ? null : item.id)} className="w-full flex items-center justify-between px-4 py-3.5 text-[16px]" style={{ color: 'var(--lj-text)' }} data-testid={`mobile-item-${item.id}`}>
                        {item.label}
                        <ChevronDown size={17} className={`transition-transform ${mobileExpand === item.id ? 'rotate-180' : ''}`} style={{ color: 'var(--lj-muted)' }} />
                      </button>
                      {mobileExpand === item.id && (
                        <div className="pb-2">
                          <NavAnchor href={item.featured_href || item.href} onClick={closeMenus} className="block w-full text-left px-6 py-2 text-[14px] font-medium no-underline" style={{ color: 'var(--lj-accent)' }}>
                            {item.featured_label || `Shop all ${item.label}`}
                          </NavAnchor>
                          {(item.columns || []).map((col, ci) => (
                            <div key={ci} className="px-6 py-1">
                              {col.heading && <div className="text-[11px] uppercase tracking-[0.18em] mt-2 mb-1" style={{ color: 'var(--lj-muted)' }}>{col.heading}</div>}
                              {(col.links || []).map((lnk, li) => (
                                <NavAnchor key={li} href={lnk.href} onClick={closeMenus} className="block w-full text-left py-2 text-[15px] no-underline" style={{ color: 'var(--lj-text)' }}>{lnk.label}</NavAnchor>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <NavAnchor href={item.href} onClick={closeMenus} className="w-full flex items-center justify-between px-4 py-3.5 text-[16px] no-underline" style={{ color: 'var(--lj-text)' }} testid={`mobile-item-${item.id}`}>
                      {item.label}<ChevronRight size={16} style={{ color: 'var(--lj-muted)' }} />
                    </NavAnchor>
                  )}
                </div>
              ))}
            </div>
            <div className="px-4 py-4 flex items-center gap-4" style={{ borderTop: '1px solid var(--lj-border)' }}>
              <a href="tel:+15857108292" className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--lj-accent)' }}><Phone size={16} /> Call</a>
              <NavAnchor href={accountHref} onClick={closeMenus} className="flex items-center gap-2 text-[14px] no-underline" style={{ color: 'var(--lj-accent)' }}><User size={16} /> {isLoggedIn ? 'Account' : 'Login'}</NavAnchor>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
