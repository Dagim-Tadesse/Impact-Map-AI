import React, { useState, useRef, useEffect } from 'react';
import {
  Sliders,
  BarChart3,
  GitCompare,
  Award,
  ChevronLeft,
  Layers,
  Sparkles,
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

  const tabs: Array<{ id: ActiveTab; label: string; shortcut: string; icon: React.ReactNode }> = [
    { id: 'scenario', label: t('tabs.scenario'), shortcut: '1', icon: <Sliders className="w-4 h-4" /> },
    { id: 'results', label: t('tabs.results'), shortcut: '2', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'compare', label: t('tabs.compare'), shortcut: '3', icon: <GitCompare className="w-4 h-4" /> },
    { id: 'evidence', label: t('tabs.evidence'), shortcut: '4', icon: <Award className="w-4 h-4" /> },
  ];

  const cycleMobileSheet = () => {
    if (mobileSheetPos === 'peek') setMobileSheetPos('half');
    else if (mobileSheetPos === 'half') setMobileSheetPos('full');
    else setMobileSheetPos('peek');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-[#07090e]">
      {/* 1. 3D Particle Backdrop */}
      <ParticleBackdrop
        mode={activeTab === 'evidence' ? 'terrain' : activeTab === 'results' ? 'network' : 'vortex'}
      />

      {/* 2. Top Header Cockpit Island */}
      <TopBar
        onOpenAbout={onOpenAbout}
        onGoHome={onGoHome}
        onLaunchDemo={handleLaunchPitchDemo}
        onOpenJudgeModal={() => setShowJudgeModal(true)}
        onLaunchJudgeTour={() => setShowJudgeTour(true)}
        onToggleBriefing={() => setHeroExpanded((prev) => !prev)}
      />

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
      <div className="relative flex-1 w-full h-[calc(100vh-4.25rem)] flex overflow-hidden">
        {/* Desktop & Tablet Sidebar (Floating Cockpit Console with Curved Cuts) */}
        <aside
          className={`hidden md:flex z-20 my-2 sm:my-2.5 ml-2 sm:ml-3 rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.65)] flex-col transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] h-[calc(100vh-4.75rem)] ${
            panelCollapsed ? 'w-16' : 'w-[340px] lg:w-[410px]'
          }`}
        >
          {/* Tabs Bar */}
          <div
            className={`flex items-center justify-between ${
              panelCollapsed ? 'flex-1 min-h-0' : 'shrink-0 border-b border-white/10 p-2 bg-white/[0.02]'
            }`}
          >
            {!panelCollapsed ? (
              <div className="grid grid-cols-4 gap-1 w-full">
                {tabs.map((t) => {
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveTab(t.id);
                      }}
                      className={`min-h-[46px] flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl text-xs font-semibold transition-all relative group ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_16px_rgba(6,182,212,0.25)]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                      title={`${t.label} (Press ${t.shortcut})`}
                    >
                      <span className="mb-0.5">{t.icon}</span>
                      <span className="text-[11px] tracking-tight">{t.label}</span>
                      <span
                        className={`text-[9px] font-mono px-1 rounded absolute top-1 right-1 transition-opacity ${
                          isActive
                            ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 opacity-100'
                            : 'bg-black/40 text-slate-500 opacity-60 group-hover:opacity-100'
                        }`}
                      >
                        {t.shortcut}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-[60%] w-full flex-col items-center justify-evenly">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTab(t.id);
                      setPanelCollapsed(false);
                    }}
                    className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
                      activeTab === t.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={`${t.label} (Press ${t.shortcut})`}
                  >
                    {t.icon}
                    <span className="absolute -bottom-1 -right-1 text-[8px] font-mono px-1 rounded bg-black/70 border border-white/10 text-slate-500">
                      {t.shortcut}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tab Content Body */}
          {!panelCollapsed && (
            <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
              {activeTab === 'scenario' && <ScenarioTab />}
              {activeTab === 'results' && <ResultsTab />}
              {activeTab === 'compare' && <CompareTab />}
              {activeTab === 'evidence' && <EvidenceTab />}
            </div>
          )}

        </aside>

        {/* Collapse edge handle — glides with the panel width */}
        <button
          onClick={() => {
            setPanelCollapsed(!panelCollapsed);
          }}
          data-testid="panel-collapse-toggle"
          title={panelCollapsed ? 'Expand Panel' : 'Collapse Panel'}
          aria-label={panelCollapsed ? 'Expand Panel' : 'Collapse Panel'}
          className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-30 h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-[#0b1018]/95 backdrop-blur text-slate-300 hover:text-white shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-[left,transform,background-color,border-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-110 hover:border-cyan-400/40 active:scale-95 ${
            panelCollapsed ? 'left-[58px] sm:left-[62px]' : 'left-[334px] sm:left-[338px] lg:left-[408px]'
          }`}
        >
          <ChevronLeft
            className={`w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              panelCollapsed ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Center Map Stage (Floating Rounded Cockpit with Curved Edge Chamfers) */}
        <main className="relative flex-1 w-full h-[calc(100vh-4.75rem)] my-2 sm:my-2.5 mr-2 sm:mr-3 ml-2 rounded-3xl overflow-hidden border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
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
                >
                  {t('legend.dismiss')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowMobileLegend(true)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl glass-panel text-slate-300 hover:text-white border border-white/10 shadow-lg active:scale-95 transition-transform"
                title="View Map Legend"
              >
                <Layers className="w-5 h-5 text-cyan-400" />
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
          className={`md:hidden fixed inset-x-0 bottom-0 z-30 glass-panel-elevated rounded-t-3xl border-t border-white/20 transition-all duration-300 flex flex-col ${
            mobileSheetPos === 'peek'
              ? 'h-16 shadow-[0_-8px_30px_rgba(0,0,0,0.6)]'
              : mobileSheetPos === 'half'
              ? 'h-[50vh] shadow-[0_-16px_50px_rgba(0,0,0,0.8)]'
              : 'h-[calc(100vh-3.5rem)] shadow-[0_-24px_80px_rgba(0,0,0,0.95)]'
          }`}
        >
          {/* Drag Handle & Position Indicator with Touch Gesture */}
          <div
            onTouchStart={handleSheetTouchStart}
            onTouchEnd={handleSheetTouchEnd}
            onClick={cycleMobileSheet}
            className="w-full flex flex-col items-center justify-center py-2.5 shrink-0 cursor-pointer select-none active:bg-white/5"
          >
            <div className="w-12 h-1.5 bg-white/40 rounded-full mb-1.5" />
            <div className="flex items-center justify-between w-full px-4 text-xs font-semibold text-slate-200">
              <span className="flex items-center gap-1.5 text-cyan-300 capitalize">
                <Sparkles className="w-3.5 h-3.5" />
                {t(`tabs.${activeTab}`)} {t('tabs.panel_suffix')}
              </span>
              <div className="flex items-center gap-1">
                {(['peek', 'half', 'full'] as MobileSheetPosition[]).map((pos) => (
                  <button
                    key={pos}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobileSheetPos(pos);
                    }}
                    className={`min-h-[32px] px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-all ${
                      mobileSheetPos === pos
                        ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Tabs Switcher */}
          <div className="grid grid-cols-4 gap-1 px-3 py-1 border-y border-white/10 shrink-0 bg-white/[0.02]">
            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id);
                    if (mobileSheetPos === 'peek') setMobileSheetPos('half');
                  }}
                  className={`min-h-[44px] flex flex-col items-center justify-center py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50'
                      : 'text-slate-400 active:bg-white/10'
                  }`}
                >
                  <span className="mb-0.5">{t.icon}</span>
                  <span className="text-[10px]">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Sheet Content */}
          {mobileSheetPos !== 'peek' && (
            <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
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
