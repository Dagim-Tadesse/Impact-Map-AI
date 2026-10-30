import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import { RISK_CLASSES } from '../lib/colors';
import { useAppStore } from '../state/useAppStore';
import { useTranslation } from 'react-i18next';

const SERIF: React.CSSProperties = { fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 };
const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };

export const Legend: React.FC = () => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { layerMode, setLayerMode } = useAppStore();

  return (
    <div
      className={`rounded-xl border border-white/[0.08] bg-[#0a0e16]/85 p-3 shadow-[0_12px_28px_rgba(0,0,0,0.55)] backdrop-blur-xl select-none transition-all duration-200 ${
        isCollapsed ? 'w-auto' : 'w-72 max-w-[calc(100vw-3rem)]'
      }`}
    >
      {/* Header */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-sky-300" />
          <span
            className="text-sm text-white"
            style={SERIF}
          >
            {t('legend.title')}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }}
          className="h-6 w-6 flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white hover:border-white/20 transition-all ml-1"
          title={isCollapsed ? 'Expand Legend' : 'Collapse Legend'}
        >
          {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="space-y-3.5 pt-1">
          {/* Mode Switcher — pill group */}
          <div className="flex rounded-full border border-white/[0.07] bg-black/30 p-1 text-[11px]">
            <button
              onClick={() => setLayerMode('exposure')}
              className={`flex-1 py-1 px-2 rounded-full font-medium transition-all ${
                layerMode === 'exposure'
                  ? 'bg-white/[0.08] text-sky-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {t('hud.flood_exposure')}
            </button>
            <button
              onClick={() => setLayerMode('closure')}
              className={`flex-1 py-1 px-2 rounded-full font-medium transition-all ${
                layerMode === 'closure'
                  ? 'bg-white/[0.08] text-amber-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {t('hud.assumed_closure')}
            </button>
          </div>

          {/* Risk colors */}
          <div>
            <div
              className="text-[9px] uppercase tracking-[0.22em] text-slate-500 mb-1.5"
              style={MONO}
            >
              {layerMode === 'exposure' ? t('legend.flood_exposure_prob') : t('legend.assumed_closure_prob')}
            </div>
            <div className="space-y-1">
              {RISK_CLASSES.map((rc, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] text-slate-300">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block rounded-full"
                      style={{
                        backgroundColor: rc.color,
                        width: `${Math.max(12, rc.strokeWidth * 3)}px`,
                        height: `${Math.max(3, rc.strokeWidth)}px`,
                      }}
                    />
                    <span style={MONO}>{rc.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-500" style={MONO}>
                    {rc.strokeWidth}px
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Facility Types */}
          <div className="pt-2 border-t border-white/[0.06]">
            <div
              className="text-[9px] uppercase tracking-[0.22em] text-slate-500 mb-1.5"
              style={MONO}
            >
              {t('results.ranking_title')}
            </div>
            <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white bg-sky-300 inline-block" />
                <span>{t('results.level_hospital')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-white bg-sky-300 inline-block" />
                <span>{t('results.level_health_center')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full border border-white bg-sky-300 inline-block" />
                <span>{t('results.level_clinic')}</span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="pt-2 border-t border-white/[0.06] flex items-start gap-1.5 text-[10px] text-slate-500 leading-snug">
            <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
            <span>{t('app.disclaimer')}</span>
          </div>
        </div>
      )}
    </div>
  );
};
