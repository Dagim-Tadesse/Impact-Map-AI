import React from 'react';
import { X, Users, Clock, AlertTriangle, ShieldAlert, Compass } from 'lucide-react';
import { useAppStore } from '../state/useAppStore';
import { useResultSummaryQuery } from '../api/hooks';
import { ProbabilityBar } from './ProbabilityBar';
import { QualityFlag } from './QualityFlag';
import { formatMinutes, formatPeople, formatDistance } from '../lib/format';

export const CommunityCard: React.FC = () => {
  const {
    selectedCommunityId,
    setSelectedCommunityId,
    currentCacheKey,
  } = useAppStore();

  const { data: resultSummary } = useResultSummaryQuery(currentCacheKey);

  if (!selectedCommunityId) return null;

  const comm = resultSummary?.top_communities?.find(
    (c: any) => c.community_id === selectedCommunityId
  );

  const name = comm?.name || selectedCommunityId;
  const people = comm?.people_est ?? 1200;
  const pCutOff = comm?.p_cut_off ?? 0.65;
  const pDegraded = comm?.p_degraded ?? 0.20;
  const baseMinutes = comm?.baseline_minutes ?? 45;
  const expMinutes = comm?.expected_minutes ?? 110;
  const snapDist = comm?.snap_distance_m ?? 120;
  const isPoorBaseline = comm?.poor_baseline_access ?? false;
  const qualityFlag = comm?.quality_flag ?? 'ok';

  return (
    <div className="fixed inset-x-0 bottom-0 top-auto sm:inset-x-auto sm:top-20 sm:bottom-auto sm:right-4 w-full sm:w-96 glass-panel-elevated rounded-t-2xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_24px_80px_rgba(0,0,0,0.85)] border-t sm:border border-white/15 z-40 flex flex-col animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
              Settlement
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {selectedCommunityId}
            </span>
          </div>
          <h3 className="text-base font-extrabold text-white leading-tight">{name}</h3>
        </div>

        <button
          onClick={() => {
            setSelectedCommunityId(null);
          }}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="Close Settlement Card"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="py-3.5 space-y-3.5 text-xs">
        {/* Cut-off Probability */}
        <div className="glass-panel p-3 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">
              Cut-Off Risk
            </span>
            <span className="font-mono font-bold text-rose-400 text-sm">
              {(pCutOff * 100).toFixed(0)}%
            </span>
          </div>
          <ProbabilityBar prob={pCutOff} />
        </div>

        {/* Population & Travel Time Grid */}
        <div className="grid grid-cols-2 gap-2 glass-panel p-3 rounded-xl border border-white/10 font-mono">
          <div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
              <Users className="w-3 h-3 text-cyan-400" />
              <span>Population Est.</span>
            </div>
            <div className="text-xs font-bold text-slate-100">
              {formatPeople(people)}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Base Travel</span>
            </div>
            <div className="text-xs font-bold text-slate-100">
              {formatMinutes(baseMinutes)}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400">Degraded Access</div>
            <div className="text-xs font-bold text-amber-300">
              {(pDegraded * 100).toFixed(0)}%
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400">Flood Travel Est.</div>
            <div className="text-xs font-bold text-rose-300">
              {formatMinutes(expMinutes)}
            </div>
          </div>
        </div>

        {/* Poor Baseline Access Note */}
        {isPoorBaseline && (
          <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/30 text-purple-200 text-xs flex items-start gap-2">
            <Clock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              This community already has travel times over 120 min to a hospital under normal conditions.
            </p>
          </div>
        )}

        {/* Snapping & Data Quality */}
        <div className="text-[10px] text-slate-400 font-mono space-y-1 border-t border-white/5 pt-2 flex items-center justify-between">
          <div>Snap distance: {formatDistance(snapDist)}</div>
          <QualityFlag flag={qualityFlag} />
        </div>
      </div>
    </div>
  );
};
