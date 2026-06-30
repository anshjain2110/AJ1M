import React, { Suspense } from 'react';
import CartPage from '@/views/store/CartPage';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your Cart', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CartPage />
    </Suspense>
  );
}
