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

const flatTrigger =
  'flex items-center rounded-lg px-2 h-9 gap-1.5 text-xs font-semibold transition-colors hover:bg-white/[0.06]';

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
      ? 'bg-cyan-400'
      : isOfflineMode
        ? 'bg-amber-400'
        : 'bg-sky-400';

  const badgeTextClass = executionMode === 'live_model'
    ? 'text-emerald-300'
    : executionMode === 'precomputed_demo'
      ? 'text-cyan-300'
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
    <header className="mx-1.5 sm:mx-3 mt-1.5 sm:mt-2 h-12 sm:h-14 bg-[#090d16]/95 backdrop-blur-2xl rounded-2xl px-2.5 sm:px-4 flex items-center justify-between gap-2 z-40 relative select-none max-w-full">
      {/* 1. Identity — brand only; region, versions, About live in its menu */}
      <Dropdown
        buttonTestId="topbar-identity-toggle"
        buttonClassName={`min-w-0 ${flatTrigger} !pl-1`}
        buttonLabel={() => (
          <>
            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-cyan-500/25 via-sky-500/20 to-blue-600/25 border border-cyan-400/40 flex items-center justify-center shrink-0">
              <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
            </span>
            <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white inline-flex items-center whitespace-nowrap">
              {t('app.title')}
              <span className="text-cyan-400 font-mono font-semibold ml-0.5">{t('app.ai')}</span>
            </span>
            <span className="hidden lg:inline text-[10px] font-mono tracking-wider text-cyan-300/80 font-bold uppercase">
              {t('app.tagline')}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
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
              icon={<Info className="w-3.5 h-3.5 text-cyan-400" />}
              label={t('app.about')}
              onClick={() => {
                close();
                onOpenAbout?.();
              }}
            />
            {onGoHome && (
              <DropdownItem
                icon={<Radio className="w-3.5 h-3.5 text-cyan-400" />}
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

      {/* 2–6. Status, Run, Language, Tour, Menu — one row, even spacing */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <Dropdown
          buttonTestId="topbar-orb-toggle"
          align="right"
          panelClassName="w-[280px]"
          buttonClassName={flatTrigger}
          buttonLabel={() => (
            <>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${badgeDot}`}
                title={isOfflineMode ? 'offline' : (executionMode || mockBehavior)}
              />
              <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${badgeTextClass}`} />
              <span className={`hidden sm:inline uppercase tracking-wider font-mono text-[11px] ${badgeTextClass}`}>
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
                icon={<FileSearch className="w-3.5 h-3.5 text-cyan-400" />}
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
                icon={<Award className="w-3.5 h-3.5 text-cyan-400" />}
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

        <button
          type="button"
          onClick={() => {
            onLaunchDemo?.();
          }}
          data-testid="topbar-run"
          title={t('app.event_simulation_tooltip')}
          className={`${flatTrigger} text-cyan-300 hover:text-white`}
        >
          <Play className="w-3.5 h-3.5 fill-current shrink-0" />
          <span className="hidden md:inline">{t('app.event_simulation')}</span>
        </button>

        {/* Language segmented toggle EN / አማ — mobile copy lives in the ⋯ menu */}
        <div
          className="relative hidden md:flex h-9 items-center rounded-full border border-white/10 bg-white/[0.04] p-1"
          role="group"
          aria-label={t('app.switch_lang')}
        >
          <span
            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-cyan-500/25 border border-cyan-400/50 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
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
              className={`relative z-10 h-full px-2.5 rounded-full text-[11px] font-mono font-bold transition-colors ${
                currentLang === lang ? 'text-cyan-200' : 'text-slate-500 hover:text-slate-300'
              }`}
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
          className={`${flatTrigger} hidden md:flex text-cyan-200 hover:text-white`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">{t('app.platform_tour')}</span>
        </button>

        <Dropdown
          buttonTestId="topbar-menu-toggle"
          align="right"
          panelClassName="w-[260px]"
          buttonClassName="h-9 w-9 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
          buttonLabel={() => <MoreVertical className="w-4 h-4" aria-label={t('topbar.menu')} />}
        >
          {(close) => (
            <>
              <DropdownSection title={t('topbar.guide')} />
              <DropdownItem
                icon={<BookOpen className="w-3.5 h-3.5 text-cyan-400" />}
                label={t('app.mission_briefing')}
                onClick={() => {
                  close();
                  onToggleBriefing?.();
                }}
              />
              {/* Mobile-only: controls that live on the bar at md+ */}
              <div className="md:hidden">
                <DropdownItem
                  icon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
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
