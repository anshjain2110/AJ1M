import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import StoreLayout from '../../components/store/StoreLayout';
import JsonLd from '../../components/JsonLd';
import ContactForm from './ContactForm';
import { getPublicSettings } from '../../lib/api';
import { buildLocalBusinessSchema, SITE_BASE_URL } from '../../lib/seoSchema';

export const revalidate = 60;

export const metadata = {
  title: 'Contact The Local Jewel — Talk to a Jeweler Today',
  description: 'Get in touch with The Local Jewel. Call 585-710-8292, email ansh@thelocaljewel.com, or visit our Winter Park, FL studio. Custom engagement rings, lab-grown diamonds, certified.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact The Local Jewel',
    description: 'Talk to a jeweler — real designers, real answers, usually within a few hours.',
    url: `${SITE_BASE_URL}/contact`,
    type: 'website',
  },
};

export default async function ContactPage() {
  const settings = await getPublicSettings().catch(() => ({}));
  const businessSchema = buildLocalBusinessSchema(settings);

  return (
    <StoreLayout>
      <JsonLd id="jsonld-localbusiness" data={businessSchema} />
      <main className="min-h-screen flex flex-col" style={{ background: 'var(--lj-bg)' }} data-testid="contact-page">
        <section className="px-4 pt-12 pb-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: 'rgba(15,94,76,0.08)', border: '1px solid rgba(15,94,76,0.15)' }}>
              <MessageCircle size={13} style={{ color: 'var(--lj-accent)' }} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--lj-accent)' }}>Contact us</span>
            </div>
            <h1 className="text-[32px] sm:text-[48px] leading-[1.05] font-semibold tracking-[-0.02em] mb-4"
              style={{ color: 'var(--lj-text)', fontFamily: 'var(--lj-serif, "Cormorant Garamond","Playfair Display",Georgia,serif)' }}>
              Talk to a jeweler.
            </h1>
            <p className="text-[15px] sm:text-[17px] leading-[1.55] max-w-xl mx-auto" style={{ color: 'var(--lj-muted)' }}>
              Real designers, real answers — usually within a few hours. Drop a message, call, or stop by our Winter Park studio.
            </p>
          </div>
        </section>

        <section className="px-4 pb-16 max-w-5xl w-full mx-auto">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12">
            <div className="space-y-4">
              <a href="tel:+15857108292" data-testid="contact-card-phone"
                className="flex items-start gap-4 p-5 rounded-[14px] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(15,94,76,0.10)] no-underline"
                style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)', color: 'inherit' }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(15,94,76,0.08)' }}>
                  <Phone size={18} style={{ color: 'var(--lj-accent)' }} />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] mb-1" style={{ color: 'var(--lj-muted)' }}>Call</div>
                  <div className="text-[18px] font-medium" style={{ color: 'var(--lj-text)' }}>585-710-8292</div>
                  <div className="text-[12.5px] mt-1" style={{ color: 'var(--lj-muted)' }}>Mon-Sat · 10am-7pm ET</div>
                </div>
              </a>

              <a href="mailto:ansh@thelocaljewel.com" data-testid="contact-card-email"
                className="flex items-start gap-4 p-5 rounded-[14px] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(15,94,76,0.10)] no-underline"
                style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)', color: 'inherit' }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(15,94,76,0.08)' }}>
                  <Mail size={18} style={{ color: 'var(--lj-accent)' }} />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] mb-1" style={{ color: 'var(--lj-muted)' }}>Email</div>
                  <div className="text-[16px] font-medium" style={{ color: 'var(--lj-text)' }}>ansh@thelocaljewel.com</div>
                  <div className="text-[12.5px] mt-1" style={{ color: 'var(--lj-muted)' }}>Replies usually within a few hours</div>
                </div>
              </a>

              <div data-testid="contact-card-location" className="flex items-start gap-4 p-5 rounded-[14px]"
                style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(15,94,76,0.08)' }}>
                  <MapPin size={18} style={{ color: 'var(--lj-accent)' }} />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] mb-1" style={{ color: 'var(--lj-muted)' }}>Studio</div>
                  <div className="text-[16px] font-medium leading-snug" style={{ color: 'var(--lj-text)' }}>480N Orlando Ave<br />Winter Park, FL 32789</div>
                  <a href="https://maps.google.com/?q=480N+Orlando+Ave+Winter+Park+FL+32789" target="_blank" rel="noopener noreferrer"
                    className="text-[12.5px] mt-1 inline-block hover:underline" style={{ color: 'var(--lj-accent)' }}>
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            </div>

            <ContactForm />
          </div>
        </section>
      </main>
    </StoreLayout>
  );
}
