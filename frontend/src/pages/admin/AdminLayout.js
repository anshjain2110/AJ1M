import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { BarChart3, Users, FileText, Package, Settings, Activity, LogOut, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin', label: 'Analytics', icon: BarChart3, end: true },
  { to: '/admin/leads', label: 'Leads', icon: Users },
  { to: '/admin/orders', label: 'Orders', icon: Package },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/tracking', label: 'Tracking', icon: Activity },
];

export default function AdminLayout() {
  const { token, logout } = useAdmin();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!token) navigate('/admin/login');
  }, [token, navigate]);

  if (!token) return null;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--lj-bg)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[240px] flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--lj-surface)', borderRight: '1px solid var(--lj-border)' }}>
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--lj-border)' }}>
          <img src="/logo-main.png" alt="TLJ" className="h-7" />
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X size={20} style={{ color: 'var(--lj-muted)' }} /></button>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-colors duration-200 ${isActive ? '' : 'hover:bg-[#1A1A1D]'}`}
              style={({ isActive }) => ({ color: isActive ? 'var(--lj-accent)' : 'var(--lj-muted)', background: isActive ? 'rgba(201,168,106,0.08)' : 'transparent' })}>
              <item.icon size={18} /> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3" style={{ borderTop: '1px solid var(--lj-border)' }}>
          <button onClick={() => { logout(); navigate('/admin/login'); }} className="flex items-center gap-2 px-3 py-2 text-[13px] w-full rounded-[10px] hover:bg-[#1A1A1D] transition-colors"
            style={{ color: 'var(--lj-muted)' }}><LogOut size={16} /> Logout</button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3 lg:hidden" style={{ background: 'var(--lj-bg)', borderBottom: '1px solid var(--lj-border)' }}>
          <button onClick={() => setSidebarOpen(true)}><Menu size={22} style={{ color: 'var(--lj-text)' }} /></button>
          <img src="/logo-main.png" alt="TLJ" className="h-6" />
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
