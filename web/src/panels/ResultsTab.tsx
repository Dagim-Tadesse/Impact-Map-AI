import React, { useState, useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  Hospital,
  ArrowUpDown,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  MapPin,
  Download,
  FileText,
  Printer,
  Sparkles,
  RotateCcw,
  GitCompare,
  Info,
} from 'lucide-react';
import { useResultSummaryQuery, useSegmentsColumnarQuery } from '../api/hooks';
import { useAppStore } from '../state/useAppStore';
import { ProbabilityBar } from '../components/ProbabilityBar';
import { RankDelta } from '../components/RankDelta';
import { QualityFlag } from '../components/QualityFlag';
import { formatPeople, formatMinutes } from '../lib/format';
import { use3dTilt } from '../lib/use3dTilt';
import { SitRepModal } from '../components/SitRepModal';
import { useTranslation } from 'react-i18next';

const TiltSummaryCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  titleColor: string;
  value: string;
  subtitle: string;
}> = ({ title, icon, titleColor, value, subtitle }) => {
  const cardRef = use3dTilt<HTMLDivElement>({ maxTilt: 6, scale: 1.02, glare: true });
  return (
    <div ref={cardRef} className="glass-panel p-3.5 rounded-xl border border-white/10 card-3d-tilt">
      <div className={`flex items-center gap-1.5 text-xs ${titleColor} font-medium mb-1`}>
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-lg font-extrabold text-white font-mono">{value}</div>
      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{subtitle}</div>
    </div>
  );
};

