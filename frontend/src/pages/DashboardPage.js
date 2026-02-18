import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Package, Plus, LogOut, Clock, Loader2 } from 'lucide-react';
import axios from 'axios';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

function getStatusColor(status) {
  switch (status) { case 'new': return { bg: 'rgba(15,94,76,0.08)', color: 'var(--lj-accent)', text: 'New' }; case 'quoted': return { bg: 'rgba(22,163,74,0.08)', color: 'var(--lj-success)', text: 'Quoted' }; case 'in_progress': return { bg: 'rgba(15,94,76,0.08)', color: 'var(--lj-accent)', text: 'In Progress' }; case 'completed': return { bg: 'rgba(22,163,74,0.08)', color: 'var(--lj-success)', text: 'Completed' }; default: return { bg: 'rgba(107,114,128,0.08)', color: 'var(--lj-muted)', text: status || 'Pending' }; }
}
function formatValue(val) { if (!val) return ''; const m = { '0.5_0.9': '0.5 \u2013 0.9 ct', '1.0_1.4': '1.0 \u2013 1.4 ct', '1.5_1.9': '1.5 \u2013 1.9 ct', '2.0_2.9': '2.0 \u2013 2.9 ct', '3.0_plus': '3.0+ ct', not_sure: 'Not sure', under_2000: 'Under $2,000', '2000_5000': '$2,000 \u2013 $5,000', '5000_10000': '$5,000 \u2013 $10,000', '10000_15000': '$10,000 \u2013 $15,000', '15000_plus': '$15,000+', '14k_white_gold': '14k White Gold', '14k_yellow_gold': '14k Yellow Gold', '14k_rose_gold': '14k Rose Gold', '18k_gold': '18k Gold' }; return m[val] || val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('quotations');
  const [leads, setLeads] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  useEffect(() => { const token = localStorage.getItem('tlj_token'); if (!token) { navigate('/login'); return; } const su = localStorage.getItem('tlj_user'); if (su) setUser(JSON.parse(su)); fetchData(token); }, [navigate]);
  const fetchData = async (token) => { const h = { Authorization: `Bearer ${token}` }; try { const [lr, or] = await Promise.all([axios.get(`${BACKEND_URL}/api/me/leads`, { headers: h }), axios.get(`${BACKEND_URL}/api/me/orders`, { headers: h }).catch(() => ({ data: { orders: [] } }))]); setLeads(lr.data.leads || []); setOrders(or.data.orders || []); } catch (err) { if (err.response?.status === 401) { localStorage.removeItem('tlj_token'); navigate('/login'); } } finally { setLoading(false); } };
  const handleLogout = () => { localStorage.removeItem('tlj_token'); localStorage.removeItem('tlj_user'); navigate('/'); };
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const getProductLabel = (t) => ({ engagement_ring: 'Engagement Ring', wedding_bands: 'Wedding Bands', tennis_bracelet: 'Tennis Bracelet', studs_earrings: 'Studs / Earrings', necklace_pendant: 'Necklace / Pendant', loose_diamond: 'Loose Diamond', price_checking: 'Price Check' }[t] || t);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--lj-bg)' }}>
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between" style={{ background: 'var(--lj-bg)', borderBottom: '1px solid var(--lj-border)' }}>
        <img src="/logo-main.png" alt="The Local Jewel" className="h-8 object-contain" />
        <div className="flex items-center gap-3">{user && <span className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>{user.first_name || user.email}</span>}<button onClick={handleLogout} data-testid="dashboard-logout-button" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#F0F0EE] transition-colors" aria-label="Logout"><LogOut size={18} style={{ color: 'var(--lj-muted)' }} /></button></div>
      </header>
      <div className="px-4 flex gap-1 pt-4" data-testid="dashboard-tabs">
        {[{ id: 'quotations', label: 'My Quotations', icon: FileText }, { id: 'orders', label: 'My Orders', icon: Package }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex-1 min-h-[44px] px-4 py-2.5 rounded-t-[14px] flex items-center justify-center gap-2 text-[16px] font-medium transition-colors duration-300" style={{ background: activeTab === tab.id ? 'var(--lj-surface)' : 'transparent', color: activeTab === tab.id ? 'var(--lj-text)' : 'var(--lj-muted)', borderBottom: activeTab === tab.id ? '2px solid var(--lj-accent)' : '2px solid transparent' }}><tab.icon size={18} />{tab.label}</button>
        ))}
      </div>
      <div className="flex-1 px-4 py-6">
        {loading ? <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--lj-accent)' }} /></div> : activeTab === 'quotations' ? (
          leads.length === 0 ? <EmptyState title="No quotations yet" subtitle="Start your custom quote to get personalized pricing" onAction={() => navigate('/')} /> : (
            <div className="space-y-3 max-w-2xl mx-auto">{leads.map((lead, i) => { const si = getStatusColor(lead.status); return (<div key={i} data-testid="dashboard-quotation-card" className="p-4 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}><div className="flex items-start justify-between mb-3"><div><h3 className="text-[16px] font-medium" style={{ color: 'var(--lj-text)' }}>{getProductLabel(lead.product_type)}</h3><p className="text-[13px] flex items-center gap-1.5 mt-1" style={{ color: 'var(--lj-muted)' }}><Clock size={12} /> {formatDate(lead.created_at)}</p></div><span className="px-2.5 py-1 rounded-full text-[13px] font-medium" style={{ background: si.bg, color: si.color }}>{si.text}</span></div><div className="grid grid-cols-2 gap-2 text-[13px]">{lead.diamond_shape && <div><span style={{ color: 'var(--lj-muted)' }}>Shape:</span> <span style={{ color: 'var(--lj-text)' }}>{formatValue(lead.diamond_shape)}</span></div>}{lead.carat_range && <div><span style={{ color: 'var(--lj-muted)' }}>Carat:</span> <span style={{ color: 'var(--lj-text)' }}>{formatValue(lead.carat_range)}</span></div>}{lead.budget && <div><span style={{ color: 'var(--lj-muted)' }}>Budget:</span> <span style={{ color: 'var(--lj-text)' }}>{formatValue(lead.budget)}</span></div>}{lead.metal && <div><span style={{ color: 'var(--lj-muted)' }}>Metal:</span> <span style={{ color: 'var(--lj-text)' }}>{formatValue(lead.metal)}</span></div>}</div></div>); })}</div>
          )
        ) : orders.length === 0 ? <EmptyState title="No orders yet" subtitle="Once your quote is confirmed, orders will appear here" /> : <div className="space-y-3 max-w-2xl mx-auto">{orders.map((o, i) => <div key={i} className="p-4 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}><h3 className="text-[16px] font-medium" style={{ color: 'var(--lj-text)' }}>{o.product_description || 'Order'}</h3><p className="text-[13px] mt-1" style={{ color: 'var(--lj-muted)' }}>{formatDate(o.created_at)}</p></div>)}</div>}
      </div>
    </div>
  );
}
function EmptyState({ title, subtitle, onAction }) {
  return (<div className="flex flex-col items-center justify-center py-20 text-center"><div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(15,94,76,0.06)', border: '1px solid rgba(15,94,76,0.1)' }}><FileText size={32} style={{ color: 'var(--lj-accent)' }} /></div><h3 className="text-[22px] leading-[28px] font-medium mb-2" style={{ color: 'var(--lj-text)' }}>{title}</h3><p className="text-[16px] leading-[24px] mb-6" style={{ color: 'var(--lj-muted)' }}>{subtitle}</p>{onAction && <button onClick={onAction} data-testid="dashboard-empty-state-start-wizard-button" className="min-h-[44px] px-6 rounded-[14px] font-medium text-[16px] flex items-center gap-2" style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}><Plus size={18} /> Start a Quote</button>}</div>);
}
