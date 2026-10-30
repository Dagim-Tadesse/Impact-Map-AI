import React, { useState, useMemo, useEffect } from 'react';
import {
  Play,
  CloudRain,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  Loader2,
  Compass,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from 'recharts';
import {
  useLibraryQuery,
  useRunScenarioMutation,
  useJobQuery,
  type ScenarioInput,
} from '../api/hooks';
import {
  calculateDailyRain,
  ANTECEDENT_VALUES,
  type StormShape,
  type WetnessClass,
} from '../lib/manualScenario';
import { useAppStore } from '../state/useAppStore';
import { getConfig } from '../config';
import { useTranslation } from 'react-i18next';

interface ExecutionErrorState {
  code?: string;
  message: string;
  field?: string;
  request_id?: string;
}

const SERIF: React.CSSProperties = { fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 };
const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
const SANS: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

const SectionKicker: React.FC<{ eyebrow: string; title: string; meta?: React.ReactNode }> = ({
  eyebrow,
  title,
  meta,
}) => (
  <div className="flex items-end justify-between gap-3 mb-4">
    <div className="min-w-0">
      <div
        className="text-[10px] uppercase tracking-[0.28em] text-amber-300/80 mb-1.5"
        style={MONO}
      >
        {eyebrow}
      </div>
      <h2
        className="text-[22px] text-white leading-tight"
        style={SERIF}
      >
        {title}
      </h2>
    </div>
    {meta && (
      <div
        className="text-[10px] uppercase tracking-[0.22em] text-slate-500 shrink-0 pb-1"
        style={MONO}
      >
        {meta}
      </div>
    )}
  </div>
);

const FieldLabel: React.FC<{ children: React.ReactNode; value?: React.ReactNode }> = ({
  children,
  value,
}) => (
  <div className="flex items-center justify-between text-[11px] mb-2">
    <span className="uppercase tracking-[0.18em] text-slate-500" style={MONO}>
      {children}
    </span>
    {value && (
      <span className="text-sm text-white tabular-nums" style={SERIF}>
        {value}
      </span>
    )}
  </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string; tone?: 'default' | 'error' }> = ({
  children,
  className = '',
  tone = 'default',
}) => (
  <div
    className={`rounded-xl border p-4 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)] transition-all duration-300 ${
      tone === 'error'
        ? 'border-rose-500/40 bg-rose-950/20'
        : 'border-white/[0.08] bg-[#0a0e16]/70 hover:border-white/[0.14]'
    } ${className}`}
  >
    {children}
  </div>
);

export const ScenarioTab: React.FC = () => {
  const { t } = useTranslation();
  const config = getConfig();
  const { data: libraryScenarios, isLoading: isLibLoading } = useLibraryQuery();
  const runScenarioMutation = useRunScenarioMutation();

  const {
    currentCacheKey,
    setCurrentCacheKey,
    setCascadeState,
    setActiveTab,
    setBaseCacheKey,
    clearWhatIf,
  } = useAppStore();

  // Custom Builder State
  const [stormTotalMm, setStormTotalMm] = useState<number>(120);
  const [durationDays, setDurationDays] = useState<number>(4);
  const [stormShape, setStormShape] = useState<StormShape>('mid_peak');
  const [wetness, setWetness] = useState<WetnessClass>('normal');
  const [closureFactor, setClosureFactor] = useState<number>(1.0);
  const [spatialType, setSpatialType] = useState<'uniform' | 'gradient' | 'cell'>('uniform');
  const [gradientBearing, setGradientBearing] = useState<number>(30);
  const [gradientRatio, setGradientRatio] = useState<number>(0.5);
  const [cellCenterLat, setCellCenterLat] = useState<number>(9.15);
  const [cellCenterLng, setCellCenterLng] = useState<number>(40.16);
  const [cellRadiusKm, setCellRadiusKm] = useState<number>(45);
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [failureMode, setFailureMode] = useState<'independent' | 'correlated'>('independent');
  const [nSamples, setNSamples] = useState<number>(200);
  const [seed, setSeed] = useState<number>(42);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Active Job Polling & Lifecycle State
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStartTime, setJobStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);
  const [executionError, setExecutionError] = useState<ExecutionErrorState | null>(null);

  const { data: jobData } = useJobQuery(
    activeJobId,
    Boolean(activeJobId) && !isTimedOut,
    jobStartTime || undefined
  );

  const dailyRainArray = useMemo(() => {
    return calculateDailyRain(stormTotalMm, durationDays, stormShape);
  }, [stormTotalMm, durationDays, stormShape]);

  const chartData = useMemo(() => {
    return dailyRainArray.map((val, idx) => ({
      day: `D${idx + 1}`,
      rain: val,
    }));
  }, [dailyRainArray]);

  useEffect(() => {
    if (!activeJobId) {
      setJobStartTime(null);
      setElapsedSeconds(0);
      setIsTimedOut(false);
      return;
    }

    const start = Date.now();
    setJobStartTime(start);

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setElapsedSeconds(elapsed);

      if (elapsed >= 120) {
        setIsTimedOut(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeJobId]);

  useEffect(() => {
    if (!jobData) return;

    if (jobData.status === 'done' && jobData.cache_key) {
      setCurrentCacheKey(jobData.cache_key);
      setActiveTab('results');
      setActiveJobId(null);
      setExecutionError(null);
    } else if (jobData.status === 'failed') {
      const errPayload = (jobData as any).error;
      setExecutionError({
        code: errPayload?.code || 'SIMULATION_FAILED',
        message: errPayload?.message || 'Monte Carlo routing simulation failed in the compute cluster.',
        request_id: errPayload?.request_id,
      });
      setActiveJobId(null);
    }
  }, [jobData, setCurrentCacheKey, setActiveTab]);

  const handleRunCustom = async () => {
    setExecutionError(null);
    setIsTimedOut(false);
    setBaseCacheKey(null);
    clearWhatIf();

    if (stormTotalMm < 10 || stormTotalMm > 400) {
      setExecutionError({
        code: 'VALIDATION_ERROR',
        message: 'Storm total rainfall must be between 10.0 and 400.0 mm.',
        field: 'storm_total',
      });
      return;
    }

    let spatialPayload: any = { type: spatialType };
    if (spatialType === 'gradient') {
      spatialPayload = {
        type: 'gradient',
        bearing: gradientBearing,
        ratio: gradientRatio,
      };
    } else if (spatialType === 'cell') {
      spatialPayload = {
        type: 'cell',
        center: [cellCenterLng, cellCenterLat],
        radius_km: cellRadiusKm,
      };
    }

    const payload: ScenarioInput = {
      hazard: 'flood',
      region_id: config.region_id,
      start_date: startDate,
      daily_rain_mm: dailyRainArray,
      antecedent_30d_mm: ANTECEDENT_VALUES[wetness],
      spatial: spatialPayload,
      closure_factor: closureFactor,
      failure_mode: failureMode,
      n_samples: nSamples,
      seed: seed,
      forced_closed: [],
      forced_open: [],
    };

    try {
      const res = await runScenarioMutation.mutateAsync(payload);
      if ('cache_key' in res && res.cache_key) {
        setCurrentCacheKey(res.cache_key);
        setActiveTab('results');
      } else if ('job_id' in res && res.job_id) {
        setActiveJobId(res.job_id);
      }
    } catch (err: any) {
      const errBody = err?.error || err;
      setExecutionError({
        code: errBody?.code || (err?.status === 429 ? 'RATE_LIMITED' : 'EXECUTION_ERROR'),
        message:
          errBody?.message ||
          (err?.status === 429
            ? 'Too many requests. Please wait a moment.'
            : 'Live computation is unavailable. Demo scenarios still work.'),
        field: errBody?.field,
        request_id: errBody?.request_id,
      });
    }
  };

  const handleRunLibrary = (item: any) => {
    setExecutionError(null);
    setIsTimedOut(false);
    setActiveJobId(null);
    setBaseCacheKey(null);
    clearWhatIf();

    const targetKey = item.slug || 'awash-2020-replay';
    setCurrentCacheKey(targetKey);
    setActiveTab('results');
  };

  const isSimulating = Boolean(activeJobId) && !isTimedOut;

  return (
    <div className="space-y-10 pb-10 select-none" style={SANS}>
      {/* ── Scenario Library ── */}
      <section>
        <SectionKicker
          eyebrow="01 · Baseline Library"
          title={t('scenario.library_title')}
          meta="Validated Replays"
        />

        {isLibLoading ? (
          <div className="flex items-center justify-center p-6 text-slate-500 text-xs">
            <Loader2 className="w-4 h-4 animate-spin mr-2 text-amber-300" />
            Loading scenarios…
          </div>
        ) : (
          <div className="space-y-3">
            {libraryScenarios?.map((item: any) => {
              const isBaseline = item.slug === 'baseline-dry';
              const totalRain = item.scenario?.daily_rain_mm
                ? item.scenario.daily_rain_mm.reduce((a: number, b: number) => a + b, 0)
                : 0;

              const isActive = currentCacheKey === item.slug;

              return (
                <div
                  key={item.slug}
                  className={`group relative rounded-xl border p-4 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] transition-all duration-300 ${
                    isActive
                      ? 'border-cyan-400/50 bg-[#1a2333] shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/40'
                      : isBaseline
                      ? 'border-slate-700/60 bg-[#161B26] hover:border-slate-500'
                      : 'border-slate-700/60 bg-[#161B26] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isActive && (
                          <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            ACTIVE SIMULATION
                          </span>
                        )}
                        {isBaseline && !isActive && (
                          <div
                            className="text-[9px] uppercase tracking-[0.28em] text-sky-300 font-mono font-semibold"
                          >
                            Comparison Baseline
                          </div>
                        )}
                      </div>
                      <h3
                        className="text-base font-bold text-white leading-snug group-hover:text-amber-200 transition-colors tracking-tight"
                      >
                        {item.title}
                      </h3>
                    </div>
                    <span
                      className={`text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border shrink-0 font-mono font-semibold ${
                        item.badge === 'Replay'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-400/30'
                          : 'bg-white/[0.04] text-slate-300 border-white/[0.08]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <p className="text-[12px] text-slate-200 leading-relaxed mb-2 font-sans">
                    {item.description}
                  </p>

                  {/* 1-Line Plain-English Forecast Impact */}
                  <div className="text-[11px] text-amber-300/90 bg-amber-400/5 border border-amber-400/20 px-2.5 py-1.5 rounded-lg mb-3 font-medium">
                    {item.slug === 'awash-2020-replay'
                      ? 'Simulates 122mm 4-day peak storm deluge across Awash River Basin.'
                      : item.slug === 'baseline-dry'
                      ? 'Dry weather baseline with 0mm precipitation; all 15,336 road links passable.'
                      : `Simulates ${totalRain.toFixed(0)}mm rainfall across ${item.scenario?.daily_rain_mm?.length || 0} days.`}
                  </div>

                  <div className="flex items-end justify-between pt-2.5 border-t border-white/[0.08] gap-3">
                    <div>
                      <div
                        className="text-[9px] uppercase tracking-[0.22em] text-slate-400 mb-0.5 font-mono"
                      >
                        Total Rainfall
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-white tabular-nums font-mono">
                          {totalRain.toFixed(0)}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                          mm · {item.scenario?.daily_rain_mm?.length || 0}{t('scenario.days_suffix')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.demo && (
                        <button
                          onClick={() => {
                            setCascadeState({
                              slug: item.slug,
                              step: 1,
                              n_steps: 4,
                              playing: true,
                            });
                          }}
                          className="group/btn inline-flex items-center gap-1.5 min-h-[36px] rounded-full border border-amber-300/25 bg-amber-300/[0.06] px-3 py-1 text-[11px] font-medium text-amber-200 transition-all hover:border-amber-300/50 hover:bg-amber-300/[0.1] active:scale-95"
                          title="Launch interactive stage cascade replay"
                        >
                          <Play className="w-3 h-3 fill-current transition-transform group-hover/btn:translate-x-0.5" />
                          <span>{t('scenario.play_cascade')}</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleRunLibrary(item)}
                        className="inline-flex items-center gap-1.5 min-h-[36px] rounded-full border border-white/[0.12] bg-white/[0.04] px-3.5 py-1 text-[11px] font-medium text-slate-200 transition-all hover:border-white/25 hover:bg-white/[0.08] hover:text-white active:scale-95"
                      >
                        <span>{t('scenario.run_card')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Custom Scenario Builder ── */}
      <section>
        <SectionKicker
          eyebrow="02 · Composition"
          title={t('scenario.custom_title')}
          meta="Monte Carlo Engine"
        />

        <div className="space-y-4">
          {/* Storm Precipitation */}
          <Card tone={executionError?.field === 'storm_total' || executionError?.field === 'daily_rain_mm' ? 'error' : 'default'}>
            <FieldLabel value={<>{stormTotalMm}<span className="text-xs text-slate-500 ml-1">mm</span></>}>
              {t('scenario.storm_total')}
            </FieldLabel>
            <input
              type="range"
              min={10}
              max={400}
              step={5}
              value={stormTotalMm}
              onChange={(e) => setStormTotalMm(Number(e.target.value))}
              className="w-full accent-amber-300 cursor-pointer h-2 bg-slate-800/80 rounded-full appearance-none"
            />
            <div className="flex justify-between text-[9px] uppercase tracking-wider text-slate-500 mt-1.5" style={MONO}>
              <span>10 · {t('scenario.light')}</span>
              <span>200</span>
              <span>400 · {t('scenario.extreme')}</span>
            </div>
            {executionError?.field === 'storm_total' && (
              <p className="text-[10px] text-rose-300 mt-2" style={MONO}>
                {executionError.message}
              </p>
            )}

            <div className="my-4 h-px bg-white/[0.05]" />

            <FieldLabel value={<>{durationDays}<span className="text-xs text-slate-500 ml-1">{t('scenario.days_suffix')}</span></>}>
              {t('scenario.duration')}
            </FieldLabel>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full accent-amber-300 cursor-pointer h-2 bg-slate-800/80 rounded-full appearance-none"
            />
          </Card>

          {/* Storm shape + wetness */}
          <Card>
            <div
              className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mb-2"
              style={MONO}
            >
              {t('scenario.shape')}
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-5">
              {[
                { id: 'even', label: 'Even', icon: '▄▄▄▄' },
                { id: 'front_loaded', label: 'Front', icon: '█▄  ' },
                { id: 'mid_peak', label: 'Mid-Peak', icon: ' ▄█▄' },
                { id: 'back_loaded', label: 'Back', icon: '  ▄█' },
              ].map((s) => {
                const active = stormShape === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStormShape(s.id as StormShape)}
                    className={`min-h-[48px] py-1.5 rounded-xl border text-center transition-all active:scale-95 ${
                      active
                        ? 'bg-amber-300/[0.08] border-amber-300/40 text-amber-200'
                        : 'bg-white/[0.03] border-white/[0.07] text-slate-400 hover:text-slate-200 hover:border-white/15'
                    }`}
                  >
                    <div className="text-[11px] leading-none mb-1" style={MONO}>{s.icon}</div>
                    <div className="text-[10px] uppercase tracking-wider" style={MONO}>{s.label}</div>
                  </button>
                );
              })}
            </div>

            <div
              className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mb-2"
              style={MONO}
            >
              Antecedent Wetness
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'dry', label: 'Dry', value: '40 mm' },
                { id: 'normal', label: 'Normal', value: '120 mm' },
                { id: 'wet', label: 'Wet', value: '220 mm' },
              ].map((w) => {
                const active = wetness === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setWetness(w.id as WetnessClass)}
                    className={`min-h-[52px] rounded-xl border px-2 py-2 text-center transition-all active:scale-95 ${
                      active
                        ? 'bg-sky-400/[0.08] border-sky-400/40 text-sky-100'
                        : 'bg-white/[0.03] border-white/[0.07] text-slate-400 hover:text-slate-200 hover:border-white/15'
                    }`}
                  >
                    <div className="text-sm text-white" style={SERIF}>{w.label}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5" style={MONO}>
                      {w.value}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Date + closure */}
          <Card>
            <div
              className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mb-2"
              style={MONO}
            >
              Simulation Start Date
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 text-xs text-slate-200 focus:outline-none focus:border-amber-300/40"
              style={MONO}
            />

            <div className="my-4 h-px bg-white/[0.05]" />

            <FieldLabel value={<span className="text-amber-200">{closureFactor.toFixed(2)}</span>}>
              Assumed Closure Factor
            </FieldLabel>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={closureFactor}
              onChange={(e) => setClosureFactor(Number(e.target.value))}
              className="w-full accent-amber-300 cursor-pointer h-2 bg-slate-800/80 rounded-full appearance-none"
            />
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              How often a flooded road is treated as closed. Default 1.0.
            </p>
          </Card>

          {/* Failure Mode */}
          <div>
            <div
              className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mb-2"
              style={MONO}
            >
              Road Network Failure Mode
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFailureMode('independent')}
                className={`min-h-[44px] rounded-full border px-3 text-[11px] font-medium transition-all ${
                  failureMode === 'independent'
                    ? 'bg-white/[0.08] border-white/20 text-white'
                    : 'bg-white/[0.03] border-white/[0.07] text-slate-400 hover:text-slate-200'
                }`}
              >
                Independent
              </button>

              <button
                type="button"
                disabled={!config.features.correlated_mode}
                className="min-h-[44px] rounded-full border border-white/[0.05] bg-white/[0.02] text-slate-500 text-[11px] cursor-not-allowed opacity-60 flex flex-col items-center justify-center"
                title="Correlated mode is disabled in current configuration"
              >
                <span>Correlated</span>
                <span className="text-[9px] text-slate-600 uppercase tracking-wider" style={MONO}>
                  Disabled
                </span>
              </button>
            </div>
          </div>

          {/* Hyetograph */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-slate-500"
                style={MONO}
              >
                <CloudRain className="w-3.5 h-3.5 text-sky-300" />
                Rainfall Hyetograph
              </div>
              <div className="text-right">
                <span className="text-lg text-white tabular-nums" style={SERIF}>
                  {stormTotalMm}
                </span>
                <span className="text-[10px] text-slate-500 ml-1 uppercase tracking-wider" style={MONO}>
                  mm total
                </span>
              </div>
            </div>

            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0a0e16',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="rain" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500 text-center mt-2" style={MONO}>
              [{dailyRainArray.join(', ')}] mm
            </div>
          </Card>

          {/* Advanced fold */}
          <div className="border-t border-white/[0.06] pt-4">
            <button
              type="button"
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="flex items-center justify-between w-full min-h-[40px] group"
            >
              <div className="flex items-center gap-2">
                <div
                  className="text-[10px] uppercase tracking-[0.28em] text-slate-500 group-hover:text-slate-300 transition-colors"
                  style={MONO}
                >
                  Advanced · Spatial & Monte Carlo
                </div>
              </div>
              {advancedOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
              )}
            </button>

            {advancedOpen && (
              <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <div
                    className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mb-2"
                    style={MONO}
                  >
                    Spatial Distribution
                  </div>
                  <select
                    value={spatialType}
                    onChange={(e) => setSpatialType(e.target.value as any)}
                    className="w-full min-h-[44px] rounded-xl border border-white/[0.08] bg-black/30 px-3 text-xs text-slate-200 focus:outline-none focus:border-amber-300/40"
                    style={SANS}
                  >
                    <option value="uniform">Uniform Catchment Basin</option>
                    <option value="gradient">Orographic Gradient</option>
                    <option value="cell">Isolated Convective Storm Cell</option>
                  </select>
                </div>

                {spatialType === 'gradient' && (
                  <Card className="!p-3.5 !shadow-none">
                    <FieldLabel value={<>{gradientBearing}°</>}>
                      <span className="inline-flex items-center gap-1">
                        <Compass className="w-3 h-3 text-sky-300" />
                        Gradient Bearing
                      </span>
                    </FieldLabel>
                    <input
                      type="range"
                      min={0}
                      max={359}
                      value={gradientBearing}
                      onChange={(e) => setGradientBearing(Number(e.target.value))}
                      className="w-full accent-sky-400 cursor-pointer h-2 bg-slate-800/80 rounded-full appearance-none"
                    />
                    <div className="my-3 h-px bg-white/[0.05]" />
                    <FieldLabel value={gradientRatio.toFixed(2)}>Contrast Ratio</FieldLabel>
                    <input
                      type="range"
                      min={0.2}
                      max={1.0}
                      step={0.05}
                      value={gradientRatio}
                      onChange={(e) => setGradientRatio(Number(e.target.value))}
                      className="w-full accent-sky-400 cursor-pointer h-2 bg-slate-800/80 rounded-full appearance-none"
                    />
                  </Card>
                )}

                {spatialType === 'cell' && (
                  <Card className="!p-3.5 !shadow-none">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-500 mb-1" style={MONO}>
                          Center Lat
                        </div>
                        <input
                          type="number"
                          step={0.01}
                          value={cellCenterLat}
                          onChange={(e) => setCellCenterLat(Number(e.target.value))}
                          className="w-full rounded-lg border border-white/[0.08] bg-black/30 p-2 text-xs text-slate-200"
                          style={MONO}
                        />
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-500 mb-1" style={MONO}>
                          Center Lng
                        </div>
                        <input
                          type="number"
                          step={0.01}
                          value={cellCenterLng}
                          onChange={(e) => setCellCenterLng(Number(e.target.value))}
                          className="w-full rounded-lg border border-white/[0.08] bg-black/30 p-2 text-xs text-slate-200"
                          style={MONO}
                        />
                      </div>
                    </div>
                    <FieldLabel value={<>{cellRadiusKm}<span className="text-xs text-slate-500 ml-1">km</span></>}>
                      Storm Cell Radius
                    </FieldLabel>
                    <input
                      type="range"
                      min={5}
                      max={200}
                      step={5}
                      value={cellRadiusKm}
                      onChange={(e) => setCellRadiusKm(Number(e.target.value))}
                      className="w-full accent-sky-400 cursor-pointer h-2 bg-slate-800/80 rounded-full appearance-none"
                    />
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mb-2" style={MONO}>
                      Monte Carlo Draws
                    </div>
                    <select
                      value={nSamples}
                      onChange={(e) => setNSamples(Number(e.target.value))}
                      className="w-full min-h-[44px] rounded-xl border border-white/[0.08] bg-black/30 p-2 text-xs text-slate-200"
                      style={MONO}
                    >
                      <option value={100}>100 · Fast</option>
                      <option value={200}>200 · Standard</option>
                      <option value={400}>400 · High Precision</option>
                    </select>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mb-2" style={MONO}>
                      Random Seed
                    </div>
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(Number(e.target.value))}
                      className="w-full min-h-[44px] rounded-xl border border-white/[0.08] bg-black/30 p-2 text-xs text-slate-200"
                      style={MONO}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Progress stepper */}
          {isSimulating && (
            <Card className="!border-amber-300/30 !bg-amber-500/[0.04] space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span className="text-sm text-white" style={SERIF}>Monte Carlo Dijkstra Engine</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-amber-200" style={MONO}>
                  {elapsedSeconds}s
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[9px] uppercase tracking-[0.22em] text-center" style={MONO}>
                <div
                  className={`py-2 rounded-full border transition-all ${
                    jobData?.status === 'queued' || !jobData?.status
                      ? 'bg-amber-500/[0.08] border-amber-300/40 text-amber-200 animate-pulse'
                      : 'bg-emerald-500/[0.05] border-emerald-400/25 text-emerald-300'
                  }`}
                >
                  01 Queued
                </div>
                <div
                  className={`py-2 rounded-full border transition-all ${
                    jobData?.status === 'running'
                      ? 'bg-sky-500/[0.08] border-sky-400/40 text-sky-200 animate-pulse'
                      : jobData?.status === 'done'
                      ? 'bg-emerald-500/[0.05] border-emerald-400/25 text-emerald-300'
                      : 'bg-white/[0.02] border-white/[0.07] text-slate-500'
                  }`}
                >
                  02 Running
                </div>
                <div
                  className={`py-2 rounded-full border transition-all ${
                    jobData?.status === 'done'
                      ? 'bg-emerald-500/[0.08] border-emerald-400/40 text-emerald-200'
                      : 'bg-white/[0.02] border-white/[0.07] text-slate-500'
                  }`}
                >
                  03 Done
                </div>
              </div>

              {elapsedSeconds >= 20 && jobData?.status !== 'done' && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-500/[0.06] border border-sky-400/25 text-sky-200 text-[11px]">
                  <Info className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  <span>Still working. New scenarios can take up to a minute.</span>
                </div>
              )}
            </Card>
          )}

          {isTimedOut && (
            <Card tone="error" className="space-y-2.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span className="text-sm text-white" style={SERIF}>Simulation Timed Out · 120s</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The compute cluster did not respond within the maximum 120 second SLA window.
              </p>
              <button
                onClick={handleRunCustom}
                className="inline-flex items-center gap-1.5 min-h-[36px] rounded-full border border-rose-400/30 bg-rose-500/[0.08] px-3.5 text-[11px] text-rose-200 hover:bg-rose-500/[0.14] transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Try again</span>
              </button>
            </Card>
          )}

          {executionError && (
            <Card tone="error" className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span className="text-sm text-white" style={SERIF}>
                    {executionError.code || 'Simulation Error'}
                  </span>
                </div>
                {executionError.request_id && (
                  <span className="text-[9px] text-rose-300/80 uppercase tracking-wider" style={MONO}>
                    {executionError.request_id}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {executionError.message}
              </p>
              <button
                onClick={handleRunCustom}
                className="inline-flex items-center gap-1.5 min-h-[36px] rounded-full border border-rose-400/30 bg-rose-500/[0.08] px-3.5 text-[11px] text-rose-200 hover:bg-rose-500/[0.14] transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Try again</span>
              </button>
            </Card>
          )}

          {/* Primary Run — landing-style white pill */}
          <div className="pt-2">
            <button
              onClick={handleRunCustom}
              disabled={runScenarioMutation.isPending || isSimulating}
              className="group relative w-full min-h-[52px] flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_10px_30px_rgba(255,255,255,0.12)] transition-all duration-300 hover:scale-[1.02] hover:bg-amber-50 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <span>
                    {jobData?.status === 'running'
                      ? `Simulating · ${nSamples} draws`
                      : t('scenario.queued')}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-600 transition-transform group-hover:rotate-12" />
                  <span>{t('scenario.run_button')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
