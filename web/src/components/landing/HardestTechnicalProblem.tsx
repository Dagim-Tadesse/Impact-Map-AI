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
          <div className="border-b border-white/[0.08] pb-3 sm:pb-4 flex items-center justify-between text-xs text-slate-300">
            <span className="text-amber-300 font-mono text-xs uppercase tracking-wider">The Technical Innovation</span>
            <span className="text-slate-300 text-xs font-mono font-semibold">WHY EXISTING TOOLS FAIL</span>
          </div>

          {/* 2-Column Problem & Calibration Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-start">
            {/* Left Column: Algorithmic Narrative */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-5 text-left">
              <h3
                className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.08]"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                Separating Water Presence From Physical Access Loss
              </h3>

              <p className="text-sm sm:text-base leading-relaxed text-slate-200 max-w-2xl font-normal" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Traditional flood systems naively assume that where there is water, roads are closed—and where it is dry, roads are open. But on the ground, a relief convoy can safely ford 5cm of sheetflow, while a dry hospital whose only wadi bridge collapsed 10 kilometers away is <span className="text-white font-semibold">100% cut off</span>.
              </p>

              <p className="text-sm sm:text-base leading-relaxed text-slate-200 max-w-2xl font-normal" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                ImpactMap AI decoupled this problem with a <span className="text-amber-300 font-semibold">two-tier architecture</span>: first calculating physical inundation probability across Copernicus 30m terrain, then executing a 10,000-pass Monte Carlo stochastic percolation solver across the full road network graph.
              </p>

              <p className="text-base sm:text-lg text-slate-100 italic" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                &ldquo;Responders see water exposure, road closure risk, and population cutoff as transparent, unmixed quantities.&rdquo;
              </p>
            </div>

            {/* Right Column: Calibration Benchmark Ledger (Preserving metricRef) */}
            <div
              ref={metricRef}
              className="lg:col-span-4 w-full rounded-2xl border border-slate-700/60 bg-[#161B26] p-5 sm:p-6 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] space-y-4"
            >
              <p className="text-xs uppercase tracking-wider text-slate-300 font-mono font-semibold">
                Performance Benchmark
              </p>

              <div>
                <p className="text-3xl sm:text-4xl lg:text-5xl text-white font-extrabold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                  &lt; 0.6s
                </p>
                <p className="mt-1 text-xs text-slate-200 font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Live Monte Carlo Simulation Speed
                </p>
                <p className="mt-0.5 text-[11px] text-slate-300" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Runs 10,000 network graph realizations across 15,336 segments in real-time
                </p>
              </div>

              <div className="pt-3 border-t border-white/[0.08] space-y-1 text-xs text-slate-200" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <p className="text-slate-100 font-semibold">0.023 Expected Calibration Error</p>
                <p className="text-slate-300 text-[11px]">Validated against Copernicus Sentinel-1 SAR imagery</p>
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
              className="hardest-tech-card group border-l border-slate-600 pl-4 sm:pl-5 py-1 space-y-1.5 transition-all duration-300 hover:border-cyan-400"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-300" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {stack.category}
                </span>
                <span className="text-slate-400 transition-colors group-hover:text-cyan-300">
                  {stack.icon}
                </span>
              </div>
              <p className="text-base sm:text-lg text-white font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                {stack.tech}
              </p>
              <p className="text-xs text-slate-200 leading-snug font-sans">
                {stack.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
