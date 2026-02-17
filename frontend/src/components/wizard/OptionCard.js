import React from 'react';
import * as Icons from 'lucide-react';

export default function OptionCard({ 
  option, 
  isSelected, 
  onClick, 
  showDesc = false,
  testIdPrefix = 'wizard-option-card'
}) {
  const IconComponent = option.icon ? Icons[option.icon] : null;
  
  return (
    <button
      type="button"
      onClick={() => onClick(option.id)}
      data-testid={`${testIdPrefix}-${option.id}`}
      className="w-full text-left px-4 py-4 flex items-center gap-4 transition-all duration-300"
      style={{
        background: isSelected ? '#1A1610' : 'var(--lj-surface)',
        border: `1.5px solid ${isSelected ? 'var(--lj-accent)' : 'var(--lj-border)'}`,
        borderRadius: 'var(--lj-r-md)',
        boxShadow: isSelected ? 'var(--lj-shadow-1)' : 'none',
      }}
      aria-pressed={isSelected}
    >
      {IconComponent && (
        <div 
          className="w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0"
          style={{ 
            background: isSelected ? 'rgba(201, 168, 106, 0.15)' : 'rgba(255,255,255,0.04)',
          }}
        >
          <IconComponent 
            size={20} 
            strokeWidth={1.5}
            style={{ color: isSelected ? 'var(--lj-accent)' : 'var(--lj-muted)' }}
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span 
          className="text-[16px] leading-[24px] font-medium block"
          style={{ color: isSelected ? 'var(--lj-accent-2)' : 'var(--lj-text)' }}
        >
          {option.label}
        </span>
        {showDesc && option.desc && (
          <span 
            className="text-[13px] leading-[18px] mt-0.5 block"
            style={{ color: 'var(--lj-muted)' }}
          >
            {option.desc}
          </span>
        )}
      </div>
      {isSelected && (
        <div 
          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--lj-accent)' }}
        >
          <Icons.Check size={12} style={{ color: '#0B0B0C' }} />
        </div>
      )}
    </button>
  );
}
