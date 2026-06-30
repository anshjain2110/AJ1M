'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { MessageCircle, Send, Loader2, Search, Mail, Phone, ExternalLink, Check, X as XIcon, AlertTriangle } from 'lucide-react';

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const STATUSES = ['active', 'closed', 'spam'];

export default function MessagesAdminPage() {
  const { api } = useAdmin();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api('get', `/api/admin/threads?${params.toString()}`);
      setThreads(res.data.threads || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [api, search, statusFilter]);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);
  useEffect(() => {
    if (!activeId) return;
    const interval = setInterval(async () => {
      try {
        const r = await api('get', `/api/admin/threads/${activeId}`);
        setDetail(r.data);
      } catch (e) {}
    }, 8000);
    return () => clearInterval(interval);
  }, [api, activeId]);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [detail?.messages?.length]);

  const openThread = async (t) => {
    setActiveId(t.thread_id);
    try {
      const r = await api('get', `/api/admin/threads/${t.thread_id}`);
      setDetail(r.data);
      // Also clear unread badge in list
      setThreads(prev => prev.map(x => x.thread_id === t.thread_id ? { ...x, admin_unread_count: 0 } : x));
    } catch (e) { console.error(e); }
  };

  const sendReply = async () => {
    const text = replyText.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    try {
      await api('post', `/api/admin/threads/${activeId}/reply`, { text });
      setReplyText('');
      const r = await api('get', `/api/admin/threads/${activeId}`);
      setDetail(r.data);
      fetchThreads();
    } catch (e) { window.alert(e?.response?.data?.detail || 'Reply failed'); }
    finally { setSending(false); }
  };

  const updateStatus = async (next) => {
    if (!activeId) return;
    try {
      await api('patch', `/api/admin/threads/${activeId}`, { status: next });
      const r = await api('get', `/api/admin/threads/${activeId}`);
      setDetail(r.data);
      fetchThreads();
    } catch (e) { console.error(e); }
  };

  return (
    <div data-testid="admin-messages-page">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[22px] font-semibold" style={{ color: 'var(--lj-text)' }}>Messages</h1>
        <div className="text-[12.5px]" style={{ color: 'var(--lj-muted)' }}>{threads.length} threads</div>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-4 h-[calc(100vh-180px)] min-h-[520px]">
        {/* Threads list */}
        <aside className="rounded-[14px] overflow-hidden flex flex-col"
          style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
          <div className="p-3 space-y-2" style={{ borderBottom: '1px solid var(--lj-border)' }}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--lj-muted)' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, project…"
                data-testid="messages-search"
                className="w-full min-h-[36px] pl-9 pr-3 rounded-[8px] text-[13px] outline-none"
                style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)', color: 'var(--lj-text)' }} />
            </div>
            <div className="flex gap-1">
              {['', ...STATUSES].map(s => (
                <button key={s || 'all'} onClick={() => setStatusFilter(s)}
                  data-testid={`messages-filter-${s || 'all'}`}
                  className="flex-1 px-2 py-1.5 rounded-[8px] text-[11.5px] capitalize font-medium transition-colors"
                  style={{
                    background: statusFilter === s ? 'var(--lj-accent)' : 'transparent',
                    color: statusFilter === s ? '#fff' : 'var(--lj-muted)',
                    border: '1px solid ' + (statusFilter === s ? 'var(--lj-accent)' : 'var(--lj-border)'),
                  }}>
                  {s || 'All'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="py-10 flex items-center justify-center" style={{ color: 'var(--lj-muted)' }}>
                <Loader2 size={18} className="animate-spin mr-2" /> Loading…
              </div>
            ) : threads.length === 0 ? (
              <div className="py-10 text-center px-4" style={{ color: 'var(--lj-muted)' }}>
                <MessageCircle size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-[14px] mb-1">No conversations yet</p>
                <p className="text-[12px]">When a customer messages a project, it shows up here.</p>
              </div>
            ) : (
              threads.map(t => {
                const last = (t.messages || []).slice(-1)[0];
                const preview = last?.text || '';
                const active = activeId === t.thread_id;
                return (
                  <button key={t.thread_id} onClick={() => openThread(t)}
                    data-testid={`messages-thread-${t.thread_id}`}
                    className="w-full text-left p-3 transition-colors hover:bg-[var(--lj-bg)]"
                    style={{
                      background: active ? 'var(--lj-bg)' : 'transparent',
                      borderBottom: '1px solid var(--lj-border)',
                      borderLeft: active ? '3px solid var(--lj-accent)' : '3px solid transparent',
                    }}>
                    <div className="flex items-start gap-2.5">
                      {t.project_hero && <img src={t.project_hero} alt="" className="w-10 h-10 rounded-[8px] object-cover flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-[13.5px] font-medium truncate" style={{ color: 'var(--lj-text)' }}>{t.user_name}</span>
                          <span className="text-[10.5px] flex-shrink-0" style={{ color: 'var(--lj-muted)' }}>{formatDate(t.updated_at)}</span>
                        </div>
                        <div className="text-[11.5px] truncate mb-1" style={{ color: 'var(--lj-muted)' }}>{t.project_title}</div>
                        <div className="text-[12.5px] line-clamp-1" style={{ color: last?.sender === 'admin' ? 'var(--lj-muted)' : 'var(--lj-text)' }}>
                          {last?.sender === 'admin' ? 'You: ' : ''}{preview}
                        </div>
                      </div>
                      {t.admin_unread_count > 0 && (
                        <span className="flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                          style={{ background: 'var(--lj-accent)', color: '#fff' }}>{t.admin_unread_count}</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Conversation panel */}
        <section className="rounded-[14px] overflow-hidden flex flex-col"
          style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
          {!detail ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6" style={{ color: 'var(--lj-muted)' }}>
              <MessageCircle size={36} className="mb-3 opacity-30" />
              <p className="text-[14.5px] mb-1">Pick a thread to view</p>
              <p className="text-[12px]">Reply directly — the customer gets an email + SMS notification.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--lj-border)' }}>
                {detail.project_hero && <img src={detail.project_hero} alt="" className="w-12 h-12 rounded-[10px] object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium truncate" style={{ color: 'var(--lj-text)' }}>{detail.user_name}</div>
                  <div className="text-[12px] truncate" style={{ color: 'var(--lj-muted)' }}>
                    Re: {detail.project_title}
                    {detail.project_slug && <a href={`/projects/${detail.project_slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 ml-1 hover:underline" style={{ color: 'var(--lj-accent)' }}><ExternalLink size={10} /></a>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {detail.user_email && <a href={`mailto:${detail.user_email}`} title={detail.user_email} className="p-1.5 rounded-[8px] transition-colors hover:bg-[var(--lj-bg)]" style={{ color: 'var(--lj-muted)' }}><Mail size={15} /></a>}
                  {detail.user_phone && <a href={`tel:${detail.user_phone}`} title={detail.user_phone} className="p-1.5 rounded-[8px] transition-colors hover:bg-[var(--lj-bg)]" style={{ color: 'var(--lj-muted)' }}><Phone size={15} /></a>}
                  <div className="w-px h-5 mx-1" style={{ background: 'var(--lj-border)' }} />
                  {detail.status !== 'closed' && (
                    <button onClick={() => updateStatus('closed')} title="Mark as closed" data-testid="messages-close-thread"
                      className="p-1.5 rounded-[8px] transition-colors hover:bg-[var(--lj-bg)]" style={{ color: 'var(--lj-muted)' }}>
                      <Check size={15} />
                    </button>
                  )}
                  {detail.status === 'closed' && (
                    <button onClick={() => updateStatus('active')} title="Reopen"
                      className="p-1.5 rounded-[8px] transition-colors hover:bg-[var(--lj-bg)]" style={{ color: 'var(--lj-muted)' }}>
                      <XIcon size={15} />
                    </button>
                  )}
                  <button onClick={() => updateStatus(detail.status === 'spam' ? 'active' : 'spam')} title="Mark as spam"
                    className="p-1.5 rounded-[8px] transition-colors hover:bg-[var(--lj-bg)]" style={{ color: detail.status === 'spam' ? '#c0392b' : 'var(--lj-muted)' }}>
                    <AlertTriangle size={15} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-5 space-y-2" style={{ background: 'var(--lj-bg)' }}>
                {(detail.messages || []).map((m, i) => {
                  const isAdmin = m.sender === 'admin';
                  return (
                    <div key={i} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`} data-testid={`messages-msg-${i}`}>
                      <div className="max-w-[78%]">
                        <div className="px-3.5 py-2 rounded-[16px] text-[14px] leading-[1.4]"
                          style={{
                            background: isAdmin ? 'var(--lj-accent)' : 'var(--lj-surface)',
                            color: isAdmin ? '#FFFFFF' : 'var(--lj-text)',
                            border: isAdmin ? 'none' : '1px solid var(--lj-border)',
                            borderBottomRightRadius: isAdmin ? 4 : 16,
                            borderBottomLeftRadius: isAdmin ? 16 : 4,
                            whiteSpace: 'pre-wrap',
                          }}>
                          {m.text}
                        </div>
                        <div className="text-[10.5px] mt-1 px-1" style={{ color: 'var(--lj-muted)', textAlign: isAdmin ? 'right' : 'left' }}>
                          {isAdmin ? 'You' : detail.user_name} · {formatDate(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply box */}
              <div className="p-3" style={{ borderTop: '1px solid var(--lj-border)' }}>
                <div className="flex items-end gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply(); }}
                    placeholder="Type your reply…  (Cmd/Ctrl+Enter to send)"
                    rows={2}
                    data-testid="messages-reply-input"
                    className="flex-1 px-3 py-2 rounded-[12px] text-[14px] outline-none resize-none"
                    style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)', color: 'var(--lj-text)', fontFamily: 'inherit' }}
                  />
                  <button onClick={sendReply} disabled={!replyText.trim() || sending}
                    data-testid="messages-send-reply"
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50"
                    style={{ background: 'var(--lj-accent)', color: '#fff' }}>
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                  </button>
                </div>
                <p className="mt-1.5 text-[11px]" style={{ color: 'var(--lj-muted)' }}>
                  Customer gets an email + SMS notification on send.
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}