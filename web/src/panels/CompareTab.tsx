import React, { useState, useEffect } from 'react';
import { GitCompare, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useCompareQuery, useLibraryQuery } from '../api/hooks';
import { useAppStore } from '../state/useAppStore';
import { useTranslation } from 'react-i18next';

export const CompareTab: React.FC = () => {
  const { t } = useTranslation();
  const {
    currentCacheKey,
    baseCacheKey,
    comparePair,
    setCurrentCacheKey,
    setSelectedFacilityId,
    setDrawerOpen,
  } = useAppStore();
  const { data: libraryScenarios } = useLibraryQuery();

  const [scenarioA, setScenarioA] = useState<string>(comparePair.a || baseCacheKey || 'baseline-dry');
  const [scenarioB, setScenarioB] = useState<string>(comparePair.b || currentCacheKey || 'awash-2020-replay');

  useEffect(() => {
    if (comparePair.a) setScenarioA(comparePair.a);
    if (comparePair.b) setScenarioB(comparePair.b);
  }, [comparePair]);

  const { data: compareData, isLoading } = useCompareQuery(scenarioA, scenarioB);

  // Dynamic scenario options
  const scenarioOptions = [
    { value: 'baseline-dry', label: 'Baseline (Dry Weather)' },
    ...(libraryScenarios || [])
      .filter((s: any) => s.slug !== 'baseline-dry')
      .map((s: any) => ({ value: s.slug, label: s.title })),
    ...(baseCacheKey && baseCacheKey !== 'baseline-dry'
      ? [{ value: baseCacheKey, label: `Original Baseline (${baseCacheKey.slice(0, 8)})` }]
      : []),
    ...(currentCacheKey && currentCacheKey !== 'baseline-dry' && currentCacheKey !== baseCacheKey
      ? [{ value: currentCacheKey, label: `Active Simulation (${currentCacheKey.slice(0, 8)})` }]
      : []),
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            {t('compare.title')}
          </h2>
        </div>
        <span className="text-[10px] font-mono text-slate-400">{t('compare.subtitle')}</span>
      </div>

      {/* Selectors for A and B */}
      <div className="grid grid-cols-2 gap-3 glass-panel p-4 rounded-2xl border border-white/10">
        <div>
          <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
            {t('compare.scenario_a')}
          </label>
          <select
            value={scenarioA}
            onChange={(e) => setScenarioA(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            {scenarioOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-mono uppercase text-cyan-400 block mb-1">
            {t('compare.scenario_b')}
          </label>
          <select
            value={scenarioB}
            onChange={(e) => setScenarioB(e.target.value)}
            className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl p-2.5 text-xs text-cyan-200 focus:outline-none focus:border-cyan-400"
          >
            {scenarioOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Differential Region Totals Table */}
      {compareData ? (
        <div className="space-y-4">
          {/* Quick Map Synchronizer */}
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">{t('compare.active_map')}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentCacheKey(scenarioA);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  currentCacheKey === scenarioA
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                }`}
              >
                Map A
              </button>
              <button
                onClick={() => {
                  setCurrentCacheKey(scenarioB);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  currentCacheKey === scenarioB
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                }`}
              >
                Map B
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
            <div className="px-3.5 py-2.5 bg-white/[0.02] border-b border-white/10 text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Regional Differential Matrix</span>
              <span className="text-[10px] font-mono text-cyan-400">Δ = B - A</span>
            </div>

            <div className="p-3.5 space-y-4 text-xs">
              {/* Metric 1: People Cut Off */}
              <div className="space-y-1.5 pb-3 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Cut Off Population</span>
                  <span
                    className={`font-mono font-bold ${
                      compareData.people_cut_off_delta > 0
                        ? 'text-rose-400'
                        : compareData.people_cut_off_delta < 0
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {compareData.people_cut_off_delta > 0 ? '+' : ''}
                    {Math.round(compareData.people_cut_off_delta).toLocaleString()} people
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                  <div className="bg-white/[0.02] p-1.5 rounded-lg">
                    <div className="text-[9px] text-slate-400">Scenario A</div>
                    <div className="font-bold text-slate-200">
                      {Math.round(compareData.region_totals_a?.people_cut_off?.mean || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center justify-center text-slate-500 text-xs">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-cyan-950/30 border border-cyan-500/20 p-1.5 rounded-lg">
                    <div className="text-[9px] text-cyan-400">Scenario B</div>
                    <div className="font-bold text-cyan-200">
                      {Math.round(compareData.region_totals_b?.people_cut_off?.mean || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metric 2: People Degraded */}
              <div className="space-y-1.5 pb-3 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Degraded Access (&gt;2x Time)</span>
                  <span
                    className={`font-mono font-bold ${
                      (compareData.region_totals_b?.people_degraded?.mean || 0) -
                        (compareData.region_totals_a?.people_degraded?.mean || 0) >
                      0
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {(
                      (compareData.region_totals_b?.people_degraded?.mean || 0) -
                      (compareData.region_totals_a?.people_degraded?.mean || 0)
                    ).toFixed(0)}{' '}
                    people
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                  <div className="bg-white/[0.02] p-1.5 rounded-lg">
                    <div className="text-[9px] text-slate-400">Scenario A</div>
                    <div className="font-bold text-slate-200">
                      {Math.round(compareData.region_totals_a?.people_degraded?.mean || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center justify-center text-slate-500 text-xs">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-cyan-950/30 border border-cyan-500/20 p-1.5 rounded-lg">
                    <div className="text-[9px] text-cyan-400">Scenario B</div>
                    <div className="font-bold text-cyan-200">
                      {Math.round(compareData.region_totals_b?.people_degraded?.mean || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metric 3: Facilities Isolated */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Isolated Facilities (Expected)</span>
                  <span
                    className={`font-mono font-bold ${
                      (compareData.region_totals_b?.facilities_isolated_expected || 0) -
                        (compareData.region_totals_a?.facilities_isolated_expected || 0) >
                      0
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {(
                      (compareData.region_totals_b?.facilities_isolated_expected || 0) -
                      (compareData.region_totals_a?.facilities_isolated_expected || 0)
                    ).toFixed(1)}{' '}
                    fac
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                  <div className="bg-white/[0.02] p-1.5 rounded-lg">
                    <div className="text-[9px] text-slate-400">Scenario A</div>
                    <div className="font-bold text-slate-200">
                      {(compareData.region_totals_a?.facilities_isolated_expected || 0).toFixed(1)}
                    </div>
                  </div>
                  <div className="flex items-center justify-center text-slate-500 text-xs">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-cyan-950/30 border border-cyan-500/20 p-1.5 rounded-lg">
                    <div className="text-[9px] text-cyan-400">Scenario B</div>
                    <div className="font-bold text-cyan-200">
                      {(compareData.region_totals_b?.facilities_isolated_expected || 0).toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rank Shifts List */}
          {compareData.rank_changes && compareData.rank_changes.length > 0 && (
            <div className="glass-panel rounded-xl p-3.5 border border-white/10">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Facility Priority Rank Shifts
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Click to Inspect</span>
              </div>

              <div className="space-y-2">
                {compareData.rank_changes.map((rc: any) => (
                  <button
                    key={rc.facility_id}
                    onClick={() => {
                      setSelectedFacilityId(rc.facility_id);
                      setDrawerOpen('facility');
                    }}
                    className="w-full flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-cyan-500/30 transition-all text-left group"
                  >
                    <div className="font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">
                      {rc.facility_id}
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-slate-400">Rank {rc.rank_a}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-cyan-300 font-bold">Rank {rc.rank_b}</span>
                      <span
                        className={`font-semibold ml-1.5 ${
                          rc.rank_b < rc.rank_a
                            ? 'text-rose-400'
                            : rc.rank_b > rc.rank_a
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {rc.rank_b < rc.rank_a ? `↑ +${rc.rank_a - rc.rank_b} (worse)` : `↓ ${rc.rank_a - rc.rank_b}`}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-6 text-xs text-slate-400 glass-panel rounded-xl">
          Loading comparison between {scenarioA} and {scenarioB}...
        </div>
      )}
    </div>
  );
};
