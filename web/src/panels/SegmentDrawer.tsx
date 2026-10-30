import React from 'react';
import { X, ShieldAlert, ShieldCheck, MapPin, Compass, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../state/useAppStore';
import { useSegmentExplainQuery } from '../api/hooks';
import { formatPercent, formatDistance } from '../lib/format';

export const SegmentDrawer: React.FC = () => {
  const { t } = useTranslation();
  const {
    selectedSegmentId,
    setSelectedSegmentId,
    currentCacheKey,
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

  if (selectedSegmentId === null) return null;

  const isForcedClosed = whatIf.forced_closed.includes(selectedSegmentId);
  const isForcedOpen = whatIf.forced_open.includes(selectedSegmentId);

  return (
    <div className="fixed inset-x-0 bottom-0 top-14 sm:inset-x-auto sm:top-20 sm:bottom-8 sm:right-4 w-full sm:w-96 glass-panel-elevated rounded-t-2xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_24px_80px_rgba(0,0,0,0.85)] border-t sm:border border-white/15 z-40 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/40 text-sky-300 font-bold">
              {t('segment_drawer.badge')}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              #{selectedSegmentId}
            </span>
          </div>
          <h3 className="text-base font-extrabold text-white leading-tight">
            {explainData?.name || `${t('segment_drawer.badge')} #${selectedSegmentId}`}
          </h3>
        </div>

        <button
          onClick={() => {
            setSelectedSegmentId(null);
          }}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="Close Segment Drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
        {/* Core Attributes */}
        <div className="grid grid-cols-2 gap-2 glass-panel p-3 rounded-xl border border-white/10 font-mono">
          <div>
            <div className="text-[10px] text-slate-400">{t('segment_drawer.class')}</div>
            <div className="text-xs font-bold text-slate-100 uppercase">
              {explainData?.road_class || 'primary'}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400">{t('segment_drawer.length')}</div>
            <div className="text-xs font-bold text-slate-100">
              {formatDistance(explainData?.length_m || 1420)}
            </div>
          </div>
        </div>

        {/* Inundation vs Assumed Closure */}
        <div className="glass-panel p-3.5 rounded-xl border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">{t('segment_drawer.exposure_prob')}</span>
            <span className="font-mono font-bold text-cyan-400">
              {isLoading ? (
                <span className="text-slate-400 text-xs">...</span>
              ) : (
                formatPercent(explainData?.exposure_prob ?? 0.0)
              )}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-slate-300">{t('segment_drawer.closure_prob')}</span>
            <span className="font-mono font-bold text-amber-400">
              {isLoading ? (
                <span className="text-slate-400 text-xs">...</span>
              ) : (
                formatPercent(explainData?.closure_prob ?? 0.0)
              )}
            </span>
          </div>
        </div>

        {/* Feature Contribution Reasons (SHAP/Terrain Factors) */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            {t('segment_drawer.top_factors')}
          </h4>

          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-800 rounded w-4/5" />
            </div>
          ) : explainData?.top_reasons ? (
            <div className="space-y-2">
              {explainData.top_reasons.map((r: any, idx: number) => (
                <div key={idx} className="glass-panel p-2.5 rounded-lg border border-white/5">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-200">{r.label}</span>
                    <span className="font-mono text-cyan-300">
                      {(r.contribution * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.abs(r.contribution) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 text-slate-400 text-xs">
              <p>• {t('segment_drawer.factor_precip')}</p>
              <p>• {t('segment_drawer.factor_hand')}</p>
            </div>
          )}
        </div>

        {/* What-If Action Buttons */}
        <div className="pt-2 space-y-2 border-t border-white/10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
            {t('segment_drawer.overrides_title')}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (isForcedClosed) {
                  removeForcedClosed(selectedSegmentId);
                } else {
                  addForcedClosed(selectedSegmentId);
                }
              }}
              className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isForcedClosed
                  ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                  : 'bg-white/5 hover:bg-rose-950/40 border-white/10 hover:border-rose-500/40 text-slate-300 hover:text-rose-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{isForcedClosed ? t('segment_drawer.remove_closed') : t('segment_drawer.assume_closed')}</span>
            </button>

            <button
              onClick={() => {
                if (isForcedOpen) {
                  removeForcedOpen(selectedSegmentId);
                } else {
                  addForcedOpen(selectedSegmentId);
                }
              }}
              className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isForcedOpen
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'bg-white/5 hover:bg-cyan-950/40 border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isForcedOpen ? t('segment_drawer.remove_protected') : t('segment_drawer.assume_open')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
