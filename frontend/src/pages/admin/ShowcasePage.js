import React, { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Plus, Trash2, Upload, Loader2, Image, ArrowRight, GripVertical } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function ShowcasePage() {
  const { api } = useAdmin();
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', renderFile: null, productFile: null });
  const [renderPreview, setRenderPreview] = useState(null);
  const [productPreview, setProductPreview] = useState(null);

  const fetchPairs = useCallback(async () => {
    try {
      const res = await api('get', '/api/admin/showcase-pairs');
      setPairs(res.data.pairs || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [api]);

  useEffect(() => { fetchPairs(); }, [fetchPairs]);

  const handleFileSelect = (type, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'render') { setRenderPreview(e.target.result); setForm(p => ({ ...p, renderFile: file })); }
      else { setProductPreview(e.target.result); setForm(p => ({ ...p, productFile: file })); }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPair = async () => {
    if (!form.renderFile || !form.productFile) return;
    setUploading(true);
    try {
      // Upload render image
      const renderData = new FormData();
      renderData.append('files', form.renderFile);
      const renderRes = await api('post', '/api/uploads', renderData);
      const renderFile = renderRes.data.files[0];

      // Upload product image
      const productData = new FormData();
      productData.append('files', form.productFile);
      const productRes = await api('post', '/api/uploads', productData);
      const productFile = productRes.data.files[0];

      // Create the pair
      const params = new URLSearchParams({
        title: form.title || '',
        render_storage_path: renderFile.storage_path || '',
        render_original_name: renderFile.original_name || '',
        render_content_type: renderFile.content_type || 'image/jpeg',
        product_storage_path: productFile.storage_path || '',
        product_original_name: productFile.original_name || '',
        product_content_type: productFile.content_type || 'image/jpeg',
      });

      await api('post', `/api/admin/showcase-pairs?${params.toString()}`);
      setShowForm(false);
      setForm({ title: '', renderFile: null, productFile: null });
      setRenderPreview(null);
      setProductPreview(null);
      fetchPairs();
    } catch (err) { console.error('Upload failed:', err); }
    setUploading(false);
  };

  const handleDelete = async (pairId) => {
    if (!window.confirm('Delete this showcase pair?')) return;
    try {
      await api('delete', `/api/admin/showcase-pairs/${pairId}`);
      fetchPairs();
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin" size={24} style={{ color: 'var(--lj-accent)' }} />
    </div>
  );

  return (
    <div className="space-y-6" data-testid="showcase-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-semibold" style={{ color: 'var(--lj-text)' }}>Render → Product Showcase</h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--lj-muted)' }}>Upload 3D render and finished product pairs for the landing page slideshow</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[14px] font-medium transition-colors hover:opacity-90"
          style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}
          data-testid="add-showcase-pair-btn"
        >
          <Plus size={16} /> Add Pair
        </button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="p-6 rounded-[12px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
          <h3 className="text-[16px] font-medium mb-4" style={{ color: 'var(--lj-text)' }}>New Showcase Pair</h3>

          <div className="mb-4">
            <label className="text-[13px] font-medium mb-1.5 block" style={{ color: 'var(--lj-muted)' }}>Title (optional)</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Solitaire Engagement Ring"
              className="w-full px-4 py-2.5 rounded-[8px] text-[14px]"
              style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)', color: 'var(--lj-text)' }}
              data-testid="showcase-title-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Render Image */}
            <div>
              <label className="text-[13px] font-medium mb-1.5 block" style={{ color: 'var(--lj-muted)' }}>3D Render / CAD</label>
              <label
                className="flex flex-col items-center justify-center h-[180px] rounded-[10px] cursor-pointer transition-colors hover:opacity-80 overflow-hidden"
                style={{ background: 'var(--lj-bg)', border: '2px dashed var(--lj-border)' }}
                data-testid="showcase-render-upload"
              >
                {renderPreview ? (
                  <img src={renderPreview} alt="Render preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2" style={{ color: 'var(--lj-muted)' }}>
                    <Upload size={24} />
                    <span className="text-[13px]">Upload Render</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect('render', e.target.files[0])} />
              </label>
            </div>

            {/* Product Image */}
            <div>
              <label className="text-[13px] font-medium mb-1.5 block" style={{ color: 'var(--lj-muted)' }}>Finished Product</label>
              <label
                className="flex flex-col items-center justify-center h-[180px] rounded-[10px] cursor-pointer transition-colors hover:opacity-80 overflow-hidden"
                style={{ background: 'var(--lj-bg)', border: '2px dashed var(--lj-border)' }}
                data-testid="showcase-product-upload"
              >
                {productPreview ? (
                  <img src={productPreview} alt="Product preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2" style={{ color: 'var(--lj-muted)' }}>
                    <Upload size={24} />
                    <span className="text-[13px]">Upload Product</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect('product', e.target.files[0])} />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleUploadPair}
              disabled={!form.renderFile || !form.productFile || uploading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-[14px] font-medium transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--lj-accent)', color: '#FFFFFF' }}
              data-testid="showcase-save-btn"
            >
              {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Plus size={16} /> Save Pair</>}
            </button>
            <button
              onClick={() => { setShowForm(false); setRenderPreview(null); setProductPreview(null); setForm({ title: '', renderFile: null, productFile: null }); }}
              className="px-4 py-2.5 rounded-[8px] text-[14px] transition-colors hover:bg-[#F0F0EE]"
              style={{ color: 'var(--lj-muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pairs List */}
      {pairs.length === 0 ? (
        <div className="text-center py-16 rounded-[12px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
          <Image size={40} className="mx-auto mb-3" style={{ color: 'var(--lj-muted)', opacity: 0.4 }} />
          <p className="text-[15px] font-medium" style={{ color: 'var(--lj-text)' }}>No showcase pairs yet</p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--lj-muted)' }}>Add your first 3D render → finished product pair</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pairs.map((pair) => (
            <div key={pair.pair_id} className="flex items-center gap-4 p-4 rounded-[12px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }} data-testid={`showcase-pair-${pair.pair_id}`}>
              <GripVertical size={18} style={{ color: 'var(--lj-muted)', opacity: 0.4 }} className="shrink-0" />

              {/* Render thumbnail */}
              <div className="w-[80px] h-[80px] rounded-[8px] overflow-hidden shrink-0" style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)' }}>
                <img src={`${BACKEND_URL}${pair.render_image?.url || ''}`} alt="Render" className="w-full h-full object-cover" />
              </div>

              <ArrowRight size={20} style={{ color: 'var(--lj-accent)' }} className="shrink-0" />

              {/* Product thumbnail */}
              <div className="w-[80px] h-[80px] rounded-[8px] overflow-hidden shrink-0" style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)' }}>
                <img src={`${BACKEND_URL}${pair.product_image?.url || ''}`} alt="Product" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium truncate" style={{ color: 'var(--lj-text)' }}>{pair.title || 'Untitled'}</p>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--lj-muted)' }}>
                  {pair.render_image?.original_name} → {pair.product_image?.original_name}
                </p>
              </div>

              <button
                onClick={() => handleDelete(pair.pair_id)}
                className="p-2 rounded-[8px] transition-colors hover:bg-red-50"
                style={{ color: 'var(--lj-muted)' }}
                data-testid={`delete-pair-${pair.pair_id}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
