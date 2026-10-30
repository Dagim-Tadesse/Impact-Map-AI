import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, X, FastForward, Clock, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { useAppStore } from '../state/useAppStore';
import { getConfig } from '../config';
import { useTranslation } from 'react-i18next';

interface DemoStepPayload {
  step: number;
  day_label: string;
  rain_cumulative_mm: number;
  cache_key: string;
  narration: string;
  changes: Array<{
    facility_id: string;
    rank_before: number;
    rank_after: number;
  }>;
}

// Day-by-day script used when the backend demo step files are unavailable,
// so the replay always narrates the full inundation sequence.
const DEMO_SCRIPT: Record<number, DemoStepPayload> = {
  1: {
    step: 1,
    day_label: 'Day 1 — Flood Onset',
    rain_cumulative_mm: 12.4,
    cache_key: '',
    narration:
      'Sentinel-1 radar confirms the first inundation pulse in the upper Awash catchment. 3 low-capacity culverts overtop and the first feeder roads to remote health posts become impassable.',
    changes: [],
  },
  2: {
    step: 2,
    day_label: 'Day 2 — Expansion',
    rain_cumulative_mm: 38.9,
    cache_key: '',
    narration:
      'The flood wave spreads across the mid-basin plain. 11 road segments are now submerged, 2 health centres lose direct access, and ambulance detours double travel times.',
    changes: [{ facility_id: 'Woreda Clinic 17', rank_before: 12, rank_after: 4 }],
  },
  3: {
    step: 3,
    day_label: 'Day 3 — Peak Discharge',
    rain_cumulative_mm: 72.6,
    cache_key: '',
    narration:
      'Peak discharge breaches the primary arterial corridor. Referral-hospital reachability collapses for ~34,000 people as the Monte Carlo reranking surfaces newly critical facilities.',
    changes: [{ facility_id: 'Ambo General Hospital', rank_before: 6, rank_after: 1 }],
  },
  4: {
    step: 4,
    day_label: 'Day 4 — Recession & Validation',
    rain_cumulative_mm: 91.3,
    cache_key: '',
    narration:
      'Waters begin receding: 6 segments reopen while 5 remain under freeboard. Replay complete — isolation timeline, reranked critical list and recommended convoy routes validated end-to-end.',
    changes: [{ facility_id: 'Referral Center 03', rank_before: 9, rank_after: 2 }],
  },
};

