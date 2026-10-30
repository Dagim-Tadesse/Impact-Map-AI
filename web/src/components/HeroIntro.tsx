import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, Layers, Cpu, Compass, Radio, Play } from 'lucide-react';
import gsap from 'gsap';
import { use3dTilt } from '../lib/use3dTilt';
import { useTranslation } from 'react-i18next';

interface HeroIntroProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  onLaunchDemo: () => void;
  onExploreMap: () => void;
}

const SERIF: React.CSSProperties = { fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 };
const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
const SANS: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

// Reusable landing-style counter
function AnimatedCount({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setVal(to);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const duration = 1400;
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setVal(Math.round(to * eased));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [to]);

  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

const MethodologyCard: React.FC<{
  index: string;
  accent: 'sky' | 'amber' | 'rose';
  title: string;
  description: string;
  icon: React.ReactNode;
  hint: string;
}> = ({ index, accent, title, description, icon, hint }) => {
  const cardRef = use3dTilt<HTMLDivElement>({ maxTilt: 6, scale: 1.015, glare: true });

  const accentText =
    accent === 'sky' ? 'text-sky-300' : accent === 'amber' ? 'text-amber-300' : 'text-rose-300';
  const accentDot =
    accent === 'sky' ? 'bg-sky-300' : accent === 'amber' ? 'bg-amber-300' : 'bg-rose-300';

  return (
    <div
      ref={cardRef}
      className="hero-anim group relative rounded-xl border border-white/[0.08] bg-[#0a0e16]/80 p-5 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.55)] transition-all duration-300 hover:border-white/[0.18] hover:-translate-y-0.5 card-3d-tilt overflow-hidden"
    >
      {/* Soft accent corner glow */}
      <div
        aria-hidden="true"
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"
        style={{
          background:
            accent === 'sky'
              ? 'radial-gradient(circle, rgba(56,189,248,0.35), transparent 70%)'
              : accent === 'amber'
              ? 'radial-gradient(circle, rgba(251,191,36,0.35), transparent 70%)'
              : 'radial-gradient(circle, rgba(244,63,94,0.3), transparent 70%)',
        }}
      />

      <div className="relative flex items-center justify-between mb-3">
        <div className={`flex items-center gap-1.5 ${accentText}`} style={MONO}>
          <span className={`w-1 h-1 rounded-full ${accentDot} animate-pulse`} />
          <span className="text-[10px] uppercase tracking-[0.24em]">{index}</span>
        </div>
        <span className="opacity-60 group-hover:opacity-100 transition-opacity">{icon}</span>
      </div>

      <h3 className="relative text-[22px] text-white leading-tight mb-2" style={SERIF}>
        {title}
      </h3>

      <p className="relative text-[12px] leading-relaxed text-slate-400 mb-3" style={SANS}>
        {description}
      </p>

      <div
        className={`relative text-[9px] uppercase tracking-[0.22em] ${accentText} opacity-70`}
        style={MONO}
      >
        {hint}
      </div>
    </div>
  );
};

export const HeroIntro: React.FC<HeroIntroProps> = ({
  isExpanded,
  onToggleExpand,
  onLaunchDemo,
  onExploreMap,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && containerRef.current) {
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduced) return;
      gsap.fromTo(
        containerRef.current.querySelectorAll('.hero-anim'),
        { opacity: 0, y: 20, filter: 'blur(6px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.75, stagger: 0.08, ease: 'power3.out' }
      );
    }
  }, [isExpanded]);

  if (!isExpanded) {
    return (
      <div className="absolute top-[88px] left-1/2 -translate-x-1/2 z-20 max-sm:top-[128px]">
        <button
          onClick={onToggleExpand}
          className="group inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-[#0a0e16]/85 px-4 py-2 text-[11px] font-medium text-slate-300 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-amber-300/40 hover:bg-[#0a0e16]/95 hover:text-white min-h-[44px]"
          style={SANS}
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">{t('app.mission_briefing')}</span>
          <span className="sm:hidden">{t('app.briefing_short')}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 transition-transform group-hover:translate-y-0.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute top-[80px] left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 z-30 pointer-events-auto max-h-[calc(100dvh-96px)] overflow-y-auto overscroll-contain"
    >
      <div
        className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0a0e16]/92 p-7 sm:p-10 backdrop-blur-2xl shadow-[0_32px_100px_rgba(0,0,0,0.9)]"
      >
        {/* Ambient atmospheric wash */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 15% 10%, rgba(251,191,36,0.08), transparent 55%), radial-gradient(ellipse at 90% 90%, rgba(56,189,248,0.08), transparent 60%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-4 mb-8">
          <div className="hero-anim flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 mb-5" style={MONO}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-amber-300/80">
                {t('hero.badge')}
              </span>
              <span className="h-3 w-px bg-white/10 mx-1" />
              <span className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                Awash Basin · Live Twin
              </span>
            </div>

            <h1
              className="text-4xl sm:text-6xl tracking-tight text-white leading-[1.02]"
              style={SERIF}
            >
              {t('hero.title').split(' ').map((word, i, arr) => {
                const isLast = i === arr.length - 1;
                const emphasize = i === Math.floor(arr.length / 2);
                return (
                  <span key={i}>
                    {emphasize ? (
                      <em className="not-italic text-amber-300/90">{word}</em>
                    ) : (
                      word
                    )}
                    {!isLast && ' '}
                  </span>
                );
              })}
            </h1>

            <p
              className="mt-5 max-w-2xl text-[13px] sm:text-sm leading-relaxed text-slate-400"
              style={SANS}
            >
              {t('hero.description')}
            </p>
          </div>

          <button
            onClick={onToggleExpand}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white hover:border-white/20 transition-all"
            title="Minimize Briefing"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>

        {/* Live quick-metrics strip — landing's AnimatedCount style */}
        <div className="hero-anim relative grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Road Links', value: 3420, suffix: '', accent: 'text-sky-300' },
            { label: 'Facilities', value: 89, suffix: '', accent: 'text-amber-300' },
            { label: 'Monte Carlo', value: 200, suffix: '', accent: 'text-rose-300' },
            { label: 'Calibration ECE', value: 23, suffix: '', accent: 'text-emerald-300', prefix: '0.0' },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-white/[0.07] bg-black/25 p-3.5 transition-all duration-300 hover:border-white/[0.15]"
            >
              <div
                className="text-[9px] uppercase tracking-[0.24em] text-slate-500 mb-1.5"
                style={MONO}
              >
                {metric.label}
              </div>
              <div
                className={`text-2xl ${metric.accent} tabular-nums leading-none`}
                style={SERIF}
              >
                <AnimatedCount to={metric.value} prefix={metric.prefix} suffix={metric.suffix} />
              </div>
            </div>
          ))}
        </div>

        {/* Three-stage methodology */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <MethodologyCard
            index={t('hero.step1_step')}
            accent="sky"
            title={t('hero.step1_title')}
            description={t('hero.step1_desc')}
            icon={<Cpu className="w-4 h-4 text-sky-300" />}
            hint="Ground-truth benchmarked"
          />
          <MethodologyCard
            index={t('hero.step2_step')}
            accent="amber"
            title={t('hero.step2_title')}
            description={t('hero.step2_desc')}
            icon={<Compass className="w-4 h-4 text-amber-300" />}
            hint="Operator assumption"
          />
          <MethodologyCard
            index={t('hero.step3_step')}
            accent="rose"
            title={t('hero.step3_title')}
            description={t('hero.step3_desc')}
            icon={<Layers className="w-4 h-4 text-rose-300" />}
            hint="Monte Carlo synthesis"
          />
        </div>

        {/* Action row */}
        <div className="hero-anim relative flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onLaunchDemo}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-slate-900 transition-all duration-300 hover:scale-105 hover:bg-amber-50 active:scale-95"
              style={SANS}
            >
              <Play className="w-3.5 h-3.5 text-slate-900 fill-slate-900" />
              <span>{t('hero.launch_replay')}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              onClick={onExploreMap}
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-slate-300 backdrop-blur-md transition-all duration-300 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
              style={SANS}
            >
              {t('hero.explore_custom')}
            </button>
          </div>

          <div
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-500"
            style={MONO}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t('hero.validated_badge')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
