import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Loader2, Send, MessageCircle, ChevronLeft, ExternalLink } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const formatTime = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  const today = new Date();
  if (dt.toDateString() === today.toDateString()) {
    return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return dt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/**
 * Customer-facing messages panel — shows their inquiry threads with the jeweler.
 * Mounted on the Dashboard "Messages" tab.
 */
export default function MessagesPanel({ headers }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${BACKEND_URL}/api/me/threads`, { headers });
      setThreads(r.data.threads || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [headers]);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);
  useEffect(() => {
    if (!activeId) return;
    const fn = async () => {
      try { const r = await axios.get(`${BACKEND_URL}/api/me/threads/${activeId}`, { headers }); setDetail(r.data); } catch (e) {}
    };
    fn();
    const iv = setInterval(fn, 10000);
    return () => clearInterval(iv);
  }, [activeId, headers]);

  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' }); }, [detail?.messages?.length]);

  const sendReply = async () => {
    const text = reply.trim();
    if (!text || sending || !activeId) return;
    setSending(true);
    try {
      await axios.post(`${BACKEND_URL}/api/me/threads/${activeId}/reply`, { text }, { headers });
      setReply('');
      const r = await axios.get(`${BACKEND_URL}/api/me/threads/${activeId}`, { headers });
      setDetail(r.data);
      fetchThreads();
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  if (loading) {
    return <div className="py-12 flex items-center justify-center" style={{ color: 'var(--lj-muted)' }}>
      <Loader2 size={20} className="animate-spin mr-2" /> Loading messages…
    </div>;
  }

  if (threads.length === 0) {
    return (
      <div className="py-12 text-center max-w-md mx-auto" data-testid="dashboard-messages-empty">
        <MessageCircle size={40} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--lj-muted)' }} />
        <h3 className="text-[18px] font-semibold mb-2" style={{ color: 'var(--lj-text)' }}>No messages yet</h3>
        <p className="text-[13.5px] leading-[1.55]" style={{ color: 'var(--lj-muted)' }}>
          Asked about a project on our site? Replies from the jeweler will show up here.
        </p>
        <a href="/projects" className="inline-flex items-center gap-1.5 mt-4 text-[13.5px] font-medium" style={{ color: 'var(--lj-accent)' }}>
          Browse projects →
        </a>
      </div>
    );
  }

  // Mobile: show list OR detail (no split-pane)
  if (activeId && detail) {
    return (
      <div className="max-w-2xl mx-auto" data-testid="dashboard-messages-detail">
        <button onClick={() => { setActiveId(null); setDetail(null); }}
          data-testid="dashboard-messages-back"
          className="inline-flex items-center gap-1.5 text-[13.5px] mb-3" style={{ color: 'var(--lj-accent)' }}>
          <ChevronLeft size={16} /> All messages
        </button>
        <div className="rounded-[14px] overflow-hidden" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
          <div className="p-3.5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--lj-border)' }}>
            {detail.project_hero && <img src={detail.project_hero} alt="" className="w-11 h-11 rounded-[10px] object-cover" />}
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium truncate" style={{ color: 'var(--lj-text)' }}>Re: {detail.project_title}</div>
              <a href={`/projects/${detail.project_slug}`}
                className="inline-flex items-center gap-1 text-[11.5px] hover:underline" style={{ color: 'var(--lj-accent)' }}>
                View project <ExternalLink size={10} />
              </a>
            </div>
          </div>
          <div className="px-3.5 py-4 max-h-[50vh] overflow-y-auto space-y-2" style={{ background: 'var(--lj-bg)' }}>
            {(detail.messages || []).map((m, i) => {
              const isUser = m.sender === 'user';
              return (
                <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[78%]">
                    <div className="px-3.5 py-2 rounded-[16px] text-[14px] leading-[1.4]"
                      style={{
                        background: isUser ? 'var(--lj-accent)' : 'var(--lj-surface)',
                        color: isUser ? '#FFFFFF' : 'var(--lj-text)',
                        border: isUser ? 'none' : '1px solid var(--lj-border)',
                        borderBottomRightRadius: isUser ? 4 : 16,
                        borderBottomLeftRadius: isUser ? 16 : 4,
                        whiteSpace: 'pre-wrap',
                      }}>
                      {m.text}
                    </div>
                    <div className="text-[10.5px] mt-1 px-1" style={{ color: 'var(--lj-muted)', textAlign: isUser ? 'right' : 'left' }}>
                      {isUser ? 'You' : 'The Local Jewel'} · {formatTime(m.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <div className="p-3 flex items-end gap-2" style={{ borderTop: '1px solid var(--lj-border)' }}>
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply…" rows={2}
              data-testid="dashboard-messages-reply"
              className="flex-1 px-3 py-2 rounded-[12px] text-[14px] outline-none resize-none"
              style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)', color: 'var(--lj-text)', fontFamily: 'inherit' }} />
            <button onClick={sendReply} disabled={!reply.trim() || sending}
              data-testid="dashboard-messages-send"
              className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50"
              style={{ background: 'var(--lj-accent)', color: '#fff' }}>
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-w-2xl mx-auto" data-testid="dashboard-messages-list">
      {threads.map(t => {
        const last = (t.messages || []).slice(-1)[0];
        return (
          <button key={t.thread_id} onClick={() => setActiveId(t.thread_id)}
            data-testid={`dashboard-thread-${t.thread_id}`}
            className="w-full text-left flex items-start gap-3 p-3.5 rounded-[14px] transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
            {t.project_hero && <img src={t.project_hero} alt="" className="w-12 h-12 rounded-[10px] object-cover flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[14px] font-medium truncate" style={{ color: 'var(--lj-text)' }}>Re: {t.project_title}</span>
                <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--lj-muted)' }}>{formatTime(t.updated_at)}</span>
              </div>
              <div className="text-[12.5px] line-clamp-2" style={{ color: last?.sender === 'admin' ? 'var(--lj-text)' : 'var(--lj-muted)' }}>
                {last?.sender === 'admin' && <strong>The Local Jewel: </strong>}
                {last?.text}
              </div>
            </div>
            {t.user_unread_count > 0 && (
              <span className="flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: 'var(--lj-accent)', color: '#fff' }}>{t.user_unread_count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
