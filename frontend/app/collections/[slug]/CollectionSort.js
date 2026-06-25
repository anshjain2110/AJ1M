'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function CollectionSort({ initialSort = '' }) {
  const router = useRouter();
  const pathname = usePathname();

  const onChange = (e) => {
    const v = e.target.value;
    const url = v ? `${pathname}?sort=${v}` : pathname;
    router.push(url, { scroll: false });
  };

  return (
    <select
      defaultValue={initialSort}
      onChange={onChange}
      data-testid="collection-sort"
      className="text-[13px] px-3 py-2 bg-transparent"
      style={{ border: '1px solid var(--lj-border)', color: 'var(--lj-text)' }}
    >
      <option value="">Featured</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
    </select>
  );
}
