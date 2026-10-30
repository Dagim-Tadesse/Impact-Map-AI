import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import {
  Sliders,
  BarChart3,
  GitCompare,
  ShieldCheck,
  ChevronLeft,
  Layers,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { HeroIntro } from '../components/HeroIntro';
import { ParticleBackdrop } from '../components/ParticleBackdrop';
import { MapView } from '../map/MapView';
import { Legend } from '../components/Legend';
import { ScenarioTab } from '../panels/ScenarioTab';
import { ResultsTab } from '../panels/ResultsTab';
import { CompareTab } from '../panels/CompareTab';
import { EvidenceTab } from '../panels/EvidenceTab';
import { FacilityDrawer } from '../panels/FacilityDrawer';
import { SegmentDrawer } from '../panels/SegmentDrawer';
import { CommunityCard } from '../components/CommunityCard';
import { OfflineBanner } from '../components/OfflineBanner';
import { WhatIfBasket } from '../panels/WhatIfBasket';
import { CascadeBar } from '../panels/CascadeBar';
import { JudgeInspectorModal } from '../components/JudgeInspectorModal';
import { JudgeTour } from '../components/JudgeTour';
import { useAppStore, type ActiveTab } from '../state/useAppStore';
import { useTranslation } from 'react-i18next';

interface ExplorerPageProps {
  onOpenAbout: () => void;
  onGoHome?: () => void;
}

type MobileSheetPosition = 'peek' | 'half' | 'full';

const EXPLORER_BG_IMAGE =
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1920&q=80';

export const ExplorerPage: React.FC<ExplorerPageProps> = ({ onOpenAbout, onGoHome }) => {
  const { t } = useTranslation();
  const {
    activeTab,
    setActiveTab,
    setCascadeState,
    cascade,
    selectedFacilityId,
    selectedSegmentId,
    selectedCommunityId,
    setSelectedFacilityId,
    setSelectedSegmentId,
    setSelectedCommunityId,
    is3DView,
    toggle3DView,
  } = useAppStore();

  const [heroExpanded, setHeroExpanded] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [mobileSheetPos, setMobileSheetPos] = useState<MobileSheetPosition>('peek');
  const [showMobileLegend, setShowMobileLegend] = useState(false);
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [showJudgeTour, setShowJudgeTour] = useState(false);

  const shellRef = useRef<HTMLDivElement>(null);
  const panelBodyRef = useRef<HTMLDivElement>(null);

  // Global Keyboard Navigation (1-4 tabs, Space cascade, M 3D view, Esc, ? Judge HUD)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      if ((e.key === 'j' || e.key === 'J') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowJudgeModal((prev) => !prev);
        return;
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowJudgeModal((prev) => !prev);
        return;
      }
      if ((e.key === 't' || e.key === 'T') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowJudgeTour((prev) => !prev);
        return;
      }

      if (e.key === '1') {
        setActiveTab('scenario');
      } else if (e.key === '2') {
        setActiveTab('results');
      } else if (e.key === '3') {
        setActiveTab('compare');
      } else if (e.key === '4') {
        setActiveTab('evidence');
      } else if (e.code === 'Space' && cascade.slug) {
        e.preventDefault();
        setCascadeState({ playing: !cascade.playing });
      } else if (e.key === 'm' || e.key === 'M') {
        toggle3DView();
      } else if (e.key === 'Escape') {
        if (showJudgeTour) {
          setShowJudgeTour(false);
        } else if (showJudgeModal) {
          setShowJudgeModal(false);
        } else if (selectedFacilityId) {
          setSelectedFacilityId(null);
        } else if (selectedSegmentId) {
          setSelectedSegmentId(null);
        } else if (selectedCommunityId) {
          setSelectedCommunityId(null);
        } else if (cascade.slug) {
          setCascadeState({ slug: null, playing: false });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showJudgeModal,
    cascade,
    is3DView,
    selectedFacilityId,
    selectedSegmentId,
    selectedCommunityId,
    setActiveTab,
    setCascadeState,
    toggle3DView,
    setSelectedFacilityId,
    setSelectedSegmentId,
    setSelectedCommunityId,
  ]);

  // Entrance choreography — brief, non-scroll, reduced-motion aware
  useEffect(() => {
    if (!shellRef.current) return;
    const reduced = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const nodes = shellRef.current.querySelectorAll<HTMLElement>('[data-mount]');
    if (!nodes.length) return;
    gsap.fromTo(
      nodes,
      { opacity: 0, y: 12, filter: 'blur(8px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, stagger: 0.07, ease: 'power3.out' }
    );
  }, []);

  // Panel body cross-fade on tab change
  useEffect(() => {
    if (!panelBodyRef.current) return;
    const reduced = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    gsap.fromTo(
      panelBodyRef.current,
      { opacity: 0, y: 6, filter: 'blur(4px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.4, ease: 'power2.out' }
    );
  }, [activeTab]);

  // Auto-collapse left console on compressed screens when inspecting a segment or facility
  useEffect(() => {
    const hasRightDrawer = Boolean(selectedFacilityId || selectedSegmentId || selectedCommunityId);
    if (hasRightDrawer && typeof window !== 'undefined' && window.innerWidth < 1280 && !panelCollapsed) {
      setPanelCollapsed(true);
    }
  }, [selectedFacilityId, selectedSegmentId, selectedCommunityId]);

  // Touch Swipe Gesture Tracking for Mobile Bottom Sheet
  const touchStartY = useRef<number | null>(null);

  const handleSheetTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleSheetTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY;

    if (deltaY > 40) {
      if (mobileSheetPos === 'peek') setMobileSheetPos('half');
      else if (mobileSheetPos === 'half') setMobileSheetPos('full');
    } else if (deltaY < -40) {
      if (mobileSheetPos === 'full') setMobileSheetPos('half');
      else if (mobileSheetPos === 'half') setMobileSheetPos('peek');
    }
    touchStartY.current = null;
  };

  const handleLaunchPitchDemo = () => {
    setHeroExpanded(false);
    setCascadeState({
      slug: 'awash-2020-replay',
      step: 1,
      n_steps: 4,
      playing: true,
      speedMs: 5000,
    });
  };

  const tabs: Array<{
    id: ActiveTab;
    label: string;
    shortcut: string;
    index: string;
    icon: React.ReactNode;
    accent: 'amber' | 'sky' | 'rose' | 'emerald';
  }> = [
    { id: 'scenario', label: t('tabs.scenario'), shortcut: '1', index: '01', accent: 'amber', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'results', label: t('tabs.results'), shortcut: '2', index: '02', accent: 'sky', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'compare', label: t('tabs.compare'), shortcut: '3', index: '03', accent: 'rose', icon: <GitCompare className="w-3.5 h-3.5" /> },
    { id: 'evidence', label: t('tabs.evidence'), shortcut: '4', index: '04', accent: 'emerald', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  ];

  const accentDot: Record<'amber' | 'sky' | 'rose' | 'emerald', string> = {
    amber: 'bg-amber-300',
    sky: 'bg-sky-300',
    rose: 'bg-rose-300',
    emerald: 'bg-emerald-300',
  };
  const accentText: Record<'amber' | 'sky' | 'rose' | 'emerald', string> = {
    amber: 'text-amber-300',
    sky: 'text-sky-300',
    rose: 'text-rose-300',
    emerald: 'text-emerald-300',
  };

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  const cycleMobileSheet = () => {
    if (mobileSheetPos === 'peek') setMobileSheetPos('half');
    else if (mobileSheetPos === 'half') setMobileSheetPos('full');
    else setMobileSheetPos('peek');
  };

  return (
    <div
      ref={shellRef}
      className="relative w-screen h-screen overflow-hidden flex flex-col bg-[#060a14] text-slate-200"
    >
      {/* 0. Continuous atmospheric backdrop — matches landing (pointer-events-none) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={EXPLORER_BG_IMAGE}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-[0.14] scale-105"
          loading="eager"
          fetchPriority="high"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 18% 10%, rgba(251,191,36,0.06), transparent 55%), radial-gradient(ellipse at 82% 68%, rgba(56,189,248,0.05), transparent 60%), radial-gradient(circle at 50% 100%, rgba(244,63,94,0.025), transparent 55%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#060a14]/70 via-[#060a14]/55 to-[#060a14]/85" />
      </div>

      {/* 1. 3D Particle Backdrop (behavior preserved) */}
      <ParticleBackdrop
        mode={activeTab === 'evidence' ? 'terrain' : activeTab === 'results' ? 'network' : 'vortex'}
      />

      {/* 2. Top Header Floating Pill */}
      <div data-mount className="relative z-40">
        <TopBar
          onOpenAbout={onOpenAbout}
          onGoHome={onGoHome}
          onLaunchDemo={handleLaunchPitchDemo}
          onOpenJudgeModal={() => setShowJudgeModal(true)}
          onLaunchJudgeTour={() => setShowJudgeTour(true)}
          onToggleBriefing={() => setHeroExpanded((prev) => !prev)}
        />
      </div>

      {/* Global Resilience Offline Banner */}
      <OfflineBanner />

      {/* 3. Hero Briefing Overlay */}
      <HeroIntro
        isExpanded={heroExpanded}
        onToggleExpand={() => setHeroExpanded(!heroExpanded)}
        onLaunchDemo={handleLaunchPitchDemo}
        onExploreMap={() => setHeroExpanded(false)}
      />

      {/* 4. Main Explorer Canvas */}
      <div className="relative flex-1 w-full h-[calc(100vh-4.25rem)] flex overflow-hidden z-10">
        {/* Desktop & Tablet Sidebar — paper-thin console */}
        <aside
          data-mount
          className={`hidden md:flex z-20 my-3 ml-3 rounded-2xl overflow-hidden flex-col transition-[width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] h-[calc(100vh-5rem)] ${
            panelCollapsed ? 'w-16' : 'w-[348px] lg:w-[418px]'
          }`}
          style={{
            background: 'linear-gradient(180deg, rgba(22,27,38,0.95) 0%, rgba(18,22,32,0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow:
              '0 24px 60px rgba(0,0,0,0.7), inset 0 1px 0 0 rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Tabs Bar — landing-style compact pill group */}
          <div
            className={`${
              panelCollapsed ? 'flex-1 min-h-0 flex items-center justify-center' : 'shrink-0 px-4 pt-4 pb-3'
            }`}
          >
            {!panelCollapsed ? (
              <div className="w-full">
                {/* Console header: mono tag + section number + active title */}
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <div
                      className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.28em] text-slate-400 mb-1"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${accentDot[activeTabMeta.accent]} animate-pulse`} />
                      <span className="font-semibold text-slate-300">Mission Console</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-xs tabular-nums font-mono font-bold ${accentText[activeTabMeta.accent]}`}
                      >
                        {activeTabMeta.index}
                      </span>
                      <span
                        className="text-lg font-bold text-white tracking-tight leading-none"
                        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                      >
                        {activeTabMeta.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tab pill group */}
                <div className="flex items-center gap-1 rounded-full border border-white/[0.07] bg-black/30 p-1">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`group relative flex-1 min-h-[38px] flex items-center justify-center gap-1.5 rounded-full px-2 text-[11px] font-medium transition-all duration-300 ${
                          isActive
                            ? 'bg-white/[0.08] text-white shadow-[0_2px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]'
                            : 'text-slate-400 hover:text-slate-100'
                        }`}
                        title={`${tab.label} · press ${tab.shortcut}`}
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        <span className={isActive ? accentText[tab.accent] : 'text-slate-500 group-hover:text-slate-300'}>
                          {tab.icon}
                        </span>
                        <span className="tracking-tight hidden sm:inline">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Keyboard shortcut hint row (clean, below pills) */}
                <div className="flex items-center justify-between mt-2 px-1">
                  <div
                    className="flex items-center gap-1 text-[9px] uppercase tracking-[0.22em] text-slate-500"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    <span>Keys</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          title={tab.label}
                          className={`h-5 min-w-[20px] px-1 flex items-center justify-center rounded border text-[10px] tabular-nums transition-all ${
                            isActive
                              ? `${accentText[tab.accent]} border-white/15 bg-white/[0.05]`
                              : 'text-slate-500 border-white/[0.06] bg-transparent hover:text-slate-300 hover:border-white/15'
                          }`}
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          {tab.shortcut}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[60%] w-full flex-col items-center justify-evenly py-4">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setPanelCollapsed(false);
                      }}
                      className={`group relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                        isActive
                          ? `bg-white/[0.08] ${accentText[tab.accent]} border border-white/10 shadow-md`
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title={`${tab.label} · press ${tab.shortcut}`}
                    >
                      {tab.icon}
                      <span
                        className={`absolute -right-1 -bottom-1 h-4 w-4 flex items-center justify-center rounded-full border border-white/15 bg-[#060a14] text-[9px] tabular-nums ${
                          isActive ? accentText[tab.accent] : 'text-slate-500'
                        }`}
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {tab.shortcut}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hairline separator */}
          {!panelCollapsed && (
            <div className="shrink-0 h-px mx-4 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          )}

          {/* Tab Content Body */}
          {!panelCollapsed && (
            <div
              ref={panelBodyRef}
              className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar"
            >
              {activeTab === 'scenario' && <ScenarioTab />}
              {activeTab === 'results' && <ResultsTab />}
              {activeTab === 'compare' && <CompareTab />}
              {activeTab === 'evidence' && <EvidenceTab />}
            </div>
          )}
        </aside>

        {/* Collapse edge handle */}
        <button
          onClick={() => {
            setPanelCollapsed(!panelCollapsed);
          }}
          data-testid="panel-collapse-toggle"
          title={panelCollapsed ? 'Expand Panel' : 'Collapse Panel'}
          aria-label={panelCollapsed ? 'Expand Panel' : 'Collapse Panel'}
          className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-30 h-7 w-7 items-center justify-center rounded-full border border-white/[0.1] bg-[#0a0e16]/95 backdrop-blur text-slate-300 hover:text-white shadow-[0_4px_16px_rgba(0,0,0,0.6)] transition-[left,transform,background-color,border-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-110 hover:border-amber-300/40 active:scale-95 ${
            panelCollapsed ? 'left-[58px] sm:left-[62px]' : 'left-[344px] sm:left-[348px] lg:left-[418px]'
          }`}
        >
          <ChevronLeft
            className={`w-3.5 h-3.5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              panelCollapsed ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Center Map Stage */}
        <main
          data-mount
          className="relative flex-1 w-full h-[calc(100vh-5rem)] my-3 mr-3 ml-2 rounded-2xl overflow-hidden"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          }}
        >
          <MapView />

          {/* Floating Risk Legend (Desktop/Tablet top-left) */}
          <div className="absolute top-4 left-4 z-10 hidden sm:block">
            <Legend />
          </div>

          {/* Mobile Legend Floating Toggle */}
          <div className="absolute top-4 left-4 z-10 sm:hidden">
            {showMobileLegend ? (
              <div className="relative">
                <Legend />
                <button
                  onClick={() => setShowMobileLegend(false)}
                  className="mt-1 w-full py-1.5 min-h-[44px] flex items-center justify-center bg-black/80 text-slate-300 rounded-lg text-xs border border-white/10 active:bg-white/10"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {t('legend.dismiss')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowMobileLegend(true)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-[#0a0e16]/90 text-slate-200 hover:text-white border border-white/10 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.6)] active:scale-95 transition-transform"
                title="View Map Legend"
              >
                <Layers className="w-5 h-5 text-sky-300" />
              </button>
            )}
          </div>

          {/* Interactive Drawers */}
          <FacilityDrawer />
          <SegmentDrawer />
          <CommunityCard />
          <WhatIfBasket />

          {/* Signature Cascade Replay Bar */}
          <CascadeBar />
        </main>

        {/* Phone 3-Position Bottom Sheet */}
        <div
          data-testid="mobile-bottom-sheet"
          className={`md:hidden fixed inset-x-0 bottom-0 z-30 rounded-t-3xl border-t border-white/[0.1] backdrop-blur-2xl transition-all duration-500 flex flex-col ${
            mobileSheetPos === 'peek'
              ? 'h-16 shadow-[0_-8px_30px_rgba(0,0,0,0.6)]'
              : mobileSheetPos === 'half'
              ? 'h-[50vh] shadow-[0_-16px_50px_rgba(0,0,0,0.8)]'
              : 'h-[calc(100vh-3.5rem)] shadow-[0_-24px_80px_rgba(0,0,0,0.95)]'
          }`}
          style={{
            background:
              'linear-gradient(180deg, rgba(10,14,22,0.92) 0%, rgba(8,11,18,0.96) 100%)',
          }}
        >
          {/* Drag Handle */}
          <div
            onTouchStart={handleSheetTouchStart}
            onTouchEnd={handleSheetTouchEnd}
            onClick={cycleMobileSheet}
            className="w-full flex flex-col items-center justify-center py-2.5 shrink-0 cursor-pointer select-none active:bg-white/5"
          >
            <div className="w-12 h-1.5 bg-white/30 rounded-full mb-1.5" />
            <div className="flex items-center justify-between w-full px-4 text-xs">
              <span
                className="flex items-center gap-1.5 text-slate-300"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {activeTabMeta.icon}
                <span className="capitalize font-semibold text-slate-100">
                  {t(`tabs.${activeTab}`)}
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  {t('tabs.panel_suffix')}
                </span>
              </span>
              <div className="flex items-center gap-1">
                {(['peek', 'half', 'full'] as MobileSheetPosition[]).map((pos) => (
                  <button
                    key={pos}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobileSheetPos(pos);
                    }}
                    className={`min-h-[32px] px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all ${
                      mobileSheetPos === pos
                        ? 'bg-white/[0.08] text-amber-200 border border-white/10'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Tabs Switcher */}
          <div className="flex items-center gap-1 mx-3 mb-1 rounded-full border border-white/[0.07] bg-black/30 p-1 shrink-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (mobileSheetPos === 'peek') setMobileSheetPos('half');
                  }}
                  className={`min-h-[40px] flex-1 flex items-center justify-center gap-1 rounded-full px-1.5 py-1.5 text-[11px] font-medium transition-all ${
                    isActive
                      ? 'bg-white/[0.08] text-white shadow-[0_2px_10px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'text-slate-400 active:bg-white/5'
                  }`}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <span className={isActive ? 'text-amber-300' : 'text-slate-500'}>
                    {tab.icon}
                  </span>
                  <span className="text-[10px] tracking-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Sheet Content */}
          {mobileSheetPos !== 'peek' && (
            <div className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar">
              {activeTab === 'scenario' && <ScenarioTab />}
              {activeTab === 'results' && <ResultsTab />}
              {activeTab === 'compare' && <CompareTab />}
              {activeTab === 'evidence' && <EvidenceTab />}
            </div>
          )}
        </div>
      </div>

      {/* 5. Judge Telemetry Inspector Modal */}
      <JudgeInspectorModal isOpen={showJudgeModal} onClose={() => setShowJudgeModal(false)} />

      {/* 6. Guided 60-Second Judge Tour */}
      <JudgeTour
        isOpen={showJudgeTour}
        onClose={() => setShowJudgeTour(false)}
        onOpenJudgeModal={() => setShowJudgeModal(true)}
      />
    </div>
  );
};
