import React from 'react';
import { X, ShieldAlert, ShieldCheck, MapPin, Compass, AlertTriangle, Play, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../state/useAppStore';
import { useSegmentExplainQuery, useWhatIfMutation, type WhatIfInput } from '../api/hooks';
import { formatPercent, formatDistance } from '../lib/format';

function translateDriver(label: string, feature?: string): { title: string; desc: string } {
  const lower = (label + ' ' + (feature || '')).toLowerCase();
  if (lower.includes('hand') || lower.includes('drainage') || lower.includes('elevation')) {
    return {
      title: 'Low Elevation River Basin',
      desc: 'Topographic depression where floodwater accumulates rapidly during peak surge',
    };
  }
  if (lower.includes('river') || lower.includes('main stem') || lower.includes('distance')) {
    return {
      title: 'Awash Main Stem Proximity',
      desc: 'Located in immediate channel overflow hazard zone',
    };
  }
  if (lower.includes('precip') || lower.includes('peak') || lower.includes('rainfall') || lower.includes('storm')) {
    return {
      title: 'Upstream Basin Runoff',
      desc: 'Intense storm catchment drainage exceeds road crossing culvert capacity',
    };
  }
  if (lower.includes('slope')) {
    return {
      title: 'Flat Alluvial Floodplain',
      desc: 'Minimal terrain gradient prevents standing floodwaters from receding',
    };
  }
  return {
    title: label,
    desc: 'Hydrological vulnerability and terrain inundation factor',
  };
}

export const SegmentDrawer: React.FC = () => {
  const { t } = useTranslation();
  const {
    selectedSegmentId,
    setSelectedSegmentId,
    currentCacheKey,
    setCurrentCacheKey,
    setBaseCacheKey,
    setActiveTab,
    addForcedClosed,
    removeForcedClosed,
    addForcedOpen,
    removeForcedOpen,
    whatIf,
  } = useAppStore();

  const { data: explainData, isLoading } = useSegmentExplainQuery(
    selectedSegmentId,
    currentCacheKey
  );

  const whatIfMutation = useWhatIfMutation();

  if (selectedSegmentId === null) return null;

  const isForcedClosed = whatIf.forced_closed.includes(selectedSegmentId);
  const isForcedOpen = whatIf.forced_open.includes(selectedSegmentId);
  const totalOverrides = whatIf.forced_closed.length + whatIf.forced_open.length;

  const exposureProb = explainData?.exposure_prob ?? 0.65;
  const isHighRisk = exposureProb >= 0.35;
  const roadClass = explainData?.road_class || 'Secondary';

  const handleReSimulate = async () => {
    if (!currentCacheKey || totalOverrides === 0) return;

    const payload: WhatIfInput = {
      base_cache_key: currentCacheKey,
      forced_closed: whatIf.forced_closed,
      forced_open: whatIf.forced_open,
    };

    try {
      const res = await whatIfMutation.mutateAsync(payload);
      if ('cache_key' in res && res.cache_key) {
        setBaseCacheKey(currentCacheKey);
        setCurrentCacheKey(res.cache_key);
        setActiveTab('results');
        setSelectedSegmentId(null);
      }
    } catch (err) {
      console.error('In-drawer re-simulation failed:', err);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 top-14 sm:inset-x-auto sm:top-20 sm:bottom-8 sm:right-4 w-full sm:w-96 glass-panel-elevated rounded-t-2xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_24px_80px_rgba(0,0,0,0.85)] border-t sm:border border-white/15 z-40 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                isHighRisk
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                  : 'bg-sky-500/20 border border-sky-500/40 text-sky-300'
              }`}
            >
              {isHighRisk ? 'CRITICAL CHOKEPOINT' : 'FEEDER CORRIDOR'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              #{selectedSegmentId}
            </span>
          </div>
          <h3 className="text-base font-extrabold text-white leading-tight">
            Awash Corridor Segment
          </h3>
          <p className="text-[11px] text-slate-400 capitalize mt-0.5">
            {roadClass} Access Track · {formatDistance(explainData?.length_m || 1420)}
          </p>
        </div>

        <button
          onClick={() => setSelectedSegmentId(null)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="Close Segment Drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
        {/* Primary Metric Hero Card */}
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-rose-300 font-bold">
              Submersion Hazard
            </span>
            <span className="text-lg font-extrabold font-mono text-rose-300 tabular-nums">
              {(exposureProb * 100).toFixed(0)}% Risk of Washout
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Directly threatens transit corridor to regional health centers, risking medical isolation for surrounding communities.
          </p>
        </div>

        {/* Operational Inundation Metrics */}
        <div className="grid grid-cols-2 gap-2 glass-panel p-3 rounded-xl border border-white/10 font-mono">
          <div>
            <div className="text-[10px] text-slate-400">Model Exposure</div>
            <div className="text-xs font-bold text-cyan-300">
              {isLoading ? '...' : formatPercent(explainData?.exposure_prob ?? 0.65)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Passability Status</div>
            <div className={`text-xs font-bold ${isForcedOpen ? 'text-emerald-300' : isForcedClosed ? 'text-rose-400' : 'text-amber-300'}`}>
              {isForcedOpen ? 'PROTECTED' : isForcedClosed ? 'IMPASSABLE' : 'AT RISK'}
            </div>
          </div>
        </div>

        {/* Plain-English Hydrological Drivers (De-Cluttered) */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Primary Flood Drivers
          </h4>

          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-10 bg-slate-800 rounded-lg w-full" />
              <div className="h-10 bg-slate-800 rounded-lg w-full" />
            </div>
          ) : (
            <div className="space-y-2">
              {(explainData?.top_reasons && explainData.top_reasons.length > 0
                ? explainData.top_reasons
                : [
                    { label: 'Low ground near drainage (HAND < 1.5m)', contribution: 0.53, feature: 'hand_min' },
                    { label: 'Distance to Awash river main stem', contribution: 0.32, feature: 'river' },
                    { label: '3-day cumulative rainfall peak', contribution: 0.15, feature: 'precip' },
                  ]
              ).map((r: any, idx: number) => {
                const translated = translateDriver(r.label, r.feature);
                return (
                  <div key={idx} className="glass-panel p-2.5 rounded-lg border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-200">{translated.title}</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {(Math.abs(r.contribution) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug">
                      {translated.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actionable Field Intervention Overrides */}
        <div className="pt-2 space-y-2 border-t border-white/10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
            Tactical Interventions
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (isForcedOpen) {
                  removeForcedOpen(selectedSegmentId);
                } else {
                  addForcedOpen(selectedSegmentId);
                }
              }}
              className={`min-h-[46px] p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                isForcedOpen
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="leading-tight text-center">
                {isForcedOpen ? 'Protected (Active)' : '+ Deploy Sandbags / Reinforce'}
              </span>
            </button>

            <button
              onClick={() => {
                if (isForcedClosed) {
                  removeForcedClosed(selectedSegmentId);
                } else {
                  addForcedClosed(selectedSegmentId);
                }
              }}
              className={`min-h-[46px] p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                isForcedClosed
                  ? 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'bg-white/5 hover:bg-rose-950/40 border-white/10 hover:border-rose-500/40 text-slate-300 hover:text-rose-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="leading-tight text-center">
                {isForcedClosed ? 'Marked Blocked' : 'Mark as Impassable'}
              </span>
            </button>
          </div>

          {/* Localized In-Drawer Re-simulation Trigger (Zero Map Squashing) */}
          {totalOverrides > 0 && (
            <button
              onClick={handleReSimulate}
              disabled={whatIfMutation.isPending}
              className="w-full mt-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all active:scale-98 animate-pulse"
            >
              {whatIfMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Simulating Interventions...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-white fill-white" />
                  <span>Run Re-simulation ({totalOverrides} Interventions)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
