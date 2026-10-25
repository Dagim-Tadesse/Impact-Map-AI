import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  X,
  Award,
  Layers,
  Hospital,
  GitCompare,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../state/useAppStore';
import { useTranslation } from 'react-i18next';

interface JudgeTourProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenJudgeModal: () => void;
}

interface TourStep {
  title: string;
  rubric: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
  duration: number; // seconds in auto-play
}

export const JudgeTour: React.FC<JudgeTourProps> = ({ isOpen, onClose, onOpenJudgeModal }) => {
  const { t } = useTranslation();
  const {
    setIs3DView,
    setActiveTab,
    setSelectedFacilityId,
    setSelectedSegmentId,
    setSelectedCommunityId,
    setDrawerOpen,
    addForcedOpen,
    clearWhatIf,
    currentCacheKey,
    setCurrentCacheKey,
    setBaseCacheKey,
  } = useAppStore();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);

  const steps: TourStep[] = [
    {
      title: t('tour.step1_title'),
      rubric: t('tour.step1_rubric'),
      badge: t('tour.step1_badge'),
      description: t('tour.step1_desc'),
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
      duration: 14,
    },
    {
      title: t('tour.step2_title'),
      rubric: t('tour.step2_rubric'),
      badge: t('tour.step2_badge'),
      description: t('tour.step2_desc'),
      icon: <Hospital className="w-4 h-4 text-sky-400" />,
      duration: 14,
    },
    {
      title: t('tour.step3_title'),
      rubric: t('tour.step3_rubric'),
      badge: t('tour.step3_badge'),
      description: t('tour.step3_desc'),
      icon: <GitCompare className="w-4 h-4 text-emerald-400" />,
      duration: 14,
    },
    {
      title: t('tour.step4_title'),
      rubric: t('tour.step4_rubric'),
      badge: t('tour.step4_badge'),
      description: t('tour.step4_desc'),
      icon: <TrendingUp className="w-4 h-4 text-amber-400" />,
      duration: 14,
    },
  ];

  // Execute step action on change
  useEffect(() => {
    if (!isOpen) return;


    if (currentStepIndex === 0) {
      // Step 1: 3D map overview
      setIs3DView(true);
      setActiveTab('results');
      setSelectedFacilityId(null);
      setSelectedSegmentId(null);
      setSelectedCommunityId(null);
      setDrawerOpen(null);
      window.dispatchEvent(
        new CustomEvent('map:fitBounds', {
          detail: {
            coordinates: [
              [39.8, 8.6],
              [40.8, 9.4],
            ],
          },
        })
      );
    } else if (currentStepIndex === 1) {
      // Step 2: Select facility and show detour
      setActiveTab('results');
      setSelectedFacilityId('fac_awash_hospital');
      setDrawerOpen('facility');
    } else if (currentStepIndex === 2) {
      // Step 3: What-If simulation
      clearWhatIf();
      addForcedOpen(1024);
      setDrawerOpen('whatif');
      if (!currentCacheKey) {
        setCurrentCacheKey('demo_whatif_sandbagged');
        setBaseCacheKey('demo_base_flood');
      }
    } else if (currentStepIndex === 3) {
      // Step 4: ML Rigor HUD
      setActiveTab('evidence');
      setDrawerOpen(null);
    }
  }, [currentStepIndex, isOpen]);

  // Auto-play timer
  useEffect(() => {
    if (!isOpen || !isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const currentDuration = steps[currentStepIndex].duration * 1000;
    const intervalMs = 100;
    let elapsed = 0;

    timerRef.current = window.setInterval(() => {
      elapsed += intervalMs;
      setProgress(Math.min(100, (elapsed / currentDuration) * 100));

      if (elapsed >= currentDuration) {
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
          setProgress(0);
        } else {
          setIsPlaying(false);
          setProgress(100);
        }
      }
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPlaying, currentStepIndex]);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onOpenJudgeModal();
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-xl animate-in slide-in-from-bottom-6 duration-300">
      <div className="relative overflow-hidden rounded-3xl glass-panel border border-cyan-400/40 p-4 sm:p-5 shadow-[0_0_50px_rgba(6,182,212,0.35)] bg-[#070a13]/95 backdrop-blur-2xl">
        {/* Progress bar line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Award className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  {t('tour.header_title')}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-bold">
                  {currentStep.badge}
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">
                {currentStep.rubric}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
              title={isPlaying ? 'Pause auto-tour' : 'Resume auto-tour'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                onClose();
              }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
              title="Exit Tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-1.5 py-1">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            {currentStep.icon}
            <span>{currentStep.title}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/10">
          <div className="flex items-center gap-1">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentStepIndex(idx);
                  setProgress(0);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-6 bg-cyan-400'
                    : idx < currentStepIndex
                    ? 'w-2 bg-emerald-400/80'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                title={`Go to Step ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="min-h-[36px] px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold flex items-center gap-1 transition-colors border border-white/10"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{t('tour.prev')}</span>
            </button>

            <button
              onClick={handleNext}
              className="min-h-[36px] px-3.5 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            >
              <span>{currentStepIndex === steps.length - 1 ? t('tour.open_telemetry') : t('tour.next')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
