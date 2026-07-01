'use client';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Package, Loader2, FileDown, Truck, CheckCircle, Hammer } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const money = (n) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

const STATUS_MAP = {
  processing: { label: 'Being crafted', bg: '#FFF3D9', color: '#7A5800', icon: Hammer },
  in_production: { label: 'In production', bg: '#E3ECFB', color: '#2456A6', icon: Hammer },
  shipped: { label: 'Shipped', bg: '#EFE6FB', color: '#6B3FA0', icon: Truck },
  delivered: { label: 'Delivered', bg: '#E9F5EE', color: '#0F5E4C', icon: CheckCircle },
};

export default function OrdersTab({ headers }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [shopOrders, setShopOrders] = useState([]);
  const [legacyOrders, setLegacyOrders] = useState([]);
  const [downloading, setDownloading] = useState('');

  useEffect(() => {
    Promise.all([
      axios.get(`${BACKEND_URL}/api/me/shop-orders`, { headers }).catch(() => ({ data: { orders: [] } })),
      axios.get(`${BACKEND_URL}/api/me/orders`, { headers }).catch(() => ({ data: { orders: [] } })),
    ]).then(([sr, lr]) => {
      setShopOrders(sr.data.orders || []);
      setLegacyOrders(lr.data.orders || []);
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadInvoice = async (order) => {
    setDownloading(order.order_id);
    try {
      const r = await axios.get(`${BACKEND_URL}/api/me/shop-orders/${order.order_id}/invoice`, { headers, responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order.invoice_number || order.order_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    setDownloading('');
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin" style={{ color: '#0F5E4C' }} /></div>;

  if (shopOrders.length === 0 && legacyOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="orders-empty">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: '#E9F5EE' }}>
          <Package size={26} style={{ color: '#0F5E4C' }} />
        </div>
        <h3 className="text-[22px] mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#1A2520' }}>No orders yet</h3>
        <p className="text-[14px] mb-6 max-w-[320px]" style={{ color: '#6B746F' }}>When you buy a piece, it will appear here with live crafting updates and your invoice.</p>
        <button onClick={() => navigate('/collections')} data-testid="orders-empty-shop-btn"
          className="px-6 py-3 rounded-full text-[14px] font-semibold" style={{ background: '#0F5E4C', color: '#fff' }}>
          Shop collections
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl" data-testid="orders-list">
      {shopOrders.map((o) => {
        const st = STATUS_MAP[o.fulfillment_status] || STATUS_MAP.processing;
        return (
          <div key={o.order_id} className="rounded-[16px] overflow-hidden" style={{ background: '#fff', border: '1px solid #E5E0D7' }} data-testid="shop-order-card">
            {/* Header */}
            <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2" style={{ background: '#F7F3EC', borderBottom: '1px solid #E5E0D7' }}>
              <div>
                <div className="text-[13.5px] font-semibold" style={{ color: '#1A2520' }}>{o.invoice_number || o.order_id}</div>
                <div className="text-[12px]" style={{ color: '#6B746F' }}>Placed {fmtDate(o.created_at)}</div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold" style={{ background: st.bg, color: st.color }} data-testid="order-status-chip">
                <st.icon size={13} /> {st.label}
              </span>
            </div>
            {/* Items */}
            <div className="px-5 py-4 space-y-3">
              {(o.items || []).map((it, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-[10px] overflow-hidden flex-shrink-0" style={{ background: '#F3EEE7', border: '1px solid #E5E0D7' }}>
                    {it.image && <img src={it.image} alt={it.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium truncate" style={{ color: '#1A2520' }}>{it.title}</div>
                    <div className="text-[12px]" style={{ color: '#6B746F' }}>
                      {[it.metal, it.carat && it.carat !== '0' && `${it.carat} ct`, it.size && `Size ${it.size}`].filter(Boolean).join(' · ')}
                      {it.qty > 1 ? ` · ×${it.qty}` : ''}
                    </div>
                  </div>
                  <div className="text-[14px] font-semibold" style={{ color: '#1A2520' }}>{money(it.unit * (it.qty || 1))}</div>
                </div>
              ))}
            </div>
            {/* Tracking */}
            {o.tracking_number && (
              <div className="px-5 pb-3 text-[13px]" style={{ color: '#3F4A45' }}>
                <Truck size={14} className="inline mr-1.5" style={{ color: '#0F5E4C' }} />
                Tracking: <span className="font-mono font-medium">{o.tracking_number}</span>{o.shipping_provider ? ` via ${o.shipping_provider}` : ''}
              </div>
            )}
            {/* Footer */}
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderTop: '1px solid #E5E0D7' }}>
              <div className="text-[14px]" style={{ color: '#6B746F' }}>
                Total paid <span className="font-semibold ml-1" style={{ color: '#0F5E4C' }}>{money(o.amount)}</span>
              </div>
              <button onClick={() => downloadInvoice(o)} disabled={downloading === o.order_id} data-testid="order-invoice-download"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12.5px] font-semibold transition-colors hover:bg-[#E9F5EE]"
                style={{ border: '1px solid #0F5E4C', color: '#0F5E4C', background: '#fff' }}>
                {downloading === o.order_id ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />} Invoice
              </button>
            </div>
          </div>
        );
      })}

      {legacyOrders.length > 0 && (
        <div className="pt-2">
          <h3 className="text-[14px] font-semibold mb-3" style={{ color: '#6B746F' }}>Custom orders</h3>
          <div className="space-y-3">
            {legacyOrders.map((o, i) => (
              <div key={i} className="p-4 rounded-[14px]" style={{ background: '#fff', border: '1px solid #E5E0D7' }}>
                <div className="text-[14.5px] font-medium" style={{ color: '#1A2520' }}>{o.product_description || `Order ${o.order_id}`}</div>
                <div className="text-[12.5px] mt-1" style={{ color: '#6B746F' }}>{fmtDate(o.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}