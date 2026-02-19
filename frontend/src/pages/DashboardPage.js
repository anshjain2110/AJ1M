import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Package, Plus, LogOut, Clock, Loader2, ChevronDown, ChevronUp, Send, Gem, Truck, CheckCircle, PenTool, Factory, Image as ImageIcon, MessageCircle, ExternalLink } from 'lucide-react';
import axios from 'axios';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const STAGES = [
  { key: 'design_quotation', label: 'Design & Quotation', icon: PenTool, color: '#0F5E4C' },
  { key: 'in_production', label: 'In Production', icon: Factory, color: '#2563EB' },
  { key: 'shipped', label: 'Shipped', icon: Truck, color: '#7C3AED' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: '#16A34A' },
];

function getStageIndex(stage) {
  const idx = STAGES.findIndex(s => s.key === stage);
  return idx >= 0 ? idx : 0;
}

function formatValue(val) {
  if (!val) return '';
  const m = { engagement_ring: 'Engagement Ring', wedding_bands: 'Wedding Bands', tennis_bracelet: 'Tennis Bracelet', studs_earrings: 'Studs / Earrings', necklace_pendant: 'Necklace / Pendant', loose_diamond: 'Loose Diamond', price_checking: 'Price Check', '0.5_0.9': '0.5–0.9 ct', '1.0_1.4': '1.0–1.4 ct', '1.5_1.9': '1.5–1.9 ct', '2.0_2.9': '2.0–2.9 ct', '3.0_plus': '3.0+ ct', not_sure: 'Not sure', under_2000: 'Under $2,000', '2000_5000': '$2,000–$5,000', '5000_10000': '$5,000–$10,000', '10000_15000': '$10,000–$15,000', '15000_plus': '$15,000+', '14k_white_gold': '14k White Gold', '14k_yellow_gold': '14k Yellow Gold', '14k_rose_gold': '14k Rose Gold', '18k_gold': '18k Gold', platinum: 'Platinum', solitaire: 'Solitaire', halo: 'Halo', three_stone: 'Three-Stone', pave_side_stones: 'Pavé / Side Stones', vintage_art_deco: 'Vintage / Art Deco', hidden_halo: 'Hidden Halo', best_value: 'Best Value', best_sparkle: 'Best Sparkle', biggest_look: 'Biggest Look', whitest_color: 'Whitest Color', cleanest_clarity: 'Cleanest Clarity' };
  return m[val] || val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatDate(d) { if (!d) return ''; return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function formatTime(d) { if (!d) return ''; return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('quotations');
  const [leads, setLeads] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [expandedLead, setExpandedLead] = useState(null);
  const [leadDetail, setLeadDetail] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const token = localStorage.getItem('tlj_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const su = localStorage.getItem('tlj_user');
    if (su) setUser(JSON.parse(su));
    fetchData();
  }, [navigate, token]);

  const fetchData = async () => {
    try {
      const [lr, or] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/me/leads`, { headers }),
        axios.get(`${BACKEND_URL}/api/me/orders`, { headers }).catch(() => ({ data: { orders: [] } })),
      ]);
      setLeads(lr.data.leads || []);
      setOrders(or.data.orders || []);
    } catch (err) {
      if (err.response?.status === 401) { localStorage.removeItem('tlj_token'); navigate('/login'); }
    } finally { setLoading(false); }
  };

  const toggleDetail = async (lead) => {
    if (expandedLead === lead.lead_id) {
      setExpandedLead(null); setLeadDetail(null); return;
    }
    setExpandedLead(lead.lead_id);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/me/leads/${lead.lead_id}`, { headers });
      setLeadDetail(res.data);
    } catch (e) { console.error(e); }
  };

  const addComment = async () => {
    if (!commentText.trim() || !expandedLead) return;
    setSendingComment(true);
    try {
      await axios.post(`${BACKEND_URL}/api/me/leads/${expandedLead}/comments`, { text: commentText }, { headers });
      setCommentText('');
      const res = await axios.get(`${BACKEND_URL}/api/me/leads/${expandedLead}`, { headers });
      setLeadDetail(res.data);
    } catch (e) { console.error(e); }
    setSendingComment(false);
  };

  const handleLogout = () => { localStorage.removeItem('tlj_token'); localStorage.removeItem('tlj_user'); navigate('/'); };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--lj-bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between" style={{ background: 'var(--lj-bg)', borderBottom: '1px solid var(--lj-border)' }}>
        <a href="/"><img src="/logo-main.png" alt="The Local Jewel" className="h-8 object-contain" /></a>
        <div className="flex items-center gap-3">
          {user && <span className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>{user.first_name || user.email}</span>}
          <button onClick={handleLogout} data-testid="dashboard-logout-button" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#F0F0EE] transition-colors" aria-label="Logout">
            <LogOut size={18} style={{ color: 'var(--lj-muted)' }} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-4 flex gap-1 pt-4" data-testid="dashboard-tabs">
        {[{ id: 'quotations', label: 'My Quotations', icon: FileText }, { id: 'orders', label: 'My Orders', icon: Package }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex-1 min-h-[44px] px-4 py-2.5 rounded-t-[14px] flex items-center justify-center gap-2 text-[16px] font-medium transition-colors duration-300"
            style={{ background: activeTab === tab.id ? 'var(--lj-surface)' : 'transparent', color: activeTab === tab.id ? 'var(--lj-text)' : 'var(--lj-muted)', borderBottom: activeTab === tab.id ? '2px solid var(--lj-accent)' : '2px solid transparent' }}>
            <tab.icon size={18} />{tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--lj-accent)' }} /></div>
        ) : activeTab === 'quotations' ? (
          leads.length === 0 ? (
            <EmptyState title="No quotations yet" subtitle="Start your custom quote to get personalized pricing" onAction={() => navigate('/')} />
          ) : (
            <div className="space-y-4 max-w-2xl mx-auto">
              {leads.map(lead => {
                const isExpanded = expandedLead === lead.lead_id;
                const detail = isExpanded ? leadDetail : null;
                const stage = lead.order_stage || 'design_quotation';
                const stageIdx = getStageIndex(stage);

                return (
                  <div key={lead.lead_id} className="rounded-[14px] overflow-hidden" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                    {/* Card header */}
                    <button onClick={() => toggleDetail(lead)} className="w-full text-left p-4 flex items-center justify-between" data-testid="dashboard-quotation-card">
                      <div>
                        <h3 className="text-[16px] font-medium" style={{ color: 'var(--lj-text)' }}>{formatValue(lead.product_type)}</h3>
                        <p className="text-[13px] flex items-center gap-1.5 mt-1" style={{ color: 'var(--lj-muted)' }}>
                          <Clock size={12} /> {formatDate(lead.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-full text-[12px] font-medium capitalize" style={{ background: 'rgba(15,94,76,0.08)', color: 'var(--lj-accent)' }}>{lead.status || 'new'}</span>
                        {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--lj-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--lj-muted)' }} />}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && detail && (
                      <div className="px-4 pb-5" style={{ borderTop: '1px solid var(--lj-border)' }}>
                        {/* Stage Timeline */}
                        <div className="py-5">
                          <div className="flex items-center justify-between relative">
                            {/* Connection line */}
                            <div className="absolute top-5 left-6 right-6 h-0.5" style={{ background: 'var(--lj-border)' }}>
                              <div className="h-full transition-all duration-500" style={{ width: `${(stageIdx / (STAGES.length - 1)) * 100}%`, background: STAGES[stageIdx].color }} />
                            </div>
                            {STAGES.map((s, i) => {
                              const isActive = i <= stageIdx;
                              const isCurrent = i === stageIdx;
                              return (
                                <div key={s.key} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCurrent ? 'ring-4' : ''}`}
                                    style={{ background: isActive ? s.color : 'var(--lj-surface)', border: `2px solid ${isActive ? s.color : 'var(--lj-border)'}`, ringColor: isCurrent ? `${s.color}30` : 'transparent' }}>
                                    <s.icon size={18} style={{ color: isActive ? '#FFFFFF' : 'var(--lj-muted)' }} />
                                  </div>
                                  <span className="text-[11px] mt-2 text-center font-medium leading-tight max-w-[70px]" style={{ color: isActive ? s.color : 'var(--lj-muted)' }}>{s.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Quotation section */}
                        {detail.quotes && detail.quotes.length > 0 && (
                          <div className="mb-4 p-4 rounded-[10px]" style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)' }}>
                            <h4 className="text-[14px] font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--lj-text)' }}>
                              <Gem size={16} style={{ color: 'var(--lj-accent)' }} /> Quotation
                            </h4>
                            {detail.quotes.map((q, qi) => (
                              <div key={qi} className="flex items-center justify-between py-2" style={{ borderBottom: qi < detail.quotes.length - 1 ? '1px solid var(--lj-border)' : 'none' }}>
                                <div>
                                  <span className="text-[18px] font-semibold" style={{ color: 'var(--lj-text)' }}>${q.total?.toLocaleString()}</span>
                                  {q.notes && <p className="text-[13px] mt-0.5" style={{ color: 'var(--lj-muted)' }}>{q.notes}</p>}
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium capitalize" style={{ background: 'rgba(15,94,76,0.08)', color: 'var(--lj-accent)' }}>{q.status}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Your Selections */}
                        <div className="mb-4 p-4 rounded-[10px]" style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)' }}>
                          <h4 className="text-[14px] font-medium mb-3" style={{ color: 'var(--lj-text)' }}>Your Selections</h4>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                            {['product_type', 'occasion', 'setting_style', 'diamond_shape', 'carat_range', 'priority', 'metal', 'ring_size', 'budget'].map(field => {
                              const val = detail.lead[field];
                              if (!val) return null;
                              return <div key={field}><span style={{ color: 'var(--lj-muted)' }}>{field.replace(/_/g, ' ')}:</span> <span className="font-medium" style={{ color: 'var(--lj-text)' }}>{formatValue(val)}</span></div>;
                            })}
                          </div>
                          {/* Inspiration files from user */}
                          {detail.lead.inspiration_files && detail.lead.inspiration_files.length > 0 && (
                            <div className="mt-3">
                              <span className="text-[13px] font-medium" style={{ color: 'var(--lj-muted)' }}>Your Inspiration:</span>
                              <div className="flex gap-2 mt-2">
                                {detail.lead.inspiration_files.map((f, fi) => (
                                  <a key={fi} href={`${BACKEND_URL}${f.url}`} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-[8px] overflow-hidden" style={{ border: '1px solid var(--lj-border)' }}>
                                    <img src={`${BACKEND_URL}${f.url}`} alt="Inspiration" className="w-full h-full object-cover" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* CAD & Renders (from admin) */}
                        {detail.lead.cad_renders && detail.lead.cad_renders.length > 0 && (
                          <div className="mb-4 p-4 rounded-[10px]" style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)' }}>
                            <h4 className="text-[14px] font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--lj-text)' }}>
                              <ImageIcon size={16} style={{ color: 'var(--lj-accent)' }} /> CAD & Renders
                            </h4>
                            <div className="grid grid-cols-3 gap-2">
                              {detail.lead.cad_renders.map((r, ri) => (
                                <a key={ri} href={`${BACKEND_URL}${r.url}`} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-[8px] overflow-hidden" style={{ border: '1px solid var(--lj-border)' }}>
                                  <img src={`${BACKEND_URL}${r.url}`} alt={r.original_name || 'CAD Render'} className="w-full h-full object-cover" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tracking info */}
                        {detail.lead.tracking_number && (
                          <div className="mb-4 p-4 rounded-[10px]" style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)' }}>
                            <h4 className="text-[14px] font-medium mb-2 flex items-center gap-2" style={{ color: 'var(--lj-text)' }}>
                              <Truck size={16} style={{ color: 'var(--lj-accent)' }} /> Shipping
                            </h4>
                            <p className="text-[14px]" style={{ color: 'var(--lj-text)' }}>
                              Tracking: <span className="font-mono font-medium">{detail.lead.tracking_number}</span>
                            </p>
                            {detail.lead.shipping_provider && (
                              <p className="text-[13px] mt-1" style={{ color: 'var(--lj-muted)' }}>via {detail.lead.shipping_provider}</p>
                            )}
                          </div>
                        )}

                        {/* Comments */}
                        <div className="p-4 rounded-[10px]" style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)' }}>
                          <h4 className="text-[14px] font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--lj-text)' }}>
                            <MessageCircle size={16} style={{ color: 'var(--lj-accent)' }} /> Comments
                          </h4>
                          <div className="space-y-3 mb-3 max-h-[300px] overflow-y-auto">
                            {(!detail.lead.comments || detail.lead.comments.length === 0) && (
                              <p className="text-[13px] text-center py-3" style={{ color: 'var(--lj-muted)' }}>No comments yet. Send a message to discuss your order.</p>
                            )}
                            {(detail.lead.comments || []).map((c, ci) => (
                              <div key={ci} className={`flex ${c.role === 'customer' ? 'justify-end' : 'justify-start'}`}>
                                <div className="max-w-[80%] px-3 py-2 rounded-[10px]"
                                  style={{ background: c.role === 'customer' ? 'rgba(15,94,76,0.08)' : 'var(--lj-surface)', border: `1px solid ${c.role === 'customer' ? 'rgba(15,94,76,0.15)' : 'var(--lj-border)'}` }}>
                                  <p className="text-[14px]" style={{ color: 'var(--lj-text)' }}>{c.text}</p>
                                  <p className="text-[11px] mt-1" style={{ color: 'var(--lj-muted)' }}>{c.author} · {formatTime(c.created_at)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === 'Enter' && addComment()}
                              className="flex-1 min-h-[40px] px-3 rounded-[10px] text-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)', color: 'var(--lj-text)' }} />
                            <button onClick={addComment} disabled={sendingComment || !commentText.trim()} className="w-10 h-10 rounded-[10px] flex items-center justify-center transition-colors"
                              style={{ background: commentText.trim() ? 'var(--lj-accent)' : '#E5E5E3', color: commentText.trim() ? '#FFFFFF' : 'var(--lj-muted)' }}>
                              {sendingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          orders.length === 0 ? (
            <EmptyState title="No orders yet" subtitle="Once your quote is confirmed, orders will appear here" />
          ) : (
            <div className="space-y-3 max-w-2xl mx-auto">
              {orders.map((o, i) => (
                <div key={i} className="p-4 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
                  <h3 className="text-[16px] font-medium" style={{ color: 'var(--lj-text)' }}>{o.product_description || `Order ${o.order_id}`}</h3>
                  <p className="text-[13px] mt-1" style={{ color: 'var(--lj-muted)' }}>{formatDate(o.created_at)}</p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, subtitle, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(15,94,76,0.06)', border: '1px solid rgba(15,94,76,0.1)' }}>
        <FileText size={32} style={{ color: 'var(--lj-accent)' }} />
      </div>
      <h3 className="text-[22px] leading-[28px] font-medium mb-2" style={{ color: 'var(--lj-text)' }}>{title}</h3>
      <p className="text-[16px] leading-[24px] mb-6" style={{ color: 'var(--lj-muted)' }}>{subtitle}</p>
      {onAction && (
        <button onClick={onAction} data-testid="dashboard-empty-state-start-wizard-button" className="min-h-[44px] px-6 rounded-[14px] font-medium text-[16px] flex items-center gap-2" style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}>
          <Plus size={18} /> Start a Quote
        </button>
      )}
    </div>
  );
}
