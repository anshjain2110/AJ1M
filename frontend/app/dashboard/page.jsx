import React, { Suspense } from 'react';
import DashboardPage from '@/views/DashboardPage';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Account', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DashboardPage />
    </Suspense>
  );
}
