import React, { useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Printer,
  Download,
  FileText,
  AlertTriangle,
  Hospital,
  Users,
  ShieldAlert,
  MapPin,
  Calendar,
  CheckCircle,
  Radio,
  Activity,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTranslation } from 'react-i18next';
import { getConfig } from '../config';
import { formatPeople } from '../lib/format';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface SitRepModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultSummary: any;
  currentCacheKey: string | null;
  onExportCSV: () => void;
  onExportGeoJSON: () => void;
}

export const SitRepModal: React.FC<SitRepModalProps> = ({
  isOpen,
  onClose,
  resultSummary,
  currentCacheKey,
  onExportCSV,
  onExportGeoJSON,
}) => {
  const { t } = useTranslation();
  const config = getConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;


    if (containerRef.current) {
      const ctx = gsap.context(() => {
        // Scroll progress bar linked to container scroll
        if (progressBarRef.current) {
          gsap.to(progressBarRef.current, {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: containerRef.current,
              scroller: containerRef.current,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.3,
            },
          });
        }

        // Header and hero elements
        gsap.from('.sitrep-header-elem', {
          opacity: 0,
          y: 20,
          stagger: 0.08,
          duration: 0.5,
          ease: 'power3.out',
        });

        // Staggered reveal for sitrep items on scroll
        const reveals = gsap.utils.toArray<HTMLElement>('.sitrep-reveal');
        reveals.forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 24,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              scroller: containerRef.current,
              start: 'top 88%',
              toggleActions: 'play none none reverse',
            },
          });
        });
      }, containerRef);

      return () => ctx.revert();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totals = resultSummary?.region_totals;
  const ranking = resultSummary?.ranking || [];
  const topFacilities = ranking.slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 min-h-screen w-full bg-[#080b12] text-slate-100 overflow-y-auto custom-scrollbar selection:bg-cyan-500/30 selection:text-cyan-200 print:bg-white print:text-black print:overflow-visible"
      role="dialog"
      aria-labelledby="sitrep-modal-title"
      aria-modal="true"
    >
      {/* Scroll-Driven Briefing Progress Indicator */}
      <div className="fixed top-0 inset-x-0 h-1 z-50 bg-slate-900/60 print:hidden">
        <div
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-400 origin-left"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#080b12]/95 backdrop-blur-2xl border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)] print:hidden">
        <button
          onClick={() => {
            onClose();
          }}
          className="min-h-[44px] inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors px-3 py-1.5 rounded-xl hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Map Explorer</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onExportCSV();
            }}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            title="Download priority table CSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{t('sitrep.export_csv')}</span>
          </button>

          <button
            onClick={() => {
              onExportGeoJSON();
            }}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            title="Download GeoJSON data"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">{t('sitrep.export_geojson')}</span>
          </button>

          <button
            onClick={handlePrint}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_16px_rgba(6,182,212,0.3)]"
            title="Print or Save PDF Briefing"
          >
            <Printer className="w-4 h-4" />
            <span>{t('sitrep.print')}</span>
          </button>
        </div>
      </header>

      {/* Main Document Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8 print:p-0 print:space-y-4">
        {/* Printable Official Header */}
        <div className="sitrep-header-elem border-b border-slate-800 pb-6 print:border-black/20 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 uppercase tracking-widest print:bg-gray-100 print:text-black print:border-gray-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse print:hidden" />
              {t('sitrep.flash_title')}
            </span>
            <span className="text-xs font-mono text-slate-400 print:text-gray-600">
              {t('sitrep.compliant')}
            </span>
          </div>

          <h1
            id="sitrep-modal-title"
            className="text-2xl sm:text-4xl font-black text-white tracking-tight print:text-black"
          >
            {t('sitrep.main_title')}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1 print:text-gray-700">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 print:text-black" />
              {t('sitrep.region')}: Awash Basin ({config.region_id})
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400 print:text-black" />
              {t('sitrep.generated')}: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </span>
            <span className="text-slate-500 print:text-gray-500">
              {t('sitrep.scenario_ref')}: {currentCacheKey || 'Active Simulation'}
            </span>
          </div>
        </div>

        {/* Executive Summary Triad (Frameless Triage Blocks with Accented Glows) */}
        <div className="sitrep-reveal grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1c0d16] to-[#0f070c] border border-rose-500/40 print:bg-gray-50 print:border-gray-300 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase print:text-red-700 font-mono">
                <Users className="w-4 h-4" />
                <span>{t('sitrep.cut_off_pop')}</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse print:hidden" />
            </div>
            <div className="text-4xl font-black font-mono text-white mt-1 print:text-black">
              {totals?.people_cut_off?.mean ? formatPeople(totals.people_cut_off.mean, false) : '0'}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-2 print:text-gray-600">
              P10–P90: [{totals?.people_cut_off?.p10 ? Math.round(totals.people_cut_off.p10).toLocaleString() : '0'} – {totals?.people_cut_off?.p90 ? Math.round(totals.people_cut_off.p90).toLocaleString() : '0'}]
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1a140b] to-[#0e0c07] border border-amber-500/40 print:bg-gray-50 print:border-gray-300 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase print:text-yellow-800 font-mono">
                <AlertTriangle className="w-4 h-4" />
                <span>{t('sitrep.degraded_access')}</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-amber-400 print:hidden" />
            </div>
            <div className="text-4xl font-black font-mono text-white mt-1 print:text-black">
              {totals?.people_degraded?.mean ? formatPeople(totals.people_degraded.mean, false) : '0'}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-2 print:text-gray-600">
              P10–P90: [{totals?.people_degraded?.p10 ? Math.round(totals.people_degraded.p10).toLocaleString() : '0'} – {totals?.people_degraded?.p90 ? Math.round(totals.people_degraded.p90).toLocaleString() : '0'}]
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0d172a] to-[#070c18] border border-sky-500/40 print:bg-gray-50 print:border-gray-300 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sky-300 text-xs font-bold uppercase print:text-blue-800 font-mono">
                <Hospital className="w-4 h-4" />
                <span>{t('sitrep.isolated_fac')}</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-sky-400 print:hidden" />
            </div>
            <div className="text-4xl font-black font-mono text-white mt-1 print:text-black">
              {totals?.facilities_isolated_expected ? totals.facilities_isolated_expected.toFixed(1) : '0.0'}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-2 print:text-gray-600">
              {t('sitrep.expected_mc')}
            </div>
          </div>
        </div>

        {/* Priority Health Centers Tactical Table */}
        <div className="sitrep-reveal space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white print:text-black flex items-center gap-2">
              <Hospital className="w-4 h-4 text-cyan-400 print:text-black" />
              <span>{t('sitrep.priority_table_title')}</span>
            </h2>
            <span className="text-xs font-mono text-slate-400 print:hidden">
              {t('sitrep.ranked_severity')}
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0d1424] print:bg-white print:border-gray-300 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 font-mono text-[11px] uppercase text-slate-400 print:bg-gray-100 print:text-black print:border-gray-300">
                <tr>
                  <th className="py-3 px-4">{t('sitrep.th_rank')}</th>
                  <th className="py-3 px-4">{t('sitrep.th_facility')}</th>
                  <th className="py-3 px-4">{t('sitrep.th_level')}</th>
                  <th className="py-3 px-4">{t('sitrep.th_isolation_prob')}</th>
                  <th className="py-3 px-4">{t('sitrep.th_catchment')}</th>
                  <th className="py-3 px-4">{t('sitrep.th_priority_score')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono print:divide-gray-200">
                {topFacilities.map((fac: any, idx: number) => (
                  <tr key={fac.facility_id} className="hover:bg-slate-800/40 print:text-black">
                    <td className="py-3 px-4 text-cyan-400 font-bold print:text-black">#{idx + 1}</td>
                    <td className="py-3 px-4 font-sans font-medium text-white print:text-black">
                      {fac.name || `Facility #${fac.facility_id}`}
                    </td>
                    <td className="py-3 px-4 text-slate-400 capitalize print:text-gray-700">
                      {(fac.level || 'Health Center').replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          fac.isolation_probability >= 0.5
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40 print:bg-gray-100 print:text-red-700'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-500/40 print:bg-gray-100 print:text-yellow-700'
                        }`}
                      >
                        {((fac.isolation_probability || 0) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 print:text-black">
                      {Math.round(fac.people_affected_est || 0).toLocaleString()} {t('sitrep.people_unit')}
                    </td>
                    <td className="py-3 px-4 font-bold text-white print:text-black">
                      {(fac.priority_score || 0).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Humanitarian Directives */}
        <div className="sitrep-reveal p-6 rounded-2xl bg-gradient-to-r from-cyan-950/30 to-blue-950/20 border border-cyan-500/30 text-xs space-y-3 print:bg-gray-50 print:border-gray-300 print:text-black">
          <div className="flex items-center gap-2 text-cyan-300 font-bold uppercase tracking-wider print:text-black">
            <CheckCircle className="w-4 h-4 text-cyan-400 print:text-black" />
            <span>{t('sitrep.directives_title')}</span>
          </div>
          <ul className="space-y-2 text-slate-300 list-disc list-inside text-xs leading-relaxed print:text-gray-800">
            <li>{t('sitrep.directive_1')}</li>
            <li>{t('sitrep.directive_2')}</li>
            <li>{t('sitrep.directive_3')}</li>
          </ul>
        </div>

        {/* Bottom Disclaimer */}
        <div className="sitrep-reveal flex items-start gap-2 text-xs text-slate-400 italic print:text-gray-500">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 print:text-black" />
          <span>
            {t('sitrep.notice')}
          </span>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="text-xs font-mono text-slate-400">
            {t('sitrep.doc_id')}: <span className="text-cyan-300">SITREP-AWASH-{currentCacheKey || 'ACTIVE'}</span>
          </div>

          <button
            onClick={() => {
              onClose();
            }}
            className="min-h-[44px] flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Return to Map Explorer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
