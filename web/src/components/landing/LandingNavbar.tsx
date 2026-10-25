"use client";

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Menu,
  X,
  ChevronRight,
  Shield,
  Layers,
  Cpu,
  Users,
} from 'lucide-react';

interface LandingNavbarProps {
  onLaunchLive: () => void;
}

export function LandingNavbar({ onLaunchLive }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navLinks = [
    { label: 'Crisis', id: 'crisis', icon: Shield },
    { label: 'Capabilities', id: 'solution', icon: Layers },
    { label: 'Architecture', id: 'architecture', icon: Cpu },
    { label: 'Team', id: 'team', icon: Users },
  ];

  return (
    <header className="fixed top-3 sm:top-5 left-0 right-0 z-50 flex justify-center px-3 sm:px-6 pointer-events-none">
      <div
        className={`pointer-events-auto w-full max-w-5xl transition-all duration-300 ${
          scrolled ? 'scale-[0.98]' : 'scale-100'
        }`}
      >
        {/* Main Curved Floating Pill Navigation */}
        <div className="relative flex items-center justify-between rounded-full border border-cyan-500/25 bg-[#070e1c]/85 px-3.5 sm:px-5 py-2 sm:py-2.5 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.65)] ring-1 ring-white/10">
          {/* Brand Logo & Name */}
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group flex items-center gap-2 text-left focus:outline-none"
          >
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-sky-400 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#080d1a]">
                <Sparkles size={14} className="text-cyan-400 transition-transform group-hover:rotate-12" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-sm sm:text-base font-extrabold tracking-tight text-white leading-tight">
                ImpactMap <span className="bg-gradient-to-r from-cyan-400 to-sky-300 bg-clip-text text-transparent">AI</span>
              </span>
              <span className="font-mono text-[9px] text-cyan-400/80 tracking-wider">
                AWASH BASIN
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollToSection(link.id)}
                className="rounded-full px-3 py-1 font-mono text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-cyan-300 focus:outline-none"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Launch Live Action Button */}
            <button
              type="button"
              onClick={() => {
                onLaunchLive();
              }}
              className="group relative hidden sm:inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 px-4 py-1.5 text-xs font-bold text-slate-950 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] active:scale-95"
            >
              <Sparkles size={13} className="transition-transform group-hover:rotate-12" />
              <span>Launch Live</span>
              <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="flex md:hidden h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile Curved Drawer / Dropdown */}
        {mobileMenuOpen && (
          <div className="mt-2 flex md:hidden flex-col gap-1.5 rounded-2xl border border-cyan-500/30 bg-[#070e1c]/95 p-3.5 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.85)] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => scrollToSection(link.id)}
                    className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 p-2.5 text-left font-mono text-xs font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-950/40 hover:text-cyan-300"
                  >
                    <Icon size={14} className="text-cyan-400" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-1 flex items-center justify-end border-t border-slate-800 pt-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLaunchLive();
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 px-3.5 py-1 font-mono text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
              >
                <Sparkles size={12} />
                <span>Launch Live</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default LandingNavbar;
