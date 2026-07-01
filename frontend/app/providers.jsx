'use client';
import React from 'react';
import { CartProvider } from '@/context/CartContext';
import { WizardProvider } from '@/context/WizardContext';

export default function Providers({ children }) {
  return (
    <CartProvider>
      <WizardProvider>{children}</WizardProvider>
    </CartProvider>
  );
}
