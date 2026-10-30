import React from 'react';
import {
  Radio,
  MapPin,
  GitBranch,
  Info,
  ChevronDown,
  Play,
  MoreVertical,
  Globe,
  Sparkles,
  BookOpen,
  FileSearch,
  Award,
  WifiOff,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { Dropdown, DropdownItem, DropdownSection } from './Dropdown';
import { useAppStore, type MockScenarioBehavior } from '../state/useAppStore';
import { useResultSummaryQuery } from '../api/hooks';
import { getConfig } from '../config';
import { useTranslation } from 'react-i18next';

interface TopBarProps {
  onOpenAbout?: () => void;
  onGoHome?: () => void;
  onLaunchDemo?: () => void;
  onOpenJudgeModal?: () => void;
  onLaunchJudgeTour?: () => void;
  onToggleBriefing?: () => void;
}

const computeModes: Array<{ id: MockScenarioBehavior; iconKey: string }> = [
  { id: 'cached_200', iconKey: 'server' },
  { id: 'async_202', iconKey: 'server' },
  { id: 'error_400', iconKey: 'warn' },
  { id: 'rate_limit_429', iconKey: 'warn' },
  { id: 'error_500', iconKey: 'warn' },
  { id: 'offline', iconKey: 'offline' },
];

// Ghost pill trigger — landing-style
const ghostTrigger =
  'flex items-center h-9 gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 text-[11px] font-medium text-slate-300 transition-all duration-300 hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white';

export const TopBar: React.FC<TopBarProps> = ({
  onOpenAbout,
  onGoHome,
  onLaunchDemo,
  onOpenJudgeModal,
  onLaunchJudgeTour,
  onToggleBriefing,
}) => {
  const config = getConfig();
  const { t, i18n } = useTranslation();
  const { isOfflineMode, mockBehavior, setActiveTab, setMockBehavior, currentCacheKey } = useAppStore();
  const { data: resultSummary } = useResultSummaryQuery(currentCacheKey);
  const currentLang = i18n.language || 'en';

  const executionMode = resultSummary?.execution_mode;
  const badgeLabel = executionMode === 'live_model'
    ? 'LIVE MODEL + GRAPH'
    : executionMode === 'precomputed_demo'
      ? 'PRECOMPUTED DEMO'
      : executionMode === 'heuristic'
        ? 'HEURISTIC SCENARIO'
        : 'PILOT PROTOTYPE';

  const badgeDot = executionMode === 'live_model'
    ? 'bg-emerald-400'
    : executionMode === 'precomputed_demo'
      ? 'bg-sky-400'
      : isOfflineMode
        ? 'bg-amber-400'
        : 'bg-slate-400';

  const badgeTextClass = executionMode === 'live_model'
    ? 'text-emerald-300'
    : executionMode === 'precomputed_demo'
      ? 'text-sky-300'
      : 'text-slate-300';

  const modeIcon = (iconKey: string) =>
    iconKey === 'offline' ? (
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
    ) : iconKey === 'warn' ? (
      <Award className="w-3.5 h-3.5 text-rose-400" />
    ) : (
      <Server className="w-3.5 h-3.5 text-emerald-400" />
    );

  return (
    <header
      className="relative mx-2 sm:mx-4 mt-2 sm:mt-3 flex h-14 items-center justify-between gap-2 rounded-full border border-white/[0.08] bg-[#0a0e16]/85 px-2 sm:px-3.5 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] select-none max-w-full"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* 1. Identity — serif wordmark with amber italic em (matches landing) */}
      <Dropdown
        buttonTestId="topbar-identity-toggle"
        buttonClassName="group flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-2.5 text-left transition hover:bg-white/[0.04] focus:outline-none min-w-0"
        buttonLabel={() => (
          <>
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/10 p-0.5 shrink-0">
              <span className="flex h-full w-full items-center justify-center rounded-full bg-[#080d1a]">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 transition-transform group-hover:rotate-12" />
              </span>
            </span>
            <span className="flex flex-col leading-tight">
              <span
                className="text-sm sm:text-base tracking-tight text-white whitespace-nowrap"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}
              >
                {t('app.title')}
                <em className="text-amber-300/90 not-italic">{t('app.ai')}</em>
              </span>
              <span
                className="text-[9px] font-mono tracking-[0.22em] uppercase text-slate-500"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {t('app.tagline')}
              </span>
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform group-hover:text-slate-300" />
          </>
        )}
      >
        {(close) => (
          <>
            <DropdownItem
              muted
              icon={<MapPin className="w-3.5 h-3.5 text-sky-400" />}
              label={t('app.region_pilot')}
              hint={config.region_id}
            />
            <DropdownItem
              muted
              icon={<GitBranch className="w-3.5 h-3.5 text-slate-400" />}
              label={t('topbar.versions')}
              hint={`${config.data_version} · ${config.model_version} · ${config.app_version}`}
            />
            <div className="my-1.5 border-t border-white/[0.07]" />
            <DropdownItem
              icon={<Info className="w-3.5 h-3.5 text-sky-400" />}
              label={t('app.about')}
              onClick={() => {
                close();
                onOpenAbout?.();
              }}
            />
            {onGoHome && (
              <DropdownItem
                icon={<Radio className="w-3.5 h-3.5 text-amber-300" />}
                label={t('topbar.home')}
                onClick={() => {
                  close();
                  onGoHome();
                }}
              />
            )}
          </>
        )}
      </Dropdown>

      {/* 2–6. Status, Run, Language, Tour, Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <Dropdown
          buttonTestId="topbar-orb-toggle"
          align="right"
          panelClassName="w-[280px]"
          buttonClassName={ghostTrigger}
          buttonLabel={() => (
            <>
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeDot}`}
                title={isOfflineMode ? 'offline' : (executionMode || mockBehavior)}
              />
              <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${badgeTextClass}`} />
              <span
                className={`hidden sm:inline uppercase tracking-[0.18em] text-[10px] ${badgeTextClass}`}
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {badgeLabel}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
            </>
          )}
        >
          {(close) => (
            <>
              <DropdownSection title={t('topbar.evidence')} />
              <DropdownItem
                icon={<FileSearch className="w-3.5 h-3.5 text-sky-400" />}
                label={t('topbar.open_evidence')}
                onClick={() => {
                  setActiveTab('evidence');
                  close();
                }}
              />
              <DropdownSection title={t('topbar.compute_mode')} />
              {computeModes.map((mode) => (
                <DropdownItem
                  key={mode.id}
                  icon={modeIcon(mode.iconKey)}
                  label={t(`topbar.mode_${mode.id}`)}
                  active={mockBehavior === mode.id}
                  onClick={() => {
                    setMockBehavior(mode.id);
                  }}
                />
              ))}
              <DropdownSection title={t('topbar.system')} />
              <DropdownItem
                icon={<Award className="w-3.5 h-3.5 text-amber-300" />}
                label={t('app.system_telemetry')}
                hint="⌘J"
                onClick={() => {
                  close();
                  onOpenJudgeModal?.();
                }}
              />
            </>
          )}
        </Dropdown>

        {/* Primary CTA — landing's white pill with amber Sparkles */}
        <button
          type="button"
          onClick={() => {
            onLaunchDemo?.();
          }}
          data-testid="topbar-run"
          title={t('app.event_simulation_tooltip')}
          className="group relative hidden sm:inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-white px-4 py-1.5 text-[11px] font-semibold text-slate-900 transition-all duration-300 hover:scale-105 hover:bg-amber-50 active:scale-95"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          <Play className="w-3 h-3 fill-current text-amber-600 transition-transform group-hover:translate-x-0.5" />
          <span>{t('app.event_simulation')}</span>
        </button>

        {/* Mobile Run button */}
        <button
          type="button"
          onClick={() => {
            onLaunchDemo?.();
          }}
          title={t('app.event_simulation_tooltip')}
          className="sm:hidden inline-flex items-center justify-center h-9 w-9 rounded-full bg-white text-slate-900 shadow-[0_6px_18px_rgba(255,255,255,0.12)] active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current text-amber-600" />
        </button>

        {/* Language segmented toggle */}
        <div
          className="relative hidden md:flex h-9 items-center rounded-full border border-white/[0.08] bg-white/[0.04] p-1"
          role="group"
          aria-label={t('app.switch_lang')}
        >
          <span
            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-white/[0.1] border border-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              currentLang === 'en' ? 'translate-x-0' : 'translate-x-full'
            }`}
          />
          {(['en', 'am'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => {
                if (lang === currentLang) return;
                i18n.changeLanguage(lang);
              }}
              className={`relative z-10 h-full px-2.5 rounded-full text-[10px] font-bold tracking-wider transition-colors ${
                currentLang === lang ? 'text-amber-200' : 'text-slate-500 hover:text-slate-300'
              }`}
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {lang === 'en' ? 'EN' : 'አማ'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            onLaunchJudgeTour?.();
          }}
          title={t('app.platform_tour')}
          aria-label={t('app.platform_tour')}
          className={`${ghostTrigger} hidden md:inline-flex`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 transition-transform group-hover:rotate-12" />
          <span className="hidden lg:inline">{t('app.platform_tour')}</span>
        </button>

        <Dropdown
          buttonTestId="topbar-menu-toggle"
          align="right"
          panelClassName="w-[260px]"
          buttonClassName="h-9 w-9 flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white"
          buttonLabel={() => <MoreVertical className="w-4 h-4" aria-label={t('topbar.menu')} />}
        >
          {(close) => (
            <>
              <DropdownSection title={t('topbar.guide')} />
              <DropdownItem
                icon={<BookOpen className="w-3.5 h-3.5 text-amber-300" />}
                label={t('app.mission_briefing')}
                onClick={() => {
                  close();
                  onToggleBriefing?.();
                }}
              />
              {/* Mobile-only controls */}
              <div className="md:hidden">
                <DropdownItem
                  icon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                  label={t('app.platform_tour')}
                  onClick={() => {
                    close();
                    onLaunchJudgeTour?.();
                  }}
                />
                <DropdownSection title={t('app.switch_lang')} />
                {(['en', 'am'] as const).map((lang) => (
                  <DropdownItem
                    key={lang}
                    icon={<Globe className="w-3.5 h-3.5 text-sky-400" />}
                    label={lang === 'en' ? 'English' : 'አማርኛ'}
                    active={currentLang === lang}
                    onClick={() => i18n.changeLanguage(lang)}
                  />
                ))}
              </div>
            </>
          )}
        </Dropdown>
      </div>
    </header>
  );
};
