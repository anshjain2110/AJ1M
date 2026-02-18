import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { TrendingUp, Users, Clock, AlertTriangle, Loader2 } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="p-4 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>{label}</span>
      </div>
      <span className="text-[28px] font-semibold" style={{ color: 'var(--lj-text)' }}>{value}</span>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { api } = useAdmin();
  const [overview, setOverview] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [sources, setSources] = useState([]);
  const [devices, setDevices] = useState([]);
  const [abandonment, setAbandonment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api('get', '/api/admin/analytics/overview'),
      api('get', '/api/admin/analytics/funnel'),
      api('get', '/api/admin/analytics/sources'),
      api('get', '/api/admin/analytics/devices'),
      api('get', '/api/admin/analytics/abandonment'),
    ]).then(([ov, fn, sr, dv, ab]) => {
      setOverview(ov.data); setFunnel(fn.data); setSources(sr.data.sources); setDevices(dv.data.devices); setAbandonment(ab.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [api]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--lj-accent)' }} /></div>;

  const funnelSteps = [
    { key: 'tlj_landing_view', label: 'Landing Views' },
    { key: 'tlj_wizard_start', label: 'Wizard Starts' },
    { key: 'tlj_value_reveal_view', label: 'Value Reveal' },
    { key: 'tlj_contact_submit_attempt', label: 'Submit Attempts' },
    { key: 'tlj_lead_created', label: 'Leads Created' },
  ];
  const maxFunnel = Math.max(...funnelSteps.map(s => funnel?.funnel?.[s.key] || 0), 1);

  return (
    <div className="max-w-6xl">
      <h1 className="text-[28px] font-semibold mb-6" style={{ color: 'var(--lj-text)' }}>Analytics Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Today" value={overview?.today || 0} icon={TrendingUp} color="var(--lj-accent)" />
        <StatCard label="This Week" value={overview?.this_week || 0} icon={Users} color="var(--lj-success)" />
        <StatCard label="This Month" value={overview?.this_month || 0} icon={Users} color="#60A5FA" />
        <StatCard label="All Time" value={overview?.total || 0} icon={Users} color="var(--lj-accent-2)" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Funnel */}
        <div className="p-5 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
          <h3 className="text-[16px] font-medium mb-4" style={{ color: 'var(--lj-text)' }}>Conversion Funnel (30d)</h3>
          <div className="space-y-3">
            {funnelSteps.map(step => {
              const val = funnel?.funnel?.[step.key] || 0;
              const pct = maxFunnel > 0 ? (val / maxFunnel) * 100 : 0;
              return (
                <div key={step.key}>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span style={{ color: 'var(--lj-muted)' }}>{step.label}</span>
                    <span style={{ color: 'var(--lj-text)' }}>{val}</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: '#EDEDEB' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--lj-accent)', transition: 'width 500ms' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Abandonment + Avg Time */}
        <div className="space-y-4">
          <div className="p-5 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
            <h3 className="text-[16px] font-medium mb-3" style={{ color: 'var(--lj-text)' }}>Abandonment</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(226,92,92,0.1)', border: '2px solid rgba(226,92,92,0.3)' }}>
                <AlertTriangle size={24} style={{ color: 'var(--lj-danger)' }} />
              </div>
              <div>
                <span className="text-[28px] font-bold" style={{ color: 'var(--lj-text)' }}>{abandonment?.abandonment_rate_pct || 0}%</span>
                <p className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>
                  {abandonment?.total_started || 0} started, {abandonment?.total_completed || 0} completed
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
            <h3 className="text-[16px] font-medium mb-2" style={{ color: 'var(--lj-text)' }}>Avg. Completion Time</h3>
            <div className="flex items-center gap-3">
              <Clock size={24} style={{ color: 'var(--lj-accent)' }} />
              <span className="text-[28px] font-bold" style={{ color: 'var(--lj-text)' }}>
                {overview?.avg_completion_time_seconds > 0 ? `${Math.round(overview.avg_completion_time_seconds)}s` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sources */}
        <div className="p-5 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
          <h3 className="text-[16px] font-medium mb-4" style={{ color: 'var(--lj-text)' }}>Lead Sources</h3>
          {sources.length === 0 ? <p className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>No attribution data yet</p> : (
            <div className="space-y-2">
              {sources.map((s, i) => (
                <div key={i} className="flex justify-between px-3 py-2 rounded-[10px]" style={{ background: 'var(--lj-bg)' }}>
                  <span className="text-[14px]" style={{ color: 'var(--lj-text)' }}>{s.source || 'direct'}{s.medium ? ` / ${s.medium}` : ''}</span>
                  <span className="text-[14px] font-medium" style={{ color: 'var(--lj-accent)' }}>{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Devices */}
        <div className="p-5 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
          <h3 className="text-[16px] font-medium mb-4" style={{ color: 'var(--lj-text)' }}>Device Breakdown</h3>
          {devices.length === 0 ? <p className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>No device data yet</p> : (
            <div className="space-y-2">
              {devices.map((d, i) => (
                <div key={i} className="flex justify-between px-3 py-2 rounded-[10px]" style={{ background: 'var(--lj-bg)' }}>
                  <span className="text-[14px] capitalize" style={{ color: 'var(--lj-text)' }}>{d.device}</span>
                  <span className="text-[14px] font-medium" style={{ color: 'var(--lj-accent)' }}>{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="p-5 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
          <h3 className="text-[16px] font-medium mb-4" style={{ color: 'var(--lj-text)' }}>Lead Status Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(overview?.status_breakdown || {}).map(([status, count]) => (
              <div key={status} className="flex justify-between px-3 py-2 rounded-[10px]" style={{ background: 'var(--lj-bg)' }}>
                <span className="text-[14px] capitalize" style={{ color: 'var(--lj-text)' }}>{status}</span>
                <span className="text-[14px] font-medium" style={{ color: 'var(--lj-accent)' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
