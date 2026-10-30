import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useCompareQuery, useLibraryQuery } from '../api/hooks';
import { useAppStore } from '../state/useAppStore';
import { useTranslation } from 'react-i18next';

const SERIF: React.CSSProperties = { fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 };
const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
const SANS: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

const FACILITY_NAMES: Record<string, string> = {
  fac_00001: 'Sabure Rural Clinic',
  fac_00002: 'Kesem Health Post',
  fac_00003: 'Bolen Clinic',
  fac_00004: 'Debre Berhan Referral Hospital',
  fac_00005: 'Awash Valley Primary Clinic',
  fac_00006: 'Gewane Health Post',
  fac_00007: 'Metehara Health Center',
  fac_00008: 'Awash Sebat General Hospital',
  fac_00009: 'Awash Arba Health Center',
  fac_00010: 'Gedamaytu Health Center',
  fac_00011: 'Doho Rural Clinic',
  fac_00012: 'Amibara Primary Hospital',
  fac_00013: 'Melka Sedi Health Center',
  fac_00014: 'Meteka Clinic',
  fac_00015: 'Aqaqi Health Post',
  fac_00016: 'Melka Werer Health Center',
  fac_00017: 'Metehara Sugar Hospital',
  fac_00018: 'Garamuleta Health Post',
  fac_00029: 'Halidebi Clinic',
};

