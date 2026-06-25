/** Eye-catching price badge — reused on project cards and PDP. */
const fmt = (p, currency = 'USD') => {
  if (p === null || p === undefined || p === '') return null;
  const num = Number(p);
  if (Number.isNaN(num)) return String(p);
  return currency === 'USD'
    ? `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : `${currency} ${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

export default function PriceTag({ price, prefix, currency = 'USD', size = 'sm', testid }) {
  const display = fmt(price, currency);
  if (!display) return null;
  const small = size === 'sm';
  return (
    <div className={`inline-flex items-baseline gap-1 font-bold tracking-tight ${small ? 'px-2.5 py-1 text-[12.5px]' : 'px-4 py-2 text-[18px]'} rounded-full`}
      style={{ background: 'linear-gradient(135deg, #0F5E4C 0%, #16876B 100%)', color: '#fff', boxShadow: '0 4px 14px rgba(15,94,76,0.25)' }}
      data-testid={testid || 'price-tag'}>
      {prefix && <span className="opacity-90 font-normal text-[0.85em]">{prefix}</span>}
      <span>{display}</span>
    </div>
  );
}
