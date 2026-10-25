import React from 'react';
import { X, Sliders, AlertTriangle, ShieldCheck, Play, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../state/useAppStore';
import { useWhatIfMutation, type WhatIfInput } from '../api/hooks';

export const WhatIfBasket: React.FC = () => {
  const { t } = useTranslation();
  const {
    whatIf,
    removeForcedClosed,
    removeForcedOpen,
    clearWhatIf,
    currentCacheKey,
    setCurrentCacheKey,
    setBaseCacheKey,
    setActiveTab,
    drawerOpen,
    setDrawerOpen,
  } = useAppStore();

  const whatIfMutation = useWhatIfMutation();

  const totalOverrides = whatIf.forced_closed.length + whatIf.forced_open.length;

  if (totalOverrides === 0 && drawerOpen !== 'whatif') {
    return null;
  }

  const handleApply = async () => {
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
        setDrawerOpen(null);
      }
    } catch (err) {
      console.error('What-if mutation failed:', err);
    }
  };

  return (
    <div className="fixed bottom-20 sm:bottom-24 right-3 sm:right-4 left-3 sm:left-auto sm:w-80 glass-panel-elevated rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/15 z-50 animate-in fade-in slide-in-from-bottom-6 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            {t('whatif.title')} ({totalOverrides})
          </h3>
        </div>

        <button
          onClick={clearWhatIf}
          className="text-[10px] font-mono text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
          title="Clear All Overrides"
        >
          <Trash2 className="w-3 h-3" />
          <span>{t('whatif.clear')}</span>
        </button>
      </div>

      {/* Lists of Overrides */}
      <div className="max-h-48 overflow-y-auto space-y-2 mb-3 text-xs">
        {whatIf.forced_open.length > 0 && (
          <div>
            <div className="text-[10px] font-mono uppercase text-cyan-400 font-semibold mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>{t('whatif.protected_roads')} ({whatIf.forced_open.length})</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {whatIf.forced_open.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[11px]"
                >
                  <span>#{id}</span>
                  <button
                    onClick={() => removeForcedOpen(id)}
                    className="hover:text-white"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {whatIf.forced_closed.length > 0 && (
          <div>
            <div className="text-[10px] font-mono uppercase text-rose-400 font-semibold mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>{t('whatif.forced_closures')} ({whatIf.forced_closed.length})</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {whatIf.forced_closed.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300 font-mono text-[11px]"
                >
                  <span>#{id}</span>
                  <button
                    onClick={() => removeForcedClosed(id)}
                    className="hover:text-white"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Apply Button */}
      <button
        onClick={handleApply}
        disabled={whatIfMutation.isPending || totalOverrides === 0}
        className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-xs shadow-[0_0_16px_rgba(6,182,212,0.3)] transition-all active:scale-98 disabled:opacity-50"
      >
        {whatIfMutation.isPending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{t('whatif.simulating')}</span>
          </>
        ) : (
          <>
            <span>{t('whatif.apply')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </div>
  );
};
