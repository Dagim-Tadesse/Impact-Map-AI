import React, { useState, useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  Hospital,
  Search,
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

const SERIF: React.CSSProperties = { fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 };
const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
const SANS: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

const SectionKicker: React.FC<{ eyebrow: string; title: string; meta?: React.ReactNode }> = ({
  eyebrow,
  title,
  meta,
}) => (
  <div className="flex items-end justify-between gap-3 mb-4">
    <div className="min-w-0">
      <div
        className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-sky-300/90 mb-1.5"
        style={MONO}
      >
        <span className="w-1 h-1 rounded-full bg-sky-300" />
        <span>{eyebrow}</span>
      </div>
      <h2
        className="text-[22px] text-white leading-tight"
        style={SERIF}
      >
        {title}
      </h2>
    </div>
    {meta && (
      <div
        className="text-[10px] uppercase tracking-[0.22em] text-slate-500 shrink-0 pb-1"
        style={MONO}
      >
        {meta}
      </div>
    )}
  </div>
);

// Landing-style metric card: mono UPPERCASE kicker → serif number → DM Sans caption
const MetricCard: React.FC<{
  eyebrow: string;
  icon: React.ReactNode;
  accent: 'rose' | 'amber' | 'sky';
  value: string;
  caption: string;
}> = ({ eyebrow, icon, accent, value, caption }) => {
  const cardRef = use3dTilt<HTMLDivElement>({ maxTilt: 5, scale: 1.015, glare: true });
  const accentText =
    accent === 'rose' ? 'text-rose-300' : accent === 'amber' ? 'text-amber-300' : 'text-sky-300';

  return (
    <div
      ref={cardRef}
      className="group relative rounded-xl border border-white/[0.08] bg-[#0a0e16]/80 p-4 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/[0.18] hover:-translate-y-0.5 card-3d-tilt"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] uppercase tracking-[0.22em] ${accentText}`} style={MONO}>
          {eyebrow}
        </span>
        <span className="opacity-60 group-hover:opacity-100 transition-opacity">{icon}</span>
      </div>
      <div className="text-3xl text-white leading-none tabular-nums" style={SERIF}>
        {value}
      </div>
      <div className="text-[11px] text-slate-500 mt-2 leading-snug" style={SANS}>
        {caption}
      </div>
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
      <div
        className="flex flex-col items-center justify-center p-10 text-center rounded-2xl border border-white/[0.08] bg-[#0a0e16]/70 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)] mt-6"
        style={SANS}
      >
        <Hospital className="w-10 h-10 text-slate-600 mb-4" />
        <h3 className="text-xl text-white mb-2" style={SERIF}>No Active Simulation</h3>
        <p className="text-[12px] text-slate-500 max-w-xs leading-relaxed">
          Select a baseline from the Scenario tab or execute a custom rainfall event to view healthcare access impacts.
        </p>
      </div>
    );
  }

  const totals = resultSummary?.region_totals;

  return (
    <div className="space-y-10 pb-10" style={SANS}>
      {/* ── What-If Diff Card ── */}
      {baseCacheKey && baseSummary && (
        <section className="rounded-2xl border border-sky-300/25 bg-sky-500/[0.04] p-4 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)] space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              <span
                className="text-[10px] uppercase tracking-[0.28em] text-sky-200"
                style={MONO}
              >
                What-If Overlay Active
              </span>
              <span
                className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-300"
                style={MONO}
              >
                {whatIf.forced_closed.length + whatIf.forced_open.length} overrides
              </span>
            </div>

            <button
              onClick={() => {
                setCurrentCacheKey(baseCacheKey);
                setBaseCacheKey(null);
              }}
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
              style={MONO}
              title="Revert to original pre-intervention scenario"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-black/20 border border-white/[0.05] p-3">
              <div className="text-[9px] uppercase tracking-[0.22em] text-sky-300/70 mb-1.5" style={MONO}>
                Cut-Off Population
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-slate-500 line-through text-[11px] tabular-nums" style={MONO}>
                  {formatPeople(baseSummary.region_totals?.people_cut_off?.mean || 0, false)}
                </span>
                <span className="text-xl text-white tabular-nums" style={SERIF}>
                  {formatPeople(totals?.people_cut_off?.mean || 0, false)}
                </span>
              </div>
              {totals && baseSummary?.region_totals && (
                <div
                  className={`text-[10px] mt-1 ${
                    totals.people_cut_off.mean - baseSummary.region_totals.people_cut_off.mean <= 0
                      ? 'text-emerald-300'
                      : 'text-rose-300'
                  }`}
                  style={MONO}
                >
                  {totals.people_cut_off.mean - baseSummary.region_totals.people_cut_off.mean <= 0 ? '↓ ' : '↑ '}
                  {Math.abs(Math.round(totals.people_cut_off.mean - baseSummary.region_totals.people_cut_off.mean)).toLocaleString()} people
                </div>
              )}
            </div>

            <div className="rounded-xl bg-black/20 border border-white/[0.05] p-3">
              <div className="text-[9px] uppercase tracking-[0.22em] text-sky-300/70 mb-1.5" style={MONO}>
                Isolated Facilities
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-slate-500 line-through text-[11px] tabular-nums" style={MONO}>
                  {baseSummary.region_totals?.facilities_isolated_expected?.toFixed(1) || '0'}
                </span>
                <span className="text-xl text-white tabular-nums" style={SERIF}>
                  {totals?.facilities_isolated_expected?.toFixed(1) || '0'}
                </span>
              </div>
              {totals && baseSummary?.region_totals && (
                <div
                  className={`text-[10px] mt-1 ${
                    totals.facilities_isolated_expected -
                      baseSummary.region_totals.facilities_isolated_expected <=
                    0
                      ? 'text-emerald-300'
                      : 'text-rose-300'
                  }`}
                  style={MONO}
                >
                  {totals.facilities_isolated_expected - baseSummary.region_totals.facilities_isolated_expected <= 0 ? '↓ ' : '↑ '}
                  {Math.abs(totals.facilities_isolated_expected - baseSummary.region_totals.facilities_isolated_expected).toFixed(1)} fac
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setComparePair({ a: baseCacheKey, b: currentCacheKey });
              setActiveTab('compare');
            }}
            className="group w-full inline-flex items-center justify-center gap-2 min-h-[40px] rounded-full border border-white/[0.1] bg-white/[0.04] text-[11px] font-medium text-slate-200 transition-all hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
          >
            <GitCompare className="w-3.5 h-3.5 text-sky-300" />
            <span>{t('results.compare_diff')}</span>
          </button>
        </section>
      )}

      {/* ── Summary Metrics ── */}
      <section>
        <SectionKicker
          eyebrow="01 · Regional Totals"
          title="Impact Snapshot"
          meta="P10–P90 band"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricCard
            eyebrow="Cut-Off Population"
            icon={<Users className="w-3.5 h-3.5 text-rose-300" />}
            accent="rose"
            value={totals?.people_cut_off?.mean ? formatPeople(totals.people_cut_off.mean, false) : '0'}
            caption={`${totals?.people_cut_off?.p10 ? Math.round(totals.people_cut_off.p10).toLocaleString() : '0'} – ${totals?.people_cut_off?.p90 ? Math.round(totals.people_cut_off.p90).toLocaleString() : '0'} range`}
          />
          <MetricCard
            eyebrow="Degraded Access"
            icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-300" />}
            accent="amber"
            value={totals?.people_degraded?.mean ? formatPeople(totals.people_degraded.mean, false) : '0'}
            caption={`${totals?.people_degraded?.p10 ? Math.round(totals.people_degraded.p10).toLocaleString() : '0'} – ${totals?.people_degraded?.p90 ? Math.round(totals.people_degraded.p90).toLocaleString() : '0'} range`}
          />
          <MetricCard
            eyebrow="Isolated Facilities"
            icon={<Hospital className="w-3.5 h-3.5 text-sky-300" />}
            accent="sky"
            value={totals?.facilities_isolated_expected ? totals.facilities_isolated_expected.toFixed(1) : '0.0'}
            caption={t('results.expected_value')}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5">
          <div className="flex items-start gap-1.5 text-[11px] text-slate-500 leading-snug">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span className="italic">
              {t('contracts.access_loss_label')}. {t('contracts.disclaimer')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setSitRepOpen(true)}
              className="group inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-semibold text-slate-900 shadow-[0_6px_18px_rgba(255,255,255,0.1)] transition-all hover:scale-105 hover:bg-amber-50 active:scale-95"
              title="Open Official UN-OCHA / EDRMC Situation Report Briefing"
            >
              <FileText className="w-3 h-3 text-amber-600 transition-transform group-hover:rotate-6" />
              <span>{t('results.export_sitrep')}</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-200 hover:border-white/25 hover:bg-white/[0.08] transition-all"
              style={MONO}
              title="Download Executive SitRep priority table as CSV"
            >
              <Download className="w-3 h-3" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportGeoJSON}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-300 hover:border-white/25 hover:bg-white/[0.08] transition-all"
              style={MONO}
              title="Download prioritized road segments as GeoJSON"
            >
              <FileText className="w-3 h-3" />
              <span>GeoJSON</span>
            </button>
            <button
              onClick={() => setSitRepOpen(true)}
              className="inline-flex items-center justify-center min-h-[32px] min-w-[32px] rounded-full border border-white/[0.1] bg-white/[0.03] text-slate-400 hover:text-white hover:border-white/25 transition-all"
              title="Print operational briefing sheet"
            >
              <Printer className="w-3 h-3" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Facility Ranking ── */}
      <section>
        <SectionKicker
          eyebrow="02 · Priority Ranking"
          title={t('results.ranking_title')}
          meta={`${filteredRanking.length} ${t('results.facilities_count')}`}
        />

        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('results.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 rounded-full border border-white/[0.08] bg-black/30 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-white/20"
            />
          </div>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as any)}
            className="h-10 rounded-full border border-white/[0.08] bg-black/30 px-3 text-[11px] text-slate-300 focus:outline-none focus:border-white/20"
            style={MONO}
          >
            <option value="all">{t('results.level_all')}</option>
            <option value="hospital">{t('results.level_hospital')}</option>
            <option value="health_center">{t('results.level_health_center')}</option>
            <option value="clinic">{t('results.level_clinic')}</option>
          </select>
        </div>

        <p className="text-[11px] text-amber-300/80 mb-3 flex items-center gap-1.5" style={MONO}>
          <span className="inline-block w-1 h-1 rounded-full bg-amber-300" />
          <span className="uppercase tracking-[0.18em]">Click a row to fly the map to the facility</span>
        </p>

        <div className="space-y-2.5">
          {filteredRanking.map((fac: any) => {
            const isSelected = fac.facility_id === selectedFacilityId;

            return (
              <div
                key={fac.facility_id}
                onClick={() => setSelectedFacilityId(fac.facility_id)}
                className={`group p-3.5 rounded-xl border backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.4)] transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500/[0.05] border-sky-300/35 shadow-[0_12px_32px_rgba(56,189,248,0.1)]'
                    : 'bg-[#0a0e16]/70 border-white/[0.07] hover:border-white/[0.16] hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className="text-2xl text-white leading-none tabular-nums shrink-0 w-7 text-right"
                      style={SERIF}
                    >
                      {fac.rank}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm text-white group-hover:text-sky-100 transition-colors leading-tight" style={SERIF}>
                        {fac.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[9px] uppercase tracking-[0.2em] text-sky-300"
                          style={MONO}
                        >
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

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/[0.05]">
                  <ProbabilityBar
                    prob={fac.p_isolation}
                    p10={fac.p10}
                    p90={fac.p90}
                    showWhiskers={true}
                  />

                  <div className="text-right">
                    <div
                      className="text-[9px] uppercase tracking-[0.22em] text-slate-500 mb-1"
                      style={MONO}
                      title="Total population in the surrounding woredas relying on this facility"
                    >
                      Catchment Serviced
                    </div>
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-base text-white tabular-nums" style={SERIF}>
                        {fac.people_affected_est
                          ? Math.round(fac.people_affected_est).toLocaleString()
                          : '0'}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-500" style={MONO}>
                        pop
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-white/[0.05] flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[9px] uppercase tracking-[0.22em] text-slate-500" style={MONO}>
                      Priority
                    </span>
                    <span className="text-lg text-white tabular-nums" style={SERIF}>
                      {fac.priority_score ? fac.priority_score.toFixed(1) : (fac.p_isolation * 100).toFixed(0)}
                    </span>
                    <span className="text-[10px] text-slate-500" style={MONO}>/100</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedFacilityId(expandedFacilityId === fac.facility_id ? null : fac.facility_id);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500 hover:text-sky-300 transition-colors"
                    style={MONO}
                  >
                    <span>{expandedFacilityId === fac.facility_id ? 'Hide' : 'Breakdown'}</span>
                    <Info className="w-3 h-3" />
                  </button>
                </div>

                {expandedFacilityId === fac.facility_id && (
                  <div className="mt-3 p-3 rounded-xl bg-black/30 border border-white/[0.05] space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    {[
                      {
                        label: 'Isolation Risk',
                        value: `${(fac.p_isolation * 100).toFixed(1)}%`,
                        tone: 'text-sky-300',
                      },
                      {
                        label: 'Catchment Pop',
                        value: Math.round(fac.people_affected_est || 0).toLocaleString(),
                        tone: 'text-slate-200',
                      },
                      {
                        label: 'Expected Cut-Off',
                        value: `~${Math.round((fac.p_isolation || 0) * (fac.people_affected_est || 0)).toLocaleString()}`,
                        tone: 'text-rose-300',
                      },
                      {
                        label: 'Baseline Travel',
                        value: formatMinutes(fac.baseline_minutes || 0),
                        tone: 'text-amber-300',
                      },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between text-[11px]" style={MONO}>
                        <span className="uppercase tracking-wider text-slate-500">{row.label}</span>
                        <span className={row.tone}>{row.value}</span>
                      </div>
                    ))}
                    <p className="text-[9px] text-slate-600 italic pt-1 uppercase tracking-wider" style={MONO}>
                      Scored vs Awash Basin pilot distribution
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Communities ── */}
      {resultSummary?.top_communities && resultSummary.top_communities.length > 0 && (
        <section className="border-t border-white/[0.06] pt-5">
          <button
            onClick={() => setCommunitiesOpen(!communitiesOpen)}
            className="group flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-sky-300" />
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-sky-300/80" style={MONO}>
                  03 · Settlements
                </div>
                <div className="text-base text-white group-hover:text-sky-100 transition-colors" style={SERIF}>
                  Top Cut-Off Settlements
                  <span className="text-slate-500 ml-2 text-sm" style={MONO}>
                    ({resultSummary.top_communities.length})
                  </span>
                </div>
              </div>
            </div>
            {communitiesOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {communitiesOpen && (
            <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
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
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? 'bg-sky-500/[0.05] border-sky-300/40'
                        : 'bg-[#0a0e16]/60 border-white/[0.07] hover:border-white/[0.16]'
                    }`}
                  >
                    <div>
                      <div
                        className={`text-sm ${isSelected ? 'text-sky-100' : 'text-white'}`}
                        style={SERIF}
                      >
                        {c.name}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider" style={MONO}>
                        {Math.round(c.people_est).toLocaleString()} people · Base {c.baseline_minutes?.toFixed(1)} min
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg text-rose-300 tabular-nums leading-none" style={SERIF}>
                        {(c.p_cut_off * 100).toFixed(0)}%
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-500 mt-0.5" style={MONO}>
                        cut off
                      </div>
                      {c.p_degraded > 0 && (
                        <div className="text-[10px] text-amber-300 mt-0.5" style={MONO}>
                          {(c.p_degraded * 100).toFixed(0)}% degraded
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

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