export const ResultsTab: React.FC = () => {
  const { t } = useTranslation();
  const {
    currentCacheKey,
    baseCacheKey,
    setBaseCacheKey,
    setCurrentCacheKey,
    setActiveTab,
    setComparePair,
    whatIf,
    selectedFacilityId,
    setSelectedFacilityId,
    selectedCommunityId,
    setSelectedCommunityId,
  } = useAppStore();
  const { data: resultSummary, isLoading } = useResultSummaryQuery(currentCacheKey);
  const { data: baseSummary } = useResultSummaryQuery(baseCacheKey);
  const { data: segmentsData } = useSegmentsColumnarQuery(currentCacheKey);

  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'hospital' | 'health_center' | 'clinic'>('all');
  const [sortField, setSortField] = useState<'rank' | 'p_isolation' | 'people' | 'score'>('rank');
  const [sortAsc, setSortAsc] = useState(true);
  const [communitiesOpen, setCommunitiesOpen] = useState(false);
  const [expandedFacilityId, setExpandedFacilityId] = useState<string | null>(null);
  const [sitRepOpen, setSitRepOpen] = useState(false);

  const handleExportCSV = () => {
    if (!resultSummary?.ranking) return;
    const headers = ['Rank', 'Facility ID', 'Name', 'Level', 'Isolation Probability', 'Est Population Impact', 'Priority Score'];
    const rows = resultSummary.ranking.map((f: any, idx: number) => [
      idx + 1,
      f.facility_id,
      `"${(f.name || `Facility #${f.facility_id}`).replace(/"/g, '""')}"`,
      f.level || 'health_center',
      (f.isolation_probability || 0).toFixed(3),
      Math.round(f.people_affected_est || 0),
      (f.priority_score || 0).toFixed(1),
    ]);
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `impactmap-sitrep-${currentCacheKey || 'active'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportGeoJSON = () => {
    if (!segmentsData) return;
    const features = segmentsData.segment_ids.map((id: number, idx: number) => ({
      type: 'Feature',
      properties: {
        segment_id: id,
        exposure_probability: segmentsData.exposure_prob[idx],
        closure_probability: segmentsData.closure_prob[idx],
      },
      geometry: null,
    }));
    const geojson = {
      type: 'FeatureCollection',
      metadata: {
        source: 'ImpactMap AI',
        scenario_cache_key: currentCacheKey,
        exported_at: new Date().toISOString(),
      },
      features,
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `impactmap-roads-${currentCacheKey || 'active'}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered and Sorted Ranking List
  const filteredRanking = useMemo(() => {
    if (!resultSummary?.ranking) return [];

    let list = resultSummary.ranking.filter((item: any) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = levelFilter === 'all' || item.level === levelFilter;
      return matchesSearch && matchesLevel;
    });

    list.sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (sortField === 'people') {
        valA = a.people_affected_est || 0;
        valB = b.people_affected_est || 0;
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [resultSummary, searchQuery, levelFilter, sortField, sortAsc]);

  if (!currentCacheKey || (!resultSummary && !isLoading)) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center glass-panel rounded-2xl border border-white/10 mt-6">
        <Hospital className="w-10 h-10 text-slate-500 mb-3" />
        <h3 className="text-base font-bold text-white mb-1">No Active Simulation</h3>
        <p className="text-xs text-slate-400 max-w-xs mb-4">
          Select a baseline from the Scenario tab or execute a custom rainfall event to view healthcare access impacts.
        </p>
      </div>
    );
  }

  const totals = resultSummary?.region_totals;

  return (
    <div className="space-y-6 pb-12">
      {/* What-If Before-and-After Comparison Card (Work Division A4.10 Contract) */}
      {baseCacheKey && baseSummary && (
        <div className="p-4 rounded-2xl glass-panel-elevated border border-cyan-500/40 bg-[#091524] space-y-3 shadow-[0_0_24px_rgba(6,182,212,0.2)] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                What-If Scenario Active
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                {whatIf.forced_closed.length + whatIf.forced_open.length} Overrides
              </span>
            </div>

            <button
              onClick={() => {
                setCurrentCacheKey(baseCacheKey);
                setBaseCacheKey(null);
              }}
              className="text-[11px] font-mono text-cyan-300 hover:text-white underline underline-offset-2 flex items-center gap-1 transition-colors"
              title="Revert to original pre-intervention scenario"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Back to original</span>
            </button>
          </div>

          {/* Before & After Delta Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Cut Off Population</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-slate-400 line-through font-mono text-[11px]">
                  {formatPeople(baseSummary.region_totals?.people_cut_off?.mean || 0, false)}
                </span>
                <span className="text-white font-bold font-mono">
                  {formatPeople(totals?.people_cut_off?.mean || 0, false)}
                </span>
              </div>
              {totals && baseSummary?.region_totals && (
                <div
                  className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                    totals.people_cut_off.mean - baseSummary.region_totals.people_cut_off.mean <= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {totals.people_cut_off.mean - baseSummary.region_totals.people_cut_off.mean <= 0
                    ? '↓ '
                    : '↑ '}
                  {Math.abs(
                    Math.round(
                      totals.people_cut_off.mean - baseSummary.region_totals.people_cut_off.mean
                    )
                  ).toLocaleString()}{' '}
                  people
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Isolated Facilities</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-slate-400 line-through font-mono text-[11px]">
                  {baseSummary.region_totals?.facilities_isolated_expected?.toFixed(1) || '0'}
                </span>
                <span className="text-white font-bold font-mono">
                  {totals?.facilities_isolated_expected?.toFixed(1) || '0'}
                </span>
              </div>
              {totals && baseSummary?.region_totals && (
                <div
                  className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                    totals.facilities_isolated_expected -
                      baseSummary.region_totals.facilities_isolated_expected <=
                    0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {totals.facilities_isolated_expected -
                    baseSummary.region_totals.facilities_isolated_expected <=
                  0
                    ? '↓ '
                    : '↑ '}
                  {Math.abs(
                    totals.facilities_isolated_expected -
                      baseSummary.region_totals.facilities_isolated_expected
                  ).toFixed(1)}{' '}
                  facilities
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setComparePair({ a: baseCacheKey, b: currentCacheKey });
              setActiveTab('compare');
            }}
            className="w-full py-1.5 px-3 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('results.compare_diff')}</span>
          </button>
        </div>
      )}

      {/* 1. Summary Cards with 3D Tilt */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <TiltSummaryCard
          title={t('results.cut_off_population')}
          icon={<Users className="w-3.5 h-3.5 text-rose-400" />}
          titleColor="text-rose-300"
          value={totals?.people_cut_off?.mean ? formatPeople(totals.people_cut_off.mean, false) : '0'}
          subtitle={`[${totals?.people_cut_off?.p10 ? Math.round(totals.people_cut_off.p10).toLocaleString() : '0'} – ${totals?.people_cut_off?.p90 ? Math.round(totals.people_cut_off.p90).toLocaleString() : '0'}]`}
        />

        <TiltSummaryCard
          title={t('results.degraded_access')}
          icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
          titleColor="text-amber-300"
          value={totals?.people_degraded?.mean ? formatPeople(totals.people_degraded.mean, false) : '0'}
          subtitle={`[${totals?.people_degraded?.p10 ? Math.round(totals.people_degraded.p10).toLocaleString() : '0'} – ${totals?.people_degraded?.p90 ? Math.round(totals.people_degraded.p90).toLocaleString() : '0'}]`}
        />

        <TiltSummaryCard
          title={t('results.isolated_facilities')}
          icon={<Hospital className="w-3.5 h-3.5 text-sky-400" />}
          titleColor="text-sky-300"
          value={totals?.facilities_isolated_expected ? totals.facilities_isolated_expected.toFixed(1) : '0.0'}
          subtitle={t('results.expected_value')}
        />
      </div>

      {/* Mandatory Disclaimer Line & Executive Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-sans">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="italic">
            {t('contracts.access_loss_label')}. {t('contracts.disclaimer')}
          </span>
        </div>

        {/* 1-Click Executive Data Exports & SitRep Modal */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              setSitRepOpen(true);
            }}
            className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)] font-semibold"
            title="Open Official UN-OCHA / EDRMC Situation Report Briefing"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-300" />
            <span>{t('results.export_sitrep')}</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all shadow-sm"
            title="Download Executive SitRep priority table as CSV"
          >
            <Download className="w-3 h-3" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportGeoJSON}
            className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all shadow-sm"
            title="Download prioritized road segments as GeoJSON"
          >
            <FileText className="w-3 h-3" />
            <span>GeoJSON</span>
          </button>
          <button
            onClick={() => {
              setSitRepOpen(true);
            }}
            className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 transition-all shadow-sm"
            title="Print operational briefing sheet"
          >
            <Printer className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. Facility Priority Ranking Table */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            {t('results.ranking_title')}
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            {filteredRanking.length} {t('results.facilities_count')}
          </span>
        </div>

        {/* Search & Level Filters */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('results.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500"
            />
          </div>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as any)}
            className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
          >
            <option value="all">{t('results.level_all')}</option>
            <option value="hospital">{t('results.level_hospital')}</option>
            <option value="health_center">{t('results.level_health_center')}</option>
            <option value="clinic">{t('results.level_clinic')}</option>
          </select>
        </div>

        {/* Interaction Hint */}
        <p className="text-[11px] text-cyan-400/90 mb-2.5 flex items-center gap-1.5 font-medium">
          <span>🎯</span>
          <span>Click any facility below to fly the map to it and inspect its road route:</span>
        </p>

        {/* Ranking List */}
        <div className="space-y-2">
          {filteredRanking.map((fac: any) => {
            const isSelected = fac.facility_id === selectedFacilityId;

            return (
              <div
                key={fac.facility_id}
                onClick={() => setSelectedFacilityId(fac.facility_id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.25)]'
                    : 'glass-panel hover:glass-panel-elevated border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 border border-white/10 text-[11px] font-mono font-bold text-slate-300 flex items-center justify-center shrink-0">
                      {fac.rank}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white hover:text-cyan-300 transition-colors">
                        {fac.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono uppercase text-sky-400">
                          {fac.level.replace('_', ' ')}
                        </span>
                        <QualityFlag
                          flag={fac.quality_flag}
                          poorBaseline={fac.poor_baseline_access}
                        />
                      </div>
                    </div>
                  </div>

                  <RankDelta delta={fac.rank_delta} />
                </div>

                {/* Probability & Impact Metric */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                  <ProbabilityBar
                    prob={fac.p_isolation}
                    p10={fac.p10}
                    p90={fac.p90}
                    showWhiskers={true}
                  />

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Population Impact</div>
                    <div className="text-xs font-bold font-mono text-slate-200">
                      {fac.people_affected_est
                        ? Math.round(fac.people_affected_est).toLocaleString()
                        : '0'}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">est.</span>
                    </div>
                  </div>
                </div>

                {/* Score & Raw Components Breakdown (Work Division A4.5 Contract) */}
                <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>Priority Score:</span>
                    <span className="font-bold text-cyan-300">
                      {fac.priority_score ? fac.priority_score.toFixed(1) : (fac.p_isolation * 100).toFixed(0)}
                    </span>
                    <span className="text-[10px] text-slate-500">/ 100</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedFacilityId(expandedFacilityId === fac.facility_id ? null : fac.facility_id);
                    }}
                    className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 underline underline-offset-2"
                  >
                    <span>{expandedFacilityId === fac.facility_id ? 'Hide' : 'Raw Components'}</span>
                    <Info className="w-3 h-3" />
                  </button>
                </div>

                {expandedFacilityId === fac.facility_id && (
                  <div className="mt-2 p-2 rounded-lg bg-black/40 border border-white/5 text-[10px] font-mono space-y-1 animate-in fade-in duration-150">
                    <div className="flex justify-between text-slate-300">
                      <span>• Isolation Risk:</span>
                      <span className="text-cyan-400">{(fac.p_isolation * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>• People Cut Off:</span>
                      <span className="text-rose-400">{Math.round(fac.people_affected_est || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>• Baseline Travel:</span>
                      <span className="text-amber-400">{formatMinutes(fac.baseline_minutes || 0)}</span>
                    </div>
                    <p className="text-[9px] text-slate-500 italic pt-0.5">
                      Score is calculated relative to Awash Basin pilot distribution.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Top Communities Affected (Collapsible Section) */}
      {resultSummary?.top_communities && resultSummary.top_communities.length > 0 && (
        <div className="border-t border-white/10 pt-4">
          <button
            onClick={() => setCommunitiesOpen(!communitiesOpen)}
            className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Top Cut-Off Settlements ({resultSummary.top_communities.length})</span>
            </div>
            {communitiesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {communitiesOpen && (
            <div className="space-y-2 mt-3">
              {resultSummary.top_communities.map((c: any) => {
                const isSelected = selectedCommunityId === c.community_id;
                return (
                  <div
                    key={c.community_id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCommunityId(null);
                      } else {
                        setSelectedCommunityId(c.community_id);
                      }
                    }}
                    className={`p-2.5 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
                        : 'glass-panel border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div>
                      <div className={`font-bold ${isSelected ? 'text-cyan-200' : 'text-white'}`}>
                        {c.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {Math.round(c.people_est).toLocaleString()} people · Base {c.baseline_minutes?.toFixed(1)} min
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-rose-400">
                        {(c.p_cut_off * 100).toFixed(0)}% cut off
                      </div>
                      {c.p_degraded > 0 && (
                        <div className="text-[10px] font-mono text-amber-400">
                          {(c.p_degraded * 100).toFixed(0)}% degraded
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Official Executive SitRep Modal */}
      <SitRepModal
        isOpen={sitRepOpen}
        onClose={() => setSitRepOpen(false)}
        resultSummary={resultSummary}
        currentCacheKey={currentCacheKey}
        onExportCSV={handleExportCSV}
        onExportGeoJSON={handleExportGeoJSON}
      />
    </div>
  );
};
