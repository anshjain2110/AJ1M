import React, { useState } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { ArrowRight } from 'lucide-react';
import { WRIST_SIZES, METALS } from '../../../utils/wizardConfig';

export default function BraceletScreen() {
  const { state, setAnswer, goNext } = useWizard();
  const [wristSize, setWristSize] = useState(state.answers.bracelet_wrist_size || '');
  const [metal, setMetal] = useState(state.answers.bracelet_metal || '');
  const handleContinue = () => { setAnswer('bracelet_wrist_size', wristSize); setAnswer('bracelet_metal', metal); goNext('bracelet_specifics'); };
  const canContinue = wristSize && metal;
  return (
    <div className="flex-1 flex flex-col px-4 py-6 max-w-[520px] mx-auto w-full">
      <div className="mb-6"><h2 className="text-[22px] leading-[28px] font-medium tracking-[-0.005em] mb-2" style={{ color: 'var(--lj-text)' }}>Bracelet Details</h2><p className="text-[13px] leading-[18px]" style={{ color: 'var(--lj-muted)' }}>Help us find the perfect fit for you</p></div>
      <div className="mb-6"><label className="text-[16px] leading-[24px] font-medium mb-3 block" style={{ color: 'var(--lj-text)' }}>Wrist Size / Length</label>
        <div className="grid grid-cols-3 gap-2">{WRIST_SIZES.map(size => (<button key={size} onClick={() => setWristSize(size)} className="min-h-[44px] px-3 py-2 rounded-[10px] text-[16px] transition-all duration-300" style={{ background: wristSize === size ? '#E8F5F1' : 'var(--lj-surface)', border: `1.5px solid ${wristSize === size ? 'var(--lj-accent)' : 'var(--lj-border)'}`, color: wristSize === size ? 'var(--lj-accent)' : 'var(--lj-text)' }}>{size}</button>))}</div>
      </div>
      <div className="mb-6"><label className="text-[16px] leading-[24px] font-medium mb-3 block" style={{ color: 'var(--lj-text)' }}>Metal Preference</label>
        <div className="space-y-2">{METALS.map(m => (<button key={m.id} onClick={() => setMetal(m.id)} className="w-full text-left min-h-[44px] px-4 py-3 rounded-[14px] text-[16px] transition-all duration-300" style={{ background: metal === m.id ? '#E8F5F1' : 'var(--lj-surface)', border: `1.5px solid ${metal === m.id ? 'var(--lj-accent)' : 'var(--lj-border)'}`, color: metal === m.id ? 'var(--lj-accent)' : 'var(--lj-text)' }}>{m.label}</button>))}</div>
      </div>
      <div className="sticky bottom-0 pt-4 pb-6 mt-auto" style={{ background: 'var(--lj-bg)' }}>
        <button onClick={handleContinue} disabled={!canContinue} data-testid="wizard-continue-button" className="w-full min-h-[48px] px-6 rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.99]" style={{ background: canContinue ? 'var(--lj-accent)' : '#E5E5E3', color: canContinue ? '#FFFFFF' : 'var(--lj-muted)', cursor: canContinue ? 'pointer' : 'not-allowed' }}>Continue <ArrowRight size={18} /></button>
      </div>
    </div>
  );
}
