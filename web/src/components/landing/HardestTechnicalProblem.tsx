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
    category: 'Frontend',
    tech: 'React 19, TS, Vite',
    desc: 'MapLibre GL, GSAP, Web Audio API',
    icon: <Layers size={16} className="text-cyan-400" />,
  },
  {
    category: 'Backend Engine',
    tech: 'FastAPI, NetworkX',
    desc: 'Monte Carlo Dijkstra, GeoPandas',
    icon: <Cpu size={16} className="text-sky-400" />,
  },
  {
    category: 'AI & Remote Sensing',
    tech: 'Sentinel-1 SAR, LightGBM',
    desc: 'WorldPop 100m, CHIRPS telemetry',
    icon: <Activity size={16} className="text-teal-400" />,
  },
  {
    category: 'Edge Resilience',
    tech: 'MSW Offline PWA',
    desc: 'IndexedDB caching & PDF SitRep',
    icon: <ShieldCheck size={16} className="text-emerald-400" />,
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
      className="relative py-10 sm:py-14 md:py-16 bg-[#060a14] border-t border-white/5 z-10 overflow-hidden"
    >
      {/* Background radial accent glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(6,182,212,0.18), transparent 70%), radial-gradient(ellipse at 80% 80%, rgba(14,165,233,0.1), transparent 60%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* The Hardest Technical Problem Solved Card */}
        <div
          ref={cardRef}
          className="rounded-2xl sm:rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-[#091426]/95 via-[#0c1c36]/90 to-[#091426]/95 p-5 sm:p-7 md:p-8 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <Badge
                variant="outline"
                className="inline-flex items-center gap-1.5 rounded-md border-cyan-500/30 bg-cyan-950/80 px-2.5 py-1 font-mono text-[10px] sm:text-xs font-bold text-cyan-300"
              >
                <Sparkles size={13} className="text-cyan-400" />
                <span>THE HARDEST TECHNICAL PROBLEM WE SOLVED</span>
              </Badge>

              <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                De-conflating Flood Probability from Physical Road Closure
              </h3>

              <p className="text-xs sm:text-sm md:text-base leading-relaxed text-slate-300 font-normal">
                Standard flood models naively multiply water presence by road closure, creating
                crippling false alarms or lethal blind spots. ImpactMap AI solved this by engineering
                a{' '}
                <strong className="text-cyan-300 font-semibold">
                  two-stage calibrated Monte Carlo solver
                </strong>
                : LightGBM estimates pure surface inundation against Sentinel-1 SAR observations,
                while a discrete stochastic graph walker samples real physical passability across
                10,000 runs. Decision-makers see water risk, physical cutoff, and access loss as three
                transparent, unmixed quantities.
              </p>
            </div>

            {/* Calibration Error Metric Badge */}
            <div
              ref={metricRef}
              className="rounded-xl sm:rounded-2xl border border-cyan-500/30 bg-black/70 p-4 sm:p-5 text-center min-w-[170px] sm:min-w-[210px] w-full md:w-auto shadow-[0_0_24px_rgba(6,182,212,0.15)] flex-shrink-0"
            >
              <p className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-slate-400">
                Calibration Error
              </p>
              <p className="font-display text-3xl sm:text-4xl font-black text-cyan-400 mt-1">
                0.023 ECE
              </p>
              <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] sm:text-xs text-emerald-400 font-mono">
                <CheckCircle2 size={13} />
                <span>48% tighter than raw baseline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack Matrix (4 Cards) */}
        <div
          ref={techGridRef}
          className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {TECH_STACK.map((stack) => (
            <div
              key={stack.category}
              className="hardest-tech-card group rounded-xl sm:rounded-2xl border border-slate-800/80 bg-[#080d19]/80 p-4 sm:p-5 backdrop-blur-md transition-all duration-300 hover:border-cyan-500/40 hover:bg-[#0b1324] hover:shadow-[0_4px_20px_rgba(6,182,212,0.12)]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cyan-400">
                  {stack.category}
                </span>
                <span className="transition-transform duration-300 group-hover:scale-110">
                  {stack.icon}
                </span>
              </div>
              <p className="mt-2 font-display text-sm sm:text-base font-bold text-white group-hover:text-cyan-200 transition-colors">
                {stack.tech}
              </p>
              <p className="mt-1 text-[11px] sm:text-xs text-slate-400 font-normal">
                {stack.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
