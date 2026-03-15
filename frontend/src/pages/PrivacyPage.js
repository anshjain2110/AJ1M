import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--lj-bg)' }}>
      <header className="px-4 py-3 flex items-center" style={{ borderBottom: '1px solid var(--lj-border)' }}>
        <a href="/"><img src="/logo-main.png" alt="The Local Jewel" className="h-10 object-contain" /></a>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-[28px] font-semibold mb-2" style={{ color: 'var(--lj-text)' }}>Privacy Policy</h1>
        <p className="text-[13px] mb-8" style={{ color: 'var(--lj-muted)' }}>Last Updated: February 28, 2026</p>
        <div className="space-y-6 text-[15px] leading-[24px]" style={{ color: 'var(--lj-text)' }}>
          <p style={{ color: 'var(--lj-muted)' }}>The Local Jewel ("we," "us," or "our") respects your privacy. This policy explains how we collect, use, and protect your information when you visit www.thelocaljewel.com or communicate with us.</p>

          <Section title="Information We Collect">
            <p className="font-medium mb-2">Personal Information You Provide:</p>
            <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--lj-muted)' }}>
              <li>Name</li><li>Email address</li><li>Phone number</li><li>Shipping/billing address</li><li>Ring preferences and custom design details</li><li>Payment information (processed securely by third-party providers)</li>
            </ul>
            <p className="font-medium mb-2 mt-4">Automatically Collected Information:</p>
            <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--lj-muted)' }}>
              <li>Browser type and device information</li><li>IP address</li><li>Pages visited and time spent on site</li><li>Cookies and similar tracking technologies</li>
            </ul>
          </Section>

          <Section title="How We Use Your Information">
            <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--lj-muted)' }}>
              <li>Respond to inquiries and provide quotes</li><li>Create and deliver custom jewelry</li><li>Process orders and payments</li><li>Send order updates via email or SMS</li><li>Send promotional messages (with your consent)</li><li>Improve our website and services</li><li>Comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="Text Messaging (SMS)">
            <p style={{ color: 'var(--lj-muted)' }}>By providing your phone number and opting in, you consent to receive order confirmations and updates, appointment reminders, and promotional offers and announcements.</p>
            <p className="mt-2" style={{ color: 'var(--lj-muted)' }}>Message frequency varies. Message and data rates may apply. To opt out, reply STOP to any message. For help, reply HELP or contact us at ansh@thelocaljewel.com.</p>
            <p className="mt-2" style={{ color: 'var(--lj-muted)' }}>We will never sell your phone number to third parties.</p>
          </Section>

          <Section title="Sharing Your Information">
            <p style={{ color: 'var(--lj-muted)' }}>We do not sell your personal information. We may share data with payment processors (Stripe, PayPal, etc.), shipping carriers (USPS, FedEx, UPS), SMS service providers, and analytics tools (Google Analytics). All third parties are bound by confidentiality agreements.</p>
          </Section>

          <Section title="Cookies">
            <p style={{ color: 'var(--lj-muted)' }}>We use cookies to improve your experience, analyze traffic, and remember preferences. You can disable cookies in your browser settings, but some features may not work properly.</p>
          </Section>

          <Section title="Data Security">
            <p style={{ color: 'var(--lj-muted)' }}>We use industry-standard encryption and security measures to protect your information. However, no method of transmission over the internet is 100% secure.</p>
          </Section>

          <Section title="Data Retention">
            <p style={{ color: 'var(--lj-muted)' }}>We retain your information as long as necessary to provide services, comply with legal obligations, and resolve disputes. You may request deletion of your data at any time.</p>
          </Section>

          <Section title="Your Rights">
            <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--lj-muted)' }}>
              <li>Access the personal data we hold about you</li><li>Request correction of inaccurate data</li><li>Request deletion of your data</li><li>Opt out of marketing communications</li>
            </ul>
            <p className="mt-2" style={{ color: 'var(--lj-muted)' }}>California residents have additional rights under the CCPA. Contact us to exercise these rights.</p>
          </Section>

          <Section title="Changes to This Policy">
            <p style={{ color: 'var(--lj-muted)' }}>We may update this policy from time to time. Changes will be posted on this page with an updated date.</p>
          </Section>

          <Section title="Contact Us">
            <p style={{ color: 'var(--lj-muted)' }}>Email: ansh@thelocaljewel.com<br />Phone: 585-710-8292<br />Address: 480N Orlando Ave, Winter Park, FL 32789</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-[18px] font-medium mb-3" style={{ color: 'var(--lj-text)' }}>{title}</h2>
      {children}
    </div>
  );
}
