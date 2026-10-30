import React, { useEffect, useState, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import gsap from 'gsap';

const SERIF: React.CSSProperties = { fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 };
const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
const SANS: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

const BOOT_BG_IMAGE =
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1920&q=80';

type Stage = {
  key: string;
  label: string;
  accent: 'sky' | 'amber' | 'rose' | 'emerald' | 'cyan';
  readout: string;
};

const STAGES: Stage[] = [
  { key: '01', label: 'Hydrologic Ingestion', accent: 'sky', readout: 'CHIRPS · Sentinel-1' },
  { key: '02', label: 'Calibrated Inundation', accent: 'cyan', readout: 'LightGBM · ECE 0.023' },
  { key: '03', label: 'Cascade Topology Solver', accent: 'amber', readout: 'Monte Carlo · 3,420 links' },
  { key: '04', label: 'What-If Interventions', accent: 'rose', readout: 'Counterfactual graph' },
  { key: '05', label: 'Ground Truth Verification', accent: 'emerald', readout: 'LOEO · SAR benchmark' },
];

const accentText: Record<Stage['accent'], string> = {
  sky: 'text-sky-300',
  cyan: 'text-cyan-300',
  amber: 'text-amber-300',
  rose: 'text-rose-300',
  emerald: 'text-emerald-300',
};
const accentDot: Record<Stage['accent'], string> = {
  sky: 'bg-sky-300',
  cyan: 'bg-cyan-300',
  amber: 'bg-amber-300',
  rose: 'bg-rose-300',
  emerald: 'bg-emerald-300',
};

export const HudBootIntro: React.FC = () => {
  const [active, setActive] = useState(false);
  const [stageIndex, setStageIndex] = useState<number>(-1);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const stagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const seen =
      typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('impactmap_boot_seen') : null;
    if (seen || window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      return;
    }

    setActive(true);

    const totalMs = 2000;

    // Stage progression — each stage lights up over ~400ms
    const stageTimers: number[] = [];
    STAGES.forEach((_, i) => {
      stageTimers.push(
        window.setTimeout(() => setStageIndex(i), i * (totalMs / STAGES.length))
      );
    });

    const timer = window.setTimeout(() => {
      dismissIntro();
    }, totalMs + 300);

    return () => {
      clearTimeout(timer);
      stageTimers.forEach((t) => clearTimeout(t));
    };
  }, []);

  // Entrance choreography
  useEffect(() => {
    if (!active) return;
    if (!contentRef.current) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduced) return;

    gsap.fromTo(
      contentRef.current.querySelectorAll('[data-boot-anim]'),
      { opacity: 0, y: 16, filter: 'blur(8px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, stagger: 0.08, ease: 'power3.out' }
    );

    if (progressRef.current) {
      gsap.fromTo(
        progressRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 2, ease: 'power2.inOut' }
      );
    }
  }, [active]);

  // Light up each stage as the index advances
  useEffect(() => {
    if (stageIndex < 0 || !stagesRef.current) return;
    const row = stagesRef.current.querySelector<HTMLElement>(`[data-stage="${stageIndex}"]`);
    if (!row) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduced) return;
    gsap.fromTo(
      row,
      { opacity: 0.3, x: -6 },
      { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
    );
  }, [stageIndex]);

  const dismissIntro = () => {
    if (!overlayRef.current) {
      setActive(false);
      return;
    }

    sessionStorage.setItem('impactmap_boot_seen', '1');

    gsap.to(contentRef.current, {
      opacity: 0,
      y: -16,
      filter: 'blur(6px)',
      duration: 0.4,
      ease: 'power2.in',
    });

    gsap.to(overlayRef.current, {
      clipPath: 'inset(50% 0% 50% 0%)',
      opacity: 0,
      duration: 0.65,
      delay: 0.2,
      ease: 'expo.inOut',
      onComplete: () => {
        setActive(false);
      },
    });
  };

  if (!active) return null;

  return (
    <div
      ref={overlayRef}
      onClick={dismissIntro}
      className="fixed inset-0 z-50 bg-[#060a14] flex items-center justify-center p-6 cursor-pointer select-none"
      style={{ clipPath: 'inset(0% 0% 0% 0%)', ...SANS }}
      role="status"
      aria-live="polite"
      aria-label="Loading ImpactMap live explorer"
    >
      {/* Atmospheric backdrop — matches landing */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={BOOT_BG_IMAGE}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-[0.14] scale-105"
          loading="eager"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 25% 20%, rgba(251,191,36,0.1), transparent 55%), radial-gradient(ellipse at 80% 75%, rgba(56,189,248,0.08), transparent 60%), radial-gradient(circle at 50% 100%, rgba(244,63,94,0.04), transparent 55%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#060a14]/70 via-[#060a14]/55 to-[#060a14]/85" />
      </div>

      {/* Subtle animated scanline (toned down) */}
      <div
        aria-hidden="true"
        className="hologram-scanline opacity-50"
      />

      <div
        ref={contentRef}
        className="relative z-10 w-full max-w-xl space-y-7"
      >
        {/* Brand mark */}
        <div
          data-boot-anim
          className="flex items-center gap-3"
        >
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 p-0.5 shrink-0">
            <span className="flex h-full w-full items-center justify-center rounded-full bg-[#080d1a]">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            </span>
          </span>
          <div className="flex flex-col leading-tight">
            <span
              className="text-xl text-white"
              style={SERIF}
            >
              Impact<em className="not-italic text-amber-300/90">Map</em>
            </span>
            <span
              className="text-[9px] uppercase tracking-[0.28em] text-slate-500"
              style={MONO}
            >
              Awash Basin · Live Twin
            </span>
          </div>
        </div>

        {/* Title */}
        <div data-boot-anim className="space-y-3">
          <div
            className="flex items-center gap-2 text-amber-300/80"
            style={MONO}
          >
            <span className="w-1 h-1 rounded-full bg-amber-300 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.3em]">
              Boot Sequence · 5-Stage Engine
            </span>
          </div>
          <h1
            className="text-4xl sm:text-5xl text-white leading-[1.02] tracking-tight"
            style={SERIF}
          >
            Initializing the <em className="not-italic text-amber-300/90">digital&nbsp;twin</em>
          </h1>
        </div>

        {/* Pipeline readout — stages light up sequentially */}
        <div
          data-boot-anim
          ref={stagesRef}
          className="relative rounded-2xl border border-white/[0.08] bg-[#0a0e16]/70 p-5 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.75)] space-y-2"
        >
          {STAGES.map((stage, i) => {
            const activeStage = stageIndex >= i;
            const completedStage = stageIndex > i;
            return (
              <div
                key={stage.key}
                data-stage={i}
                className="flex items-center gap-3 py-1.5 transition-opacity duration-300"
                style={{ opacity: activeStage ? 1 : 0.3 }}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] tabular-nums border transition-all duration-300 ${
                    activeStage
                      ? `${accentText[stage.accent]} border-current bg-current/[0.08]`
                      : 'text-slate-600 border-white/[0.06]'
                  }`}
                  style={MONO}
                >
                  {stage.key}
                </span>
                <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                  <span
                    className={`text-sm leading-none ${activeStage ? 'text-white' : 'text-slate-600'} transition-colors duration-300`}
                    style={SERIF}
                  >
                    {stage.label}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-[0.18em] ${
                      activeStage ? accentText[stage.accent] : 'text-slate-600'
                    } transition-colors duration-300 hidden sm:inline`}
                    style={MONO}
                  >
                    {stage.readout}
                  </span>
                </div>
                <span
                  className={`w-1 h-1 rounded-full transition-opacity duration-300 ${accentDot[stage.accent]} ${
                    activeStage && !completedStage ? 'animate-pulse opacity-100' : completedStage ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div data-boot-anim className="space-y-3">
          <div className="relative h-[2px] w-full rounded-full bg-white/[0.05] overflow-hidden">
            <div
              ref={progressRef}
              className="absolute inset-y-0 left-0 origin-left bg-gradient-to-r from-amber-300 via-sky-300 to-emerald-300"
              style={{ transform: 'scaleX(0)', width: '100%' }}
            />
          </div>

          <div
            className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-slate-500"
            style={MONO}
          >
            <span>Click anywhere to enter →</span>
            <span>{Math.min(stageIndex + 1, STAGES.length)}/{STAGES.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