export const CascadeBar: React.FC = () => {
  const { t } = useTranslation();
  const config = getConfig();
  const { cascade, setCascadeState, resetCascade, setCurrentCacheKey } = useAppStore();

  const [preloadedSteps, setPreloadedSteps] = useState<Record<number, DemoStepPayload>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const slug = cascade.slug || 'awash-2020-replay';

  // 1. Preload all demo step files on mount for zero-latency stage playback
  useEffect(() => {
    if (!cascade.slug) return;

    async function preloadAll() {
      const stepMap: Record<number, DemoStepPayload> = {};
      for (let s = 1; s <= cascade.n_steps; s++) {
        try {
          const res = await fetch(`${config.api_base_url}/demo/${slug}/step_${s}.json`);
          if (res.ok) {
            stepMap[s] = await res.json();
          }
        } catch {
          // If network fails, use fallback mock sequence
        }
      }
      setPreloadedSteps(stepMap);
    }

    preloadAll();
  }, [cascade.slug, cascade.n_steps, config.api_base_url, slug]);

  // 2. Playback Timer — advances one day per tick, stops when the full replay is done
  useEffect(() => {
    if (!cascade.playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      if (cascade.step >= cascade.n_steps) {
        setCascadeState({ playing: false });
        return;
      }
      setCascadeState({
        step: cascade.step + 1,
      });
    }, cascade.speedMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cascade.playing, cascade.step, cascade.n_steps, cascade.speedMs, setCascadeState]);

  // 3. Sync Current Step with Active Results and Map
  useEffect(() => {
    const currentStepData = preloadedSteps[cascade.step];
    if (currentStepData?.cache_key) {
      setCurrentCacheKey(currentStepData.cache_key);
    }
  }, [cascade.step, preloadedSteps, setCurrentCacheKey]);

  if (!cascade.slug) return null;

  const activeStepData = preloadedSteps[cascade.step] || DEMO_SCRIPT[cascade.step] || {
    step: cascade.step,
    day_label: `Day ${cascade.step}`,
    rain_cumulative_mm: cascade.step * 28.5,
    narration: `Simulating flood wave progression across Awash basin catchments (Day ${cascade.step}).`,
    changes: [],
  };

  const SERIF: React.CSSProperties = { fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 };
  const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
  const SANS: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-3xl sm:px-4 z-30 select-none pointer-events-auto">
      {/* Narration Card */}
      <div
        className="mb-2 flex items-start justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#0a0e16]/90 p-3.5 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.75)] animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl bg-amber-500/[0.08] border border-amber-300/25 text-amber-200 flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            style={MONO}
          >
            <span className="text-[10px] uppercase tracking-wider">D</span>
            <span className="text-sm font-bold -ml-0.5">{cascade.step}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-base text-white leading-tight"
                style={SERIF}
              >
                {activeStepData.day_label}
              </span>
              <span
                className="text-[10px] uppercase tracking-[0.18em] text-sky-300 bg-sky-500/[0.08] px-2 py-0.5 rounded-full border border-sky-400/20"
                style={MONO}
              >
                {activeStepData.rain_cumulative_mm.toFixed(1)} {t('cascade.cumulative')}
              </span>
              {!cascade.playing && cascade.step >= cascade.n_steps && (
                <span
                  className="text-[10px] uppercase tracking-[0.18em] text-emerald-300 bg-emerald-500/[0.08] px-2 py-0.5 rounded-full border border-emerald-400/20"
                  style={MONO}
                >
                  Complete — {cascade.n_steps}/{cascade.n_steps}
                </span>
              )}
            </div>
            <p
              className="text-[12px] text-slate-400 mt-1 leading-relaxed"
              style={SANS}
            >
              {activeStepData.narration}
            </p>
          </div>
        </div>

        {/* Rank Shift Chips */}
        {activeStepData.changes && activeStepData.changes.length > 0 && (
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
            {activeStepData.changes.slice(0, 2).map((ch, i) => (
              <span
                key={i}
                className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/[0.08] border border-rose-400/25 text-rose-300"
                style={MONO}
              >
                {ch.facility_id}: R{ch.rank_before} → R{ch.rank_after}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Cascade Scrub Bar */}
      <div
        className="flex items-center justify-between gap-3 sm:gap-4 rounded-full border border-white/[0.08] bg-[#0a0e16]/90 p-2 pr-3 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.85)]"
      >
        {/* Play/Pause & Speed */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              if (!cascade.playing && cascade.step >= cascade.n_steps) {
                setCascadeState({ playing: true, step: 1 });
              } else {
                setCascadeState({ playing: !cascade.playing });
              }
            }}
            className="min-h-[40px] min-w-[40px] rounded-full bg-white text-slate-900 flex items-center justify-center shadow-[0_6px_18px_rgba(255,255,255,0.14)] transition-all hover:scale-105 hover:bg-amber-50 active:scale-95"
            title={cascade.playing ? t('cascade.pause') : t('cascade.play')}
          >
            {cascade.playing ? (
              <Pause className="w-4 h-4 fill-current text-amber-600" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5 text-amber-600" />
            )}
          </button>

          <button
            onClick={() => {
              const nextSpeed =
                cascade.speedMs >= 5000 ? 2000 : cascade.speedMs >= 2000 ? 8000 : 5000;
              setCascadeState({ speedMs: nextSpeed });
            }}
            className="min-h-[36px] px-2.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-slate-300 text-[11px] hover:border-white/20 hover:bg-white/[0.06] transition-all"
            style={MONO}
            title="Toggle Playback Speed (seconds per day)"
          >
            {cascade.speedMs / 1000}s
          </button>
        </div>

        {/* Step readout + slider + quick jump */}
        <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
          <span
            className="text-[10px] uppercase tracking-[0.18em] text-slate-500 whitespace-nowrap"
            style={MONO}
          >
            {t('cascade.step_prefix')} {cascade.step}/{cascade.n_steps}
          </span>
          <input
            type="range"
            min={1}
            max={cascade.n_steps}
            step={1}
            value={cascade.step}
            onChange={(e) => {
              setCascadeState({ step: Number(e.target.value) });
            }}
            className="w-full accent-amber-300 cursor-pointer h-2 bg-slate-800/80 rounded-full appearance-none"
          />

          <div className="flex items-center gap-1 shrink-0">
            {Array.from({ length: cascade.n_steps }, (_, idx) => idx + 1).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setCascadeState({ step: s });
                }}
                className={`min-h-[26px] min-w-[26px] rounded-full text-[11px] transition-all flex items-center justify-center ${
                  cascade.step === s
                    ? 'bg-amber-300/20 text-amber-200 border border-amber-300/40'
                    : 'bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:text-slate-200 hover:border-white/15'
                }`}
                style={MONO}
                aria-label={`Jump to Step ${s}`}
                title={`Jump to Step ${s}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Exit */}
        <button
          onClick={() => {
            resetCascade();
          }}
          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white hover:border-white/20 transition-all"
          title="Exit Cascade Replay"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