function formatFacilityName(id: string): string {
  return FACILITY_NAMES[id] || id.replace('fac_', 'Facility #');
}

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

  const DeltaMetric: React.FC<{
    label: string;
    delta: number;
    valueA: number;
    valueB: number;
    suffix: string;
    formatter: (v: number) => string;
    worseWhenPositive?: boolean;
  }> = ({ label, delta, valueA, valueB, suffix, formatter, worseWhenPositive = true }) => {
    const positive = delta > 0;
    const neutral = delta === 0;
    const bad = positive === worseWhenPositive;
    const deltaColor = neutral
      ? 'text-slate-500'
      : bad
      ? 'text-rose-300'
      : 'text-emerald-300';

    return (
      <div className="py-4 first:pt-0 border-t border-white/[0.05] first:border-t-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] uppercase tracking-[0.22em] text-slate-500" style={MONO}>
            {label}
          </span>
          <span className={`text-base tabular-nums ${deltaColor}`} style={SERIF}>
            {delta > 0 ? '+' : ''}
            {formatter(delta)}
            <span className="text-[10px] text-slate-500 ml-1 uppercase tracking-wider" style={MONO}>
              {suffix}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
            <div className="text-[9px] uppercase tracking-[0.22em] text-slate-500 mb-1" style={MONO}>
              Scenario A
            </div>
            <div className="text-xl text-slate-200 tabular-nums" style={SERIF}>
              {formatter(valueA)}
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-600" />

          <div className="rounded-xl bg-rose-500/[0.05] border border-rose-300/25 p-3">
            <div className="text-[9px] uppercase tracking-[0.22em] text-rose-300/80 mb-1" style={MONO}>
              Scenario B
            </div>
            <div className="text-xl text-rose-100 tabular-nums" style={SERIF}>
              {formatter(valueB)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10" style={SANS}>
      <div>
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-rose-300/90 mb-1.5" style={MONO}>
          <span className="w-1 h-1 rounded-full bg-rose-300" />
          <span>Differential · A vs B</span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-[22px] text-white leading-tight" style={SERIF}>
            {t('compare.title')}
          </h2>
          <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500 pb-1" style={MONO}>
            {t('compare.subtitle')}
          </span>
        </div>
      </div>

      {/* Scenario selectors */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0a0e16]/70 p-4 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-[0.22em] text-slate-500 block mb-2" style={MONO}>
              {t('compare.scenario_a')}
            </label>
            <select
              value={scenarioA}
              onChange={(e) => setScenarioA(e.target.value)}
              className="w-full h-11 rounded-full border border-white/[0.08] bg-black/30 px-3.5 text-[11px] text-slate-200 focus:outline-none focus:border-white/20"
              style={SANS}
            >
              {scenarioOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.22em] text-rose-300/90 block mb-2" style={MONO}>
              {t('compare.scenario_b')}
            </label>
            <select
              value={scenarioB}
              onChange={(e) => setScenarioB(e.target.value)}
              className="w-full h-11 rounded-full border border-rose-300/25 bg-rose-500/[0.05] px-3.5 text-[11px] text-rose-100 focus:outline-none focus:border-rose-300/50"
              style={SANS}
            >
              {scenarioOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {compareData ? (
        <>
          {/* Actionable Executive Summary Banner */}
          <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-3.5 space-y-1">
            <div className="text-[10px] uppercase tracking-wider font-mono font-bold text-sky-300">
              Executive Differential Summary
            </div>
            <p className="text-xs text-slate-100 font-sans leading-relaxed">
              {compareData.people_cut_off_delta < 0 ? (
                <>
                  Intervention saves <strong className="text-emerald-300 font-bold">{Math.abs(Math.round(compareData.people_cut_off_delta)).toLocaleString()} residents</strong> from medical isolation compared to Baseline.
                </>
              ) : compareData.people_cut_off_delta > 0 ? (
                <>
                  Severe flood increases medical isolation by <strong className="text-rose-300 font-bold">{Math.round(compareData.people_cut_off_delta).toLocaleString()} residents</strong> compared to Baseline.
                </>
              ) : (
                <>Equal regional medical access outcomes between selected scenarios.</>
              )}
            </p>
          </div>

          {/* Map sync */}
          <div className="flex items-center justify-between gap-3 rounded-full border border-slate-700/60 bg-[#161B26] pl-4 pr-2 py-1.5 backdrop-blur-xl">
            <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-mono">
              {t('compare.active_map')}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentCacheKey(scenarioA)}
                className={`min-h-[32px] rounded-full px-3 text-[11px] font-mono transition-all ${
                  currentCacheKey === scenarioA
                    ? 'bg-white text-slate-900 font-bold shadow-[0_4px_12px_rgba(255,255,255,0.14)]'
                    : 'bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                Map A
              </button>
              <button
                onClick={() => setCurrentCacheKey(scenarioB)}
                className={`min-h-[32px] rounded-full px-3 text-[11px] font-mono transition-all ${
                  currentCacheKey === scenarioB
                    ? 'bg-rose-400 text-slate-950 font-bold shadow-[0_4px_12px_rgba(251,113,133,0.3)]'
                    : 'bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                Map B
              </button>
            </div>
          </div>

          {/* Differential matrix */}
          <div className="rounded-xl border border-slate-700/60 bg-[#161B26] overflow-hidden backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-rose-400 font-mono font-bold">
                  Regional Matrix
                </div>
                <div className="text-base text-white font-bold tracking-tight mt-0.5">
                  Side-by-Side Deltas
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-mono font-semibold">
                Net Difference (B vs A)
              </span>
            </div>

            <div className="px-4">
              <DeltaMetric
                label="Cut-Off Population"
                delta={compareData.people_cut_off_delta}
                valueA={compareData.region_totals_a?.people_cut_off?.mean || 0}
                valueB={compareData.region_totals_b?.people_cut_off?.mean || 0}
                suffix="people"
                formatter={(v) => Math.round(v).toLocaleString()}
              />
              <DeltaMetric
                label="Degraded Access (>2× time)"
                delta={
                  (compareData.region_totals_b?.people_degraded?.mean || 0) -
                  (compareData.region_totals_a?.people_degraded?.mean || 0)
                }
                valueA={compareData.region_totals_a?.people_degraded?.mean || 0}
                valueB={compareData.region_totals_b?.people_degraded?.mean || 0}
                suffix="people"
                formatter={(v) => Math.round(v).toLocaleString()}
              />
              <DeltaMetric
                label="Isolated Facilities (Expected)"
                delta={
                  (compareData.region_totals_b?.facilities_isolated_expected || 0) -
                  (compareData.region_totals_a?.facilities_isolated_expected || 0)
                }
                valueA={compareData.region_totals_a?.facilities_isolated_expected || 0}
                valueB={compareData.region_totals_b?.facilities_isolated_expected || 0}
                suffix="facilities"
                formatter={(v) => Math.abs(v) < 0.05 ? '0' : v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)}
              />
              <div className="h-4" />
            </div>
          </div>

          {/* Rank Shifts */}
          {compareData.rank_changes && compareData.rank_changes.length > 0 && (
            <div className="rounded-xl border border-slate-700/60 bg-[#161B26] p-4 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
              <div className="flex items-end justify-between mb-3 border-b border-white/[0.08] pb-2">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-rose-400 font-mono font-bold">
                    Rank Shifts
                  </div>
                  <h3 className="text-base text-white font-bold tracking-tight mt-0.5">
                    Facility Priority Reordering
                  </h3>
                </div>
                <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-mono">
                  Click to inspect
                </span>
              </div>

              <div className="space-y-2">
                {compareData.rank_changes.map((rc: any) => (
                  <button
                    key={rc.facility_id}
                    onClick={() => {
                      setSelectedFacilityId(rc.facility_id);
                      setDrawerOpen('facility');
                    }}
                    className="group w-full flex items-center justify-between gap-3 rounded-xl bg-slate-800/50 border border-slate-700/50 px-3.5 py-3 hover:bg-slate-800 hover:border-slate-500 transition-all text-left"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-rose-200 transition-colors truncate">
                        {formatFacilityName(rc.facility_id)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Priority movement under scenario shift
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono">
                      <span className="text-[10px] text-slate-400">Rank #{rc.rank_a}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-[11px] text-rose-300 font-bold">Rank #{rc.rank_b}</span>
                      <span
                        className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-semibold ${
                          rc.rank_b < rc.rank_a
                            ? 'text-rose-300 bg-rose-500/10 border-rose-500/30'
                            : rc.rank_b > rc.rank_a
                            ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
                            : 'text-slate-400 bg-white/5 border-white/10'
                        }`}
                      >
                        {rc.rank_b < rc.rank_a
                          ? `+${rc.rank_a - rc.rank_b} Risk Increased`
                          : rc.rank_b > rc.rank_a
                          ? `${rc.rank_a - rc.rank_b} Risk Decreased`
                          : 'Unchanged'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div
          className="text-center p-6 text-xs text-slate-500 rounded-xl border border-white/[0.07] bg-[#0a0e16]/70 backdrop-blur-xl"
          style={MONO}
        >
          Loading comparison · {scenarioA} ↔ {scenarioB}
        </div>
      )}
    </div>
  );
};
