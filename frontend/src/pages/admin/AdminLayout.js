import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { BarChart3, Users, Package, Settings, Activity, LogOut, Menu, X } from 'lucide-react';

const NAV = [{ to: '/admin', label: 'Analytics', icon: BarChart3, end: true }, { to: '/admin/leads', label: 'Leads', icon: Users }, { to: '/admin/orders', label: 'Orders', icon: Package }, { to: '/admin/settings', label: 'Settings', icon: Settings }, { to: '/admin/tracking', label: 'Tracking', icon: Activity }];

export default function AdminLayout() {
  const { token, logout } = useAdmin();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!token) navigate('/admin/login'); }, [token, navigate]);
  if (!token) return null;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--lj-bg)' }}>
      {open && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[240px] flex flex-col transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`} style={{ background: 'var(--lj-surface)', borderRight: '1px solid var(--lj-border)' }}>
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--lj-border)' }}><img src="/logo-main.png" alt="TLJ" className="h-7" /><button className="lg:hidden" onClick={() => setOpen(false)}><X size={20} style={{ color: 'var(--lj-muted)' }} /></button></div>
        <nav className="flex-1 py-3 px-2 space-y-1">{NAV.map(item => (<NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-colors duration-200 ${isActive ? '' : 'hover:bg-[#EDEDEB]'}`} style={({ isActive }) => ({ color: isActive ? 'var(--lj-accent)' : 'var(--lj-muted)', background: isActive ? 'rgba(15,94,76,0.06)' : 'transparent' })}><item.icon size={18} /> {item.label}</NavLink>))}</nav>
        <div className="p-3" style={{ borderTop: '1px solid var(--lj-border)' }}><button onClick={() => { logout(); navigate('/admin/login'); }} className="flex items-center gap-2 px-3 py-2 text-[13px] w-full rounded-[10px] hover:bg-[#EDEDEB] transition-colors" style={{ color: 'var(--lj-muted)' }}><LogOut size={16} /> Logout</button></div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3 lg:hidden" style={{ background: 'var(--lj-bg)', borderBottom: '1px solid var(--lj-border)' }}><button onClick={() => setOpen(true)}><Menu size={22} style={{ color: 'var(--lj-text)' }} /></button><img src="/logo-main.png" alt="TLJ" className="h-6" /></header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto"><Outlet /></main>
      </div>
    </div>
  );
}
