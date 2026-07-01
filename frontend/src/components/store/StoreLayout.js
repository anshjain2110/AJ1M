'use client';
import React from 'react';
import MegaMenuHeader from './MegaMenuHeader';
import StoreFooter from './StoreFooter';

export default function StoreLayout({ children }) {
  return (
    <div className="store min-h-screen flex flex-col" style={{ background: 'var(--lj-bg)', fontFamily: "'Outfit', Inter, sans-serif" }}>
      <MegaMenuHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}