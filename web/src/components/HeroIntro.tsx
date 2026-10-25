import React, { useEffect, useRef } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, Layers, Cpu, Compass, Sparkles, Radio } from 'lucide-react';
import gsap from 'gsap';
import { use3dTilt } from '../lib/use3dTilt';
import { useTranslation } from 'react-i18next';

interface HeroIntroProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  onLaunchDemo: () => void;
  onExploreMap: () => void;
}

const TiltMethodologyCard: React.FC<{
  icon: React.ReactNode;
  step: string;
  stepColor: string;
  borderColor: string;
  title: string;
  description: string;
}> = ({ icon, step, stepColor, borderColor, title, description }) => {
  const cardRef = use3dTilt<HTMLDivElement>({ maxTilt: 8, scale: 1.02, glare: true });

  return (
    <div
      ref={cardRef}
      className={`hero-anim glass-panel rounded-xl p-4 border-l-2 ${borderColor} card-3d-tilt cursor-default transition-all shadow-[0_8px_30px_rgba(0,0,0,0.5)]`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className={`text-xs font-mono font-semibold uppercase tracking-wider ${stepColor}`}>
          {step}
        </span>
      </div>
      <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-300 leading-normal">{description}</p>
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
      gsap.fromTo(
        containerRef.current.querySelectorAll('.hero-anim'),
        { opacity: 0, y: 20, filter: 'blur(6px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.75, stagger: 0.08, ease: 'power3.out' }
      );
    }
  }, [isExpanded]);

  if (!isExpanded) {
    return (
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 max-sm:top-[124px]">
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800/90 text-slate-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/40 backdrop-blur-md shadow-2xl transition-all duration-200 text-xs font-medium group min-h-[44px]"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">{t('app.mission_briefing')}</span>
          <span className="sm:hidden">{t('app.briefing_short')}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute top-16 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 z-30 pointer-events-auto max-h-[calc(100dvh-72px)] overflow-y-auto overscroll-contain"
    >
      <div className="glass-panel-elevated rounded-2xl p-6 sm:p-8 border border-white/15 relative overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.85)]">
        {/* Ambient background glow */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Collapse */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="hero-anim">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>{t('hero.badge')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              {t('hero.description')}
            </p>
          </div>

          <button
            onClick={onToggleExpand}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Minimize Briefing"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        </div>

        {/* The Three Non-Mixed Quantities with 3D Specular Glare Tilt */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          <TiltMethodologyCard
            icon={<Cpu className="w-4 h-4 text-cyan-400" />}
            step={t('hero.step1_step')}
            stepColor="text-cyan-300"
            borderColor="border-l-cyan-400"
            title={t('hero.step1_title')}
            description={t('hero.step1_desc')}
          />

          <TiltMethodologyCard
            icon={<Compass className="w-4 h-4 text-amber-400" />}
            step={t('hero.step2_step')}
            stepColor="text-amber-300"
            borderColor="border-l-amber-400"
            title={t('hero.step2_title')}
            description={t('hero.step2_desc')}
          />

          <TiltMethodologyCard
            icon={<Layers className="w-4 h-4 text-rose-400" />}
            step={t('hero.step3_step')}
            stepColor="text-rose-300"
            borderColor="border-l-rose-400"
            title={t('hero.step3_title')}
            description={t('hero.step3_desc')}
          />
        </div>

        {/* Action Buttons */}
        <div className="hero-anim flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={onLaunchDemo}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-sm shadow-[0_0_24px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>{t('hero.launch_replay')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onExploreMap}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-sm font-semibold transition-colors"
            >
              {t('hero.explore_custom')}
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{t('hero.validated_badge')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
