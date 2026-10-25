"use client";

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Zap,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Radio,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const U_CARD = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=700&q=75`;

interface SolutionCard {
  id: string;
  badge: string;
  title: string;
  headline: string;
  description: string;
  image: string;
  accent: string;
  icon: React.ElementType;
  tags: string[];
}

const SOLUTION_CARDS: SolutionCard[] = [
  {
    id: 'sol-1',
    badge: '01 • HYDRO-MET ENGINE',
    title: 'Stress Storms in Real-Time',
    headline: 'Real-Time Hydrologic Exposure',
    description:
      'Input millimeter precipitation, storm duration, and antecedent soil moisture. The calibrated LightGBM model calculates flood exposure across all 3,420 road links in under 50 milliseconds.',
    image: U_CARD('photo-1446776811953-b23d57bd21aa'),
    accent: 'cyan',
    icon: Zap,
    tags: ['Sentinel-1 SAR Ground Truth', '< 48ms Execution', '3,420 Road Links Scored'],
  },
  {
    id: 'sol-2',
    badge: '02 • CASCADE PROPAGATION',
    title: 'Hour-by-Hour Network Cascade',
    headline: 'Topological Vulnerability Solver',
    description:
      'Watch failures domino through the Awash transportation graph. Rank-delta indicators show which towns degrade from accessible, to 4x detour delay, to complete health isolation.',
    image: U_CARD('photo-1524661135-423995f22d0b'),
    accent: 'sky',
    icon: Cpu,
    tags: ['10,000 Monte Carlo Iterations', 'NetworkX Directed Graph', '89 Clinics Monitored'],
  },
  {
    id: 'sol-3',
    badge: '03 • WHAT-IF SANDBOX',
    title: 'Counterfactual Intervention Sandbox',
    headline: 'Test Sandbags & Mobile Bridges',
    description:
      'Test where a single sandbag barricade or mobile Bailey bridge pays back the most access. Pin road links open or closed and instantly inspect how many people retain hospital connectivity.',
    image: U_CARD('photo-1519494026892-80bbd2d6fd0d'),
    accent: 'emerald',
    icon: Sparkles,
    tags: ['Immediate Population ROI', 'Interactive Re-routing', 'Bridge Culvert Defense'],
  },
  {
    id: 'sol-4',
    badge: '04 • SATELLITE GROUND GATE',
    title: 'Calibrated SAR Classification',
    headline: 'Isotonic Inundation Honesty',
    description:
      'De-conflates water presence from physical road closure. Calibrated against Copernicus Sentinel-1 SAR observations to achieve an industry-leading 0.023 Expected Calibration Error.',
    image: U_CARD('photo-1451187580459-43490279c0fa'),
    accent: 'purple',
    icon: ShieldCheck,
    tags: ['0.023 ECE Precision', 'Leave-One-Event-Out Validation', 'Zero Hallucination'],
  },
  {
    id: 'sol-5',
    badge: '05 • TACTICAL ZERO-CONNECTIVITY',
    title: 'Offline PWA & Bilingual Field SitReps',
    headline: 'Zero-Cloud Field Convoys',
    description:
      'Engineered for tactical teams operating in zero-cell-reception zones. Generates offline bilingual Amharic/English PDF dispatch manifests directly in browser memory without cloud dependence.',
    image: U_CARD('photo-1584438784894-089d6a62b8fa'),
    accent: 'amber',
    icon: FileText,
    tags: ['100% Offline Edge Cache', 'Amharic / English UN-OCHA', 'IndexedDB Persistence'],
  },
];

export default function HorizontalSolutionShowcase({
  onLaunchDemo,
}: {
  onLaunchDemo?: () => void;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [whatIfActive, setWhatIfActive] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const getScrollDistance = () => {
        const extra = window.innerWidth < 640 ? 40 : 100;
        return Math.max(0, track.scrollWidth - window.innerWidth + extra);
      };

      const tween = gsap.to(track, {
        x: () => -getScrollDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.max(1000, getScrollDistance())}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const index = Math.min(
              SOLUTION_CARDS.length - 1,
              Math.floor(self.progress * SOLUTION_CARDS.length)
            );
            setActiveCardIndex(index);
          },
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
      };
    }, section);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={sectionRef}
      className="relative w-full bg-[#07090e] text-slate-100 overflow-hidden z-10"
    >
      <div className="relative flex h-screen min-h-[580px] max-h-[960px] w-full flex-col justify-between pt-16 sm:pt-20 pb-3 sm:pb-6">
        {/* Section Header */}
        <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 text-center space-y-1 sm:space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Five Breakthrough Capabilities
          </h2>
          <p className="mx-auto max-w-2xl text-xs sm:text-sm text-slate-300">
            Scroll horizontally through the operational toolset designed for high-stress crisis command rooms.
          </p>
        </div>

        {/* Horizontal Track of 5 Cards */}
        <div className="relative my-auto w-full overflow-hidden py-1 sm:py-2">
          <div
            ref={trackRef}
            className="flex items-stretch gap-4 sm:gap-6 px-4 sm:px-12 pr-12 sm:pr-24 w-max will-change-transform"
          >
            {SOLUTION_CARDS.map((card, idx) => {
              const Icon = card.icon;
              const isCard3 = card.id === 'sol-3';

              return (
                <div
                  key={card.id}
                  className={`w-[84vw] sm:w-[400px] md:w-[450px] lg:w-[470px] flex-shrink-0 rounded-2xl sm:rounded-3xl border p-3.5 sm:p-5 md:p-6 backdrop-blur-xl shadow-2xl transition-all duration-300 flex flex-col justify-between ${
                    idx === activeCardIndex
                      ? 'border-cyan-400/50 bg-[#0c1427]/95 shadow-[0_0_35px_rgba(6,182,212,0.18)] scale-[1.01]'
                      : 'border-slate-800 bg-[#090e1c]/85 hover:border-slate-700'
                  }`}
                >
                  {/* Card Visual / Image Header */}
                  <div className="relative h-28 sm:h-36 md:h-40 w-full overflow-hidden rounded-xl sm:rounded-2xl bg-slate-900 flex-shrink-0">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090e1c] via-transparent to-black/40" />

                    <div className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-lg bg-black/75 px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono text-[9px] sm:text-[10px] font-semibold text-cyan-300 backdrop-blur">
                      <Icon size={11} className="text-cyan-400" />
                      <span>{card.badge}</span>
                    </div>

                    <div className="absolute top-2 right-2 rounded-full bg-cyan-950/80 px-2 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold text-cyan-400 border border-cyan-500/30">
                      0{idx + 1} / 05
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="mt-2.5 sm:mt-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h3 className="font-display text-base sm:text-xl md:text-2xl font-bold text-white leading-tight">
                        {card.title}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-300 line-clamp-2 sm:line-clamp-3">
                        {card.description}
                      </p>
                    </div>

                    {/* Interactive What-If Sandbox in Card 3 */}
                    {isCard3 && (
                      <div className="rounded-xl border border-emerald-500/30 bg-[#071714]/90 p-2 sm:p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] sm:text-[10px] font-bold text-emerald-400">
                            LIVE WHAT-IF INTERVENTION TEST
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setWhatIfActive(!whatIfActive);
                            }}
                            className={`rounded-full px-2 py-0.5 sm:px-2.5 sm:py-0.5 font-mono text-[9px] sm:text-[10px] font-bold transition-all ${
                              whatIfActive
                                ? 'bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                                : 'border border-emerald-500/50 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60'
                            }`}
                          >
                            {whatIfActive ? '✓ Pin Applied' : '+ Pin Road Open'}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                          <div>
                            <span className="text-slate-400">Cutoff: </span>
                            <span className="font-bold text-rose-400">
                              {whatIfActive ? '194,800' : '312,400'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Saved: </span>
                            <span className="font-bold text-emerald-400">
                              {whatIfActive ? '+117,600' : '0'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Feature Tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {card.tags.map((tag) => (
                        <div
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-md border border-white/5 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] text-cyan-300"
                        >
                          <CheckCircle2 size={10} className="text-cyan-400" />
                          <span>{tag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Horizontal Progress Indicators */}
        <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 flex items-center justify-center sm:justify-start">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {SOLUTION_CARDS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeCardIndex
                    ? 'w-8 sm:w-10 bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                    : 'w-2.5 sm:w-3 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
