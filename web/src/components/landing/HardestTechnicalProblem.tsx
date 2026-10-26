import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, Cpu, Layers, Activity, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface TechStackItem {
  category: string;
  tech: string;
  desc: string;
  icon: React.ReactNode;
}

const TECH_STACK: TechStackItem[] = [
  {
    category: 'Frontend Architecture',
    tech: 'React 19, TS, Vite',
    desc: 'MapLibre GL 3D vector, GSAP, Web Audio API',
    icon: <Layers size={15} className="text-slate-400" />,
  },
  {
    category: 'Simulation Engine',
    tech: 'FastAPI, NetworkX',
    desc: 'Monte Carlo Dijkstra, GeoPandas spatial graph',
    icon: <Cpu size={15} className="text-slate-400" />,
  },
  {
    category: 'Earth Observation & ML',
    tech: 'Sentinel-1 SAR, LightGBM',
    desc: 'WorldPop 100m, CHIRPS precipitation ingestion',
    icon: <Activity size={15} className="text-slate-400" />,
  },
  {
    category: 'Edge & Offline Field',
    tech: 'PWA Edge Cache',
    desc: 'IndexedDB storage & Amharic / English PDF dispatch',
    icon: <ShieldCheck size={15} className="text-slate-400" />,
  },
];

export function HardestTechnicalProblem() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const metricRef = useRef<HTMLDivElement>(null);
  const techGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Main problem card entrance
      gsap.fromTo(
        cardRef.current,
        { y: 35, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Metric box entrance
      if (metricRef.current) {
        gsap.fromTo(
          metricRef.current,
          { scale: 0.9, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.7,
            delay: 0.15,
            ease: 'back.out(1.4)',
            scrollTrigger: {
              trigger: cardRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Tech Stack cards staggered entrance
      const cards = techGridRef.current?.querySelectorAll('.hardest-tech-card');
      if (cards && cards.length > 0) {
        gsap.fromTo(
          cards,
          { y: 30, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: techGridRef.current,
              start: 'top 88%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="hardest-problem"
      ref={sectionRef}
      className="relative py-14 sm:py-20 md:py-24 bg-transparent z-10 overflow-hidden"
    >
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Main Problem Deep-Dive Block (Preserving cardRef for GSAP scroll trigger) */}
        <div ref={cardRef} className="space-y-6">
          {/* Eyebrow Header */}
          <div className="border-b border-white/[0.08] pb-3 sm:pb-4 flex items-center justify-between text-xs text-slate-400">
            <span className="text-slate-300 font-serif italic text-sm">Algorithmic Formulation</span>
            <span className="text-slate-400 text-xs">Physical Passability vs. Water Presence</span>
          </div>

          {/* 2-Column Problem & Calibration Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-start">
            {/* Left Column: Algorithmic Narrative */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-5 text-left">
              <h3 className="text-2xl sm:text-4xl lg:text-5xl text-white font-normal tracking-tight leading-[1.08]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                De-conflating Flood Probability from Physical Road Closure
              </h3>

              <p className="text-sm sm:text-base leading-relaxed text-slate-300/85 max-w-2xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Standard flood models naively multiply water presence by road closure, creating crippling false alarms or lethal blind spots. ImpactMap AI solved this by engineering a <span className="text-white font-medium">two-stage calibrated Monte Carlo solver</span>: LightGBM estimates pure surface inundation against Sentinel-1 SAR observations, while a discrete stochastic graph walker samples real physical passability across 10,000 runs.
              </p>

              <p className="text-base sm:text-lg text-slate-300 italic font-serif" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                &ldquo;Decision-makers see water risk, physical cutoff, and access loss as three transparent, unmixed quantities.&rdquo;
              </p>
            </div>

            {/* Right Column: Calibration Benchmark Ledger (Preserving metricRef) */}
            <div
              ref={metricRef}
              className="lg:col-span-4 w-full rounded-2xl border border-white/[0.08] bg-[#0a0e16]/85 p-5 sm:p-6 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.5)] space-y-3"
            >
              <p className="text-xs uppercase tracking-wider text-slate-400 font-mono">
                Calibration Benchmark
              </p>

              <div>
                <p className="text-3xl sm:text-4xl lg:text-5xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  0.023 ECE
                </p>
                <p className="mt-1 text-xs text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Expected Calibration Error against Sentinel-1 SAR observations
                </p>
              </div>

              <div className="pt-3 border-t border-white/[0.08] space-y-1 text-xs text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <p className="text-slate-300">48% variance reduction over raw flood baselines</p>
                <p className="text-slate-500 text-[11px]">Leave-one-event-out holdout validation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack Matrix (Clean Architectural Specification Columns, Preserving techGridRef) */}
        <div
          ref={techGridRef}
          className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
        >
          {TECH_STACK.map((stack) => (
            <div
              key={stack.category}
              className="hardest-tech-card group border-l border-white/10 pl-4 sm:pl-5 py-1 space-y-1.5 transition-all duration-300 hover:border-white/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-slate-400" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {stack.category}
                </span>
                <span className="text-slate-500 transition-colors group-hover:text-slate-300">
                  {stack.icon}
                </span>
              </div>
              <p className="text-base sm:text-lg text-white font-normal" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                {stack.tech}
              </p>
              <p className="text-xs text-slate-400 leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {stack.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
