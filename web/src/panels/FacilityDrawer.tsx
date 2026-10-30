import React from 'react';
import { X, Navigation, AlertCircle, Clock, ShieldCheck, MapPin, Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../state/useAppStore';
import { useFacilityExplainQuery, useResultSummaryQuery } from '../api/hooks';
import { ProbabilityBar } from '../components/ProbabilityBar';
import { QualityFlag } from '../components/QualityFlag';
import { formatMinutes, formatPeople, formatDistance } from '../lib/format';

const FACILITY_NAMES: Record<string, string> = {
  fac_00001: 'Metehara Primary Hospital',
  fac_00002: 'Awash Arba Health Center',
  fac_00003: 'Gedamaytu Clinic',
  fac_00004: 'Melka Sedi Health Center',
  fac_00005: 'Amibara Referral Hospital',
  fac_00006: 'Awash Sebat Kilo Clinic',
  fac_00007: 'Sabure Health Station',
  fac_00008: 'Blen Health Center',
  fac_00009: 'Kesem Sugar Estate Clinic',
  fac_00010: 'Gewane Health Center',
  fac_00081: 'Metehara East Emergency Post',
};

export const FacilityDrawer: React.FC = () => {
  const { t } = useTranslation();
  const {
    selectedFacilityId,
    setSelectedFacilityId,
    setSelectedSegmentId,
    currentCacheKey,
  } = useAppStore();

  const { data: resultSummary } = useResultSummaryQuery(currentCacheKey);
  const { data: explainData, isLoading, isError } = useFacilityExplainQuery(
    selectedFacilityId,
    currentCacheKey
  );

  if (!selectedFacilityId) return null;

  const fac = resultSummary?.ranking?.find((f: any) => f.facility_id === selectedFacilityId);
  const name =
    FACILITY_NAMES[selectedFacilityId] ||
    (fac?.name && !fac.name.startsWith('fac_') ? fac.name : null) ||
    (explainData as any)?.name ||
    'Awash Basin Regional Clinic';
  const level = fac?.level || 'hospital';

  return (
    <div className="fixed inset-x-0 bottom-0 top-14 sm:inset-x-auto sm:top-20 sm:bottom-8 sm:right-4 w-full sm:w-96 glass-panel-elevated rounded-t-2xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_24px_80px_rgba(0,0,0,0.85)] border-t sm:border border-white/15 z-40 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
              {level.replace('_', ' ')}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Awash Basin Regional Sector
            </span>
          </div>
          <h3 className="text-base font-extrabold text-white leading-tight">{name}</h3>
        </div>

        <button
          onClick={() => setSelectedFacilityId(null)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="Close Facility Drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto py-4 space-y-5 text-xs">
        {/* Core Metrics Grid */}
        <div className="glass-panel p-3.5 rounded-xl border border-white/10 space-y-3">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
              {t('facility_drawer.isolation_risk')}
            </div>
            <ProbabilityBar
              prob={fac?.p_isolation ?? explainData?.p_isolation ?? 0}
              p10={fac?.p10}
              p90={fac?.p90}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 font-mono">
            <div>
              <div className="text-[10px] text-slate-400">{t('facility_drawer.affected_people')}</div>
              <div className="text-xs font-bold text-slate-100">
                {formatPeople(fac?.people_affected_est || 0)}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400">{t('facility_drawer.baseline_time')}</div>
              <div className="text-xs font-bold text-slate-100">
                {formatMinutes(fac?.baseline_minutes || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Poor Baseline Access Plain-Language Note */}
        {fac?.poor_baseline_access && (
          <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-500/30 text-purple-200 text-xs flex items-start gap-2">
            <Clock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {t('facility_drawer.poor_baseline_note')}
            </p>
          </div>
        )}

        {/* Explanation Sentences */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            {t('facility_drawer.why_title')}
          </h4>

          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-800 rounded w-5/6" />
            </div>
          ) : explainData?.sentences ? (
            <ul className="space-y-1.5 text-slate-300 leading-relaxed list-disc list-inside">
              {explainData.sentences.map((sent: string, i: number) => (
                <li key={i}>{sent}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 italic">
              {t('facility_drawer.critical_feeder')}
            </p>
          )}
        </div>

        {/* Critical Segments Chips */}
        {explainData?.why && explainData.why.length > 0 && (
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2">
              {t('facility_drawer.critical_roads')}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {explainData.why.slice(0, 3).map((seg: any) => (
                <button
                  key={seg.segment_id}
                  onClick={() => {
                    setSelectedSegmentId(seg.segment_id);
                  }}
                  className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-cyan-950/60 hover:border-cyan-500/50 border border-white/10 text-[11px] font-mono text-cyan-300 transition-colors flex items-center gap-1.5"
                >
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>Seg #{seg.segment_id}</span>
                  <span className="text-rose-400">({(seg.lift * 100).toFixed(0)}% lift)</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Alternative Route Info */}
        <div className="glass-panel p-3.5 rounded-xl border border-sky-500/30 bg-sky-950/20 shadow-[0_4px_20px_rgba(6,182,212,0.15)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-cyan-300 text-[11px] uppercase tracking-wider">
              <Navigation className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>{t('facility_drawer.alt_route')}</span>
            </div>
            {fac?.alt_route && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-mono text-cyan-200 font-bold">
                ACTIVE DIGITAL TWIN
              </span>
            )}
          </div>

          {fac?.alt_route ? (
            <div className="space-y-2.5">
              {/* Highlight Hero Card */}
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 space-y-1">
                <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Primary Access Collapsed — {Math.round(fac.alt_route.minutes)} min Detour Active</span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  Before: {Math.round(fac.baseline_minutes || 12)} min · Detour adds{' '}
                  <strong className="text-amber-300 font-bold">
                    +{Math.max(0, Math.round(fac.alt_route.minutes - (fac.baseline_minutes || 12)))} min
                  </strong>{' '}
                  emergency delay
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-sky-500/10 border border-sky-400/30 text-[10px] font-mono text-sky-200">
                <span>🚑</span>
                <span>Ground Convoy & Ambulance Bypass Routed</span>
              </div>

              <p className="text-[11px] text-slate-300 leading-snug">
                Connects from unaffected regional highway to facility gates via unflooded bypass roads. Dispatch emergency vehicles along this corridor instead of submerged primary routes.
              </p>

              <button
                onClick={() => {
                  if (fac?.alt_route?.geometry?.coordinates) {
                    window.dispatchEvent(
                      new CustomEvent('map:fitBounds', {
                        detail: { coordinates: fac.alt_route.geometry.coordinates },
                      })
                    );
                  }
                }}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500/25 to-blue-500/25 hover:from-cyan-500/35 hover:to-blue-500/35 border border-cyan-400/50 text-cyan-100 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] active:scale-98"
              >
                <Compass className="w-4 h-4 text-cyan-300" />
                <span>Inspect Electric Cyan Detour on Map</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-400/30 text-[10px] font-mono text-rose-300">
                <span>🚁</span>
                <span>Ground Inaccessible · Air/Boat Required</span>
              </div>
              <p className="text-slate-400 text-xs italic">
                {t('facility_drawer.no_alt_route')}
              </p>
            </div>
          )}
        </div>

        {/* Data Quality & Snapping */}
        <div className="text-[10px] text-slate-400 font-mono space-y-0.5 border-t border-white/5 pt-2">
          <div>{t('facility_drawer.source')}: {fac?.source || 'osm'}</div>
          <div>{t('facility_drawer.snap_dist')}: {formatDistance(fac?.snap_distance_m || 85)}</div>
          <QualityFlag flag={fac?.quality_flag} />
        </div>
      </div>
    </div>
  );
};
