import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Plus, Clock, Loader2, ChevronDown, ChevronUp, Send, Gem, Truck, CheckCircle, PenTool, Factory, Image as ImageIcon, MessageCircle, Check } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const STAGES = [
  { key: 'design_quotation', label: 'Design & Quotation', icon: PenTool, color: '#0F5E4C' },
  { key: 'in_production', label: 'In Production', icon: Factory, color: '#2563EB' },
  { key: 'shipped', label: 'Shipped', icon: Truck, color: '#7C3AED' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: '#16A34A' },
];

const getStageIndex = (stage) => {
  const idx = STAGES.findIndex((s) => s.key === stage);
  return idx >= 0 ? idx : 0;
};

function formatValue(val) {
  if (!val) return '';
  const m = { engagement_ring: 'Engagement Ring', wedding_bands: 'Wedding Bands', tennis_bracelet: 'Tennis Bracelet', studs_earrings: 'Studs / Earrings', necklace_pendant: 'Necklace / Pendant', loose_diamond: 'Loose Diamond', price_checking: 'Price Check', '0.5_0.9': '0.5–0.9 ct', '1.0_1.4': '1.0–1.4 ct', '1.5_1.9': '1.5–1.9 ct', '2.0_2.9': '2.0–2.9 ct', '3.0_plus': '3.0+ ct', not_sure: 'Not sure', under_2000: 'Under $2,000', '2000_5000': '$2,000–$5,000', '5000_10000': '$5,000–$10,000', '10000_15000': '$10,000–$15,000', '15000_plus': '$15,000+', '14k_white_gold': '14k White Gold', '14k_yellow_gold': '14k Yellow Gold', '14k_rose_gold': '14k Rose Gold', '18k_gold': '18k Gold', platinum: 'Platinum', solitaire: 'Solitaire', halo: 'Halo', three_stone: 'Three-Stone', pave_side_stones: 'Pavé / Side Stones', vintage_art_deco: 'Vintage / Art Deco', hidden_halo: 'Hidden Halo', best_value: 'Best Value', best_sparkle: 'Best Sparkle', biggest_look: 'Biggest Look', whitest_color: 'Whitest Color', cleanest_clarity: 'Cleanest Clarity' };
  return m[val] || val.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
const formatTime = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');

export default function QuotesTab({ headers }) {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLead, setExpandedLead] = useState(null);
  const [leadDetail, setLeadDetail] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/me/leads`, { headers })
      .then((r) => setLeads(r.data.leads || []))
      .catch(console.error)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDetail = async (lead) => {
    if (expandedLead === lead.lead_id) { setExpandedLead(null); setLeadDetail(null); return; }
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

  const approveAndMoveToProduction = async () => {
    if (!expandedLead || approving) return;
    if (!window.confirm('Approve this design and move to production? This will lock the current renders and start fabrication.')) return;
    setApproving(true);
    try {
      await axios.post(`${BACKEND_URL}/api/me/leads/${expandedLead}/approve`, {}, { headers });
      const [d, l] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/me/leads/${expandedLead}`, { headers }),
        axios.get(`${BACKEND_URL}/api/me/leads`, { headers }),
      ]);
      setLeadDetail(d.data);
      setLeads(l.data.leads || []);
    } catch (e) {
      alert('Could not approve right now. Please try again or contact us.');
      console.error(e);
    }
    setApproving(false);
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin" style={{ color: '#0F5E4C' }} /></div>;

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="quotes-empty">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: '#E9F5EE' }}>
          <FileText size={26} style={{ color: '#0F5E4C' }} />
        </div>
        <h3 className="text-[22px] mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#1A2520' }}>No quotations yet</h3>
        <p className="text-[14px] mb-6 max-w-[320px]" style={{ color: '#6B746F' }}>Start your custom quote to get personalized pricing on your dream piece.</p>
        <button onClick={() => navigate('/')} data-testid="dashboard-empty-state-start-wizard-button"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-semibold" style={{ background: '#0F5E4C', color: '#fff' }}>
          <Plus size={16} /> Start a Quote
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl" data-testid="quotes-list">
      {leads.map((lead) => {
        const isExpanded = expandedLead === lead.lead_id;
        const detail = isExpanded ? leadDetail : null;
        const stage = lead.order_stage || 'design_quotation';
        const stageIdx = getStageIndex(stage);

        return (
          <div key={lead.lead_id} className="rounded-[16px] overflow-hidden" style={{ background: '#fff', border: '1px solid #E5E0D7' }}>
            <button onClick={() => toggleDetail(lead)} className="w-full text-left p-4 flex items-center justify-between" data-testid="dashboard-quotation-card">
              <div>
                <h3 className="text-[16px] font-medium" style={{ color: '#1A2520' }}>{formatValue(lead.product_type)}</h3>
                <p className="text-[13px] flex items-center gap-1.5 mt-1" style={{ color: '#6B746F' }}>
                  <Clock size={12} /> {formatDate(lead.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-full text-[12px] font-medium capitalize" style={{ background: 'rgba(15,94,76,0.08)', color: '#0F5E4C' }}>{lead.status || 'new'}</span>
                {isExpanded ? <ChevronUp size={18} style={{ color: '#6B746F' }} /> : <ChevronDown size={18} style={{ color: '#6B746F' }} />}
              </div>
            </button>

            {isExpanded && detail && (
              <div className="px-4 pb-5" style={{ borderTop: '1px solid #E5E0D7' }}>
                {/* Stage Timeline */}
                <div className="py-5">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-5 left-6 right-6 h-0.5" style={{ background: '#E5E0D7' }}>
                      <div className="h-full transition-all duration-500" style={{ width: `${(stageIdx / (STAGES.length - 1)) * 100}%`, background: STAGES[stageIdx].color }} />
                    </div>
                    {STAGES.map((s, i) => {
                      const isActive = i <= stageIdx;
                      const isCurrent = i === stageIdx;
                      return (
                        <div key={s.key} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCurrent ? 'ring-4' : ''}`}
                            style={{ background: isActive ? s.color : '#fff', border: `2px solid ${isActive ? s.color : '#E5E0D7'}` }}>
                            <s.icon size={18} style={{ color: isActive ? '#FFFFFF' : '#6B746F' }} />
                          </div>
                          <span className="text-[11px] mt-2 text-center font-medium leading-tight max-w-[70px]" style={{ color: isActive ? s.color : '#6B746F' }}>{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Working on it status */}
                {(!detail.quotes || detail.quotes.length === 0) && stage === 'design_quotation' && (
                  <div className="mb-4 p-5 rounded-[14px] text-center" style={{ background: 'rgba(15,94,76,0.03)', border: '1px solid rgba(15,94,76,0.1)' }}>
                    <div className="flex justify-center mb-3">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-[22px] font-bold" style={{ background: 'rgba(15,94,76,0.1)', color: '#0F5E4C' }}>AJ</div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#0F5E4C' }}>
                          <PenTool size={10} style={{ color: '#FFFFFF' }} />
                        </div>
                      </div>
                    </div>
                    <p className="text-[16px] font-medium mb-1" style={{ color: '#1A2520' }}>Ansh is working on your design & quotation</p>
                    <p className="text-[13px] mb-4" style={{ color: '#6B746F' }}>We're crafting something special for you. You'll be notified once it's ready.</p>
                    <div className="flex justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: '#0F5E4C', animation: 'bounce 1.4s infinite 0s' }} />
                      <span className="w-2 h-2 rounded-full" style={{ background: '#0F5E4C', animation: 'bounce 1.4s infinite 0.2s' }} />
                      <span className="w-2 h-2 rounded-full" style={{ background: '#0F5E4C', animation: 'bounce 1.4s infinite 0.4s' }} />
                    </div>
                  </div>
                )}

                {stage === 'in_production' && (
                  <div className="mb-4 p-4 rounded-[10px] flex items-center gap-3" style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.12)' }}>
                    <Factory size={20} style={{ color: '#2563EB' }} />
                    <div>
                      <p className="text-[14px] font-medium" style={{ color: '#1A2520' }}>Your piece is in production</p>
                      <p className="text-[13px]" style={{ color: '#6B746F' }}>Our master craftsmen are bringing your design to life.</p>
                    </div>
                  </div>
                )}

                {stage === 'shipped' && (
                  <div className="mb-4 p-4 rounded-[10px] flex items-center gap-3" style={{ background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.12)' }}>
                    <Truck size={20} style={{ color: '#7C3AED' }} />
                    <div>
                      <p className="text-[14px] font-medium" style={{ color: '#1A2520' }}>Your piece has been shipped!</p>
                      <p className="text-[13px]" style={{ color: '#6B746F' }}>It's on its way to you. Check tracking details below.</p>
                    </div>
                  </div>
                )}

                {stage === 'delivered' && (
                  <div className="mb-4 p-4 rounded-[10px] flex items-center gap-3" style={{ background: 'rgba(22,163,74,0.04)', border: '1px solid rgba(22,163,74,0.12)' }}>
                    <CheckCircle size={20} style={{ color: '#16A34A' }} />
                    <div>
                      <p className="text-[14px] font-medium" style={{ color: '#1A2520' }}>Delivered — Enjoy your piece!</p>
                      <p className="text-[13px]" style={{ color: '#6B746F' }}>We hope you love it. Feel free to leave us a review.</p>
                    </div>
                  </div>
                )}

                {/* Quotation section */}
                {detail.quotes && detail.quotes.length > 0 && (
                  <div className="mb-4 p-4 rounded-[10px]" style={{ background: '#FBF7F0', border: '1px solid #E5E0D7' }}>
                    <h4 className="text-[14px] font-medium mb-3 flex items-center gap-2" style={{ color: '#1A2520' }}>
                      <Gem size={16} style={{ color: '#0F5E4C' }} /> Quotation
                    </h4>
                    {detail.quotes.map((q, qi) => (
                      <div key={qi} className="flex items-center justify-between py-2" style={{ borderBottom: qi < detail.quotes.length - 1 ? '1px solid #E5E0D7' : 'none' }}>
                        <div>
                          <span className="text-[18px] font-semibold" style={{ color: '#1A2520' }}>${q.total?.toLocaleString()}</span>
                          {q.notes && <p className="text-[13px] mt-0.5" style={{ color: '#6B746F' }}>{q.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Your Selections */}
                <div className="mb-4 p-4 rounded-[10px]" style={{ background: '#FBF7F0', border: '1px solid #E5E0D7' }}>
                  <h4 className="text-[14px] font-medium mb-3" style={{ color: '#1A2520' }}>Your Selections</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                    {['product_type', 'occasion', 'setting_style', 'diamond_shape', 'carat_range', 'priority', 'metal', 'ring_size', 'budget'].map((field) => {
                      const val = detail.lead[field];
                      if (!val) return null;
                      return <div key={field}><span style={{ color: '#6B746F' }}>{field.replace(/_/g, ' ')}:</span> <span className="font-medium" style={{ color: '#1A2520' }}>{formatValue(val)}</span></div>;
                    })}
                  </div>
                  {detail.lead.inspiration_files && detail.lead.inspiration_files.length > 0 && (
                    <div className="mt-3">
                      <span className="text-[13px] font-medium" style={{ color: '#6B746F' }}>Your Inspiration:</span>
                      <div className="flex gap-2 mt-2">
                        {detail.lead.inspiration_files.map((f, fi) => (
                          <a key={fi} href={`${BACKEND_URL}${f.url}`} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-[8px] overflow-hidden" style={{ border: '1px solid #E5E0D7' }}>
                            <img src={`${BACKEND_URL}${f.url}`} alt="Inspiration" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* CAD & Renders */}
                {detail.lead.cad_renders && detail.lead.cad_renders.length > 0 && (
                  <div className="mb-4 p-4 rounded-[10px]" style={{ background: '#FBF7F0', border: '1px solid #E5E0D7' }}>
                    <h4 className="text-[14px] font-medium mb-3 flex items-center gap-2" style={{ color: '#1A2520' }}>
                      <ImageIcon size={16} style={{ color: '#0F5E4C' }} /> CAD & Renders
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {detail.lead.cad_renders.map((r, ri) => (
                        <a key={ri} href={`${BACKEND_URL}${r.url}`} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-[8px] overflow-hidden" style={{ border: '1px solid #E5E0D7' }}>
                          <img src={`${BACKEND_URL}${r.url}`} alt={r.original_name || 'CAD Render'} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>

                    {(detail.lead.order_stage || 'design_quotation') === 'design_quotation' && (
                      <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E5E0D7' }}>
                        <p className="text-[13px] mb-3 leading-[1.5]" style={{ color: '#6B746F' }}>
                          Happy with these renders? Approve to lock the design and we'll move your ring into production.
                        </p>
                        <button onClick={approveAndMoveToProduction} disabled={approving} data-testid="approve-and-produce-button"
                          className="w-full min-h-[46px] px-5 rounded-full font-medium text-[15px] flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.99] disabled:opacity-60"
                          style={{ background: '#0F5E4C', color: '#FFFFFF' }}>
                          {approving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                          {approving ? 'Sending to production...' : 'Approve & move to production'}
                        </button>
                        <p className="mt-2 text-[11.5px] text-center" style={{ color: '#6B746F' }}>
                          This locks the current design. Want a change? Send a comment below instead.
                        </p>
                      </div>
                    )}

                    {detail.lead.order_stage && detail.lead.order_stage !== 'design_quotation' && (
                      <div className="mt-4 px-3 py-2.5 rounded-[10px] flex items-center gap-2" style={{ background: 'rgba(15,94,76,0.06)', border: '1px solid rgba(15,94,76,0.18)' }}>
                        <Check size={15} style={{ color: '#0F5E4C' }} />
                        <span className="text-[13px]" style={{ color: '#1A2520' }}>You approved this design. It's in production.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tracking info */}
                {detail.lead.tracking_number && (
                  <div className="mb-4 p-4 rounded-[10px]" style={{ background: '#FBF7F0', border: '1px solid #E5E0D7' }}>
                    <h4 className="text-[14px] font-medium mb-2 flex items-center gap-2" style={{ color: '#1A2520' }}>
                      <Truck size={16} style={{ color: '#0F5E4C' }} /> Shipping
                    </h4>
                    <p className="text-[14px]" style={{ color: '#1A2520' }}>
                      Tracking: <span className="font-mono font-medium">{detail.lead.tracking_number}</span>
                    </p>
                    {detail.lead.shipping_provider && (
                      <p className="text-[13px] mt-1" style={{ color: '#6B746F' }}>via {detail.lead.shipping_provider}</p>
                    )}
                  </div>
                )}

                {/* Comments */}
                <div className="p-4 rounded-[10px]" style={{ background: '#FBF7F0', border: '1px solid #E5E0D7' }}>
                  <h4 className="text-[14px] font-medium mb-3 flex items-center gap-2" style={{ color: '#1A2520' }}>
                    <MessageCircle size={16} style={{ color: '#0F5E4C' }} /> Comments
                  </h4>
                  <div className="space-y-3 mb-3 max-h-[300px] overflow-y-auto">
                    {(!detail.lead.comments || detail.lead.comments.length === 0) && (
                      <p className="text-[13px] text-center py-3" style={{ color: '#6B746F' }}>No comments yet. Send a message to discuss your order.</p>
                    )}
                    {(detail.lead.comments || []).map((c, ci) => (
                      <div key={ci} className={`flex ${c.role === 'customer' ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[80%] px-3 py-2 rounded-[10px]"
                          style={{ background: c.role === 'customer' ? 'rgba(15,94,76,0.08)' : '#fff', border: `1px solid ${c.role === 'customer' ? 'rgba(15,94,76,0.15)' : '#E5E0D7'}` }}>
                          <p className="text-[14px]" style={{ color: '#1A2520' }}>{c.text}</p>
                          <p className="text-[11px] mt-1" style={{ color: '#6B746F' }}>{c.author} · {formatTime(c.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === 'Enter' && addComment()}
                      className="flex-1 min-h-[40px] px-3 rounded-[10px] text-[14px] outline-none" style={{ background: '#fff', border: '1px solid #E5E0D7', color: '#1A2520' }} />
                    <button onClick={addComment} disabled={sendingComment || !commentText.trim()} className="w-10 h-10 rounded-[10px] flex items-center justify-center transition-colors"
                      style={{ background: commentText.trim() ? '#0F5E4C' : '#E5E0D7', color: commentText.trim() ? '#FFFFFF' : '#9AA39E' }}>
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
  );
}
