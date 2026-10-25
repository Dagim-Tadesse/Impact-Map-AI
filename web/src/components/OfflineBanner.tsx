import React from 'react';
import { WifiOff, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../state/useAppStore';

export const OfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  const { isOfflineMode, setIsOfflineMode, setMockBehavior } = useAppStore();

  if (!isOfflineMode) return null;

  const handleRetry = () => {
    setMockBehavior('cached_200');
    setIsOfflineMode(false);
  };

  return (
    <div
      role="alert"
      className="w-full bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-amber-950/90 border-b border-amber-500/40 text-amber-200 px-4 py-2 flex items-center justify-between shadow-[0_4px_20px_rgba(245,158,11,0.25)] z-30 animate-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-center gap-2.5 max-w-4xl text-xs">
        <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
        </div>
        <div className="leading-snug">
          <span className="font-bold text-white tracking-wide">
            {t('offline.unavailable')}
          </span>
          <span className="hidden sm:inline text-amber-300/80 ml-2">
            {t('offline.subtext')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleRetry}
          className="min-h-[36px] flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 hover:text-white font-mono text-[11px] font-semibold transition-all active:scale-95"
          title="Attempt to reconnect to live compute backend"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('offline.retry')}</span>
        </button>
      </div>
    </div>
  );
};
