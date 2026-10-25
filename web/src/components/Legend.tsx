import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import { RISK_CLASSES } from '../lib/colors';
import { useAppStore } from '../state/useAppStore';
import { useTranslation } from 'react-i18next';

export const Legend: React.FC = () => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { layerMode, setLayerMode } = useAppStore();

  return (
    <div className="glass-panel rounded-xl p-3 shadow-2xl border border-white/10 select-none max-w-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t('legend.title')}</span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
          title={isCollapsed ? 'Expand Legend' : 'Collapse Legend'}
        >
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="space-y-3 pt-1">
          {/* Mode Switcher */}
          <div className="flex rounded-lg bg-black/40 p-0.5 border border-white/10 text-[11px]">
            <button
              onClick={() => setLayerMode('exposure')}
              className={`flex-1 py-1 px-2 rounded-md font-medium transition-all ${
                layerMode === 'exposure'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('hud.flood_exposure')}
            </button>
            <button
              onClick={() => setLayerMode('closure')}
              className={`flex-1 py-1 px-2 rounded-md font-medium transition-all ${
                layerMode === 'closure'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('hud.assumed_closure')}
            </button>
          </div>

          {/* 5-Class Risk Colors & Stroke Widths */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              {layerMode === 'exposure' ? t('legend.flood_exposure_prob') : t('legend.assumed_closure_prob')}
            </div>
            <div className="space-y-1">
              {RISK_CLASSES.map((rc, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block rounded-full shadow-sm"
                      style={{
                        backgroundColor: rc.color,
                        width: `${Math.max(12, rc.strokeWidth * 3)}px`,
                        height: `${Math.max(3, rc.strokeWidth)}px`,
                      }}
                    />
                    <span className="font-mono text-[11px]">{rc.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {rc.strokeWidth}px line
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Facility Types */}
          <div className="pt-2 border-t border-white/10">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              {t('results.ranking_title')}
            </div>
            <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white bg-cyan-400 inline-block shadow-sm" />
                <span>{t('results.level_hospital')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-white bg-cyan-400 inline-block shadow-sm" />
                <span>{t('results.level_health_center')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full border border-white bg-cyan-400 inline-block shadow-sm" />
                <span>{t('results.level_clinic')}</span>
              </div>
            </div>
          </div>

          {/* Mandatory Disclaimer */}
          <div className="pt-2 border-t border-white/10 flex items-start gap-1 text-[10px] text-slate-400 leading-tight">
            <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
            <span>{t('app.disclaimer')}</span>
          </div>
        </div>
      )}
    </div>
  );
};
