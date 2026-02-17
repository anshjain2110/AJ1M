import React, { useState, useCallback } from 'react';
import { useWizard } from '../../context/WizardContext';
import OptionCard from './OptionCard';
import { ArrowRight } from 'lucide-react';

// Generic single-select screen
export default function SingleSelectScreen({ 
  screenId, 
  title, 
  subtitle, 
  options, 
  field, 
  showDesc = false,
  autoAdvance = true 
}) {
  const { state, setAnswer, goNext, setAnswerAndAdvance } = useWizard();
  const [selected, setSelected] = useState(state.answers[field] || null);

  const handleSelect = useCallback((id) => {
    setSelected(id);
    if (autoAdvance) {
      // Use atomic set+advance to avoid stale closure issues
      setTimeout(() => {
        setAnswerAndAdvance(field, id, screenId);
      }, 250);
    } else {
      setAnswer(field, id);
    }
  }, [field, screenId, setAnswer, setAnswerAndAdvance, autoAdvance]);

  return (
    <div className="flex-1 flex flex-col px-4 py-6 max-w-[520px] mx-auto w-full">
      {/* Question */}
      <div className="mb-6">
        <h2 
          className="text-[22px] leading-[28px] font-medium tracking-[-0.005em] mb-2"
          style={{ color: 'var(--lj-text)' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-[13px] leading-[18px]" style={{ color: 'var(--lj-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      
      {/* Options */}
      <div className="space-y-3 flex-1">
        {options.map(option => (
          <OptionCard
            key={option.id}
            option={option}
            isSelected={selected === option.id}
            onClick={handleSelect}
            showDesc={showDesc}
          />
        ))}
      </div>
      
      {/* Manual continue button (if not auto-advance) */}
      {!autoAdvance && selected && (
        <div className="sticky bottom-0 pt-4 pb-6" style={{ background: 'var(--lj-bg)' }}>
          <button
            onClick={() => goNext(screenId)}
            data-testid="wizard-continue-button"
            className="w-full min-h-[48px] px-6 rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.99]"
            style={{ 
              background: 'var(--lj-accent)', 
              color: '#0B0B0C',
            }}
          >
            Continue
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
