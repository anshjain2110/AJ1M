import React, { useState, useRef } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { Upload, X, Link, ArrowRight, Loader2, ImageIcon } from 'lucide-react';
import { trackEvent } from '../../../utils/analytics';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function InspirationScreen() {
  const { state, dispatch, goNext } = useWizard();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [linkInput, setLinkInput] = useState(state.inspirationLinks?.[0] || '');
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 3 - state.uploadedFiles.length);
    if (files.length === 0) return;

    setUploading(true);
    setUploadError('');
    trackEvent('tlj_file_upload_start', { file_count: files.length }, { lead_id: state.leadId });

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));

      const res = await axios.post(`${BACKEND_URL}/api/uploads`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      dispatch({ type: 'ADD_UPLOADED_FILES', files: res.data.files });
      trackEvent('tlj_file_upload_success', { file_count: res.data.files.length }, { lead_id: state.leadId });
    } catch (err) {
      setUploadError('Upload failed. Please try again.');
      trackEvent('tlj_file_upload_fail', { error_code: err.message }, { lead_id: state.leadId });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    dispatch({ type: 'REMOVE_UPLOADED_FILE', index });
  };

  const handleContinue = () => {
    if (linkInput.trim()) {
      dispatch({ type: 'SET_INSPIRATION_LINKS', links: [linkInput.trim()] });
    }
    goNext('inspiration_upload');
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-6 max-w-[520px] mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-[22px] leading-[28px] font-medium tracking-[-0.005em] mb-2" style={{ color: 'var(--lj-text)' }}>
          Share your inspiration
        </h2>
        <p className="text-[13px] leading-[18px]" style={{ color: 'var(--lj-muted)' }}>
          Screenshots from Pinterest, Instagram, or jeweler websites work great
        </p>
      </div>

      {/* Upload Area */}
      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          data-testid="wizard-file-upload-input"
        />
        
        {state.uploadedFiles.length < 3 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            data-testid="upload-trigger-button"
            className="w-full min-h-[120px] rounded-[14px] flex flex-col items-center justify-center gap-3 transition-all duration-300"
            style={{
              background: 'var(--lj-surface)',
              border: '2px dashed var(--lj-border)',
            }}
          >
            {uploading ? (
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--lj-accent)' }} />
            ) : (
              <Upload size={24} style={{ color: 'var(--lj-muted)' }} />
            )}
            <span className="text-[16px]" style={{ color: 'var(--lj-muted)' }}>
              {uploading ? 'Uploading...' : 'Tap to upload images (1-3)'}
            </span>
          </button>
        )}
        
        {uploadError && (
          <p className="mt-2 text-[13px]" style={{ color: 'var(--lj-danger)' }}>{uploadError}</p>
        )}

        {/* Preview Grid */}
        {state.uploadedFiles.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            {state.uploadedFiles.map((file, i) => (
              <div key={i} className="relative rounded-[10px] overflow-hidden aspect-square" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                <img
                  src={`${BACKEND_URL}${file.url}`}
                  alt={file.original_name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.7)' }}
                >
                  <X size={14} style={{ color: 'var(--lj-text)' }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OR Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px" style={{ background: 'var(--lj-border)' }} />
        <span className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>OR</span>
        <div className="flex-1 h-px" style={{ background: 'var(--lj-border)' }} />
      </div>

      {/* Link Input */}
      <div className="mb-6">
        <div className="relative">
          <Link size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--lj-muted)' }} />
          <input
            type="url"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Paste a link (Pinterest, Instagram...)"
            data-testid="inspiration-link-input"
            className="w-full min-h-[48px] pl-11 pr-4 py-3 rounded-[10px] text-[16px] transition-colors duration-300"
            style={{
              background: 'var(--lj-surface)',
              border: '1.5px solid var(--lj-border)',
              color: 'var(--lj-text)',
            }}
          />
        </div>
      </div>

      {/* Continue */}
      <div className="sticky bottom-0 pt-4 pb-6 mt-auto" style={{ background: 'var(--lj-bg)' }}>
        <button
          onClick={handleContinue}
          data-testid="wizard-continue-button"
          className="w-full min-h-[48px] px-6 rounded-[14px] font-medium text-[16px] flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.99]"
          style={{ 
            background: 'var(--lj-accent)', 
            color: '#0B0B0C',
          }}
        >
          {state.uploadedFiles.length === 0 && !linkInput.trim() ? 'Skip' : 'Continue'}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
