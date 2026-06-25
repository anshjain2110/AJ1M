'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/** Server-rendered details panel — defaults to OPEN so bots see the content in
 * raw HTML. Click to collapse. */
export default function AccordionBlock({ title, icon, children, defaultOpen = true, testid }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b" style={{ borderColor: 'var(--lj-border)' }} data-testid={testid}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left">
        <span className="flex items-center gap-2.5 text-[15.5px] font-semibold" style={{ color: 'var(--lj-text)' }}>
          {icon}{title}
        </span>
        <ChevronDown size={17} className={`transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--lj-muted)' }} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-[2000px] pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="text-[14.5px] leading-[1.7]" style={{ color: '#3F4A45' }}>{children}</div>
      </div>
    </div>
  );
}
