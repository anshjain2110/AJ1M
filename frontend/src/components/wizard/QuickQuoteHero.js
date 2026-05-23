import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Link as LinkIcon, ArrowRight, X, Loader2, Sparkles, Image as ImageIcon, Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import axios from 'axios';
import { trackEvent } from '../../utils/analytics';
import QuickQuoteModal from './QuickQuoteModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Phone animation sequence: inspiration → designing → renders → real video → final spec card
const PHONE_STAGES = [
  { kind: 'imessage',    src: '/hero-inspiration-ring.jpeg', label: 'You shared inspiration' },
  { kind: 'designing',   src: null,                       label: 'Rendering in 3D...' },
  { kind: 'render',      src: '/hero-render-3.jpeg',      label: 'Render 1 of 3' },
  { kind: 'render',      src: '/hero-render-1.jpeg',      label: 'Render 2 of 3' },
  { kind: 'render',      src: '/hero-render-2.jpeg',      label: 'Render 3 of 3' },
  { kind: 'video',       src: '/hero-final-video.mp4',    label: 'Final piece in your hand' },
  { kind: 'final',       src: '/hero-render-4.jpeg',      label: 'Your custom quote', price: '$2,850' },
];

// Detailed quote spec — shown on the final phone screen + floating card
const QUOTE_SPECS = {
  name: 'Three Stone Trap Mark',
  total_weight: '6.2 CT total',
  metal: '14K White Gold',
  style: 'Three Stone',
  center: { label: 'Center stone', value: 'Emerald Cut · D/E/F · VVS1/VVS2' },
  sides:  { label: 'Side stones',  value: '2 CT total · 1 CT × 2 Trapezoid' },
  setting:{ label: 'Setting',      value: '1.2 CT Princess · D · VVS2' },
  cert:   'IGI Certified',
  price:  '$2,850',
};

