import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and conditions for The Local Jewel custom jewelry services.',
  alternates: { canonical: '/terms' },
};

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-[18px] font-medium mb-3" style={{ color: 'var(--lj-text)' }}>{title}</h2>
      {children}
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--lj-bg)' }} data-testid="terms-page">
      <header className="px-4 py-3 flex items-center" style={{ borderBottom: '1px solid var(--lj-border)' }}>
        <Link href="/">{/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-main.png" alt="The Local Jewel" className="h-10 object-contain" /></Link>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-[28px] font-semibold mb-2" style={{ color: 'var(--lj-text)' }}>Terms &amp; Conditions</h1>
        <p className="text-[13px] mb-8" style={{ color: 'var(--lj-muted)' }}>Last Updated: February 28, 2026</p>
        <div className="space-y-6 text-[15px] leading-[24px]" style={{ color: 'var(--lj-text)' }}>
          <p style={{ color: 'var(--lj-muted)' }}>Welcome to The Local Jewel. By using our website or services, you agree to these terms. Please read them carefully.</p>
          <Section title="About Our Services">
            <p style={{ color: 'var(--lj-muted)' }}>The Local Jewel provides custom and ready-made lab-grown diamond jewelry. We specialize in engagement rings, wedding bands, and fine jewelry made to order.</p>
          </Section>
          <Section title="Quotes and Pricing">
            <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--lj-muted)' }}>
              <li>All quotes are valid for 7 days unless otherwise stated</li><li>Prices are in USD and do not include shipping or applicable taxes</li><li>Final pricing is confirmed upon order approval</li>
            </ul>
          </Section>
          <Section title="Custom Orders">
            <p style={{ color: 'var(--lj-muted)' }}>Custom jewelry is made specifically for you. By placing a custom order:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2" style={{ color: 'var(--lj-muted)' }}>
              <li>Production begins only after design approval</li><li>Changes after production starts may incur additional fees</li><li>Custom items are non-returnable unless defective</li>
            </ul>
            <p className="mt-2" style={{ color: 'var(--lj-muted)' }}>We provide detailed renders and specifications before production. Please review carefully before approving.</p>
          </Section>
          <Section title="Production and Delivery">
            <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--lj-muted)' }}>
              <li>Standard production: 3-7 days for most custom pieces</li><li>Rush orders may be available for an additional fee</li><li>Delivery times vary based on shipping method and location</li><li>We are not responsible for delays caused by carriers or customs</li>
            </ul>
          </Section>
          <Section title="Payments">
            <p style={{ color: 'var(--lj-muted)' }}>We accept major credit cards, PayPal, and bank transfers. Full payment is required before shipping unless other arrangements are made.</p>
          </Section>
          <Section title="Returns and Exchanges">
            <p className="font-medium mb-2">Ready-made (non-custom) items:</p>
            <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--lj-muted)' }}>
              <li>May be returned within 14 days of delivery</li><li>Items must be unworn and in original condition</li><li>Refunds issued to original payment method minus shipping costs</li>
            </ul>
            <p className="font-medium mb-2 mt-4">Custom items:</p>
            <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--lj-muted)' }}>
              <li>Non-returnable unless defective or not as specified</li><li>Defects must be reported within 7 days of delivery with photos</li>
            </ul>
          </Section>
          <Section title="Warranty">
            <p style={{ color: 'var(--lj-muted)' }}>All jewelry includes a 1-year warranty covering manufacturing defects and stone loss due to setting failure.</p>
            <p className="mt-2" style={{ color: 'var(--lj-muted)' }}>Warranty does not cover normal wear and tear, damage from improper care or accidents, or resizing/alterations done elsewhere.</p>
          </Section>
          <Section title="Intellectual Property">
            <p style={{ color: 'var(--lj-muted)' }}>All designs, images, and content on this website are owned by The Local Jewel. You may not reproduce, distribute, or use our content without written permission.</p>
          </Section>
          <Section title="Limitation of Liability">
            <p style={{ color: 'var(--lj-muted)' }}>To the maximum extent permitted by law, The Local Jewel is not liable for indirect, incidental, or consequential damages, loss of profits or data, or damages exceeding the amount paid for the product.</p>
          </Section>
          <Section title="Dispute Resolution">
            <p style={{ color: 'var(--lj-muted)' }}>Any disputes will be resolved through good-faith negotiation. If unresolved, disputes will be subject to binding arbitration in the State of Florida, under Florida law.</p>
          </Section>
          <Section title="Changes to Terms">
            <p style={{ color: 'var(--lj-muted)' }}>We may update these terms at any time. Continued use of our services after changes constitutes acceptance of the new terms.</p>
          </Section>
          <Section title="Contact Us">
            <p style={{ color: 'var(--lj-muted)' }}>Email: ansh@thelocaljewel.com<br />Phone: 585-710-8292<br />Address: 480N Orlando Ave, Winter Park, FL 32789</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
