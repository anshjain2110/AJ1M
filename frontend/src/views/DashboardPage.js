'use client';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutDashboard, FileText, Package, MessageCircle, UserRound, LogOut } from 'lucide-react';
import axios from 'axios';
import MegaMenuHeader from '../components/store/MegaMenuHeader';
import StoreFooter from '../components/store/StoreFooter';
import MessagesPanel from '../components/MessagesPanel';
import AccountOverview from '../components/account/AccountOverview';
import QuotesTab from '../components/account/QuotesTab';
import OrdersTab from '../components/account/OrdersTab';
import ProfileTab from '../components/account/ProfileTab';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'quotes', label: 'My Quotes', icon: FileText },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'profile', label: 'Profile', icon: UserRound },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requested = params.get('tab');
  const [activeTab, setActiveTab] = useState(TABS.some((t) => t.id === requested) ? requested : 'overview');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tlj_user') || 'null'); } catch { return null; }
  });

  const token = localStorage.getItem('tlj_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    axios.get(`${BACKEND_URL}/api/me`, { headers })
      .then((r) => {
        setUser(r.data.user);
        localStorage.setItem('tlj_user', JSON.stringify(r.data.user));
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('tlj_token');
          localStorage.removeItem('tlj_user');
          navigate('/login');
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('tlj_token');
    localStorage.removeItem('tlj_user');
    navigate('/');
  };

  if (!token) return null;

  const firstName = user?.first_name || (user?.email ? user.email.split('@')[0] : 'there');
  const initial = (user?.first_name?.[0] || user?.email?.[0] || 'T').toUpperCase();
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

  return (
    <div className="store min-h-screen flex flex-col" style={{ background: '#FBF7F0', fontFamily: "'Outfit', Inter, system-ui, sans-serif" }} data-testid="account-portal">
      <MegaMenuHeader />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16">
        {/* Greeting */}
        <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
          <div className="flex items-center gap-4">
            {user?.picture ? (
              <img src={user.picture} alt="" className="w-14 h-14 rounded-full object-cover" style={{ border: '2px solid #0F5E4C' }} data-testid="account-avatar" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-[20px] font-bold" style={{ background: '#E9F5EE', color: '#0F5E4C', border: '2px solid #0F5E4C' }} data-testid="account-avatar">{initial}</div>
            )}
            <div>
              <h1 className="text-[26px] sm:text-[32px] leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#1A2520' }} data-testid="account-greeting">
                Hi, {firstName}
              </h1>
              {memberSince && <p className="text-[13px]" style={{ color: '#6B746F' }}>Member since {memberSince}</p>}
            </div>
          </div>
          <button onClick={handleLogout} data-testid="dashboard-logout-button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium transition-colors hover:bg-[#F0EBE0]"
            style={{ border: '1px solid #D3CDC1', color: '#3F4A45', background: '#fff' }}>
            <LogOut size={15} /> Log out
          </button>
        </div>

        {/* Tab pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-7" data-testid="dashboard-tabs" style={{ scrollbarWidth: 'none' }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} data-testid={`dashboard-tab-${t.id}`}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13.5px] font-medium whitespace-nowrap transition-all"
              style={activeTab === t.id
                ? { background: '#0F5E4C', color: '#fff' }
                : { background: '#fff', color: '#3F4A45', border: '1px solid #E5E0D7' }}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && <AccountOverview user={user} headers={headers} onGoTab={setActiveTab} />}
        {activeTab === 'quotes' && <QuotesTab headers={headers} />}
        {activeTab === 'orders' && <OrdersTab headers={headers} />}
        {activeTab === 'messages' && <MessagesPanel headers={headers} />}
        {activeTab === 'profile' && <ProfileTab headers={headers} onUserUpdated={setUser} />}
      </main>

      <StoreFooter />
    </div>
  );
}