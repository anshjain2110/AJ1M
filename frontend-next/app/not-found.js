export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20" data-testid="not-found-page">
      <h1 className="text-5xl mb-3 font-serif" style={{ color: 'var(--lj-text)' }}>404</h1>
      <p className="text-[15px] mb-6" style={{ color: 'var(--lj-muted)' }}>We can&apos;t find that piece.</p>
      <a href="/collections" className="px-6 py-3 rounded-full text-[13px] font-semibold no-underline" style={{ background: 'var(--lj-accent)', color: '#fff' }}>
        Browse all collections
      </a>
    </main>
  );
}
