import React, { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Package, Loader2, ChevronLeft, ChevronRight, Truck } from 'lucide-react';

const ORDER_STATUSES = ['processing', 'in_production', 'shipped', 'delivered'];
const STATUS_LABELS = { processing: 'Processing', in_production: 'In Production', shipped: 'Shipped', delivered: 'Delivered' };
const STATUS_COLORS = { processing: { bg: 'rgba(201,168,106,0.1)', color: 'var(--lj-accent)' }, in_production: { bg: 'rgba(96,165,250,0.1)', color: '#60A5FA' }, shipped: { bg: 'rgba(167,139,250,0.1)', color: '#A78BFA' }, delivered: { bg: 'rgba(86,194,113,0.1)', color: 'var(--lj-success)' } };

export default function OrdersPage() {
  const { api } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editOrder, setEditOrder] = useState(null);
  const [trackingNum, setTrackingNum] = useState('');
  const [shippingUrl, setShippingUrl] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api('get', `/api/admin/orders?page=${page}&limit=25`);
      setOrders(res.data.orders); setTotal(res.data.total);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [api, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateOrder = async (orderId, data) => {
    await api('patch', `/api/admin/orders/${orderId}`, data);
    fetchOrders();
    setEditOrder(null);
  };

  return (
    <div className="max-w-6xl">
      <h1 className="text-[28px] font-semibold mb-6" style={{ color: 'var(--lj-text)' }}>Orders</h1>
      {loading ? <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--lj-accent)' }} /></div> : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={40} className="mx-auto mb-4" style={{ color: 'var(--lj-muted)' }} />
          <p className="text-[16px]" style={{ color: 'var(--lj-muted)' }}>No orders yet. Convert accepted quotes to create orders.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const sc = STATUS_COLORS[order.status] || STATUS_COLORS.processing;
            return (
              <div key={order.order_id} className="p-4 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[14px] font-medium" style={{ color: 'var(--lj-text)' }}>{order.order_id}</span>
                    <span className="ml-2 text-[13px]" style={{ color: 'var(--lj-muted)' }}>Lead: {order.lead_id}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[12px] font-medium" style={{ background: sc.bg, color: sc.color }}>{STATUS_LABELS[order.status]}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ORDER_STATUSES.map(s => (
                    <button key={s} onClick={() => updateOrder(order.order_id, { status: s })} className="px-3 py-1 rounded-full text-[12px] transition-all" style={{ background: order.status === s ? STATUS_COLORS[s].color : 'var(--lj-bg)', color: order.status === s ? '#0B0B0C' : 'var(--lj-muted)', border: `1px solid ${STATUS_COLORS[s].color}30` }}>
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
                {order.tracking_number && (
                  <div className="mt-2 flex items-center gap-2 text-[13px]" style={{ color: 'var(--lj-muted)' }}>
                    <Truck size={14} /> Tracking: {order.tracking_number}
                    {order.shipping_url && <a href={order.shipping_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--lj-accent)' }}>Track</a>}
                  </div>
                )}
                <div className="mt-2 flex gap-2">
                  <input placeholder="Tracking #" value={editOrder === order.order_id ? trackingNum : ''} onChange={e => { setEditOrder(order.order_id); setTrackingNum(e.target.value); }} className="flex-1 min-h-[32px] px-2 rounded-[6px] text-[13px]" style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)', color: 'var(--lj-text)' }} />
                  <button onClick={() => updateOrder(order.order_id, { tracking_number: trackingNum, shipping_url: shippingUrl })} className="px-3 h-8 rounded-[6px] text-[12px] font-medium" style={{ background: 'var(--lj-accent)', color: '#0B0B0C' }}>Update</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
