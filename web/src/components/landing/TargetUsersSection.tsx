"use client";

import React from 'react';
import {
  ShieldAlert,
  Building2,
  Truck,
  Users,
  Target,
  ArrowRight,
  CheckCircle2,
  LifeBuoy,
} from 'lucide-react';

interface UserPersona {
  role: string;
  badge: string;
  organization: string;
  question: string;
  solution: string;
  icon: React.ElementType;
  accent: string;
}

const USER_PERSONAS: UserPersona[] = [
  {
    role: 'Disaster Risk Managers',
    badge: 'STRATEGIC PREEMPTION',
    organization: 'EDRMC • Civil Protection • Regional Disaster Commissions',
    question: 'Where should we preposition sandbags, excavators, and emergency crews before the flood wave crests?',
    solution: 'Pinpoints highest-leverage bottlenecks so teams protect the exact bridges that prevent regional population cutoff.',
    icon: ShieldAlert,
    accent: 'amber',
  },
  {
    role: 'Regional Health Administrators',
    badge: 'HEALTHCARE CONTINUITY',
    organization: 'Ministry of Health • Zonal Health Bureaus • District Hospitals',
    question: 'Which health centers and maternity clinics are in danger of becoming completely cut off from medical supplies?',
    solution: 'Quantifies facility isolation probabilities (e.g. Gedamaytu at 65%), enabling proactive patient evacuation and medicine pre-stocking.',
    icon: Building2,
    accent: 'emerald',
  },
  {
    role: 'Humanitarian Logistics Officers',
    badge: 'SAFE CONVOY ROUTING',
    organization: 'UN-OCHA • WFP • Ethiopian Red Cross • Relief Agencies',
    question: 'Which transport corridors can safely carry 30-ton food and medical aid trucks without driving into submerged dead ends?',
    solution: 'Evaluates corridor resilience and detour penalties, preventing stranded trucks, driver danger, and spoiled emergency cargo.',
    icon: Truck,
    accent: 'sky',
  },
  {
    role: 'Local Woreda Administrators',
    badge: 'COMMUNITY PROTECTION',
    organization: 'District Administrators • Kebele Leaders • Pastoralist Reps',
    question: 'Which specific villages and settlements will lose access to food markets and clean water if local wadis flood?',
    solution: 'Replaces broad, panic-inducing regional alerts with specific, village-by-village cutoff estimates to guide targeted evacuation.',
    icon: Users,
    accent: 'purple',
  },
];

export function TargetUsersSection({ onLaunchDemo }: { onLaunchDemo?: () => void }) {
  return (
    <section id="users" className="relative py-16 sm:py-24 bg-transparent z-10 overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header: End Goal */}
        <div className="space-y-4 text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3.5 py-1 text-[11px] font-mono uppercase tracking-widest text-amber-300">
            <Target size={13} className="text-amber-400" />
            <span>The End Goal &amp; Stakeholders</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Turning Flood Data Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-200 to-amber-100">Decisive Action</span>
          </h2>

          <p
            className="text-sm sm:text-base md:text-lg leading-relaxed text-slate-200"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Our mission is to shift humanitarian flood management from <span className="text-white font-semibold">reactive crisis recovery</span> to <span className="text-amber-300 font-semibold">anticipatory access protection</span>—giving decision-makers the exact intelligence needed to protect lives before waters rise.
          </p>
        </div>

        {/* 4 User Personas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {USER_PERSONAS.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl border border-slate-700/60 bg-[#161B26] p-6 sm:p-7 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-slate-500 hover:bg-[#1a2130] flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Bar with Badge & Icon */}
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-200 px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.04] font-semibold"
                    >
                      {p.badge}
                    </span>
                    <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-slate-200 group-hover:text-amber-300 transition-colors">
                      <Icon size={18} />
                    </div>
                  </div>

                  {/* Title & Organization */}
                  <div>
                    <h3
                      className="text-xl sm:text-2xl font-bold text-white tracking-tight"
                      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                    >
                      {p.role}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 font-sans font-medium">
                      {p.organization}
                    </p>
                  </div>

                  {/* The Problem / Question */}
                  <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3.5 space-y-1">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-rose-300 font-semibold">
                      The Critical Decision
                    </p>
                    <p className="text-xs sm:text-sm text-slate-100 leading-snug italic font-sans">
                      &ldquo;{p.question}&rdquo;
                    </p>
                  </div>

                  {/* What ImpactMap AI Delivers */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 size={14} />
                      <span>How ImpactMap AI Solves It</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                      {p.solution}
                    </p>
                  </div>
                </div>

                {/* Subtle bottom indicator */}
                <div className="pt-4 mt-5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Stakeholder 0{idx + 1}</span>
                  <span className="text-slate-400 group-hover:text-white transition-colors flex items-center gap-1">
                    Operational Impact <ArrowRight size={11} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner: Transition to Demo */}
        <div className="mt-8 sm:mt-12 rounded-2xl border border-slate-700/80 bg-[#161B26] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
          <div className="space-y-1.5 text-center sm:text-left">
            <h4
              className="text-xl sm:text-2xl font-bold text-white tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Built For Field Operations, Not Theoretical Research
            </h4>
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl font-sans">
              Designed with direct operational input from regional emergency responders in the Afar and Oromia zones. Operates 100% offline at the disaster edge.
            </p>
          </div>

          {onLaunchDemo && (
            <button
              type="button"
              onClick={onLaunchDemo}
              className="whitespace-nowrap rounded-full bg-white px-6 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 transition-all hover:scale-105 hover:bg-amber-50 active:scale-95 flex items-center gap-2"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <span>Test Real Scenarios</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
