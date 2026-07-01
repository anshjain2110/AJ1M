import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Package, MessageCircle, Loader2, ArrowRight, Sparkles, ShoppingBag } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const money = (n) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export const AccountCard = ({ children, className = '', testid }) => (
  <div className={`rounded-[16px] ${className}`} style={{ background: '#fff', border: '1px solid #E5E0D7' }} data-testid={testid}>
    {children}
  </div>
);

export default function AccountOverview({ user, headers, onGoTab }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    Promise.all([
      axios.get(`${BACKEND_URL}/api/me/leads`, { headers }).catch(() => ({ data: { leads: [] } })),
      axios.get(`${BACKEND_URL}/api/me/shop-orders`, { headers }).catch(() => ({ data: { orders: [] } })),
    ]).then(([lr, or2]) => {
      setLeads(lr.data.leads || []);
      setOrders(or2.data.orders || []);
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin" style={{ color: '#0F5E4C' }} /></div>;

  const recentOrder = orders[0];
  const stats = [
    { id: 'quotes', label: 'Custom quotes', value: leads.length, icon: FileText },
    { id: 'orders', label: 'Orders', value: orders.length, icon: Package },
    { id: 'messages', label: 'Messages', value: '→', icon: MessageCircle },
  ];

  return (
    <div className="space-y-6" data-testid="account-overview">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <button key={s.id} onClick={() => onGoTab(s.id)} data-testid={`overview-stat-${s.id}`}
            className="p-4 sm:p-5 rounded-[16px] text-left transition-transform hover:-translate-y-0.5"
            style={{ background: '#fff', border: '1px solid #E5E0D7' }}>
            <s.icon size={18} style={{ color: '#0F5E4C' }} />
            <div className="text-[24px] font-semibold mt-2 leading-none" style={{ color: '#1A2520' }}>{s.value}</div>
            <div className="text-[12px] mt-1" style={{ color: '#6B746F' }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Most recent order */}
      {recentOrder && (
        <AccountCard testid="overview-recent-order">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-semibold" style={{ color: '#1A2520' }}>Latest order</h3>
              <button onClick={() => onGoTab('orders')} className="inline-flex items-center gap-1 text-[13px] font-medium" style={{ color: '#0F5E4C' }}>
                View all <ArrowRight size={13} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              {recentOrder.items?.[0]?.image && (
                <img src={recentOrder.items[0].image} alt="" className="w-16 h-16 rounded-[10px] object-cover" style={{ border: '1px solid #E5E0D7' }} />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium truncate" style={{ color: '#1A2520' }}>{recentOrder.items?.[0]?.title || recentOrder.order_id}</div>
                <div className="text-[12.5px]" style={{ color: '#6B746F' }}>{recentOrder.invoice_number} · {money(recentOrder.amount)}</div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11.5px] font-semibold" style={{ background: '#E9F5EE', color: '#0F5E4C' }}>
                {recentOrder.fulfillment_status === 'processing' ? 'Being crafted' : recentOrder.fulfillment_status}
              </span>
            </div>
          </div>
        </AccountCard>
      )}

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-3">
        <button onClick={() => navigate('/')} data-testid="overview-start-quote"
          className="p-5 rounded-[16px] text-left flex items-start gap-3 transition-transform hover:-translate-y-0.5"
          style={{ background: '#0F5E4C', color: '#fff' }}>
          <Sparkles size={20} style={{ marginTop: 2 }} />
          <div>
            <div className="text-[15px] font-semibold mb-0.5">Design a custom piece</div>
            <div className="text-[12.5px] opacity-80">Free quote in 90 seconds — no payment required</div>
          </div>
        </button>
        <button onClick={() => navigate('/collections')} data-testid="overview-shop-collections"
          className="p-5 rounded-[16px] text-left flex items-start gap-3 transition-transform hover:-translate-y-0.5"
          style={{ background: '#fff', border: '1px solid #E5E0D7', color: '#1A2520' }}>
          <ShoppingBag size={20} style={{ color: '#0F5E4C', marginTop: 2 }} />
          <div>
            <div className="text-[15px] font-semibold mb-0.5">Shop ready-to-buy pieces</div>
            <div className="text-[12.5px]" style={{ color: '#6B746F' }}>One-of-a-kind hand-crafted designs</div>
          </div>
        </button>
      </div>
    </div>
  );
}
