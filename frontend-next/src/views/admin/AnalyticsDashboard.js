'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';
import {
  TrendingUp, TrendingDown, Users, Clock, AlertTriangle, Loader2,
  BarChart3, Activity, Target, Globe, Smartphone, Eye, Zap, Shield,
  ArrowUpRight, ArrowDownRight, Minus, Filter, Calendar, RefreshCw,
  CheckCircle, XCircle, AlertCircle, ChevronRight, Lightbulb, Layers
} from 'lucide-react';

// ── Date Presets ─────────────────────────────────────────────
const DATE_PRESETS = [
  { label: 'Today', days: 1 },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: 365 },
];

// ── Tab Configuration ────────────────────────────────────────
const TABS = [
  { id: 'executive', label: 'Overview', icon: BarChart3 },
  { id: 'funnel', label: 'Funnel', icon: Filter },
  { id: 'friction', label: 'Friction', icon: AlertTriangle },
  { id: 'quality', label: 'Lead Quality', icon: Target },
  { id: 'sources', label: 'Attribution', icon: Layers },
  { id: 'geo', label: 'Geo', icon: Globe },
  { id: 'devices', label: 'Devices', icon: Smartphone },
  { id: 'visitors', label: 'Visitors', icon: Users },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'health', label: 'Events', icon: Activity },
  { id: 'ops', label: 'Lead Ops', icon: Clock },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
];

// ── Shared Components ────────────────────────────────────────

function MetricCard({ label, value, delta, icon: Icon, color = 'var(--lj-accent)', suffix = '', prefix = '' }) {
  const deltaColor = delta > 0 ? 'var(--lj-success)' : delta < 0 ? 'var(--lj-danger)' : 'var(--lj-muted)';
  const DeltaIcon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
  return (
    <div data-testid={`metric-${label.toLowerCase().replace(/\s/g, '-')}`} className="p-4 rounded-[14px]" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: `${color}12` }}>
            <Icon size={16} style={{ color }} />
          </div>
          <span className="text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--lj-muted)' }}>{label}</span>
        </div>
        {delta !== undefined && delta !== null && (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-[6px]" style={{ background: `${deltaColor}10` }}>
            <DeltaIcon size={12} style={{ color: deltaColor }} />
            <span className="text-[11px] font-semibold" style={{ color: deltaColor }}>{Math.abs(delta)}%</span>
          </div>
        )}
      </div>
      <span className="text-[26px] font-bold tracking-tight" style={{ color: 'var(--lj-text)' }}>
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </span>
    </div>
  );
}

