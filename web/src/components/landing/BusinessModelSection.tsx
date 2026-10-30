"use client";

import React from 'react';
import {
  Briefcase,
  Building,
  Truck,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

interface ModelTier {
  tier: string;
  badge: string;
  title: string;
  target: string;
  description: string;
  deliverables: string[];
  pricing: string;
  accent: string;
}

const TIERS: ModelTier[] = [
  {
    tier: 'Tier 01',
    badge: 'GOVERNMENT & UN SLA',
    title: 'Institutional Defense SLA',
    target: 'EDRMC • Regional Disaster Bureaus • UN-OCHA Horn of Africa',
    description:
      'Mission-critical deployment integrating satellite telemetry directly into national emergency command centers.',
    deliverables: [
      'Custom basin-wide hydrological calibration (HAND & Sentinel-1 SAR)',
      'Automated 24h storm hyetograph & CHIRPS rainfall ingestion',
      'Guaranteed 24/7 SLA during active Kiremt and Belg flood crests',
    ],
    pricing: 'Institutional Contract / Gov Disaster Budget',
    accent: 'amber',
  },
  {
    tier: 'Tier 02',
    badge: 'HUMANITARIAN FLEET API',
    title: 'Fleet Logistics Integration',
    target: 'WFP • Red Cross Society • MSF • Logistics Clusters',
    description:
      'Routing API for 30-ton relief trucks to avoid collapsed bridges and impassable water depths.',
    deliverables: [
      'Real-time corridor failure & detour penalty optimization API',
      'Heavy-convoy bridge passability & clearance scoring',
      'Automated route hazard alerts for dispatch drivers',
    ],
    pricing: 'Per-fleet / API Usage Licensing',
    accent: 'sky',
  },
  {
    tier: 'Tier 03',
    badge: 'LOCAL PUBLIC GOOD',
    title: 'Community Field Edge',
    target: 'Woreda Administrators • Kebele Leaders • Health Extension Workers',
    description:
      '100% free offline PWA ensuring frontline responders receive life-saving cutoff alerts without cell towers.',
    deliverables: [
      '100% free offline PWA SitRep viewer for field tablets',
      'One-click bilingual Amharic & English emergency PDF manifests',
      'Open-source core algorithms ensuring regional data sovereignty',
    ],
    pricing: '100% Free Public Good / Philanthropic Grants',
    accent: 'emerald',
  },
];

export function BusinessModelSection() {
  return (
    <section id="sustainability" className="relative py-16 sm:py-24 bg-transparent z-10 overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="space-y-4 text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-sky-300">
            <Briefcase size={13} className="text-sky-400" />
            <span>OPERATIONAL SUSTAINABILITY &amp; DEPLOYMENT MODEL</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Built for Long-Term <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-teal-200 to-amber-200">Institutional Impact</span>
          </h2>

          <p
            className="text-sm sm:text-base md:text-lg leading-relaxed text-slate-200 max-w-2xl mx-auto"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Not just a hackathon demo. ImpactMap AI operates on a sustainable tiered framework combining institutional enterprise contracts with an open-access frontline public good.
          </p>
        </div>

        {/* 3 Tiers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7">
          {TIERS.map((tier, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl border border-slate-700/60 bg-[#161B26] p-6 sm:p-7 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] flex flex-col justify-between transition-all duration-300 hover:border-slate-500/80 hover:bg-[#1a202e]"
            >
              <div className="space-y-4">
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300">
                    {tier.tier}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-slate-200 font-semibold">
                    {tier.badge}
                  </span>
                </div>

                {/* Title & Target */}
                <div>
                  <h3
                    className="text-xl sm:text-2xl font-bold text-white tracking-tight"
                    style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                  >
                    {tier.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-300 font-medium font-sans">
                    {tier.target}
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {tier.description}
                </p>

                {/* Deliverables List */}
                <div className="pt-2 space-y-2.5">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Key Value Deliverables
                  </p>
                  <ul className="space-y-2 text-xs text-slate-200">
                    {tier.deliverables.map((item, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pricing / Sustainability Tag */}
              <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Model:</span>
                <span className="text-amber-300 font-semibold text-right">{tier.pricing}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