export default function QuickQuoteHero() {
  const [linkInput, setLinkInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [voiceNote, setVoiceNote] = useState(null); // {url, storage_path, filename, original_name, content_type, duration}
  const [modalOpen, setModalOpen] = useState(false);
  const fileRef = useRef(null);
  const [stageIdx, setStageIdx] = useState(0);

  // Cycle phone animation
  useEffect(() => {
    const stage = PHONE_STAGES[stageIdx];
    // Each stage has a custom dwell time
    const delay =
      stage.kind === 'final'      ? 4800 :
      stage.kind === 'video'      ? 5200 :
      stage.kind === 'designing'  ? 1700 :
      stage.kind === 'imessage'   ? 4200 :
      stage.kind === 'inspiration'? 3000 :
                                    2400;
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
      has_voice: !!voiceNote,
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

          <h1 className="text-[32px] sm:text-[40px] lg:text-[46px] leading-[1.06] tracking-[-0.02em] font-semibold mb-4"
            style={{ color: 'var(--lj-text)' }}>
            The most personal engagement ring buying experience <span style={{ color: 'var(--lj-accent)' }}>online.</span>
          </h1>

          <p className="text-[15px] sm:text-[17px] leading-[1.55] max-w-xl mb-7" style={{ color: 'var(--lj-muted)' }}>
            Paste a link, drop an image, record a voice note, or just describe what you have in mind.
            Our designers send back 3D renders and a written quote within 24-48 hours.
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

            {/* Voice note — "Talk to your jeweler" */}
            <VoiceRecorder voiceNote={voiceNote} setVoiceNote={setVoiceNote} />

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

          {/* Floating quote card — appears with the final spec stage */}
          <AnimatePresence>
            {stage.kind === 'final' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6, x: 30, y: 30 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 230, damping: 20, delay: 0.15 }}
                data-testid="phone-floating-price"
                className="absolute right-1 lg:-right-2 top-8 rounded-2xl px-4 py-3.5 shadow-2xl max-w-[180px]"
                style={{
                  background: 'var(--lj-text)', color: '#FFFFFF',
                  boxShadow: '0 14px 40px rgba(15,94,76,0.35)',
                }}>
                <div className="text-[9.5px] uppercase tracking-[0.2em] opacity-70 mb-1">Your custom quote</div>
                <div className="text-[32px] font-semibold leading-none tracking-[-0.02em]" style={{ fontFeatureSettings: '"tnum"' }}>
                  {QUOTE_SPECS.price}
                </div>
                <div className="text-[10.5px] mt-1.5 opacity-80 leading-[1.35]">
                  {QUOTE_SPECS.total_weight} · {QUOTE_SPECS.style}
                </div>
                <div className="text-[10px] mt-0.5 opacity-65 leading-[1.35]">
                  {QUOTE_SPECS.cert}
                </div>
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
          inspirationVoice={voiceNote}
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

  if (stage.kind === 'imessage') {
    return <IMessageScreen src={stage.src} />;
  }

  if (stage.kind === 'inspiration') {
    return (
      <div className="w-full h-full flex flex-col" style={{ background: '#F5F5F7' }}>
        {baseHeader}
        <div className="px-3.5 pb-1.5">
          <div className="text-[10px] uppercase tracking-[0.12em] mb-1.5" style={{ color: '#6b7280' }}>Your inspiration</div>
        </div>
        <div className="flex-1 px-3.5 pb-4">
          <div className="w-full h-full rounded-[14px] overflow-hidden shadow-md" style={{ border: '1px solid #e5e7eb', background: '#FFFFFF' }}>
            <img src={stage.src} alt="Inspiration" className="w-full h-full object-cover object-top" draggable="false" />
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

  if (stage.kind === 'video') {
    return (
      <div className="w-full h-full flex flex-col" style={{ background: '#0a0a0c' }}>
        {/* status bar — inverted */}
        <div className="w-full pt-12 pb-2.5 px-4 flex items-center justify-between text-[11px] font-semibold" style={{ color: '#FFFFFF' }}>
          <span>9:41</span>
          <span style={{ fontSize: 9, opacity: 0.85 }}>●●●●●</span>
        </div>
        <div className="px-3.5 pb-1.5">
          <div className="text-[10px] uppercase tracking-[0.12em]" style={{ color: 'rgba(255,255,255,0.7)' }}>{stage.label}</div>
        </div>
        <div className="flex-1 px-3.5 pb-3 relative">
          <div className="w-full h-full rounded-[14px] overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <video
              src={stage.src}
              autoPlay
              muted
              loop
              playsInline
              data-testid="phone-final-video"
              className="w-full h-full object-cover"
            />
          </div>
          {/* LIVE pulse */}
          <div className="absolute top-1 right-5 flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#F87171' }} />
            <span className="text-[9px] uppercase tracking-[0.16em] font-semibold" style={{ color: '#FFFFFF' }}>The real piece</span>
          </div>
        </div>
        <div className="px-4 pb-3.5 flex items-center gap-2">
          <Sparkles size={12} style={{ color: 'var(--lj-accent)' }} />
          <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Mark's finished ring, shipped from Orlando
          </div>
        </div>
      </div>
    );
  }

  if (stage.kind === 'final') {
    // Detailed quote spec sheet
    const specs = QUOTE_SPECS;
    return (
      <div className="w-full h-full flex flex-col" style={{ background: '#FFFFFF' }}>
        {baseHeader}
        <div className="px-3.5 pt-1 pb-1.5 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--lj-accent)' }}>Your custom quote</div>
          <div className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(15,94,76,0.10)', color: 'var(--lj-accent)' }}>
            {specs.cert}
          </div>
        </div>

        {/* Small ring thumbnail */}
        <div className="px-3.5 pb-2">
          <div className="w-full h-24 rounded-[12px] overflow-hidden flex items-center justify-center"
            style={{ background: '#FAFAF9', border: '1px solid #e5e7eb' }}>
            <img src={stage.src} alt="Final render" className="h-full w-full object-contain p-1.5" draggable="false" />
          </div>
        </div>

        <div className="px-3.5 pb-1">
          <div className="text-[12px] font-semibold leading-tight" style={{ color: '#0a0a0c', fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
            {specs.name}
          </div>
          <div className="text-[9.5px] mt-0.5 mb-2" style={{ color: '#6b7280' }}>
            {specs.total_weight} · {specs.style} · {specs.metal}
          </div>
        </div>

        {/* Spec list */}
        <div className="flex-1 px-3.5 pb-2 overflow-hidden">
          <div className="rounded-[10px] divide-y" style={{ background: '#FAFAF9', borderColor: '#EEEEEC' }}>
            {[specs.center, specs.sides, specs.setting].map((s, i) => (
              <div key={i} className="px-2.5 py-1.5 flex items-start justify-between gap-2" style={{ borderColor: '#EEEEEC' }}>
                <span className="text-[9.5px] uppercase tracking-[0.1em] flex-shrink-0 pt-0.5" style={{ color: '#9CA3AF' }}>
                  {s.label}
                </span>
                <span className="text-[10px] font-medium text-right leading-[1.3]" style={{ color: '#1a1a1c' }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Price footer */}
        <div className="px-3.5 pb-3.5">
          <div className="rounded-[12px] p-2.5 flex items-center justify-between" style={{ background: 'var(--lj-text)' }}>
            <div>
              <div className="text-[8.5px] uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.6)' }}>All in</div>
              <div className="text-[20px] font-semibold leading-none mt-0.5" style={{ color: '#FFFFFF', fontFeatureSettings: '"tnum"' }}>{specs.price}</div>
            </div>
            <div className="text-[9.5px] px-2.5 py-1.5 rounded-full font-semibold" style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}>
              Approve →
            </div>
          </div>
        </div>
      </div>
    );
  }

  // render
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF9' }}>
      {baseHeader}
      <div className="px-3.5 pb-1.5">
        <div className="text-[10px] uppercase tracking-[0.12em]" style={{ color: '#6b7280' }}>
          {stage.label}
        </div>
      </div>
      <div className="flex-1 px-3.5 pb-3">
        <div className="w-full h-full rounded-[14px] overflow-hidden flex items-center justify-center"
          style={{ background: '#FFFFFF', border: '1px solid #e5e7eb' }}>
          <img src={stage.src} alt="Render" className="w-full h-full object-contain p-2" draggable="false" />
        </div>
      </div>
    </div>
  );
};

/* ──────────── iMessage Chat Screen (native-looking) ──────────── */
const IMessageScreen = ({ src }) => (
  <div className="w-full h-full flex flex-col" style={{ background: '#FFFFFF' }}>
    {/* status bar */}
    <div className="w-full pt-12 pb-1 px-4 flex items-center justify-between text-[10.5px] font-semibold" style={{ color: '#1a1a1c' }}>
      <span>9:41</span>
      <span style={{ fontSize: 9 }}>●●●●●</span>
    </div>

    {/* iMessage header bar (contact name + back) */}
    <div className="px-3 pb-2 pt-1 flex items-center justify-between"
      style={{ background: 'rgba(244,244,247,0.85)', backdropFilter: 'blur(20px)', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
      <div className="text-[14px] font-semibold leading-none" style={{ color: '#007AFF' }}>‹</div>
      <div className="flex flex-col items-center -mt-1">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold mb-0.5"
          style={{ background: 'linear-gradient(135deg, #B8B8BC 0%, #9A9A9F 100%)', color: '#FFFFFF' }}>
          MS
        </div>
        <div className="text-[9.5px] leading-none flex items-center gap-1" style={{ color: '#1a1a1c' }}>
          Mark <span style={{ color: '#9CA3AF', fontSize: 8 }}>›</span>
        </div>
      </div>
      <div className="text-[12px]" style={{ color: '#007AFF' }}>⋯</div>
    </div>

    {/* Date stamp */}
    <div className="px-3 pt-2 pb-1 text-center">
      <span className="text-[9.5px]" style={{ color: '#9CA3AF' }}>
        <strong style={{ color: '#6b7280' }}>iMessage</strong> · Today 9:38 AM
      </span>
    </div>

    {/* Message bubbles */}
    <div className="flex-1 px-3 pb-3 flex flex-col gap-1.5 overflow-hidden">
      {/* Customer bubble (left/grey) */}
      <div className="max-w-[88%] self-start">
        <div className="px-3 py-1.5 rounded-[16px] text-[11px] leading-[1.35]"
          style={{ background: '#E9E9EB', color: '#1a1a1c', borderBottomLeftRadius: 4 }}>
          Hey - this is along the lines of what I'm looking for 💍
        </div>
      </div>

      {/* Shared image — fills most of the chat */}
      <div className="max-w-[78%] self-start">
        <div className="rounded-[14px] overflow-hidden shadow-sm"
          style={{ background: '#FFFFFF', border: '0.5px solid #E5E7EB' }}>
          <img src={src} alt="Customer inspiration ring" className="w-full h-auto block" draggable="false" />
        </div>
      </div>

      {/* Customer follow-up */}
      <div className="max-w-[88%] self-start">
        <div className="px-3 py-1.5 rounded-[16px] text-[11px] leading-[1.35]"
          style={{ background: '#E9E9EB', color: '#1a1a1c', borderBottomLeftRadius: 4 }}>
          Can you make this for me?
        </div>
      </div>

      {/* TLJ reply (right/blue iMessage) */}
      <div className="max-w-[82%] self-end mt-0.5">
        <div className="px-3 py-1.5 rounded-[16px] text-[11px] leading-[1.35]"
          style={{ background: '#0B93F6', color: '#FFFFFF', borderBottomRightRadius: 4 }}>
          Absolutely. Sending 3D renders in 24h 🤝
        </div>
        <div className="text-[8.5px] text-right mt-0.5 pr-1" style={{ color: '#9CA3AF' }}>
          Delivered
        </div>
      </div>
    </div>

    {/* iMessage input bar (decorative) */}
    <div className="px-3 pb-3 pt-1 flex items-center gap-2"
      style={{ background: 'rgba(244,244,247,0.85)', backdropFilter: 'blur(20px)', borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
        style={{ background: '#E5E7EB', color: '#6b7280' }}>+</div>
      <div className="flex-1 h-6 rounded-full px-3 flex items-center text-[9.5px]"
        style={{ background: '#FFFFFF', border: '0.5px solid #D1D5DB', color: '#9CA3AF' }}>
        iMessage
      </div>
      <div className="text-[10px]" style={{ color: '#9CA3AF' }}>🎤</div>
    </div>
  </div>
);


/* ──────────── VoiceRecorder — "Talk to your jeweler" ──────────── */
const MAX_DURATION_SEC = 180; // 3 minutes

const VoiceRecorder = ({ voiceNote, setVoiceNote }) => {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const audioElRef = useRef(null);

  // Determine a MIME the browser supports (Safari prefers mp4, Chrome/Firefox prefer webm)
  const pickMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
    for (const m of candidates) {
      try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (_) {}
    }
    return '';
  };

  const cleanup = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => () => cleanup(), []);

  const startRec = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Voice recording is not supported in this browser. Try Chrome, Safari, or Edge.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        cleanup();
        await uploadBlob(blob, mimeType || 'audio/webm');
      };
      rec.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev + 1 >= MAX_DURATION_SEC) { stopRec(); return MAX_DURATION_SEC; }
          return prev + 1;
        });
      }, 1000);
      trackEvent('tlj_voice_record_start', {});
    } catch (e) {
      console.error(e);
      setError(e.name === 'NotAllowedError'
        ? 'Microphone permission denied. Please enable it in your browser settings.'
        : 'Could not start recording. Please check your microphone and try again.');
      cleanup();
    }
  };

  const stopRec = () => {
    try { mediaRecorderRef.current?.stop(); } catch (_) {}
    setRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const uploadBlob = async (blob, mime) => {
    setUploading(true);
    try {
      const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
      const file = new File([blob], `voice-note-${Date.now()}.${ext}`, { type: mime });
      const fd = new FormData();
      fd.append('files', file);
      const res = await axios.post(`${BACKEND_URL}/api/uploads`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const uploaded = res.data?.files?.[0];
      if (uploaded) {
        setVoiceNote({ ...uploaded, duration });
        trackEvent('tlj_voice_record_complete', { duration_sec: duration });
      } else {
        setError('Upload failed. Please try again.');
      }
    } catch (e) {
      console.error(e);
      setError("Couldn't upload your voice note. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const remove = () => {
    setVoiceNote(null);
    setDuration(0);
    setPlaying(false);
    if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current.currentTime = 0; }
  };

  const togglePlay = () => {
    const el = audioElRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
  };

  const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  // Recorded — show playback
  if (voiceNote) {
    const audioUrl = voiceNote.url?.startsWith('http') ? voiceNote.url : `${BACKEND_URL}${voiceNote.url}`;
    return (
      <div className="rounded-[14px] px-3.5 py-3 flex items-center gap-3"
        style={{ background: 'rgba(15,94,76,0.06)', border: '1.5px solid rgba(15,94,76,0.22)' }}
        data-testid="quick-quote-voice-recorded">
        <button
          type="button"
          onClick={togglePlay}
          data-testid="quick-quote-voice-play"
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95"
          style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}>
          {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium leading-tight" style={{ color: 'var(--lj-text)' }}>
            Voice note saved
          </div>
          <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--lj-muted)' }}>
            {voiceNote.duration ? fmt(voiceNote.duration) : 'Ready to send'} · Mark will hear this with your quote
          </div>
        </div>
        <button
          type="button"
          onClick={remove}
          data-testid="quick-quote-voice-remove"
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-[#F4F1EC]"
          style={{ color: 'var(--lj-muted)' }}>
          <Trash2 size={14} />
        </button>
        <audio ref={audioElRef} src={audioUrl} preload="metadata" onEnded={() => setPlaying(false)} />
      </div>
    );
  }

  // Recording
  if (recording) {
    return (
      <div className="rounded-[14px] px-3.5 py-3 flex items-center gap-3"
        style={{ background: 'rgba(192,57,43,0.05)', border: '1.5px solid rgba(192,57,43,0.32)' }}
        data-testid="quick-quote-voice-recording">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative" style={{ background: '#c0392b' }}>
          <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(192,57,43,0.45)' }} />
          <Mic size={16} style={{ color: '#FFFFFF', position: 'relative' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium leading-tight" style={{ color: 'var(--lj-text)' }}>
            Recording... {fmt(duration)}
          </div>
          <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--lj-muted)' }}>
            Describe her taste — vintage, modern, gold, the ring she pinned...
          </div>
        </div>
        <button
          type="button"
          onClick={stopRec}
          data-testid="quick-quote-voice-stop"
          className="px-3.5 min-h-[36px] rounded-full text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition-transform active:scale-95"
          style={{ background: 'var(--lj-text)', color: '#FFFFFF' }}>
          <Square size={11} fill="#FFFFFF" /> Stop
        </button>
      </div>
    );
  }

  // Idle — invite the user to record
  return (
    <div>
      <button
        type="button"
        onClick={startRec}
        disabled={uploading}
        data-testid="quick-quote-voice-start"
        className="w-full min-h-[52px] px-4 rounded-[14px] flex items-center gap-3 text-left transition-all duration-200 hover:bg-[rgba(15,94,76,0.03)] disabled:opacity-70"
        style={{ background: 'var(--lj-surface)', border: '1.5px dashed rgba(15,94,76,0.32)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(15,94,76,0.10)' }}>
          {uploading ? <Loader2 size={15} className="animate-spin" style={{ color: 'var(--lj-accent)' }} />
                     : <Mic size={15} style={{ color: 'var(--lj-accent)' }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium leading-tight" style={{ color: 'var(--lj-text)' }}>
            {uploading ? 'Saving your voice note...' : 'Talk to your jeweler'}
          </div>
          <div className="text-[11.5px] leading-[1.4] mt-0.5" style={{ color: 'var(--lj-muted)' }}>
            You don't need to know shapes or settings. Just describe what she likes.
          </div>
        </div>
        <div className="text-[11px] uppercase tracking-[0.14em] font-semibold flex-shrink-0" style={{ color: 'var(--lj-accent)' }}>
          Record
        </div>
      </button>
      {error && (
        <div className="mt-1.5 px-3 py-2 rounded-[10px] text-[12px] leading-[1.4]"
          style={{ background: 'rgba(192,57,43,0.08)', color: '#c0392b', border: '1px solid rgba(192,57,43,0.18)' }}
          data-testid="quick-quote-voice-error">
          {error}
        </div>
      )}
    </div>
  );
};
