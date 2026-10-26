import React, { useState, useMemo, useEffect } from 'react';
import {
  Play,
  Sliders,
  CloudRain,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Compass,
  MapPin,
  RefreshCw,
  Clock,
  ShieldAlert,
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

export const ScenarioTab: React.FC = () => {
  const { t } = useTranslation();
  const config = getConfig();
  const { data: libraryScenarios, isLoading: isLibLoading } = useLibraryQuery();
  const runScenarioMutation = useRunScenarioMutation();

  const { setCurrentCacheKey, setCascadeState, setActiveTab } = useAppStore();

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

  // TanStack Query Polling Hook with Adaptive Timing (A4.4)
  const { data: jobData } = useJobQuery(
    activeJobId,
    Boolean(activeJobId) && !isTimedOut,
    jobStartTime || undefined
  );

  // Compute daily rainfall array using golden weighting formula (A4.4)
  const dailyRainArray = useMemo(() => {
    return calculateDailyRain(stormTotalMm, durationDays, stormShape);
  }, [stormTotalMm, durationDays, stormShape]);

  const chartData = useMemo(() => {
    return dailyRainArray.map((val, idx) => ({
      day: `D${idx + 1}`,
      rain: val,
    }));
  }, [dailyRainArray]);

  // Polling Timer (A4.4: 120s timeout, A4.13: >20s slow notice)
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

  // Polling Response Lifecycle Trigger
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

  // Run Custom Scenario
  const handleRunCustom = async () => {
    setExecutionError(null);
    setIsTimedOut(false);
    setBaseCacheKey(null);
    clearWhatIf();

    // Validation
    if (stormTotalMm < 10 || stormTotalMm > 400) {
      setExecutionError({
        code: 'VALIDATION_ERROR',
        message: 'Storm total rainfall must be between 10.0 and 400.0 mm.',
        field: 'storm_total',
      });
      return;
    }

    // Build Spatial Payload
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
        // Immediate 200 cache hit
        setCurrentCacheKey(res.cache_key);
        setActiveTab('results');
      } else if ('job_id' in res && res.job_id) {
        // 202 Accepted: enter async polling lifecycle
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

  // Run Library Scenario
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
    <div className="space-y-6 pb-8 select-none">
      {/* 1. Scenario Library Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              {t('scenario.library_title')}
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Validated Baselines</span>
        </div>

        {isLibLoading ? (
          <div className="flex items-center justify-center p-6 text-slate-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin mr-2 text-cyan-400" />
            Loading scenarios...
          </div>
        ) : (
          <div className="space-y-2.5">
            {libraryScenarios?.map((item: any) => {
              const isBaseline = item.slug === 'baseline-dry';
              const totalRain = item.scenario?.daily_rain_mm
                ? item.scenario.daily_rain_mm.reduce((a: number, b: number) => a + b, 0)
                : 0;

              return (
                <div
                  key={item.slug}
                  className={`glass-panel hover:glass-panel-elevated p-3.5 rounded-xl border transition-all duration-200 group ${
                    isBaseline ? 'border-sky-500/30 bg-sky-950/10' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {item.title}
                      </h3>
                      {isBaseline && (
                        <span className="text-[9px] font-mono text-sky-400 font-semibold tracking-wider uppercase">
                          Comparison Baseline
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                        item.badge === 'Replay'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="text-[11px] font-mono text-slate-400">
                      {totalRain.toFixed(0)} mm total · {item.scenario?.daily_rain_mm?.length || 0} {t('scenario.days_suffix')}
                    </div>

                    <div className="flex items-center gap-2">
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
                          className="min-h-[36px] flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 transition-colors active:scale-95"
                          title="Launch interactive stage cascade replay"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{t('scenario.play_cascade')}</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleRunLibrary(item)}
                        className="min-h-[36px] flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors active:scale-95"
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
      </div>

      <div className="h-[1px] bg-white/10" />

      {/* 2. Custom Scenario Builder */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              {t('scenario.custom_title')}
            </h2>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            Monte Carlo
          </span>
        </div>

        {/* Sliders & Configuration Groups */}
        <div className="space-y-3.5">
          {/* Card 1: Storm Precipitation & Duration */}
          <div
            className={`p-3.5 rounded-2xl bg-[#090e1a]/80 border transition-all space-y-3 ${
              executionError?.field === 'storm_total' || executionError?.field === 'daily_rain_mm'
                ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20'
                : 'border-slate-800/80'
            }`}
          >
            {/* Storm Total */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">{t('scenario.storm_total')}</span>
                <span className="font-mono text-cyan-300 font-bold">{stormTotalMm} mm</span>
              </div>
              <input
                type="range"
                min={10}
                max={400}
                step={5}
                value={stormTotalMm}
                onChange={(e) => {
                  setStormTotalMm(Number(e.target.value));
                }}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none py-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>10 mm ({t('scenario.light')})</span>
                <span>200 mm</span>
                <span>400 mm ({t('scenario.extreme')})</span>
              </div>
              {executionError?.field === 'storm_total' && (
                <span className="text-[10px] text-rose-400 font-mono mt-1 block">
                  {executionError.message}
                </span>
              )}
            </div>

            <div className="h-[1px] bg-white/5" />

            {/* Event Duration */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">{t('scenario.duration')}</span>
                <span className="font-mono text-cyan-300 font-bold">{durationDays} {t('scenario.days_suffix')}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={durationDays}
                onChange={(e) => {
                  setDurationDays(Number(e.target.value));
                }}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none py-2"
              />
            </div>
          </div>

          {/* Card 2: Temporal Shape & Antecedent Moisture */}
          <div className="p-3.5 rounded-2xl bg-[#090e1a]/80 border border-slate-800/80 space-y-3.5">
            {/* Temporal Storm Shape */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-2">
                {t('scenario.shape')}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'even', label: 'Even', icon: '▄▄▄▄' },
                  { id: 'front_loaded', label: 'Front', icon: '█▄  ' },
                  { id: 'mid_peak', label: 'Mid-Peak', icon: ' ▄█▄' },
                  { id: 'back_loaded', label: 'Back', icon: '  ▄█' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setStormShape(s.id as StormShape);
                    }}
                    className={`min-h-[44px] py-1.5 px-1 text-center rounded-xl border transition-all text-xs active:scale-95 ${
                      stormShape === s.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                        : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="font-mono text-[11px] mb-0.5">{s.icon}</div>
                    <div className="text-[10px]">{s.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[1px] bg-white/5" />

            {/* Antecedent Soil Moisture */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-2">
                Previous Month Antecedent Wetness
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'dry', label: 'Dry (40 mm)' },
                  { id: 'normal', label: 'Normal (120 mm)' },
                  { id: 'wet', label: 'Wet (220 mm)' },
                ].map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setWetness(w.id as WetnessClass);
                    }}
                    className={`min-h-[44px] py-1.5 px-2 text-center rounded-xl border text-xs transition-all active:scale-95 ${
                      wetness === w.id
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200 font-semibold'
                        : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Start Date & Assumed Closure Factor */}
          <div className="p-3.5 rounded-2xl bg-[#090e1a]/80 border border-slate-800/80 space-y-3.5">
            {/* Start Date */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1.5">
                Simulation Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="min-h-[44px] w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="h-[1px] bg-white/5" />

            {/* Assumed Closure Factor */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Assumed Closure Factor</span>
                <span className="font-mono text-amber-300 font-bold">{closureFactor.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={closureFactor}
                onChange={(e) => {
                  setClosureFactor(Number(e.target.value));
                }}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none py-2"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                How often a flooded road is treated as closed (default 1.0).
              </p>
            </div>
          </div>

          {/* Failure Mode Selection */}
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1.5">
              Road Network Failure Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFailureMode('independent');
                }}
                className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  failureMode === 'independent'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-white/[0.03] border-white/10 text-slate-400'
                }`}
              >
                Independent
              </button>

              <button
                type="button"
                disabled={!config.features.correlated_mode}
                className="min-h-[44px] p-2.5 rounded-xl border border-white/5 bg-white/[0.02] text-slate-500 text-xs font-medium cursor-not-allowed opacity-60 flex flex-col items-center justify-center"
                title="Correlated mode is disabled in current configuration"
              >
                <span>Correlated</span>
                <span className="text-[9px] text-slate-600 font-mono">(Disabled in Meta)</span>
              </button>
            </div>
          </div>

          {/* Daily Rainfall Hyetograph Preview */}
          <div className="glass-panel p-3 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
              <span className="font-medium flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                Rainfall Hyetograph Preview
              </span>
              <span className="font-mono text-[11px] text-cyan-300">
                Total: {stormTotalMm} mm
              </span>
            </div>

            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0d111a',
                      borderColor: 'rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="rain" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-slate-400 font-mono text-center mt-1">
              Array: [{dailyRainArray.join(', ')}] mm
            </div>
          </div>

          {/* Advanced Fold (Spatial, Seed, Samples) */}
          <div className="border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={() => {
                setAdvancedOpen(!advancedOpen);
              }}
              className="flex items-center justify-between w-full min-h-[44px] text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <span className="font-semibold">Advanced Spatial &amp; Monte Carlo Parameters</span>
              {advancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {advancedOpen && (
              <div className="space-y-3.5 pt-3 animate-in fade-in duration-200">
                {/* Spatial Pattern */}
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Spatial Distribution Pattern</label>
                  <select
                    value={spatialType}
                    onChange={(e) => setSpatialType(e.target.value as any)}
                    className="w-full min-h-[44px] bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="uniform">Uniform Catchment Basin</option>
                    <option value="gradient">Orographic Gradient</option>
                    <option value="cell">Isolated Convective Storm Cell</option>
                  </select>
                </div>

                {/* Gradient Parameters */}
                {spatialType === 'gradient' && (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span className="flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5 text-cyan-400" />
                          Gradient Direction Angle
                        </span>
                        <span className="font-mono text-cyan-300">{gradientBearing}°</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={359}
                        value={gradientBearing}
                        onChange={(e) => setGradientBearing(Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>Gradient Contrast Ratio</span>
                        <span className="font-mono text-cyan-300">{gradientRatio.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={0.2}
                        max={1.0}
                        step={0.05}
                        value={gradientRatio}
                        onChange={(e) => setGradientRatio(Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                      />
                    </div>
                  </div>
                )}

                {/* Storm Cell Parameters */}
                {spatialType === 'cell' && (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Center Latitude</label>
                        <input
                          type="number"
                          step={0.01}
                          value={cellCenterLat}
                          onChange={(e) => setCellCenterLat(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs font-mono text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Center Longitude</label>
                        <input
                          type="number"
                          step={0.01}
                          value={cellCenterLng}
                          onChange={(e) => setCellCenterLng(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs font-mono text-slate-200"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>Storm Cell Radius</span>
                        <span className="font-mono text-cyan-300">{cellRadiusKm} km</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={200}
                        step={5}
                        value={cellRadiusKm}
                        onChange={(e) => setCellRadiusKm(Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                      />
                    </div>
                  </div>
                )}

                {/* Monte Carlo Draws and Seed */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Monte Carlo Draws</label>
                    <select
                      value={nSamples}
                      onChange={(e) => setNSamples(Number(e.target.value))}
                      className="w-full min-h-[44px] bg-slate-900 border border-white/10 rounded-xl p-2 text-xs text-slate-200 font-mono"
                    >
                      <option value={100}>100 Realizations (Fast)</option>
                      <option value={200}>200 Realizations (Standard)</option>
                      <option value={400}>400 Realizations (High Precision)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Random Seed</label>
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(Number(e.target.value))}
                      className="w-full min-h-[44px] bg-slate-900 border border-white/10 rounded-xl p-2 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3-State Progress Stepper & Polling Lifecycle Visualizer (A4.4) */}
          {isSimulating && (
            <div className="p-3.5 rounded-xl glass-panel-elevated border border-cyan-500/40 shadow-[0_0_24px_rgba(6,182,212,0.25)] space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  Monte Carlo Dijkstra Engine
                </span>
                <span className="font-mono text-cyan-300 text-[11px]">
                  {elapsedSeconds}s elapsed
                </span>
              </div>

              {/* 3 Steps: Queued -> Running -> Done */}
              <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px] text-center">
                <div
                  className={`py-1.5 px-1 rounded-lg border transition-all ${
                    jobData?.status === 'queued' || !jobData?.status
                      ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse'
                      : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                  }`}
                >
                  1. Queued
                </div>

                <div
                  className={`py-1.5 px-1 rounded-lg border transition-all ${
                    jobData?.status === 'running'
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.35)] animate-pulse'
                      : jobData?.status === 'done'
                      ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900/60 border-white/10 text-slate-500'
                  }`}
                >
                  2. Running
                </div>

                <div
                  className={`py-1.5 px-1 rounded-lg border transition-all ${
                    jobData?.status === 'done'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                      : 'bg-slate-900/60 border-white/10 text-slate-500'
                  }`}
                >
                  3. Done
                </div>
              </div>

              {/* Slow Job Notice (> 20s required by Work Division A4.13) */}
              {elapsedSeconds >= 20 && jobData?.status !== 'done' && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-sky-950/60 border border-sky-500/30 text-sky-200 text-xs animate-in fade-in duration-300">
                  <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Still working. New scenarios can take up to a minute.</span>
                </div>
              )}
            </div>
          )}

          {/* Timeout Error State (>= 120s) */}
          {isTimedOut && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Simulation Timed Out (120s)</span>
              </div>
              <p className="text-[11px] text-slate-300">
                The compute cluster did not respond within the maximum 120 second SLA window.
              </p>
              <button
                onClick={handleRunCustom}
                className="min-h-[36px] px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try again</span>
              </button>
            </div>
          )}

          {/* Failed Job / API Error State */}
          {executionError && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>{executionError.code || 'Simulation Error'}</span>
                </div>
                {executionError.request_id && (
                  <span className="font-mono text-[9px] text-rose-400">
                    {executionError.request_id}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                {executionError.message}
              </p>
              <button
                onClick={handleRunCustom}
                className="min-h-[36px] px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try again</span>
              </button>
            </div>
          )}

          {/* Run Scenario Button & Status Flow */}
          <div className="pt-2">
            <button
              onClick={handleRunCustom}
              disabled={runScenarioMutation.isPending || isSimulating}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-sm shadow-[0_0_24px_rgba(6,182,212,0.35)] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {jobData?.status === 'running'
                      ? `Simulating Monte Carlo Dijkstra (${nSamples} Draws)...`
                      : t('scenario.queued')}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t('scenario.run_button')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
