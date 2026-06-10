import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import StoreLayout from '../../components/store/StoreLayout';
import { useCart } from '../../context/CartContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const MAX_ATTEMPTS = 8;

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { clearCart } = useCart();
  const [status, setStatus] = useState('checking'); // checking | paid | failed | expired
  const cleared = useRef(false);

  useEffect(() => {
    document.title = 'Order Confirmation | The Local Jewel';
    const sessionId = params.get('session_id');

    let attempts = 0;
    let timer = null;
    const poll = async () => {
      if (!sessionId) { setStatus('failed'); return; }
      try {
        const r = await axios.get(`${BACKEND_URL}/api/checkout/status/${sessionId}`);
        const ps = r.data.payment_status;
        if (ps === 'paid') {
          if (!cleared.current) { clearCart(); cleared.current = true; }
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
    return () => { if (timer) clearTimeout(timer); };
  }, [params, clearCart]);

  return (
    <StoreLayout>
      <div className="max-w-xl mx-auto px-4 py-24 text-center" data-testid="checkout-result">
        {status === 'checking' && (
          <>
            <Loader2 size={44} className="mx-auto mb-5 animate-spin" style={{ color: 'var(--lj-accent)' }} />
            <h1 className="text-3xl mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-text)' }}>Confirming your order…</h1>
            <p className="text-[15px]" style={{ color: 'var(--lj-muted)' }}>One moment while we verify your payment.</p>
          </>
        )}
        {status === 'paid' && (
          <>
            <CheckCircle2 size={56} className="mx-auto mb-5" style={{ color: 'var(--lj-accent)' }} />
            <h1 className="text-4xl mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-accent)' }} data-testid="order-success">Thank you!</h1>
            <p className="text-[15px] mb-7" style={{ color: 'var(--lj-muted)' }}>Your order is confirmed. Your receipt is on its way by email, and our team will be in touch with crafting updates at every step.</p>
            <button onClick={() => navigate('/collections')} className="px-7 py-3.5 text-[13px] tracking-wide font-medium" style={{ background: 'var(--lj-accent)', color: '#fff' }}>Continue Shopping</button>
          </>
        )}
        {(status === 'failed' || status === 'expired') && (
          <>
            <XCircle size={48} className="mx-auto mb-5" style={{ color: 'var(--lj-danger)' }} />
            <h1 className="text-3xl mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--lj-text)' }}>We could not confirm your payment</h1>
            <p className="text-[15px] mb-7" style={{ color: 'var(--lj-muted)' }}>If you were charged, an email confirmation will arrive shortly. Otherwise, please try again.</p>
            <button onClick={() => navigate('/cart')} className="px-7 py-3.5 text-[13px] tracking-wide font-medium" style={{ background: 'var(--lj-accent)', color: '#fff' }}>Back to Bag</button>
          </>
        )}
      </div>
    </StoreLayout>
  );
}
