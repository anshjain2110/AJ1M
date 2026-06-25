import React, { useState, useCallback, useRef } from 'react';
import { useWizard } from '../../context/WizardContext';
import OptionCard from './OptionCard';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { DIAMOND_SHAPES } from '../../utils/wizardConfig';

export default function DiamondShapeScreen() {
  const { state, setAnswer, goNext, setAnswerAndAdvance } = useWizard();
  const [selected, setSelected] = useState(state.answers.diamond_shape || null);
  const [showModal, setShowModal] = useState(false);
  const isClickPending = useRef(false);

  const handleSelect = useCallback((id) => {
    if (isClickPending.current) return;
    setSelected(id);
    isClickPending.current = true;
    setTimeout(() => {
      setAnswerAndAdvance('diamond_shape', id, 'diamond_shape');
      setTimeout(() => { isClickPending.current = false; }, 500);
    }, 250);
  }, [setAnswerAndAdvance]);

  return (
    <div className="flex-1 flex flex-col px-4 py-6 max-w-[520px] mx-auto w-full">
      {/* Question */}
      <div className="mb-4">
        <h2 className="text-[22px] leading-[28px] font-medium tracking-[-0.005em] mb-2" style={{ color: 'var(--lj-text)' }}>
          Preferred diamond shape?
        </h2>
        <p className="text-[13px] leading-[18px]" style={{ color: 'var(--lj-muted)' }}>
          Each shape has its own unique character
        </p>
      </div>

      {/* Custom Cut Announcement */}
      <div className="mb-5 p-3.5 rounded-[12px] flex items-start gap-3" style={{ background: 'rgba(15,94,76,0.04)', border: '1px solid rgba(15,94,76,0.12)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(15,94,76,0.1)' }}>
          <Sparkles size={16} style={{ color: 'var(--lj-accent)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium leading-[20px]" style={{ color: 'var(--lj-text)' }}>
            We also custom cut diamonds
          </p>
          <p className="text-[12px] leading-[17px] mt-0.5" style={{ color: 'var(--lj-muted)' }}>
            Shapes never seen before — letters, symbols, anything you dream of.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="text-[12px] font-medium mt-1.5 inline-flex items-center gap-1 transition-opacity hover:opacity-80"
            style={{ color: 'var(--lj-accent)' }}
          >
            See examples →
          </button>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3 flex-1">
        {DIAMOND_SHAPES.map(option => (
          <OptionCard
            key={option.id}
            option={option}
            isSelected={selected === option.id}
            onClick={handleSelect}
          />
        ))}
      </div>

      {/* Custom Cut Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-[440px] rounded-[18px] overflow-hidden" style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)', boxShadow: 'var(--lj-shadow-2)' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--lj-border)' }}>
              <div>
                <h3 className="text-[18px] font-medium" style={{ color: 'var(--lj-text)' }}>Custom Cut Diamonds</h3>
                <p className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>Shapes never seen before</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F0F0EE] transition-colors">
                <X size={18} style={{ color: 'var(--lj-muted)' }} />
              </button>
            </div>

            {/* Images */}
            <div className="p-5">
              <div className="grid grid-cols-5 gap-2">
                {/* Left: Loose custom cut diamonds (2 images, taking 3 cols) */}
                <div className="col-span-3 space-y-2">
                  <div className="rounded-[10px] overflow-hidden" style={{ border: '1px solid var(--lj-border)' }}>
                    <img src="/custom-cut-1.jpeg" alt="Custom cut diamond letters A-Z" className="w-full h-auto object-cover" />
                  </div>
                  <div className="rounded-[10px] overflow-hidden" style={{ border: '1px solid var(--lj-border)' }}>
                    <img src="/custom-cut-2.jpeg" alt="Custom cut diamond tree shapes" className="w-full h-auto object-cover" />
                  </div>
                  <p className="text-[11px] text-center" style={{ color: 'var(--lj-muted)' }}>Loose custom cut diamonds</p>
                </div>
                {/* Right: Ring made from custom diamonds (2 cols) */}
                <div className="col-span-2 flex flex-col">
                  <div className="rounded-[10px] overflow-hidden flex-1" style={{ border: '1px solid var(--lj-border)' }}>
                    <img src="/custom-cut-ring.jpg" alt="Custom letter diamond rings" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[11px] text-center mt-2" style={{ color: 'var(--lj-muted)' }}>Finished ring</p>
                </div>
              </div>

              <p className="text-[13px] leading-[19px] mt-4 text-center" style={{ color: 'var(--lj-muted)' }}>
                From letters and initials to custom symbols — we cut diamonds into any shape you can imagine.
              </p>

              <button
                onClick={() => setShowModal(false)}
                className="w-full mt-4 min-h-[44px] rounded-[12px] text-[14px] font-medium transition-all"
                style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}
              >
                Got it — continue choosing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
