import React, { useState } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { ArrowRight } from 'lucide-react';
import { RING_SIZES } from '../../../utils/wizardConfig';

export default function RingSizeScreen() {
  const { state, setAnswer, goNext } = useWizard();
  const [size, setSize] = useState(state.answers.ring_size || '');

  const handleContinue = () => {
    setAnswer('ring_size', size);
    goNext('ring_size');
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-6 max-w-[520px] mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-[22px] leading-[28px] font-medium tracking-[-0.005em] mb-2" style={{ color: 'var(--lj-text)' }}>
          What's the ring size?
        </h2>
        <p className="text-[13px] leading-[18px]" style={{ color: 'var(--lj-muted)' }}>
          Don't worry if it's approximate \u2014 we can resize later
        </p>
      </div>

      <div className="mb-6">
        <select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          data-testid="ring-size-select"
          className="w-full min-h-[48px] px-4 py-3 rounded-[10px] text-[16px] appearance-none cursor-pointer transition-colors duration-300"
          style={{
            background: 'var(--lj-surface)',
            border: '1.5px solid var(--lj-border)',
            color: size ? 'var(--lj-text)' : 'var(--lj-muted)',
          }}
        >
          <option value="">Select ring size</option>
          {RING_SIZES.map(s => (
            <option key={s} value={s}>
              US Size {s}
            </option>
          ))}
        </select>
      </div>

      <div className="sticky bottom-0 pt-4 pb-6 mt-auto" style={{ background: 'var(--lj-bg)' }}>
        <button
          onClick={handleContinue}
          disabled={!size}
          data-testid="wizard-continue-button"
          className="w-full min-h-[48px] px-6 rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.99]"
          style={{ 
            background: size ? 'var(--lj-accent)' : '#2A2A2E', 
            color: size ? '#0B0B0C' : 'var(--lj-muted)',
            cursor: size ? 'pointer' : 'not-allowed',
          }}
        >
          Continue
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
