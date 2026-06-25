import Link from 'next/link';
import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Custom Cut Diamonds — Letters, Symbols & Shapes',
  description: 'We custom cut diamonds into any shape — alphabet letters, symbols, initials, and beyond. See our custom diamond cuts and request your own.',
  alternates: { canonical: '/cuts' },
};

export default function CutsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--lj-bg)' }} data-testid="cuts-page">
      <div className="px-4 py-4 flex justify-center" style={{ borderBottom: '1px solid var(--lj-border)' }}>
        <Link href="/">{/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-main.png" alt="The Local Jewel" className="h-10 object-contain" /></Link>
      </div>

      <div className="px-4 pt-10 pb-6 text-center max-w-lg mx-auto">
        <div className="flex justify-center mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(15,94,76,0.08)' }}>
            <Sparkles size={20} style={{ color: 'var(--lj-accent)' }} />
          </div>
        </div>
        <h1 className="text-[26px] leading-[32px] font-semibold tracking-[-0.01em] mb-3" style={{ color: 'var(--lj-text)' }}>
          Here are some cuts you probably haven&apos;t seen before.
        </h1>
        <p className="text-[15px] leading-[22px]" style={{ color: 'var(--lj-muted)' }}>
          We custom cut diamonds into any shape — letters, symbols, initials, and beyond.
        </p>
      </div>

      <div className="px-4 pb-8 max-w-lg mx-auto">
        <div className="rounded-[14px] overflow-hidden mb-3" style={{ border: '1px solid var(--lj-border)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/custom-cut-1.jpeg" alt="Custom cut diamond alphabet — A to Z" className="w-full h-auto" />
        </div>
        <p className="text-[12px] text-center mb-6" style={{ color: 'var(--lj-muted)' }}>A–Z alphabet diamonds, custom cut in-house</p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--lj-border)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/custom-cut-2.jpeg" alt="Custom cut diamond trees and symbols" className="w-full h-auto" />
          </div>
          <div className="rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--lj-border)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/custom-cut-ring.jpg" alt="Custom letter diamond ring" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-[12px] text-center mb-8" style={{ color: 'var(--lj-muted)' }}>
          <span>Custom shapes &amp; symbols</span>
          <span>Set into 14K gold rings</span>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px" style={{ background: 'var(--lj-border)' }} />
          <span className="text-[12px] font-medium" style={{ color: 'var(--lj-muted)' }}>INTERESTED?</span>
          <div className="flex-1 h-px" style={{ background: 'var(--lj-border)' }} />
        </div>

        <div className="space-y-3">
          <a href="https://www.instagram.com/thelocaljewel/" target="_blank" rel="noopener noreferrer"
            className="w-full min-h-[52px] rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2.5 transition-all duration-300 active:scale-[0.99] no-underline"
            style={{ background: 'var(--lj-accent)', color: '#FFFFFF', boxShadow: '0 4px 20px rgba(15,94,76,0.2)' }}
            data-testid="cuts-dm-cta">
            <MessageCircle size={18} /> Want one of these? Let&apos;s talk
          </a>
          <Link href="/?utm_source=cuts_page"
            className="w-full min-h-[48px] rounded-[14px] font-medium text-[15px] flex items-center justify-center gap-2 transition-all duration-300 no-underline"
            style={{ background: 'var(--lj-surface)', color: 'var(--lj-text)', border: '1px solid var(--lj-border)' }}
            data-testid="cuts-quote-cta">
            Or get a free custom quote <ArrowRight size={16} />
          </Link>
        </div>

        <p className="text-[12px] text-center mt-6" style={{ color: 'var(--lj-muted)' }}>
          The Local Jewel · Custom Diamond Jewelry · Worldwide Shipping
        </p>
      </div>
    </div>
  );
}
