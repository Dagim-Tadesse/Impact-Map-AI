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
    badge: '01 • HYDROLOGICAL INGESTION',
    title: 'Connects Rain & Elevation to Real Roads',
    headline: 'Real-Time Hydrologic Exposure',
    description:
      'Floods do not happen in the abstract. ImpactMap AI overlays Copernicus 30m digital elevation, river channel proximity, and storm rainfall directly onto 15,336 OpenStreetMap road segments to calculate precise flood exposure.',
    image: U_CARD('photo-1446776811953-b23d57bd21aa'),
    accent: 'cyan',
    icon: Zap,
    tags: ['Copernicus 30m DEM', '15,336 Road Segments', 'HAND Hydrology'],
  },
  {
    id: 'sol-2',
    badge: '02 • CASCADE TOPOLOGY SOLVER',
    title: 'Predicts Cut-Off Villages & Isolated Clinics',
    headline: 'Topological Disruption Engine',
    description:
      'Standard GPS apps only find individual driving detours. ImpactMap AI analyzes systemic access consequence across the entire basin, predicting which communities become completely cut off and which hospitals lose referral links.',
    image: U_CARD('photo-1524661135-423995f22d0b'),
    accent: 'sky',
    icon: Cpu,
    tags: ['Monte Carlo Graph Solver', 'Cutoff Population Modeling', '28 Health Facilities'],
  },
  {
    id: 'sol-3',
    badge: '03 • WHAT-IF INTERVENTION SANDBOX',
    title: 'Test Interventions Before Dispatching Trucks',
    headline: 'Sandbag & Bridge Defense Simulator',
    description:
      'Field commanders test counterfactual civil defense actions before committing equipment. Click any wadi bottleneck (like Road #7466), assume it protected with sandbags, and watch Gedamaytu Health Center risk drop from 65% to 0%.',
    image: U_CARD('photo-1519494026892-80bbd2d6fd0d'),
    accent: 'emerald',
    icon: Sparkles,
    tags: ['Actionable Resource ROI', 'Culvert & Bridge Defense', '< 0.6s Live Re-simulation'],
  },
  {
    id: 'sol-4',
    badge: '04 • EXPLAINABLE TERRAIN DRIVERS',
    title: 'Transparent Physical Ground Evidence',
    headline: 'Zero Black-Box Hallucination',
    description:
      'Disaster responders must verify why a road is flagged. ImpactMap AI provides verifiable physical drivers for every segment: distance to Awash river mainstem (0m), drainage height (0.0m HAND), and slope runoff concentration.',
    image: U_CARD('photo-1451187580459-43490279c0fa'),
    accent: 'purple',
    icon: ShieldCheck,
    tags: ['Auditable Terrain Telemetry', 'River Channel Proximity', 'Physical Ground Truth'],
  },
  {
    id: 'sol-5',
    badge: '05 • TACTICAL FIELD DEPLOYMENT',
    title: 'Offline Edge PWA & Bilingual SitReps',
    headline: 'Zero-Connectivity Disaster Edge',
    description:
      'Engineered for tactical teams operating in zero-cell-reception zones. Generates one-click bilingual (English/Amharic) SitRep briefing reports directly in browser storage without cloud dependence.',
    image: U_CARD('photo-1584438784894-089d6a62b8fa'),
    accent: 'amber',
    icon: FileText,
    tags: ['100% Offline Edge Cache', 'Bilingual English/Amharic', 'UN-OCHA SitRep Ready'],
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
      className="relative w-full bg-transparent text-slate-100 overflow-hidden z-10"
    >
      <div className="relative flex h-screen min-h-[580px] max-h-[960px] w-full flex-col justify-between pt-16 sm:pt-20 pb-3 sm:pb-6">
        {/* Section Header */}
        <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 text-center space-y-2 sm:space-y-2.5">
          <div className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-widest text-amber-300 font-mono">
            <span>WHAT THE SYSTEM DOES</span>
            <span className="text-white/20">•</span>
            <span>FIVE CORE CAPABILITIES</span>
          </div>
          <h2
            className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            How ImpactMap AI Solves the Crisis
          </h2>
          <p className="mx-auto max-w-2xl text-xs sm:text-sm text-slate-200 leading-relaxed font-normal" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Transforming raw rainfall and satellite radar into life-saving access intelligence across 15,336 road segments.
          </p>
        </div>

        {/* Horizontal Track of 5 Cards */}
        <div className="relative my-auto w-full overflow-hidden py-1 sm:py-2">
          <div
            ref={trackRef}
            className="flex items-stretch gap-5 sm:gap-7 px-4 sm:px-12 pr-12 sm:pr-24 w-max will-change-transform"
          >
            {SOLUTION_CARDS.map((card, idx) => {
              const isCard3 = card.id === 'sol-3';

              return (
                <div
                  key={card.id}
                  className={`w-[85vw] sm:w-[420px] md:w-[460px] lg:w-[480px] flex-shrink-0 rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden backdrop-blur-xl ${
                    idx === activeCardIndex
                      ? 'border-cyan-400/60 bg-[#1e2638] shadow-[0_20px_50px_rgba(0,0,0,0.7)]'
                      : 'border-slate-700/60 bg-[#161B26] hover:border-slate-500'
                  }`}
                >
                  {/* Seamless Bleed Image Header */}
                  <div className="relative h-36 sm:h-44 md:h-48 w-full overflow-hidden bg-slate-900 flex-shrink-0">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161B26] via-black/20 to-black/30" />

                    {/* Minimal Top Header Marks */}
                    <div className="absolute top-3 left-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-200" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      <span>{card.badge.replace(/^\d+\s*•\s*/, '')}</span>
                    </div>

                    <div className="absolute top-2.5 right-4 text-xl sm:text-2xl text-white/70 font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                      0{idx + 1}
                    </div>
                  </div>

                  {/* Card Content Area (No nested boxes) */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3
                        className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight leading-snug"
                        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                      >
                        {card.title}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                        {card.description}
                      </p>
                    </div>

                    {/* Interactive What-If Sandbox in Card 3 (Minimal clean inline ledger) */}
                    {isCard3 && (
                      <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">
                            Cutoff: <strong className="text-white font-normal">{whatIfActive ? '194,800' : '312,400'}</strong>
                          </span>
                          <span className="text-emerald-400">
                            Saved: {whatIfActive ? '+117,600' : '0'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setWhatIfActive(!whatIfActive)}
                          className={`rounded-full px-3 py-1 text-[10px] sm:text-[11px] font-medium transition-all ${
                            whatIfActive
                              ? 'bg-white text-slate-950 font-semibold'
                              : 'border border-white/20 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {whatIfActive ? '✓ Sandbag Active' : '+ Test Sandbag'}
                        </button>
                      </div>
                    )}

                    {/* Feature Specification Line (Clean dot-separated specs, not chunky pill buttons) */}
                    <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] sm:text-[11px] text-slate-400" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {card.tags.map((tag, tIdx) => (
                        <span key={tag} className="flex items-center gap-2">
                          <span>{tag}</span>
                          {tIdx < card.tags.length - 1 && <span className="text-white/20">•</span>}
                        </span>
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
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === activeCardIndex
                    ? 'w-8 sm:w-10 bg-white'
                    : 'w-2.5 sm:w-3 bg-white/15'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
