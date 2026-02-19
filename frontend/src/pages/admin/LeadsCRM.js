import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Search, Filter, Download, ChevronLeft, ChevronRight, Eye, Loader2, X, Send, MessageSquare, Plus, Upload, PenTool, Factory, Truck, CheckCircle } from 'lucide-react';

const STATUS_COLORS = { new: { bg: 'rgba(15,94,76,0.1)', color: 'var(--lj-accent)' }, contacted: { bg: 'rgba(96,165,250,0.1)', color: '#60A5FA' }, quoted: { bg: 'rgba(167,139,250,0.1)', color: '#A78BFA' }, won: { bg: 'rgba(86,194,113,0.1)', color: 'var(--lj-success)' }, lost: { bg: 'rgba(226,92,92,0.1)', color: 'var(--lj-danger)' } };
const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'];
const PRODUCTS = ['engagement_ring', 'wedding_bands', 'tennis_bracelet', 'studs_earrings', 'necklace_pendant', 'loose_diamond', 'price_checking'];

function formatLabel(v) { if (!v) return ''; const m = { engagement_ring: 'Engagement Ring', wedding_bands: 'Wedding Bands', tennis_bracelet: 'Tennis Bracelet', studs_earrings: 'Studs/Earrings', necklace_pendant: 'Necklace/Pendant', loose_diamond: 'Loose Diamond', price_checking: 'Price Check', under_2000: '<$2K', '2000_5000': '$2K-$5K', '5000_10000': '$5K-$10K', '10000_15000': '$10K-$15K', '15000_plus': '$15K+', not_sure: 'Not Sure' }; return m[v] || v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }
function formatDate(d) { if (!d) return ''; return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

export default function LeadsCRM() {
  const { api } = useAdmin();
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [quoteTotal, setQuoteTotal] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [commentText, setCommentText] = useState('');
  const [trackingNum, setTrackingNum] = useState('');
  const cadInputRef = useRef(null);

  const ADMIN_STAGES = [
    { key: 'design_quotation', label: 'Design & Quotation', icon: PenTool },
    { key: 'in_production', label: 'In Production', icon: Factory },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 25 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (productFilter) params.set('product_type', productFilter);
      const res = await api('get', `/api/admin/leads?${params}`);
      setLeads(res.data.leads); setTotal(res.data.total); setPages(res.data.pages);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [api, page, search, statusFilter, productFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const openDetail = async (lead) => {
    setSelectedLead(lead);
    try {
      const res = await api('get', `/api/admin/leads/${lead.lead_id}`);
      setDetailData(res.data);
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (leadId, status) => {
    await api('patch', `/api/admin/leads/${leadId}`, { status });
    fetchLeads();
    if (detailData) { setDetailData(prev => ({ ...prev, lead: { ...prev.lead, status } })); }
  };

  const addNote = async () => {
    if (!noteText.trim() || !selectedLead) return;
    await api('post', `/api/admin/leads/${selectedLead.lead_id}/notes`, { text: noteText });
    setNoteText('');
    const res = await api('get', `/api/admin/leads/${selectedLead.lead_id}`);
    setDetailData(res.data);
  };

  const createQuote = async () => {
    if (!quoteTotal || !selectedLead) return;
    await api('post', `/api/admin/leads/${selectedLead.lead_id}/quotes`, { total: parseFloat(quoteTotal), notes: quoteNotes, items: [], currency: 'USD' });
    setQuoteTotal(''); setQuoteNotes('');
    const res = await api('get', `/api/admin/leads/${selectedLead.lead_id}`);
    setDetailData(res.data);
    fetchLeads();
  };

  const exportCSV = () => { window.open(`${process.env.REACT_APP_BACKEND_URL}/api/admin/leads/export.csv?status=${statusFilter}`, '_blank'); };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-[28px] font-semibold" style={{ color: 'var(--lj-text)' }}>Lead Management</h1>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-medium" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)', color: 'var(--lj-muted)' }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--lj-muted)' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, phone, email..." data-testid="lead-search-input"
            className="w-full min-h-[40px] pl-9 pr-4 rounded-[10px] text-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)', color: 'var(--lj-text)' }} />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="min-h-[40px] px-3 rounded-[10px] text-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)', color: 'var(--lj-text)' }}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={productFilter} onChange={e => { setProductFilter(e.target.value); setPage(1); }}
          className="min-h-[40px] px-3 rounded-[10px] text-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)', color: 'var(--lj-text)' }}>
          <option value="">All Products</option>
          {PRODUCTS.map(p => <option key={p} value={p}>{formatLabel(p)}</option>)}
        </select>
      </div>

      {/* Leads Table */}
      {loading ? <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--lj-accent)' }} /></div> : (
        <div className="rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--lj-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'var(--lj-surface)' }}>
                  {['Name', 'Phone', 'Product', 'Budget', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[13px] font-medium" style={{ color: 'var(--lj-muted)', borderBottom: '1px solid var(--lj-border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => {
                  const sc = STATUS_COLORS[lead.status] || STATUS_COLORS.new;
                  return (
                    <tr key={lead.lead_id} className="hover:bg-[#F8F8F7] cursor-pointer transition-colors" onClick={() => openDetail(lead)} style={{ borderBottom: '1px solid var(--lj-border)' }}>
                      <td className="px-4 py-3 text-[14px]" style={{ color: 'var(--lj-text)' }}>{lead.first_name}</td>
                      <td className="px-4 py-3 text-[14px]" style={{ color: 'var(--lj-muted)' }}>{lead.phone || lead.email || '—'}</td>
                      <td className="px-4 py-3 text-[14px]" style={{ color: 'var(--lj-text)' }}>{formatLabel(lead.product_type)}</td>
                      <td className="px-4 py-3 text-[14px]" style={{ color: 'var(--lj-muted)' }}>{formatLabel(lead.budget)}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-[12px] font-medium capitalize" style={{ background: sc.bg, color: sc.color }}>{lead.status || 'new'}</span></td>
                      <td className="px-4 py-3 text-[13px]" style={{ color: 'var(--lj-muted)' }}>{formatDate(lead.created_at)}</td>
                      <td className="px-4 py-3"><Eye size={16} style={{ color: 'var(--lj-muted)' }} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--lj-surface)', borderTop: '1px solid var(--lj-border)' }}>
            <span className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>{total} leads total</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--lj-bg)', color: 'var(--lj-muted)' }}><ChevronLeft size={16} /></button>
              <span className="text-[13px]" style={{ color: 'var(--lj-text)' }}>Page {page} of {pages || 1}</span>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--lj-bg)', color: 'var(--lj-muted)' }}><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Drawer */}
      {selectedLead && detailData && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setSelectedLead(null); setDetailData(null); }} />
          <div className="relative w-full max-w-[500px] h-full overflow-y-auto" style={{ background: 'var(--lj-bg)', borderLeft: '1px solid var(--lj-border)' }}>
            <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between" style={{ background: 'var(--lj-bg)', borderBottom: '1px solid var(--lj-border)' }}>
              <h3 className="text-[18px] font-medium" style={{ color: 'var(--lj-text)' }}>{detailData.lead.first_name}</h3>
              <button onClick={() => { setSelectedLead(null); setDetailData(null); }}><X size={20} style={{ color: 'var(--lj-muted)' }} /></button>
            </div>
            <div className="p-5 space-y-5">
              {/* Status */}
              <div>
                <label className="text-[13px] block mb-2" style={{ color: 'var(--lj-muted)' }}>Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => {
                    const sc = STATUS_COLORS[s];
                    const active = detailData.lead.status === s;
                    return <button key={s} onClick={() => updateStatus(detailData.lead.lead_id, s)} className="px-3 py-1.5 rounded-full text-[13px] font-medium capitalize transition-all" style={{ background: active ? sc.color : sc.bg, color: active ? '#FFFFFF' : sc.color, border: active ? 'none' : `1px solid ${sc.color}30` }}>{s}</button>;
                  })}
                </div>
              </div>

              {/* Contact */}
              <div className="p-4 rounded-[10px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                <h4 className="text-[13px] font-medium mb-3" style={{ color: 'var(--lj-muted)' }}>Contact Info</h4>
                <div className="space-y-1 text-[14px]">
                  {detailData.lead.phone && <p style={{ color: 'var(--lj-text)' }}>Phone: {detailData.lead.phone}</p>}
                  {detailData.lead.email && <p style={{ color: 'var(--lj-text)' }}>Email: {detailData.lead.email}</p>}
                  <p style={{ color: 'var(--lj-muted)' }}>Submitted: {formatDate(detailData.lead.created_at)}</p>
                </div>
              </div>

              {/* Answers */}
              <div className="p-4 rounded-[10px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                <h4 className="text-[13px] font-medium mb-3" style={{ color: 'var(--lj-muted)' }}>Form Answers</h4>
                <div className="grid grid-cols-2 gap-2 text-[13px]">
                  {['product_type', 'occasion', 'deadline', 'setting_style', 'diamond_shape', 'carat_range', 'priority', 'metal', 'ring_size', 'budget', 'has_inspiration'].map(field => {
                    const val = detailData.lead[field];
                    if (!val) return null;
                    return <div key={field}><span style={{ color: 'var(--lj-muted)' }}>{field.replace(/_/g, ' ')}:</span> <span style={{ color: 'var(--lj-text)' }}>{formatLabel(val)}</span></div>;
                  })}
                </div>
                {detailData.lead.notes && <p className="mt-2 text-[13px]" style={{ color: 'var(--lj-muted)' }}>Notes: {detailData.lead.notes}</p>}
              </div>

              {/* Attribution */}
              {detailData.lead.attribution && Object.keys(detailData.lead.attribution).length > 0 && (
                <div className="p-4 rounded-[10px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                  <h4 className="text-[13px] font-medium mb-3" style={{ color: 'var(--lj-muted)' }}>Attribution</h4>
                  <div className="space-y-1 text-[13px]">
                    {Object.entries(detailData.lead.attribution).filter(([_, v]) => v).map(([k, v]) => (
                      <div key={k}><span style={{ color: 'var(--lj-muted)' }}>{k}:</span> <span style={{ color: 'var(--lj-text)' }} className="break-all">{String(v).substring(0, 100)}</span></div>
                    ))}
                  </div>
                </div>
              )}

              {/* Internal Notes */}
              <div className="p-4 rounded-[10px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                <h4 className="text-[13px] font-medium mb-3" style={{ color: 'var(--lj-muted)' }}>Internal Notes</h4>
                {(detailData.lead.internal_notes || []).map((n, i) => (
                  <div key={i} className="mb-2 p-2 rounded-[8px]" style={{ background: 'var(--lj-bg)' }}>
                    <p className="text-[14px]" style={{ color: 'var(--lj-text)' }}>{n.text}</p>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--lj-muted)' }}>{n.author} — {formatDate(n.created_at)}</p>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." className="flex-1 min-h-[36px] px-3 rounded-[8px] text-[14px]" style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)', color: 'var(--lj-text)' }} />
                  <button onClick={addNote} className="w-9 h-9 rounded-[8px] flex items-center justify-center" style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}><Send size={14} /></button>
                </div>
              </div>

              {/* Quotes */}
              <div className="p-4 rounded-[10px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                <h4 className="text-[13px] font-medium mb-3" style={{ color: 'var(--lj-muted)' }}>Quotes</h4>
                {(detailData.quotes || []).map((q, i) => (
                  <div key={i} className="mb-2 p-2 rounded-[8px] flex justify-between items-center" style={{ background: 'var(--lj-bg)' }}>
                    <div>
                      <span className="text-[14px] font-medium" style={{ color: 'var(--lj-text)' }}>${q.total?.toLocaleString()}</span>
                      <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] capitalize" style={{ background: STATUS_COLORS[q.status]?.bg || 'rgba(15,94,76,0.1)', color: STATUS_COLORS[q.status]?.color || 'var(--lj-accent)' }}>{q.status}</span>
                    </div>
                    <span className="text-[11px]" style={{ color: 'var(--lj-muted)' }}>{formatDate(q.created_at)}</span>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input type="number" value={quoteTotal} onChange={e => setQuoteTotal(e.target.value)} placeholder="Quote amount ($)" className="flex-1 min-h-[36px] px-3 rounded-[8px] text-[14px]" style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)', color: 'var(--lj-text)' }} />
                  <button onClick={createQuote} className="px-3 h-9 rounded-[8px] flex items-center gap-1 text-[13px] font-medium" style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}><Plus size={14} /> Quote</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