function DataTable({ headers, rows, emptyText = 'No data available' }) {
  if (!rows || rows.length === 0) {
    return <div className="py-8 text-center text-[13px]" style={{ color: 'var(--lj-muted)' }}>{emptyText}</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--lj-border)' }}>
            {headers.map((h, i) => (
              <th key={i} className={`py-2.5 px-3 font-medium text-left ${i > 0 ? 'text-right' : ''}`} style={{ color: 'var(--lj-muted)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-[#F5F5F3]/60 transition-colors duration-150" style={{ borderBottom: '1px solid var(--lj-border)' }}>
              {row.map((cell, j) => (
                <td key={j} className={`py-2.5 px-3 ${j > 0 ? 'text-right' : ''}`} style={{ color: j === 0 ? 'var(--lj-text)' : 'var(--lj-muted)' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionCard({ title, children, className = '' }) {
  return (
    <div className={`rounded-[14px] ${className}`} style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
      {title && <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--lj-border)' }}>
        <h3 className="text-[15px] font-semibold" style={{ color: 'var(--lj-text)' }}>{title}</h3>
      </div>}
      <div className="p-5">{children}</div>
    </div>
  );
}

function BarChart({ data, maxVal, labelKey, valueKey, color = 'var(--lj-accent)' }) {
  const max = maxVal || Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div className="space-y-2.5">
      {data.map((item, i) => {
        const val = item[valueKey] || 0;
        const pct = (val / max) * 100;
        return (
          <div key={i}>
            <div className="flex justify-between text-[12px] mb-1">
              <span className="font-medium truncate mr-2" style={{ color: 'var(--lj-text)' }}>{item[labelKey]}</span>
              <span className="font-semibold tabular-nums" style={{ color }}>{val.toLocaleString()}</span>
            </div>
            <div className="h-[6px] rounded-full" style={{ background: '#EDEDEB' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 1)}%`, background: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProgressRing({ value, size = 64, strokeWidth = 5, color = 'var(--lj-accent)' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#EDEDEB" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 600ms ease' }} />
    </svg>
  );
}

// ── Tab Content Components ───────────────────────────────────

function ExecutiveTab({ data }) {
  if (!data) return null;
  const m = data.metrics;
  return (
    <div data-testid="executive-tab" className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Sessions" value={m.sessions.value} delta={m.sessions.delta} icon={Users} />
        <MetricCard label="Wizard Starts" value={m.wizard_starts.value} delta={m.wizard_starts.delta} icon={Zap} color="var(--lj-accent-2)" />
        <MetricCard label="Leads Created" value={m.total_leads.value} delta={m.total_leads.delta} icon={Target} color="var(--lj-success)" />
        <MetricCard label="Completion Rate" value={m.completion_rate.value} delta={m.completion_rate.delta} icon={TrendingUp} suffix="%" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Lead Quality Distribution">
          {Object.keys(data.quality_breakdown || {}).length === 0 ? (
            <p className="text-[13px] py-4 text-center" style={{ color: 'var(--lj-muted)' }}>No scored leads in this period</p>
          ) : (
            <div className="space-y-3">
              {['high', 'medium', 'low', 'unscored'].map(bucket => {
                const count = data.quality_breakdown[bucket] || 0;
                const total = Object.values(data.quality_breakdown).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const colors = { high: 'var(--lj-success)', medium: '#D97706', low: 'var(--lj-danger)', unscored: 'var(--lj-muted)' };
                return count > 0 ? (
                  <div key={bucket} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors[bucket] }} />
                    <span className="text-[13px] capitalize flex-1" style={{ color: 'var(--lj-text)' }}>{bucket}</span>
                    <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--lj-text)' }}>{count}</span>
                    <span className="text-[12px] w-10 text-right" style={{ color: 'var(--lj-muted)' }}>{pct}%</span>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </SectionCard>
        <SectionCard title="Lead Status Pipeline">
          {Object.keys(data.status_breakdown || {}).length === 0 ? (
            <p className="text-[13px] py-4 text-center" style={{ color: 'var(--lj-muted)' }}>No leads in this period</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.status_breakdown).map(([status, count]) => {
                const statusColors = { new: '#3B82F6', contacted: '#8B5CF6', quoted: '#D97706', won: 'var(--lj-success)', lost: 'var(--lj-danger)' };
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColors[status] || 'var(--lj-muted)' }} />
                    <span className="text-[13px] capitalize flex-1" style={{ color: 'var(--lj-text)' }}>{status}</span>
                    <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--lj-text)' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard label="Avg Step Time" value={m.avg_step_time_sec.value} icon={Clock} suffix="s" color="#8B5CF6" />
        <MetricCard label="Abandons" value={m.abandons.value} icon={AlertTriangle} color="var(--lj-danger)" />
        <MetricCard label="Submits" value={m.submits.value} delta={m.submits.delta} icon={CheckCircle} color="var(--lj-success)" />
      </div>
    </div>
  );
}

function FunnelTab({ data }) {
  if (!data) return null;
  const steps = data.steps || {};
  const stepOrder = ['product_type', 'setting_style', 'bracelet_specifics', 'diamond_shape', 'carat_range', 'priority', 'metal', 'ring_size_known', 'ring_size', 'has_inspiration', 'inspiration_upload', 'value_reveal', 'contact'];
  const orderedSteps = stepOrder.filter(s => steps[s]).map(s => ({ id: s, ...steps[s] }));
  const maxViews = Math.max(...orderedSteps.map(s => s.views || 0), 1);

  return (
    <div data-testid="funnel-tab" className="space-y-6">
      <SectionCard title="Wizard Step Funnel">
        {orderedSteps.length === 0 ? (
          <p className="text-[13px] py-6 text-center" style={{ color: 'var(--lj-muted)' }}>No wizard step data yet. Events will appear as users interact with the wizard.</p>
        ) : (
          <div className="space-y-1">
            {orderedSteps.map((step, i) => {
              const pctW = (step.views / maxViews) * 100;
              const pctC = step.views > 0 ? (step.completes / step.views) * 100 : 0;
              return (
                <div key={step.id} className="py-2.5 px-3 rounded-[10px] hover:bg-[#EDEDEB]/50 transition-colors" style={{ borderBottom: '1px solid var(--lj-border)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--lj-accent)', color: '#fff' }}>{i + 1}</span>
                      <span className="text-[13px] font-medium" style={{ color: 'var(--lj-text)' }}>{step.id.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[12px]">
                      <span style={{ color: 'var(--lj-muted)' }}>{step.views} views</span>
                      <span style={{ color: 'var(--lj-success)' }}>{step.completes} done</span>
                      {step.abandons > 0 && <span style={{ color: 'var(--lj-danger)' }}>{step.abandons} left</span>}
                      {step.avg_time_sec > 0 && <span style={{ color: '#8B5CF6' }}>{step.avg_time_sec}s</span>}
                      <span className="font-semibold" style={{ color: step.drop_rate > 30 ? 'var(--lj-danger)' : 'var(--lj-muted)' }}>{step.drop_rate}% drop</span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-[5px]">
                    <div className="flex-1 rounded-full" style={{ background: '#EDEDEB' }}>
                      <div className="h-full rounded-full" style={{ width: `${pctW}%`, background: 'var(--lj-accent)', transition: 'width 500ms' }} />
                    </div>
                    <div className="w-16 rounded-full" style={{ background: '#EDEDEB' }}>
                      <div className="h-full rounded-full" style={{ width: `${pctC}%`, background: 'var(--lj-success)', transition: 'width 500ms' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
      <SectionCard title="Top-Level Funnel Events">
        {!data.funnel || Object.keys(data.funnel).length === 0 ? (
          <p className="text-[13px] py-4 text-center" style={{ color: 'var(--lj-muted)' }}>No funnel events recorded</p>
        ) : (
          <BarChart
            data={[
              { name: 'Landing Views', count: data.funnel['tlj_landing_view']?.count || 0 },
              { name: 'Session Start', count: data.funnel['tlj_session_start']?.count || 0 },
              { name: 'Wizard Start', count: data.funnel['tlj_wizard_start']?.count || 0 },
              { name: 'Value Reveal', count: data.funnel['tlj_value_reveal_view']?.count || 0 },
              { name: 'Submit Attempt', count: data.funnel['tlj_contact_submit_attempt']?.count || 0 },
              { name: 'Lead Created', count: data.funnel['tlj_lead_created']?.count || 0 },
            ].filter(d => d.count > 0)}
            labelKey="name" valueKey="count"
          />
        )}
      </SectionCard>
    </div>
  );
}

function FrictionTab({ data }) {
  if (!data) return null;
  return (
    <div data-testid="friction-tab" className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Top Abandon Steps">
          {data.abandon_by_step?.length > 0 ? (
            <BarChart data={data.abandon_by_step.map(a => ({ name: a.step.replace(/_/g, ' '), count: a.count }))} labelKey="name" valueKey="count" color="var(--lj-danger)" />
          ) : (
            <p className="text-[13px] py-4 text-center" style={{ color: 'var(--lj-muted)' }}>No abandon data yet</p>
          )}
        </SectionCard>
        <SectionCard title="Slowest Steps (avg seconds)">
          {data.slowest_steps?.length > 0 ? (
            <BarChart data={data.slowest_steps.map(s => ({ name: s.step.replace(/_/g, ' '), count: s.avg_time_sec }))} labelKey="name" valueKey="count" color="#8B5CF6" />
          ) : (
            <p className="text-[13px] py-4 text-center" style={{ color: 'var(--lj-muted)' }}>No timing data yet</p>
          )}
        </SectionCard>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Field Errors">
          <DataTable
            headers={['Field', 'Error', 'Count']}
            rows={(data.field_errors || []).map(f => [f.field.replace(/_/g, ' '), f.error, f.count])}
            emptyText="No field errors recorded"
          />
        </SectionCard>
        <SectionCard title="Back-Button Navigation">
          {data.back_navigation?.length > 0 ? (
            <BarChart data={data.back_navigation.map(b => ({ name: b.from_step.replace(/_/g, ' '), count: b.count }))} labelKey="name" valueKey="count" color="#D97706" />
          ) : (
            <p className="text-[13px] py-4 text-center" style={{ color: 'var(--lj-muted)' }}>No back-navigation data yet</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function QualityTab({ data }) {
  if (!data) return null;
  return (
    <div data-testid="quality-tab" className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-4">
        {(data.intent_breakdown || []).map(bucket => {
          const colors = { high: 'var(--lj-success)', medium: '#D97706', low: 'var(--lj-danger)', unscored: 'var(--lj-muted)' };
          return (
            <div key={bucket.bucket} className="p-4 rounded-[14px] flex items-center gap-4" style={{ background: 'var(--lj-surface)', border: '1px solid var(--lj-border)' }}>
              <div className="relative flex items-center justify-center">
                <ProgressRing value={bucket.avg_score} color={colors[bucket.bucket] || 'var(--lj-accent)'} />
                <span className="absolute text-[13px] font-bold" style={{ color: 'var(--lj-text)' }}>{Math.round(bucket.avg_score)}</span>
              </div>
              <div>
                <p className="text-[14px] font-semibold capitalize" style={{ color: 'var(--lj-text)' }}>{bucket.bucket}</p>
                <p className="text-[12px]" style={{ color: 'var(--lj-muted)' }}>{bucket.count} leads</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Quality by Source">
          <DataTable
            headers={['Source', 'Leads', 'Avg Score', 'High Intent']}
            rows={(data.quality_by_source || []).map(s => [
              s.source,
              s.count,
              <span key="score" className="font-semibold" style={{ color: s.avg_score >= 70 ? 'var(--lj-success)' : s.avg_score >= 45 ? '#D97706' : 'var(--lj-danger)' }}>{s.avg_score}</span>,
              s.high_intent
            ])}
            emptyText="No source quality data"
          />
        </SectionCard>
        <SectionCard title="Quality Flags">
          {data.quality_flags?.length > 0 ? (
            <BarChart data={data.quality_flags.map(f => ({ name: f.flag.replace(/_/g, ' '), count: f.count }))} labelKey="name" valueKey="count" color="var(--lj-success)" />
          ) : (
            <p className="text-[13px] py-4 text-center" style={{ color: 'var(--lj-muted)' }}>No quality flags data</p>
          )}
        </SectionCard>
      </div>
      <SectionCard title="Score Distribution">
        {data.score_distribution?.length > 0 ? (
          <BarChart data={data.score_distribution.map(s => ({ name: s.range, count: s.count }))} labelKey="name" valueKey="count" color="var(--lj-accent)" />
        ) : (
          <p className="text-[13px] py-4 text-center" style={{ color: 'var(--lj-muted)' }}>No score distribution data</p>
        )}
      </SectionCard>
    </div>
  );
}

function SourcesTab({ data }) {
  if (!data) return null;
  return (
    <div data-testid="sources-tab" className="space-y-6">
      <SectionCard title="Source / Medium Breakdown">
        <DataTable
          headers={['Source / Medium', 'Leads', 'Avg Score', 'High Intent']}
          rows={(data.sources || []).map(s => [
            `${s.source} / ${s.medium}`,
            s.count,
            <span key="score" className="font-semibold" style={{ color: s.avg_score >= 70 ? 'var(--lj-success)' : 'var(--lj-muted)' }}>{s.avg_score}</span>,
            s.high_intent
          ])}
          emptyText="No attribution data yet. Leads from UTM-tagged links will appear here."
        />
      </SectionCard>
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Campaigns">
          <DataTable
            headers={['Campaign', 'Leads', 'Avg Score']}
            rows={(data.campaigns || []).map(c => [c.campaign, c.count, c.avg_score])}
            emptyText="No campaign data"
          />
        </SectionCard>
        <SectionCard title="Top Referrers">
          {data.referrers?.length > 0 ? (
            <BarChart data={data.referrers.map(r => ({ name: new URL(r.url).hostname || r.url, count: r.count }))} labelKey="name" valueKey="count" />
          ) : (
            <p className="text-[13px] py-4 text-center" style={{ color: 'var(--lj-muted)' }}>No referrer data</p>
          )}
        </SectionCard>
      </div>
      <SectionCard title="Landing Pages">
        <DataTable
          headers={['Landing Page', 'Sessions']}
          rows={(data.landing_pages || []).map(l => {
            try { return [new URL(l.url).pathname, l.count]; } catch { return [l.url, l.count]; }
          })}
          emptyText="No landing page data"
        />
      </SectionCard>
    </div>
  );
}

function GeoTab({ data }) {
  if (!data) return null;
  return (
    <div data-testid="geo-tab" className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Countries (by events)">
          {data.countries?.length > 0 ? (
            <BarChart data={data.countries.map(c => ({ name: c.country, count: c.sessions }))} labelKey="name" valueKey="count" />
          ) : (
            <p className="text-[13px] py-4 text-center" style={{ color: 'var(--lj-muted)' }}>No geo data yet. IP-based geo resolution enriches events automatically.</p>
          )}
        </SectionCard>
        <SectionCard title="Cities (by sessions)">
          <DataTable
            headers={['City', 'Region', 'Country', 'Sessions']}
            rows={(data.cities || []).map(c => [c.city, c.region, c.country, c.sessions])}
            emptyText="No city data"
          />
        </SectionCard>
      </div>
      <SectionCard title="Timezones">
        <DataTable
          headers={['Timezone', 'Events']}
          rows={(data.timezones || []).map(t => [t.timezone, t.events])}
          emptyText="No timezone data"
        />
      </SectionCard>
    </div>
  );
}

function DevicesTab({ data }) {
  if (!data) return null;
  return (
    <div data-testid="devices-tab" className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-4">
        <SectionCard title="Device Type">
          {data.devices?.length > 0 ? (
            <BarChart data={data.devices.map(d => ({ name: d.device, count: d.sessions }))} labelKey="name" valueKey="count" />
          ) : (
            <p className="text-[13px] py-4 text-center" style={{ color: 'var(--lj-muted)' }}>No device data yet</p>
          )}
        </SectionCard>
        <SectionCard title="Browsers">
          {data.browsers?.length > 0 ? (
            <BarChart data={data.browsers.map(b => ({ name: b.browser, count: b.sessions }))} labelKey="name" valueKey="count" color="var(--lj-accent-2)" />
          ) : (
            <p className="text-[13px] py-4 text-center" style={{ color: 'var(--lj-muted)' }}>No browser data yet</p>
          )}
        </SectionCard>
        <SectionCard title="Operating Systems">
          {data.os?.length > 0 ? (
            <BarChart data={data.os.map(o => ({ name: o.os, count: o.sessions }))} labelKey="name" valueKey="count" color="#8B5CF6" />
          ) : (
            <p className="text-[13px] py-4 text-center" style={{ color: 'var(--lj-muted)' }}>No OS data yet</p>
          )}
        </SectionCard>
      </div>
      <SectionCard title="Viewport Sizes">
        <DataTable
          headers={['Viewport', 'Events']}
          rows={(data.viewports || []).map(v => [v.viewport, v.count])}
          emptyText="No viewport data"
        />
      </SectionCard>
    </div>
  );
}

function VisitorsTab({ data }) {
  if (!data) return null;
  const types = data.visitor_types || {};
  return (
    <div data-testid="visitors-tab" className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="New vs Returning">
          <div className="flex items-center gap-8 py-2">
            {['new', 'returning'].map(type => (
              <div key={type} className="text-center">
                <p className="text-[28px] font-bold" style={{ color: 'var(--lj-text)' }}>{types[type]?.sessions || 0}</p>
                <p className="text-[12px] capitalize" style={{ color: 'var(--lj-muted)' }}>{type} sessions</p>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Session Depth (events/session)">
          {data.session_depth?.length > 0 ? (
            <BarChart data={data.session_depth.map(d => ({ name: d.range + ' events', count: d.count }))} labelKey="name" valueKey="count" color="#D97706" />
          ) : (
            <p className="text-[13px] py-4 text-center" style={{ color: 'var(--lj-muted)' }}>No session depth data</p>
          )}
        </SectionCard>
      </div>
      <SectionCard title="Daily Unique Visitors">
        {data.daily_visitors?.length > 0 ? (
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {data.daily_visitors.slice(-14).map(d => (
              <div key={d.date} className="flex items-center gap-3 py-1.5">
                <span className="text-[12px] w-24 shrink-0 tabular-nums" style={{ color: 'var(--lj-muted)' }}>{d.date}</span>
                <div className="flex-1 h-[6px] rounded-full" style={{ background: '#EDEDEB' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.max((d.unique / Math.max(...data.daily_visitors.map(x => x.unique), 1)) * 100, 2)}%`, background: 'var(--lj-accent)', transition: 'width 500ms' }} />
                </div>
                <span className="text-[12px] w-16 text-right tabular-nums font-medium" style={{ color: 'var(--lj-text)' }}>{d.unique} / {d.sessions}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] py-4 text-center" style={{ color: 'var(--lj-muted)' }}>No visitor data yet</p>
        )}
      </SectionCard>
    </div>
  );
}

function TrendsTab({ data }) {
  if (!data) return null;
  return (
    <div data-testid="trends-tab" className="space-y-6">
      <SectionCard title="Daily Trends">
        {data.daily?.length > 0 ? (
          <div className="space-y-1 max-h-[350px] overflow-y-auto">
            <div className="flex items-center gap-3 py-1 text-[11px] font-medium" style={{ color: 'var(--lj-muted)' }}>
              <span className="w-24 shrink-0">Date</span>
              <span className="flex-1">Sessions</span>
              <span className="w-20 text-right">Starts</span>
              <span className="w-20 text-right">Leads</span>
            </div>
            {data.daily.map(d => {
              const maxS = Math.max(...data.daily.map(x => x.sessions), 1);
              return (
                <div key={d.date} className="flex items-center gap-3 py-1.5">
                  <span className="text-[12px] w-24 shrink-0 tabular-nums" style={{ color: 'var(--lj-muted)' }}>{d.date.slice(5)}</span>
                  <div className="flex-1 h-[6px] rounded-full" style={{ background: '#EDEDEB' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.max((d.sessions / maxS) * 100, 1)}%`, background: 'var(--lj-accent)' }} />
                  </div>
                  <span className="text-[12px] w-20 text-right tabular-nums" style={{ color: 'var(--lj-accent-2)' }}>{d.wizard_starts}</span>
                  <span className="text-[12px] w-20 text-right tabular-nums font-semibold" style={{ color: 'var(--lj-success)' }}>{d.leads}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[13px] py-4 text-center" style={{ color: 'var(--lj-muted)' }}>No daily trend data yet</p>
        )}
      </SectionCard>
      <SectionCard title="Hourly Heatmap">
        {data.hourly?.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[auto_repeat(24,1fr)] gap-[2px] min-w-[600px]">
              <div />
              {Array.from({length: 24}, (_, i) => (
                <div key={i} className="text-[10px] text-center py-1" style={{ color: 'var(--lj-muted)' }}>{i}</div>
              ))}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, di) => (
                <React.Fragment key={day}>
                  <div className="text-[11px] pr-2 flex items-center" style={{ color: 'var(--lj-muted)' }}>{day}</div>
                  {Array.from({length: 24}, (_, hi) => {
                    const cell = data.hourly.find(h => h.dow === di + 1 && h.hour === hi);
                    const val = cell ? cell.sessions : 0;
                    const maxHourly = Math.max(...data.hourly.map(h => h.sessions), 1);
                    const intensity = val / maxHourly;
                    return (
                      <div key={hi} className="w-full aspect-square rounded-[3px] flex items-center justify-center"
                        style={{ background: val > 0 ? `rgba(15,94,76,${0.1 + intensity * 0.8})` : '#F5F5F3' }}
                        title={`${day} ${hi}:00 — ${val} sessions`}>
                        {val > 0 && <span className="text-[8px] font-bold" style={{ color: intensity > 0.5 ? '#fff' : 'var(--lj-text)' }}>{val}</span>}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[13px] py-4 text-center" style={{ color: 'var(--lj-muted)' }}>No hourly data yet</p>
        )}
      </SectionCard>
    </div>
  );
}

function EventsHealthTab({ data }) {
  if (!data) return null;
  return (
    <div data-testid="health-tab" className="space-y-4">
      <SectionCard title="Event Coverage & Health">
        <div className="space-y-1">
          {(data.events || []).map(evt => {
            const StatusIcon = evt.status === 'healthy' ? CheckCircle : evt.status === 'stale' ? AlertCircle : XCircle;
            const statusColor = evt.status === 'healthy' ? 'var(--lj-success)' : evt.status === 'stale' ? '#D97706' : 'var(--lj-danger)';
            return (
              <div key={evt.event} className="flex items-center gap-3 py-2 px-3 rounded-[10px] hover:bg-[#EDEDEB]/50 transition-colors" style={{ borderBottom: '1px solid var(--lj-border)' }}>
                <StatusIcon size={16} style={{ color: statusColor }} />
                <span className="text-[13px] font-mono flex-1" style={{ color: 'var(--lj-text)' }}>{evt.event}</span>
                <span className="text-[12px] tabular-nums" style={{ color: 'var(--lj-muted)' }}>{evt.total_count.toLocaleString()} total</span>
                <span className="text-[12px] tabular-nums" style={{ color: 'var(--lj-muted)' }}>{evt.last_7d_count} (7d)</span>
                <span className="text-[11px] tabular-nums w-36 text-right" style={{ color: statusColor }}>
                  {evt.last_seen === 'never' ? 'Never fired' : evt.last_seen.replace('T', ' ').slice(0, 19)}
                </span>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

function LeadOpsTab({ data }) {
  if (!data) return null;
  const buckets = data.aging_buckets || {};
  const bucketConfig = [
    { key: 'critical_48h', label: 'Critical (48h+)', color: 'var(--lj-danger)', icon: AlertTriangle },
    { key: 'urgent_24h', label: 'Urgent (24h+)', color: '#D97706', icon: Clock },
    { key: 'aging_12h', label: 'Aging (12h+)', color: '#3B82F6', icon: Eye },
    { key: 'fresh', label: 'Fresh', color: 'var(--lj-success)', icon: CheckCircle },
  ];
  return (
    <div data-testid="ops-tab" className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {bucketConfig.map(b => (
          <MetricCard key={b.key} label={b.label} value={(buckets[b.key] || []).length} icon={b.icon} color={b.color} />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-3">
        <MetricCard label="Total Uncontacted" value={data.total_uncontacted || 0} icon={Users} color="var(--lj-danger)" />
        <MetricCard label="High-Intent Uncontacted" value={data.high_intent_uncontacted || 0} icon={Target} color="#D97706" />
      </div>
      {(buckets.critical_48h?.length > 0 || buckets.urgent_24h?.length > 0) && (
        <SectionCard title="Priority Queue">
          <DataTable
            headers={['Name', 'Product', 'Score', 'Age (hrs)', 'Status']}
            rows={[...(buckets.critical_48h || []), ...(buckets.urgent_24h || [])].slice(0, 15).map(l => [
              l.first_name,
              (l.product_type || '').replace(/_/g, ' '),
              <span key="s" className="font-semibold" style={{ color: l.lead_score >= 70 ? 'var(--lj-success)' : l.lead_score >= 45 ? '#D97706' : 'var(--lj-danger)' }}>{l.lead_score}</span>,
              l.age_hours,
              <span key="st" className="capitalize text-[11px] px-2 py-0.5 rounded-full" style={{ background: l.status === 'new' ? '#3B82F620' : '#8B5CF620', color: l.status === 'new' ? '#3B82F6' : '#8B5CF6' }}>{l.status}</span>
            ])}
          />
        </SectionCard>
      )}
    </div>
  );
}

function InsightsTab({ data }) {
  if (!data) return null;
  const typeConfig = {
    critical: { color: 'var(--lj-danger)', bg: 'rgba(220,53,69,0.06)', icon: AlertTriangle },
    warning: { color: '#D97706', bg: 'rgba(217,119,6,0.06)', icon: AlertCircle },
    info: { color: '#3B82F6', bg: 'rgba(59,130,246,0.06)', icon: Eye },
    success: { color: 'var(--lj-success)', bg: 'rgba(22,163,74,0.06)', icon: CheckCircle },
  };
  return (
    <div data-testid="insights-tab" className="space-y-4">
      {(!data.insights || data.insights.length === 0) ? (
        <SectionCard title="Smart Insights">
          <div className="py-8 text-center">
            <Lightbulb size={32} style={{ color: 'var(--lj-muted)', margin: '0 auto 12px' }} />
            <p className="text-[14px] font-medium" style={{ color: 'var(--lj-text)' }}>No insights yet</p>
            <p className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>Insights will appear as more data flows in from wizard interactions.</p>
          </div>
        </SectionCard>
      ) : (
        data.insights.map((insight, i) => {
          const cfg = typeConfig[insight.type] || typeConfig.info;
          const InsightIcon = cfg.icon;
          return (
            <div key={i} className="p-4 rounded-[14px] flex items-start gap-4" style={{ background: cfg.bg, border: `1px solid ${cfg.color}20` }}>
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: `${cfg.color}15` }}>
                <InsightIcon size={18} style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--lj-text)' }}>{insight.title}</span>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: `${cfg.color}15`, color: cfg.color }}>{insight.category}</span>
                </div>
                <p className="text-[13px]" style={{ color: 'var(--lj-muted)' }}>{insight.message}</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Main Dashboard Component ─────────────────────────────────

export default function AnalyticsDashboard() {
  const { api } = useAdmin();
  const [activeTab, setActiveTab] = useState('executive');
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({});

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    
    try {
      const params = `?days=${days}`;
      const safeGet = async (url) => {
        try { return (await api('get', url)).data; } catch { return null; }
      };
      const [exec, funnel, friction, quality, sources, geo, devices, visitors, trends, health, ops, insights] = await Promise.all([
        safeGet(`/api/admin/analytics/executive${params}`),
        safeGet(`/api/admin/analytics/funnel${params}`),
        safeGet(`/api/admin/analytics/friction${params}`),
        safeGet(`/api/admin/analytics/quality${params}`),
        safeGet(`/api/admin/analytics/sources${params}`),
        safeGet(`/api/admin/analytics/geo${params}`),
        safeGet(`/api/admin/analytics/devices${params}`),
        safeGet(`/api/admin/analytics/visitors${params}`),
        safeGet(`/api/admin/analytics/trends${params}`),
        safeGet('/api/admin/analytics/events-health'),
        safeGet('/api/admin/analytics/lead-ops'),
        safeGet(`/api/admin/analytics/smart-insights${params}`),
      ]);
      setData({
        executive: exec,
        funnel: funnel,
        friction: friction,
        quality: quality,
        sources: sources,
        geo: geo,
        devices: devices,
        visitors: visitors,
        trends: trends,
        health: health,
        ops: ops,
        insights: insights,
      });
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const renderTab = () => {
    switch (activeTab) {
      case 'executive': return <ExecutiveTab data={data.executive} />;
      case 'funnel': return <FunnelTab data={data.funnel} />;
      case 'friction': return <FrictionTab data={data.friction} />;
      case 'quality': return <QualityTab data={data.quality} />;
      case 'sources': return <SourcesTab data={data.sources} />;
      case 'geo': return <GeoTab data={data.geo} />;
      case 'devices': return <DevicesTab data={data.devices} />;
      case 'visitors': return <VisitorsTab data={data.visitors} />;
      case 'trends': return <TrendsTab data={data.trends} />;
      case 'health': return <EventsHealthTab data={data.health} />;
      case 'ops': return <LeadOpsTab data={data.ops} />;
      case 'insights': return <InsightsTab data={data.insights} />;
      default: return null;
    }
  };

  return (
    <div data-testid="analytics-dashboard" className="max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[24px] font-bold" style={{ color: 'var(--lj-text)' }}>Analytics Intelligence</h1>
        <div className="flex items-center gap-2">
          {/* Date presets */}
          <div className="flex rounded-[10px] overflow-hidden" style={{ border: '1px solid var(--lj-border)' }}>
            {DATE_PRESETS.map(preset => (
              <button
                key={preset.days}
                data-testid={`date-preset-${preset.label.toLowerCase()}`}
                onClick={() => setDays(preset.days)}
                className="px-3 py-1.5 text-[12px] font-medium transition-colors duration-150"
                style={{
                  background: days === preset.days ? 'var(--lj-accent)' : 'transparent',
                  color: days === preset.days ? '#fff' : 'var(--lj-muted)',
                  borderRight: '1px solid var(--lj-border)',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <button
            data-testid="refresh-analytics"
            onClick={() => fetchData(false)}
            className="w-8 h-8 flex items-center justify-center rounded-[10px] transition-colors duration-150 hover:bg-[#EDEDEB]"
            style={{ border: '1px solid var(--lj-border)' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} style={{ color: 'var(--lj-muted)' }} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 overflow-x-auto scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex gap-1 min-w-max pb-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              data-testid={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-medium transition-all duration-200 whitespace-nowrap"
              style={{
                background: activeTab === tab.id ? 'var(--lj-accent)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--lj-muted)',
              }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--lj-accent)' }} />
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          {renderTab()}
        </div>
      )}
    </div>
  );
}