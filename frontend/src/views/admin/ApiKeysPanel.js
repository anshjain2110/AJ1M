'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Loader2, RefreshCw, Copy, Check, AlertTriangle, Eye, EyeOff, Trash2, BookOpen, FolderOpen } from 'lucide-react';

const TARGETS = {
  projects: {
    title: 'Projects Automation API Key',
    descriptionPrefix: 'Use this key with the ',
    descriptionCode1: 'X-API-Key',
    descriptionMiddle: ' header on ',
    descriptionCode2: 'POST/PUT/DELETE /api/projects/api/*',
    descriptionSuffix: ' endpoints. Share with your automation contractor — rotate the moment they no longer need access.',
    handoffDoc: '/projects-api-handoff.md',
    icon: FolderOpen,
    endpoint: '/api/admin/api-keys/projects',
  },
  blog: {
    title: 'Blog (Journal) Automation API Key',
    descriptionPrefix: 'Use this key with the ',
    descriptionCode1: 'X-API-Key',
    descriptionMiddle: ' header on ',
    descriptionCode2: 'POST/PUT/DELETE/GET /api/blog/api/*',
    descriptionSuffix: ' endpoints. Lets your internal HQ, n8n, Make, or Zapier push blog posts and media into the journal directly.',
    handoffDoc: '/blog-api-handoff.md',
    icon: BookOpen,
    endpoint: '/api/admin/api-keys/blog',
  },
};

