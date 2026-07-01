import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <p style={{ fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#0F5E4C', marginBottom: 10 }}>The Local Jewel</p>
      <h1 style={{ fontSize: 34, fontWeight: 600, color: '#1A1A1C', marginBottom: 10, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Page not found</h1>
      <p style={{ color: '#6B7280', marginBottom: 22, maxWidth: 460 }}>The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.</p>
      <Link href="/" style={{ background: '#0F5E4C', color: '#fff', padding: '12px 26px', borderRadius: 14, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Back to home</Link>
    </div>
  );
}
