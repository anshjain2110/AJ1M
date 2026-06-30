import React, { Suspense } from 'react';
import CheckoutSuccessPage from '@/views/store/CheckoutSuccessPage';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Order Confirmation', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessPage />
    </Suspense>
  );
}
