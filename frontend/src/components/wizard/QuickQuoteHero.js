import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Link as LinkIcon, ArrowRight, X, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { trackEvent } from '../../utils/analytics';
import QuickQuoteModal from './QuickQuoteModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Phone animation sequence: inspiration → designing → 4 renders → final with price
const PHONE_STAGES = [
  { kind: 'inspiration', src: '/hero-inspiration-1.png', label: 'You shared inspiration' },
  { kind: 'inspiration', src: '/hero-inspiration-2.png', label: 'Our designers see it' },
  { kind: 'designing',   src: null,                       label: 'Rendering in 3D...' },
  { kind: 'render',      src: '/hero-render-3.jpeg',      label: 'Render 1 of 4' },
  { kind: 'render',      src: '/hero-render-1.jpeg',      label: 'Render 2 of 4' },
  { kind: 'render',      src: '/hero-render-2.jpeg',      label: 'Render 3 of 4' },
  { kind: 'final',       src: '/hero-render-4.jpeg',      label: 'Your custom quote', price: '$2,850' },
];

export default function QuickQuoteHero() {
  const [linkInput, setLinkInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const fileRef = useRef(null);
  const [stageIdx, setStageIdx] = useState(0);

  // Cycle phone animation
  useEffect(() => {
    const stage = PHONE_STAGES[stageIdx];
    // Final card lingers a little longer for read time
    const delay = stage.kind === 'final' ? 3800 : stage.kind === 'designing' ? 1700 : 2400;
    const t = setTimeout(() => setStageIdx(i => (i + 1) % PHONE_STAGES.length), delay);
    return () => clearTimeout(t);
  }, [stageIdx]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 3 - uploadedFiles.length);
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      const res = await axios.post(`${BACKEND_URL}/api/uploads`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadedFiles(prev => [...prev, ...res.data.files]);
      trackEvent('tlj_quick_quote_upload', { count: res.data.files.length });
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (i) => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i));

  const openModal = () => {
    trackEvent('tlj_quick_quote_open', {
      has_link: !!linkInput.trim(),
      has_files: uploadedFiles.length > 0,
      has_notes: !!notesInput.trim(),
    });
    setModalOpen(true);
  };

  const stage = PHONE_STAGES[stageIdx];

  return (
    <section data-testid="quick-quote-hero"
      className="relative w-full"
      style={{
        background: 'linear-gradient(180deg, var(--lj-surface) 0%, var(--lj-bg) 100%)',
        borderBottom: '1px solid var(--lj-border)',
      }}>

      {/* Soft decorative wash */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-60"
        style={{ background: 'radial-gradient(70% 40% at 50% 0%, rgba(15,94,76,0.08), transparent 70%)' }} />

      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-8 sm:pt-14 pb-10 sm:pb-16 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-12 items-center">

        {/* LEFT — Quick quote form */}
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] mb-4 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(15,94,76,0.08)', color: 'var(--lj-accent)' }}>
            <Sparkles size={12} /> Custom in 90 seconds
          </div>

          <h1 className="text-[36px] sm:text-[44px] lg:text-[52px] leading-[1.05] tracking-[-0.02em] font-semibold mb-4"
            style={{ color: 'var(--lj-text)' }}>
            Show us the ring. <br className="hidden sm:block" />
            <span style={{ color: 'var(--lj-accent)' }}>We'll send you renders + a quote.</span>
          </h1>

          <p className="text-[15px] sm:text-[17px] leading-[1.55] max-w-xl mb-7" style={{ color: 'var(--lj-muted)' }}>
            Paste a link, drop an image, or describe what you have in mind. Our designers send back 3D renders and a price within 24-48 hours.
          </p>

          {/* The 3 inspiration inputs */}
          <div className="space-y-3 mb-5 max-w-xl">

            {/* Link */}
            <div className="relative">
              <LinkIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--lj-muted)' }} />
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Paste a link (Pinterest, Instagram, retail site...)"
                data-testid="quick-quote-link"
                className="w-full min-h-[52px] pl-10 pr-4 rounded-[14px] text-[15px] outline-none transition-colors"
                style={{ background: 'var(--lj-surface)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)' }}
              />
            </div>

            {/* Upload */}
            <div>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" data-testid="quick-quote-upload-input" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || uploadedFiles.length >= 3}
                data-testid="quick-quote-upload-btn"
                type="button"
                className="w-full min-h-[52px] rounded-[14px] flex items-center justify-center gap-2.5 text-[14.5px] transition-all duration-200 hover:bg-[#F4F1EC]"
                style={{ background: 'var(--lj-surface)', border: '1.5px dashed var(--lj-border)', color: 'var(--lj-muted)' }}>
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploading ? 'Uploading...' : uploadedFiles.length ? `${uploadedFiles.length}/3 images attached - add more` : 'Attach inspiration images (1-3)'}
              </button>
              {uploadedFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="relative rounded-[10px] overflow-hidden aspect-square" style={{ border: '1px solid var(--lj-border)' }}>
                      <img src={`${BACKEND_URL}${f.url}`} alt={f.original_name} className="w-full h-full object-cover" />
                      <button onClick={() => removeFile(i)} type="button" data-testid={`quick-quote-remove-${i}`}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <X size={12} style={{ color: '#fff' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <textarea
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              maxLength={500}
              rows={3}
              data-testid="quick-quote-notes"
              placeholder="Or just describe it. e.g. Emerald cut, 3 carats with trapezoid side stones in white gold, my partner wears a size 6."
              className="w-full px-4 py-3 rounded-[14px] text-[15px] leading-[1.5] outline-none transition-colors resize-none"
              style={{ background: 'var(--lj-surface)', border: '1.5px solid var(--lj-border)', color: 'var(--lj-text)', fontFamily: 'inherit' }}
            />
          </div>

          <button
            onClick={openModal}
            data-testid="quick-quote-submit"
            className="w-full sm:w-auto min-h-[56px] px-8 rounded-[14px] font-medium text-[16px] inline-flex items-center justify-center gap-2.5 transition-all duration-300 active:scale-[0.99] hover:shadow-[0_10px_28px_rgba(15,94,76,0.28)]"
            style={{ background: 'var(--lj-accent)', color: '#FFFFFF', boxShadow: '0 8px 22px rgba(15,94,76,0.22)' }}>
            Get me a quote <ArrowRight size={18} />
          </button>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px]" style={{ color: 'var(--lj-muted)' }}>
            <span>No payment required</span>
            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--lj-muted)', opacity: 0.5 }} />
            <span>Renders in 24-48 hrs</span>
            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--lj-muted)', opacity: 0.5 }} />
            <span>IGI / GIA certified</span>
          </div>
        </div>

        {/* RIGHT — Animated phone */}
        <div className="relative flex justify-center items-center min-h-[520px] sm:min-h-[600px]">

          {/* Ambient glow behind phone */}
          <div aria-hidden="true" className="absolute -inset-8 rounded-full opacity-60"
            style={{ background: 'radial-gradient(closest-side, rgba(15,94,76,0.18), transparent 75%)', filter: 'blur(20px)' }} />

          {/* iPhone frame */}
          <div className="relative" style={{ width: 'min(78%, 320px)' }}>
            <PhoneFrame>
              <AnimatePresence mode="wait">
                <motion.div
                  key={stageIdx}
                  initial={{ opacity: 0, scale: 0.98, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -8 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full h-full"
                >
                  <PhoneScreen stage={stage} stageIdx={stageIdx} />
                </motion.div>
              </AnimatePresence>
            </PhoneFrame>

            {/* Progress dots */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5" data-testid="phone-stage-dots">
              {PHONE_STAGES.map((_, i) => (
                <div key={i}
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: i === stageIdx ? 18 : 6,
                    background: i === stageIdx ? 'var(--lj-accent)' : 'rgba(15,94,76,0.25)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Floating price tag — appears with the final render */}
          <AnimatePresence>
            {stage.kind === 'final' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6, x: 30, y: 30 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 230, damping: 20, delay: 0.15 }}
                data-testid="phone-floating-price"
                className="absolute right-2 lg:right-0 top-12 rounded-2xl px-4 py-3 shadow-2xl"
                style={{
                  background: 'var(--lj-text)', color: '#FFFFFF', minWidth: 130,
                  boxShadow: '0 14px 40px rgba(15,94,76,0.35)',
                }}>
                <div className="text-[10px] uppercase tracking-[0.18em] opacity-70 mb-1">Your custom quote</div>
                <div className="text-[28px] font-semibold leading-none" style={{ fontFeatureSettings: '"tnum"' }}>$2,850</div>
                <div className="text-[10.5px] mt-1.5 opacity-70">3.0ct emerald · 14k WG</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {modalOpen && (
        <QuickQuoteModal
          onClose={() => setModalOpen(false)}
          inspirationLink={linkInput.trim()}
          inspirationFiles={uploadedFiles}
          inspirationNotes={notesInput.trim()}
        />
      )}
    </section>
  );
}

/* ──────────── PhoneFrame (chrome around the screen) ──────────── */
const PhoneFrame = ({ children }) => (
  <div className="relative mx-auto"
    style={{
      aspectRatio: '9/19',
      borderRadius: '46px',
      background: 'linear-gradient(180deg, #1a1a1c 0%, #2a2a2e 100%)',
      padding: '11px',
      boxShadow: '0 30px 80px -20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08) inset, 0 -2px 0 rgba(0,0,0,0.4) inset',
    }}>
    {/* Side buttons */}
    <div aria-hidden="true" style={{ position: 'absolute', left: -2, top: '20%', width: 3, height: 32, background: '#1a1a1c', borderRadius: '2px 0 0 2px' }} />
    <div aria-hidden="true" style={{ position: 'absolute', left: -2, top: '30%', width: 3, height: 56, background: '#1a1a1c', borderRadius: '2px 0 0 2px' }} />
    <div aria-hidden="true" style={{ position: 'absolute', left: -2, top: '40%', width: 3, height: 56, background: '#1a1a1c', borderRadius: '2px 0 0 2px' }} />
    <div aria-hidden="true" style={{ position: 'absolute', right: -2, top: '26%', width: 3, height: 78, background: '#1a1a1c', borderRadius: '0 2px 2px 0' }} />

    <div className="relative w-full h-full overflow-hidden"
      style={{ borderRadius: '36px', background: '#FFFFFF' }}>
      {/* Dynamic island */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
        width: 100, height: 28, background: '#0a0a0c', borderRadius: 22, zIndex: 30,
      }} />
      {children}
    </div>
  </div>
);

/* ──────────── PhoneScreen (changes per stage) ──────────── */
const PhoneScreen = ({ stage }) => {
  const baseHeader = (
    <div className="w-full pt-12 pb-2.5 px-4 flex items-center justify-between text-[11px] font-semibold" style={{ color: '#1a1a1c' }}>
      <span>9:41</span>
      <div className="flex items-center gap-1.5 opacity-80">
        <span style={{ fontSize: 9 }}>●●●●●</span>
      </div>
    </div>
  );

  if (stage.kind === 'designing') {
    return (
      <div className="w-full h-full flex flex-col" style={{ background: '#FFFFFF' }}>
        {baseHeader}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="relative w-16 h-16 mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--lj-accent)', borderTopColor: 'transparent' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={20} style={{ color: 'var(--lj-accent)' }} />
            </div>
          </div>
          <div className="text-[14px] font-semibold mb-1.5" style={{ color: '#1a1a1c' }}>Designing your ring</div>
          <div className="text-[11.5px] leading-[1.5] px-2" style={{ color: '#6b7280' }}>
            Our designers are turning your inspiration into 3D renders.
          </div>
        </div>
      </div>
    );
  }

  if (stage.kind === 'inspiration') {
    return (
      <div className="w-full h-full flex flex-col" style={{ background: '#F5F5F7' }}>
        {baseHeader}
        <div className="px-3.5 pb-1.5">
          <div className="text-[10px] uppercase tracking-[0.12em] mb-1.5" style={{ color: '#6b7280' }}>Your inspiration</div>
        </div>
        <div className="flex-1 px-3.5 pb-4">
          <div className="w-full h-full rounded-[14px] overflow-hidden shadow-md" style={{ border: '1px solid #e5e7eb' }}>
            <img src={stage.src} alt="Inspiration board" className="w-full h-full object-cover" draggable="false" />
          </div>
        </div>
        <div className="px-4 pb-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(15,94,76,0.12)' }}>
            <ImageIcon size={12} style={{ color: 'var(--lj-accent)' }} />
          </div>
          <div className="text-[11.5px]" style={{ color: '#374151' }}>{stage.label}</div>
        </div>
      </div>
    );
  }

  // render + final
  const isFinal = stage.kind === 'final';
  return (
    <div className="w-full h-full flex flex-col" style={{ background: isFinal ? '#FFFFFF' : '#FAFAF9' }}>
      {baseHeader}
      <div className="px-3.5 pb-1.5">
        <div className="text-[10px] uppercase tracking-[0.12em]" style={{ color: isFinal ? 'var(--lj-accent)' : '#6b7280' }}>
          {stage.label}
        </div>
      </div>
      <div className="flex-1 px-3.5 pb-3">
        <div className="w-full h-full rounded-[14px] overflow-hidden flex items-center justify-center"
          style={{ background: '#FFFFFF', border: '1px solid #e5e7eb' }}>
          <img src={stage.src} alt="Render" className="w-full h-full object-contain p-2" draggable="false" />
        </div>
      </div>
      {isFinal && (
        <div className="px-4 pb-3.5">
          <div className="rounded-[12px] p-3 flex items-center justify-between" style={{ background: 'rgba(15,94,76,0.06)', border: '1px solid rgba(15,94,76,0.18)' }}>
            <div>
              <div className="text-[9.5px] uppercase tracking-[0.14em]" style={{ color: 'var(--lj-accent)' }}>Price</div>
              <div className="text-[16px] font-semibold leading-none mt-0.5" style={{ color: '#0a0a0c' }}>$2,850</div>
            </div>
            <div className="text-[10px] px-2 py-1 rounded-full" style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}>
              Approve →
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
