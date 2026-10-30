"use client";

import React from 'react';
import {
  Database,
  Layers,
  Cpu,
  Sparkles,
  FileText,
  ArrowRight,
  Workflow,
  CheckCircle2,
} from 'lucide-react';

interface Stage {
  number: string;
  badge: string;
  title: string;
  description: string;
  tags: string[];
  icon: React.ElementType;
}

const STAGES: Stage[] = [
  {
    number: '01',
    badge: 'REMOTE SENSING & HYDROLOGY',
    title: 'Hydro-Meteorological Ingestion',
    description:
      'Ingests CHIRPS rainfall telemetry, 24h storm hyetographs, and Copernicus 30m Digital Elevation Models to calculate basin slope and drainage accumulation.',
    tags: ['Copernicus 30m DEM', 'CHIRPS Ingestion', 'Antecedent Moisture'],
    icon: Database,
  },
  {
    number: '02',
    badge: 'CALIBRATED EXPOSURE',
    title: 'Road Segment Inundation Modeling',
    description:
      'Isotonically calibrated LightGBM assesses Height Above Nearest Drainage (HAND) and river mainstem proximity across all 15,336 OpenStreetMap road links.',
    tags: ['15,336 Road Links', 'HAND Hydrology', '0.023 ECE Precision'],
    icon: Layers,
  },
  {
    number: '03',
    badge: 'TOPOLOGY SOLVER',
    title: 'Monte Carlo Cascade Percolation',
    description:
      'A directed stochastic graph walker executes 10,000 passes across the transportation graph to calculate hospital isolation probabilities and population cutoffs.',
    tags: ['10,000 Iterations', 'NetworkX Directed Graph', '28 Clinics Monitored'],
    icon: Cpu,
  },
  {
    number: '04',
    badge: 'DECISION ENGINE',
    title: 'What-If Counterfactual Sandbox',
    description:
      'Field commanders pin critical road bottlenecks open or closed to test the access ROI of sandbagging, culvert clearing, or mobile Bailey bridges in real time.',
    tags: ['< 0.6s Re-simulation', 'Sandbag Prioritization', 'Bottleneck Isolation'],
    icon: Sparkles,
  },
  {
    number: '05',
    badge: 'TACTICAL DISPATCH',
    title: 'Bilingual Field SitRep Briefing',
    description:
      'Generates one-click structured Situation Reports (PDF, CSV, GeoJSON) in English and Amharic for UN-OCHA and EDRMC, functioning 100% offline at the disaster edge.',
    tags: ['Bilingual Amharic/English', '100% Offline PWA', 'UN-OCHA Formatted'],
    icon: FileText,
  },
];

export function ArchitecturePipelineSection() {
  return (
    <section id="architecture" className="relative py-16 sm:py-24 bg-transparent z-10 overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="space-y-4 text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-cyan-300">
            <Workflow size={13} className="text-cyan-400" />
            <span>HOW IT WORKS • 5-STAGE PIPELINE</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            From Raindrops to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-200">Relief Convoys</span>
          </h2>

          <p
            className="text-sm sm:text-base md:text-lg leading-relaxed text-slate-200 max-w-2xl mx-auto"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            A continuous, verifiable computational pipeline connecting planetary earth observation with physical ground passability.
          </p>
        </div>

        {/* 5-Step Connected Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {STAGES.map((s, idx) => {
            const Icon = s.icon;
            const isLast = idx === STAGES.length - 1;
            return (
              <div
                key={s.number}
                className={`group relative rounded-2xl border border-slate-700/60 bg-[#161B26] p-6 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] flex flex-col justify-between transition-all duration-300 hover:border-cyan-500/50 hover:bg-[#1a2230] ${
                  isLast ? 'md:col-span-2 lg:col-span-2' : ''
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar with Number & Badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                    <span className="text-xs font-mono font-bold tracking-wider text-cyan-400">
                      STAGE {s.number}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/10 font-semibold">
                      {s.badge}
                    </span>
                  </div>

                  {/* Title & Icon */}
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl border border-cyan-500/20 bg-cyan-500/10 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3
                        className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug"
                        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                      >
                        {s.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                    {s.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="mt-5 pt-4 border-t border-white/[0.06] flex flex-wrap gap-1.5">
                  {s.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] font-mono text-slate-300 bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