export default function ApiKeysPanel({ target = 'projects' }) {
  const cfg = TARGETS[target] || TARGETS.projects;
  const Icon = cfg.icon;
  const { api } = useAdmin();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [revealedKey, setRevealedKey] = useState(null);
  const [revealedVisible, setRevealedVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const fetchInfo = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api('get', cfg.endpoint);
      setInfo(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [api, cfg.endpoint]);

  useEffect(() => { fetchInfo(); }, [fetchInfo]);

  const handleRotate = async () => {
    setRotating(true);
    setConfirmRotate(false);
    try {
      const res = await api('post', `${cfg.endpoint}/rotate`);
      setRevealedKey(res.data.full_key);
      setRevealedVisible(true);
      setCopied(false);
      await fetchInfo();
    } catch (e) { console.error(e); }
    finally { setRotating(false); }
  };

  const handleRevoke = async () => {
    setConfirmRevoke(false);
    try {
      await api('delete', cfg.endpoint);
      setRevealedKey(null);
      await fetchInfo();
    } catch (e) { console.error(e); }
  };

  const copy = async () => {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) { /* clipboard blocked */ }
  };

  if (loading) {
    return (
      <div className="p-5 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
        <Loader2 size={18} className="animate-spin" style={{ color: 'var(--lj-accent)' }} />
      </div>
    );
  }

  const fmt = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  return (
    <div className="p-5 rounded-[14px]" data-testid={`api-keys-panel-${target}`} style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <Icon size={15} style={{ color: 'var(--lj-accent)' }} />
          <h3 className="text-[16px] font-semibold" style={{ color: 'var(--lj-text)' }}>{cfg.title}</h3>
        </div>
        <a href={cfg.handoffDoc} target="_blank" rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 py-1 rounded-full hover:bg-[#F0F0EE]"
          style={{ color: 'var(--lj-accent)', border: '1px solid var(--lj-border)' }}>
          <BookOpen size={11} /> Handoff doc
        </a>
      </div>
      <p className="text-[12.5px] leading-[1.5] mb-4" style={{ color: 'var(--lj-muted)' }}>
        {cfg.descriptionPrefix}<code>{cfg.descriptionCode1}</code>{cfg.descriptionMiddle}<code>{cfg.descriptionCode2}</code>{cfg.descriptionSuffix}
      </p>

      {/* Current key snapshot */}
      <div className="rounded-[12px] p-4 mb-3" style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)' }}>
        <div className="grid sm:grid-cols-2 gap-3 text-[12.5px]">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.12em] mb-1" style={{ color: 'var(--lj-muted)' }}>Current key (masked)</div>
            <div className="font-mono text-[13px]" style={{ color: 'var(--lj-text)' }} data-testid={`api-key-masked-${target}`}>
              {info?.configured ? info.masked : 'Not configured'}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.12em] mb-1" style={{ color: 'var(--lj-muted)' }}>Source</div>
            <div className="text-[13px] capitalize" style={{ color: 'var(--lj-text)' }}>
              {info?.source === 'db' ? 'Database (rotated via admin)' : info?.source === 'env' ? 'Environment variable (bootstrap)' : '—'}
            </div>
          </div>
          {info?.created_at && (
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.12em] mb-1" style={{ color: 'var(--lj-muted)' }}>Created</div>
              <div className="text-[13px]" style={{ color: 'var(--lj-text)' }}>{fmt(info.created_at)}</div>
            </div>
          )}
          {info?.rotated_at && (
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.12em] mb-1" style={{ color: 'var(--lj-muted)' }}>Last rotated</div>
              <div className="text-[13px]" style={{ color: 'var(--lj-text)' }}>{fmt(info.rotated_at)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Freshly rotated key — full reveal */}
      {revealedKey && (
        <div data-testid={`api-key-revealed-${target}`} className="rounded-[12px] p-4 mb-3" style={{ background: 'rgba(15,94,76,0.08)', border: '1px solid rgba(15,94,76,0.3)' }}>
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle size={15} style={{ color: 'var(--lj-accent)', marginTop: 2 }} />
            <div>
              <div className="text-[12.5px] font-semibold mb-0.5" style={{ color: 'var(--lj-text)' }}>Save this key now</div>
              <div className="text-[12px]" style={{ color: 'var(--lj-muted)' }}>It will not be shown again. The previous key has been replaced — automation using the old key will stop working immediately.</div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <code className="flex-1 px-3 py-2 rounded-[8px] text-[12.5px] font-mono break-all" style={{ background: 'var(--lj-bg)', color: 'var(--lj-text)', border: '1px solid var(--lj-border)' }}>
              {revealedVisible ? revealedKey : revealedKey.replace(/./g, '•')}
            </code>
            <button onClick={() => setRevealedVisible(v => !v)} className="p-2 rounded-[8px] hover:bg-[#F0F0EE]" style={{ color: 'var(--lj-muted)' }} aria-label="Toggle visibility">
              {revealedVisible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button onClick={copy} data-testid={`api-key-copy-${target}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[12.5px] font-medium" style={{ background: copied ? 'var(--lj-accent)' : 'var(--lj-bg)', color: copied ? '#fff' : 'var(--lj-accent)', border: '1px solid ' + (copied ? 'var(--lj-accent)' : 'var(--lj-border)') }}>
              {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
            </button>
          </div>
          <button onClick={() => setRevealedKey(null)} className="mt-3 text-[12px] font-medium" style={{ color: 'var(--lj-muted)' }}>I've saved it — close</button>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {!confirmRotate && !confirmRevoke && (
          <>
            <button onClick={() => setConfirmRotate(true)} disabled={rotating} data-testid={`api-key-rotate-${target}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-medium"
              style={{ background: 'var(--lj-accent)', color: '#fff' }}>
              {rotating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {info?.source === 'db' ? 'Rotate key' : 'Generate key'}
            </button>
            {info?.source === 'db' && (
              <button onClick={() => setConfirmRevoke(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-medium" style={{ color: '#C44', border: '1px solid var(--lj-border)' }}>
                <Trash2 size={14} /> Revoke
              </button>
            )}
          </>
        )}
        {confirmRotate && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-[10px]" style={{ background: 'rgba(255,179,71,0.10)', border: '1px solid rgba(255,179,71,0.4)' }}>
            <span className="text-[12.5px]" style={{ color: 'var(--lj-text)' }}>
              Existing key will stop working. Continue?
            </span>
            <button onClick={handleRotate} data-testid={`api-key-rotate-confirm-${target}`} className="px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium" style={{ background: 'var(--lj-accent)', color: '#fff' }}>Yes, rotate</button>
            <button onClick={() => setConfirmRotate(false)} className="px-3 py-1.5 rounded-[8px] text-[12.5px]" style={{ color: 'var(--lj-muted)' }}>Cancel</button>
          </div>
        )}
        {confirmRevoke && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-[10px]" style={{ background: '#FEE', border: '1px solid #FCC' }}>
            <span className="text-[12.5px]" style={{ color: '#A33' }}>
              Revoke key? All automation using it will stop.
            </span>
            <button onClick={handleRevoke} className="px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium" style={{ background: '#C44', color: '#fff' }}>Yes, revoke</button>
            <button onClick={() => setConfirmRevoke(false)} className="px-3 py-1.5 rounded-[8px] text-[12.5px]" style={{ color: 'var(--lj-muted)' }}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}