import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, Loader2, XCircle, FileDown, UserRound, PenTool, Hammer, Truck, ShieldCheck } from 'lucide-react';
import StoreLayout from '../../components/store/StoreLayout';
import { useCart } from '../../context/CartContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const MAX_ATTEMPTS = 8;
const money = (n) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const CHECK_MSGS = ['Verifying your payment…', 'Securing your order…', 'Preparing your confirmation…'];

const NEXT_STEPS = [
  { icon: PenTool, title: 'Design confirmation', text: 'We reach out within 24 hours to confirm every detail — sizing, engraving, finish.' },
  { icon: Hammer, title: 'Hand-crafted for you', text: 'Your piece is made to order by The Local Jewel over 2–3 weeks.' },
  { icon: Truck, title: 'Insured delivery', text: 'Free, fully-insured shipping with tracking the moment it leaves the studio.' },
];

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { clearCart } = useCart();
  const [status, setStatus] = useState('checking'); // checking | paid | failed | expired
  const [order, setOrder] = useState(null);
  const [msgIdx, setMsgIdx] = useState(0);
  const cleared = useRef(false);
  const sessionId = params.get('session_id');
  const loggedIn = !!localStorage.getItem('tlj_token');

  useEffect(() => {
    document.title = 'Order Confirmation | The Local Jewel';
    const msgTimer = setInterval(() => setMsgIdx((i) => (i + 1) % CHECK_MSGS.length), 1800);

    let attempts = 0;
    let timer = null;
    const poll = async () => {
      if (!sessionId) { setStatus('failed'); return; }
      try {
        const r = await axios.get(`${BACKEND_URL}/api/checkout/status/${sessionId}`);
        if (r.data.payment_status === 'paid') {
          if (!cleared.current) { clearCart(); cleared.current = true; }
          setOrder(r.data.order || null);
          setStatus('paid');
          return;
        }
        if (r.data.status === 'expired') { setStatus('expired'); return; }
        attempts += 1;
        if (attempts >= MAX_ATTEMPTS) { setStatus('failed'); return; }
        timer = setTimeout(poll, 2000);
      } catch {
        attempts += 1;
        if (attempts >= MAX_ATTEMPTS) { setStatus('failed'); return; }
        timer = setTimeout(poll, 2000);
      }
    };
    poll();
    return () => { if (timer) clearTimeout(timer); clearInterval(msgTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, clearCart]);

  return (
    <StoreLayout>
      <style>{`
        @keyframes tlj-pop { 0% { transform: scale(0.4); opacity: 0; } 70% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes tlj-rise { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .tlj-pop { animation: tlj-pop 0.55s cubic-bezier(.2,.9,.3,1.2) both; }
        .tlj-rise { animation: tlj-rise 0.5s ease both; }
      `}</style>
      <div className="max-w-2xl mx-auto px-4 py-16" data-testid="checkout-result">

        {status === 'checking' && (
          <div className="text-center py-16">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <Loader2 size={64} className="animate-spin" style={{ color: '#0F5E4C', opacity: 0.85 }} />
              <ShieldCheck size={24} className="absolute inset-0 m-auto" style={{ color: '#0F5E4C' }} />
            </div>
            <h1 className="text-3xl mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-text)' }}>{CHECK_MSGS[msgIdx]}</h1>
            <p className="text-[14px]" style={{ color: 'var(--lj-muted)' }}>This only takes a few seconds — please don't close this page.</p>
          </div>
        )}

        {status === 'paid' && (
          <div>
            {/* Confirmation hero */}
            <div className="text-center mb-9">
              <div className="tlj-pop w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: '#E9F5EE' }}>
                <CheckCircle2 size={44} style={{ color: '#0F5E4C' }} />
              </div>
              <h1 className="tlj-rise text-4xl sm:text-5xl mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#0F5E4C' }} data-testid="order-success">Order confirmed</h1>
              {order?.invoice_number && (
                <p className="tlj-rise text-[14px]" style={{ color: 'var(--lj-muted)', animationDelay: '0.1s' }} data-testid="order-invoice-number">
                  Order <span className="font-semibold" style={{ color: 'var(--lj-text)' }}>{order.invoice_number}</span>
                  {order.email ? <> · receipt sent to <span className="font-medium">{order.email}</span></> : null}
                </p>
              )}
            </div>

            {/* Order summary */}
            {order && (
              <div className="tlj-rise rounded-[16px] overflow-hidden mb-6" style={{ background: '#fff', border: '1px solid #E5E0D7', animationDelay: '0.15s' }} data-testid="order-items">
                <div className="px-5 py-3.5 text-[12px] uppercase tracking-[0.12em] font-semibold" style={{ background: '#F7F3EC', color: '#6B746F', borderBottom: '1px solid #E5E0D7' }}>
                  Your order
                </div>
                <div className="px-5 py-4 space-y-4">
                  {(order.items || []).map((it, i) => (
                    <div key={i} className="flex items-center gap-3.5">
                      <div className="w-16 h-16 rounded-[10px] overflow-hidden flex-shrink-0" style={{ background: '#F3EEE7', border: '1px solid #E5E0D7' }}>
                        {it.image && <img src={it.image} alt={it.title} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14.5px] font-medium" style={{ color: '#1A2520' }}>{it.title}</div>
                        <div className="text-[12.5px]" style={{ color: '#6B746F' }}>
                          {[it.metal, it.carat && it.carat !== '0' && `${it.carat} ct`, it.size && `Size ${it.size}`].filter(Boolean).join(' · ')}
                          {it.qty > 1 ? ` · ×${it.qty}` : ''}
                        </div>
                      </div>
                      <div className="text-[14.5px] font-semibold" style={{ color: '#1A2520' }}>{money(it.unit * (it.qty || 1))}</div>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderTop: '1px solid #E5E0D7' }}>
                  <span className="text-[14px]" style={{ color: '#6B746F' }}>Total paid</span>
                  <span className="text-[20px] font-semibold" style={{ color: '#0F5E4C' }} data-testid="order-total">{money(order.amount)}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="tlj-rise grid sm:grid-cols-2 gap-3 mb-10" style={{ animationDelay: '0.22s' }}>
              <button
                onClick={() => window.open(`${BACKEND_URL}/api/checkout/invoice/${sessionId}`, '_blank')}
                data-testid="invoice-download-btn"
                className="py-3.5 rounded-full text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors hover:bg-[#E9F5EE]"
                style={{ border: '1.5px solid #0F5E4C', color: '#0F5E4C', background: '#fff' }}>
                <FileDown size={16} /> Download invoice
              </button>
              <button
                onClick={() => navigate(loggedIn ? '/dashboard?tab=orders' : '/login')}
                data-testid="view-account-btn"
                className="py-3.5 rounded-full text-[14px] font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: '#0F5E4C', color: '#fff' }}>
                <UserRound size={16} /> {loggedIn ? 'Track in my account' : 'Track your order'}
              </button>
            </div>

            {/* What happens next */}
            <div className="tlj-rise mb-10" style={{ animationDelay: '0.3s' }} data-testid="next-steps">
              <h2 className="text-[22px] mb-5" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#1A2520' }}>What happens next</h2>
              <div className="space-y-0">
                {NEXT_STEPS.map((s, i) => (
                  <div key={i} className="flex gap-4 pb-6 relative">
                    {i < NEXT_STEPS.length - 1 && <div className="absolute left-[19px] top-10 bottom-0 w-px" style={{ background: '#E5E0D7' }} />}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative z-10" style={{ background: '#E9F5EE' }}>
                      <s.icon size={17} style={{ color: '#0F5E4C' }} />
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold mb-0.5" style={{ color: '#1A2520' }}>{s.title}</div>
                      <p className="text-[13.5px] leading-[1.6]" style={{ color: '#6B746F' }}>{s.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <Link to="/collections" className="text-[13.5px] font-medium underline underline-offset-4" style={{ color: '#0F5E4C' }}>Continue shopping</Link>
            </div>
          </div>
        )}

        {(status === 'failed' || status === 'expired') && (
          <div className="text-center py-16">
            <XCircle size={48} className="mx-auto mb-5" style={{ color: 'var(--lj-danger)' }} />
            <h1 className="text-3xl mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-text)' }}>We could not confirm your payment</h1>
            <p className="text-[15px] mb-7" style={{ color: 'var(--lj-muted)' }}>If you were charged, an email confirmation will arrive shortly. Otherwise, please try again.</p>
            <button onClick={() => navigate('/cart')} className="px-7 py-3.5 text-[13px] tracking-wide font-medium" style={{ background: 'var(--lj-accent)', color: '#fff' }}>Back to Bag</button>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
