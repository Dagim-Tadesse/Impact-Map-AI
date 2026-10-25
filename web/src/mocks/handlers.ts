import { http, HttpResponse, delay } from 'msw';

export type MockScenarioBehavior = 'cached_200' | 'async_202' | 'error_400' | 'rate_limit_429' | 'error_500' | 'offline';

let currentScenarioBehavior: MockScenarioBehavior = 'cached_200';
let activeJobStep = 0; // 0 = queued, 1 = running, 2 = done

export function setMockScenarioBehavior(behavior: MockScenarioBehavior) {
  currentScenarioBehavior = behavior;
  activeJobStep = 0;
}

export function getMockScenarioBehavior(): MockScenarioBehavior {
  return currentScenarioBehavior;
}

// In-memory simulation results & segments cache
const MOCK_RESULTS_CACHE: Record<string, any> = {};
const MOCK_SEGMENTS_CACHE: Record<string, any> = {};

let baseSummaryTemplate: any = null;
let baseSegmentsTemplate: any = null;

async function getBaseTemplates() {
  if (!baseSummaryTemplate) {
    const res = await fetch('/examples/result_summary.json');
    baseSummaryTemplate = await res.json();
  }
  if (!baseSegmentsTemplate) {
    const res = await fetch('/examples/segments_columnar.json');
    baseSegmentsTemplate = await res.json();
  }
  return {
    summary: JSON.parse(JSON.stringify(baseSummaryTemplate)),
    segments: JSON.parse(JSON.stringify(baseSegmentsTemplate)),
  };
}

async function buildSimulationData(scenario: any, cacheKey: string, baseKey?: string | null) {
  const { summary, segments } = await getBaseTemplates();
  summary.cache_key = cacheKey;
  summary.base_cache_key = baseKey || null;
  summary.scenario = scenario;
  segments.cache_key = cacheKey;

  const dailyRain = Array.isArray(scenario?.daily_rain_mm) ? scenario.daily_rain_mm : [120.0];
  const totalRain = dailyRain.reduce((a: number, b: number) => a + b, 0);
  const antecedent = typeof scenario?.antecedent_30d_mm === 'number' ? scenario.antecedent_30d_mm : 100.0;
  const closureFactor = typeof scenario?.closure_factor === 'number' ? scenario.closure_factor : 1.0;
  const forcedClosed = new Set(Array.isArray(scenario?.forced_closed) ? scenario.forced_closed : []);
  const forcedOpen = new Set(Array.isArray(scenario?.forced_open) ? scenario.forced_open : []);

  const isDry = totalRain <= 1.0 || cacheKey === 'baseline-dry';
  const isSevere = cacheKey === 'wet-week-heavy-storm' || (totalRain >= 180 && antecedent >= 180);

  let intensity = 1.0;
  if (isDry) {
    intensity = 0.03;
  } else if (isSevere) {
    intensity = 2.8;
  } else {
    const rainRatio = totalRain / 120.0;
    const soilRatio = Math.max(0.2, (antecedent / 100.0) ** 0.5);
    intensity = rainRatio * soilRatio * closureFactor;
  }

  // Interventions adjustment
  intensity += forcedClosed.size * 0.08 - forcedOpen.size * 0.08;
  intensity = Math.max(0.02, Math.min(intensity, 4.5));

  let cutOffMean = Math.round(14200 * intensity);
  let degradedMean = Math.round(28400 * intensity);
  let isolatedFacExp = Math.max(0.1, Number((3.4 * (intensity ** 0.8)).toFixed(1)));

  if (isDry) {
    cutOffMean = 420;
    degradedMean = 1100;
    isolatedFacExp = 0.1;
  }

  summary.region_totals = {
    people_cut_off: {
      mean: cutOffMean,
      p10: Math.round(cutOffMean * 0.72),
      p90: Math.round(cutOffMean * 1.34),
    },
    people_degraded: {
      mean: degradedMean,
      p10: Math.round(degradedMean * 0.74),
      p90: Math.round(degradedMean * 1.28),
    },
    facilities_isolated_expected: isolatedFacExp,
  };

  // Facility ranking
  if (summary.ranking) {
    const criticalFacilityBridges: Record<string, number[]> = {
      fac_00009: [102, 103],
      fac_00007: [204, 207],
      fac_00013: [182, 185],
      fac_00010: [301, 305],
      fac_00011: [412, 415],
      fac_00012: [510, 225],
      fac_00004: [810, 7567],
    };

    summary.ranking = summary.ranking.map((fac: any) => {
      let baseP = isDry ? 0.02 : fac.p_isolation || 0.4;
      let scaledP = isDry ? 0.02 : Math.min(0.985, Math.max(0.01, baseP * intensity));

      const bridges = criticalFacilityBridges[fac.facility_id] || [];
      const hasClosed = bridges.some(b => forcedClosed.has(b));
      const hasOpen = bridges.some(b => forcedOpen.has(b));

      if (hasClosed) {
        scaledP = Math.min(0.99, scaledP + 0.35);
      } else if (hasOpen) {
        scaledP = Math.max(0.02, scaledP - 0.35);
      }

      return {
        ...fac,
        p_isolation: Number(scaledP.toFixed(4)),
        p10: Number(Math.max(0.005, scaledP - 0.1).toFixed(4)),
        p90: Number(Math.min(0.995, scaledP + 0.1).toFixed(4)),
        people_affected_est: Math.round(fac.people_affected_est * (0.6 + 0.4 * Math.min(intensity, 2.0))),
      };
    });

    summary.ranking.sort((a: any, b: any) => (b.p_isolation * b.people_affected_est) - (a.p_isolation * a.people_affected_est));
    summary.ranking.forEach((f: any, idx: number) => {
      f.rank = idx + 1;
    });
  }

  // Segments columnar
  const segIds = segments.segment_ids || [];
  const baseExposure = segments.exposure_prob || [];
  const baseClosure = segments.closure_prob || [];

  const newExposure: number[] = [];
  const newClosure: number[] = [];

  for (let i = 0; i < segIds.length; i++) {
    const sid = segIds[i];
    if (forcedClosed.has(sid)) {
      newExposure.push(1.0);
      newClosure.push(1.0);
    } else if (forcedOpen.has(sid)) {
      newExposure.push(0.02);
      newClosure.push(0.0);
    } else if (isDry) {
      newExposure.push(0.01);
      newClosure.push(0.01);
    } else if (isSevere) {
      const c = baseClosure[i] ?? 0.2;
      newExposure.push(Number(Math.min(0.99, Math.max(0.15, c * 2.2)).toFixed(4)));
      newClosure.push(Number(Math.min(0.99, Math.max(0.15, c * 2.2)).toFixed(4)));
    } else {
      const e = baseExposure[i] ?? 0.1;
      const c = baseClosure[i] ?? 0.1;
      newExposure.push(Number(Math.min(0.99, Math.max(0.005, e * intensity)).toFixed(4)));
      newClosure.push(Number(Math.min(0.99, Math.max(0.005, c * intensity)).toFixed(4)));
    }
  }

  segments.exposure_prob = newExposure;
  segments.closure_prob = newClosure;

  MOCK_RESULTS_CACHE[cacheKey] = summary;
  MOCK_SEGMENTS_CACHE[cacheKey] = segments;

  return { summary, segments };
}

async function getSummaryForCacheKey(key: string): Promise<any> {
  if (MOCK_RESULTS_CACHE[key]) return MOCK_RESULTS_CACHE[key];

  if (key === 'baseline-dry') {
    const { summary } = await buildSimulationData(
      { daily_rain_mm: [0.0], antecedent_30d_mm: 40.0, closure_factor: 1.0, forced_closed: [], forced_open: [] },
      'baseline-dry'
    );
    return summary;
  }
  if (key === 'wet-week-heavy-storm') {
    const { summary } = await buildSimulationData(
      { daily_rain_mm: [30.0, 85.0, 60.0, 15.0], antecedent_30d_mm: 220.0, closure_factor: 1.0, forced_closed: [], forced_open: [] },
      'wet-week-heavy-storm'
    );
    return summary;
  }
  if (key === 'awash-2020-replay') {
    const { summary } = await buildSimulationData(
      { daily_rain_mm: [25.0, 48.0, 36.5, 12.0], antecedent_30d_mm: 120.0, closure_factor: 1.0, forced_closed: [], forced_open: [] },
      'awash-2020-replay'
    );
    return summary;
  }

  const res = await fetch('/examples/result_summary.json');
  return res.json();
}

async function getSegmentsForCacheKey(key: string): Promise<any> {
  if (MOCK_SEGMENTS_CACHE[key]) return MOCK_SEGMENTS_CACHE[key];

  if (key === 'baseline-dry') {
    const { segments } = await buildSimulationData(
      { daily_rain_mm: [0.0], antecedent_30d_mm: 40.0, closure_factor: 1.0, forced_closed: [], forced_open: [] },
      'baseline-dry'
    );
    return segments;
  }
  if (key === 'wet-week-heavy-storm') {
    const { segments } = await buildSimulationData(
      { daily_rain_mm: [30.0, 85.0, 60.0, 15.0], antecedent_30d_mm: 220.0, closure_factor: 1.0, forced_closed: [], forced_open: [] },
      'wet-week-heavy-storm'
    );
    return segments;
  }
  if (key === 'awash-2020-replay') {
    const { segments } = await buildSimulationData(
      { daily_rain_mm: [25.0, 48.0, 36.5, 12.0], antecedent_30d_mm: 120.0, closure_factor: 1.0, forced_closed: [], forced_open: [] },
      'awash-2020-replay'
    );
    return segments;
  }

  const res = await fetch('/examples/segments_columnar.json');
  return res.json();
}

export const handlers = [
  // Health check
  http.get('*/health', () => {
    return HttpResponse.json({
      status: 'ok',
      time: new Date().toISOString(),
    });
  }),

  // Meta endpoint
  http.get('*/meta', async () => {
    const res = await fetch('/examples/meta.json');
    const data = await res.json();
    return HttpResponse.json(data);
  }),

  // Supported regions
  http.get('*/regions', () => {
    return HttpResponse.json([
      {
        region_id: 'awash_01',
        name: 'Awash River Basin Pilot Region',
        country: 'Ethiopia',
        bbox: [39.5, 8.5, 41.2, 10.2],
      },
    ]);
  }),

  // Hazards
  http.get('*/hazards', () => {
    return HttpResponse.json([
      {
        hazard: 'flood',
        evidence_level: 'validated',
        label_type: 'copernicus_satellite',
        description: 'Riverine overflow and extreme precipitation flooding',
      },
    ]);
  }),

  // Scenarios Library
  http.get('*/scenarios/library', () => {
    return HttpResponse.json([
      {
        slug: 'baseline-dry',
        title: 'Baseline (Dry Weather)',
        description: 'Zero rainfall baseline reference state for accessibility benchmarks.',
        badge: 'Manual',
        demo: false,
        scenario: {
          hazard: 'flood',
          region_id: 'awash_01',
          start_date: '2026-10-25',
          daily_rain_mm: [0.0],
          antecedent_30d_mm: 40.0,
          spatial: { type: 'uniform' },
          closure_factor: 1.0,
          failure_mode: 'independent',
          n_samples: 200,
          seed: 42,
          forced_closed: [],
          forced_open: [],
        },
      },
      {
        slug: 'awash-2020-replay',
        title: 'Awash Basin 2020 Replay',
        description: 'Historical replay of the devastating August 2020 Awash river overflow.',
        badge: 'Replay',
        demo: true,
        scenario: {
          hazard: 'flood',
          region_id: 'awash_01',
          start_date: '2020-08-20',
          daily_rain_mm: [25.0, 48.0, 36.5, 12.0],
          antecedent_30d_mm: 120.0,
          spatial: { type: 'uniform' },
          closure_factor: 1.0,
          failure_mode: 'independent',
          n_samples: 200,
          seed: 42,
          forced_closed: [],
          forced_open: [],
        },
      },
      {
        slug: 'wet-week-heavy-storm',
        title: 'Severe 4-Day Flood Event',
        description: 'Peak-centered convective deluge over saturated upper catchments.',
        badge: 'Manual',
        demo: false,
        scenario: {
          hazard: 'flood',
          region_id: 'awash_01',
          start_date: '2026-10-25',
          daily_rain_mm: [30.0, 85.0, 60.0, 15.0],
          antecedent_30d_mm: 220.0,
          spatial: { type: 'uniform' },
          closure_factor: 1.0,
          failure_mode: 'independent',
          n_samples: 200,
          seed: 42,
          forced_closed: [],
          forced_open: [],
        },
      },
    ]);
  }),

  // POST /scenarios with switchable behaviors
  http.post('*/scenarios', async ({ request }) => {
    if (currentScenarioBehavior === 'offline') {
      return HttpResponse.error();
    }
    const body = (await request.json().catch(() => ({}))) as any;
    if (currentScenarioBehavior === 'rate_limit_429') {
      return HttpResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait a moment.' } },
        { status: 429 }
      );
    }
    if (currentScenarioBehavior === 'error_500') {
      return HttpResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Simulation cluster unavailable.' } },
        { status: 500 }
      );
    }
    if (currentScenarioBehavior === 'error_400') {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Storm total must be between 10.0 and 400.0 mm',
            field: 'daily_rain_mm',
          },
        },
        { status: 400 }
      );
    }

    // Determine cache key
    const totalRain = Array.isArray(body?.daily_rain_mm)
      ? body.daily_rain_mm.reduce((a: number, b: number) => a + b, 0)
      : 120;
    
    let cacheKey = `sim-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    if (totalRain <= 0.1) cacheKey = 'baseline-dry';
    else if (Math.abs(totalRain - 121.5) < 2.0 && body?.antecedent_30d_mm === 120) cacheKey = 'awash-2020-replay';
    else if (totalRain >= 185 && body?.antecedent_30d_mm >= 200) cacheKey = 'wet-week-heavy-storm';

    if (currentScenarioBehavior === 'async_202') {
      activeJobStep = 0;
      return HttpResponse.json(
        {
          job_id: 'mock-job-async-1234',
          status: 'queued',
          cache_key: cacheKey,
          submitted_at: new Date().toISOString(),
        },
        { status: 202 }
      );
    }

    // Live simulation with full dynamic state saved into memory cache
    const { summary } = await buildSimulationData(body, cacheKey);
    return HttpResponse.json(summary, { status: 200 });
  }),

  // GET /jobs/:job_id
  http.get('*/jobs/:job_id', async () => {
    activeJobStep++;
    let jobStatus: 'queued' | 'running' | 'done' = 'queued';
    if (activeJobStep === 1) jobStatus = 'queued';
    else if (activeJobStep === 2) jobStatus = 'running';
    else jobStatus = 'done';

    return HttpResponse.json({
      job_id: 'mock-job-async-1234',
      status: jobStatus,
      cache_key: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
      submitted_at: new Date(Date.now() - 5000).toISOString(),
      started_at: activeJobStep >= 2 ? new Date(Date.now() - 3000).toISOString() : null,
      finished_at: jobStatus === 'done' ? new Date().toISOString() : null,
    });
  }),

  // GET /results/:cache_key
  http.get('*/results/:cache_key', async ({ params }) => {
    const key = String(params.cache_key);
    const summary = await getSummaryForCacheKey(key);
    return HttpResponse.json(summary);
  }),

  // GET /results/:cache_key/segments
  http.get('*/results/:cache_key/segments', async ({ params }) => {
    const key = String(params.cache_key);
    const segments = await getSegmentsForCacheKey(key);
    return HttpResponse.json(segments);
  }),

  // GET /facilities/:facility_id/explain
  http.get('*/facilities/:facility_id/explain', async ({ params }) => {
    const fid = params.facility_id as string;
    const res = await fetch('/examples/result_summary.json');
    const summary = await res.json();
    const facItem = summary?.ranking?.find((f: any) => f.facility_id === fid);

    const facilityExplanations: Record<string, any> = {
      fac_00009: {
        why: [
          { segment_id: 102, lift: 0.42, closure_prob: 0.781, text: 'Critical primary access bridge over Awash tributary' },
          { segment_id: 103, lift: 0.28, closure_prob: 0.623, text: 'Low-lying junction connecting western corridor' },
        ],
        sentences: [
          'Awash Arba Health Center is likely to be isolated mainly because segment 102 (Awash Arba Secondary Access Road) has high flood risk.',
          'Closing segment 102 alone increases isolation probability by 42%.',
        ],
      },
      fac_00007: {
        why: [
          { segment_id: 204, lift: 0.38, closure_prob: 0.71, text: 'Lake Beseka shoreline rise sub-corridor' },
          { segment_id: 207, lift: 0.24, closure_prob: 0.59, text: 'Awash national highway bridge transition' },
        ],
        sentences: [
          'Metehara Health Center faces elevated isolation risk from Lake Beseka rising waters impacting segment 204.',
          'A southern high-ground bypass is viable but extends ambulance transit by 90 minutes.',
        ],
      },
      fac_00013: {
        why: [
          { segment_id: 185, lift: 0.35, closure_prob: 0.65, text: 'Mid-Awash floodplain backwater crossing' },
        ],
        sentences: [
          'Melka Sedi Health Center access is vulnerable to mid-basin river discharge overtopping segment 185.',
        ],
      },
      fac_00010: {
        why: [
          { segment_id: 301, lift: 0.31, closure_prob: 0.58, text: 'Northern wadi flash flood crossing' },
        ],
        sentences: [
          'Gedamaytu Health Center access crosses dry wadi channels that flood rapidly under storm runoff.',
        ],
      },
      fac_00011: {
        why: [
          { segment_id: 412, lift: 0.4, closure_prob: 0.62, text: 'Doho hot springs marshland feeder road' },
        ],
        sentences: [
          'Doho Rural Clinic has severe baseline isolation; feeder roads cross marshy lowlands.',
        ],
      },
      fac_00012: {
        why: [
          { segment_id: 510, lift: 0.28, closure_prob: 0.46, text: 'Amibara regional trunk crossing' },
        ],
        sentences: [
          'Amibara Primary Hospital benefits from elevated hospital grounds, but road 510 faces shoulder erosion.',
        ],
      },
      fac_00008: {
        why: [
          { segment_id: 701, lift: 0.12, closure_prob: 0.25, text: 'Main arterial highway bridge approach' },
        ],
        sentences: [
          'Awash Sebat General Hospital is located on elevated basalt terrain with robust arterial connectivity.',
        ],
      },
      fac_00004: {
        why: [
          { segment_id: 810, lift: 0.05, closure_prob: 0.1, text: 'Highland plateau highway link' },
        ],
        sentences: [
          'Debre Berhan Referral Hospital sits above 2,800m elevation with negligible direct flood risk.',
        ],
      },
    };

    const specific = facilityExplanations[fid];
    return HttpResponse.json({
      facility_id: fid,
      rank: facItem?.rank || 5,
      rank_delta: facItem?.rank_delta || 0,
      p_isolation: facItem?.p_isolation || 0.25,
      why: specific?.why || [{ segment_id: 100 + (fid.charCodeAt(fid.length - 1) * 3), lift: 0.2, closure_prob: 0.3, text: 'Access road crossing' }],
      alt_route: facItem?.alt_route || null,
      sentences: specific?.sentences || [
        `${facItem?.name || fid} has estimated ${(Number(facItem?.p_isolation || 0.25) * 100).toFixed(0)}% isolation probability.`,
      ],
    });
  }),

  // GET /segments/:segment_id/explain
  http.get('*/segments/:segment_id/explain', async ({ params }) => {
    const sid = Number(params.segment_id);
    const roadClasses = ['primary', 'secondary', 'tertiary', 'residential'];
    const roadClass = roadClasses[sid % roadClasses.length];
    const lengthM = 650 + (sid * 137) % 2200;
    const handMin = 1.0 + (sid * 3.7) % 25.0;
    const exposureProb = Math.min(0.95, Math.max(0.05, ((sid * 17) % 100) / 100));

    return HttpResponse.json({
      segment_id: sid,
      name: `Awash Corridor ${roadClass.charAt(0).toUpperCase() + roadClass.slice(1)} #${sid}`,
      road_class: roadClass,
      length_m: lengthM,
      exposure_prob: exposureProb,
      closure_prob: exposureProb,
      quality_flag: 'ok',
      top_reasons: [
        {
          feature: 'hand_min',
          label: handMin < 5.0 ? `Low ground near river drainage (HAND = ${handMin.toFixed(1)}m)` : `Elevated terrain above riverbed (HAND = ${handMin.toFixed(1)}m)`,
          contribution: 0.42,
        },
        {
          feature: 'peak_3d',
          label: exposureProb > 0.3 ? 'Heavy rainfall accumulation corridor' : 'Well-drained watershed ridge',
          contribution: 0.33,
        },
        {
          feature: 'slope_mean',
          label: `Terrain slope gradient (${(1.0 + (sid % 5) * 0.8).toFixed(1)}°)`,
          contribution: 0.25,
        },
      ],
    });
  }),

  // POST /whatif
  http.post('*/whatif', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as any;
    const baseKey = body?.base_cache_key || 'awash-2020-replay';
    const forcedClosed = Array.isArray(body?.forced_closed) ? body.forced_closed : [];
    const forcedOpen = Array.isArray(body?.forced_open) ? body.forced_open : [];

    const baseSummary = await getSummaryForCacheKey(baseKey);
    const newKey = `whatif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const scenarioPayload = {
      ...(baseSummary?.scenario || {}),
      forced_closed: forcedClosed,
      forced_open: forcedOpen,
    };

    const { summary } = await buildSimulationData(scenarioPayload, newKey, baseKey);
    return HttpResponse.json(summary, { status: 200 });
  }),

  // GET /compare
  http.get('*/compare', async ({ request }) => {
    const url = new URL(request.url);
    const a = url.searchParams.get('a') || 'baseline-dry';
    const b = url.searchParams.get('b') || 'awash-2020-replay';

    const sumA = await getSummaryForCacheKey(a);
    const sumB = await getSummaryForCacheKey(b);

    const cutOffA = sumA.region_totals?.people_cut_off?.mean || 420;
    const cutOffB = sumB.region_totals?.people_cut_off?.mean || 14200;
    const degradedA = sumA.region_totals?.people_degraded?.mean || 1100;
    const degradedB = sumB.region_totals?.people_degraded?.mean || 28400;
    const isoA = sumA.region_totals?.facilities_isolated_expected || 0.1;
    const isoB = sumB.region_totals?.facilities_isolated_expected || 3.4;

    const rankChanges = (sumB.ranking || []).map((facB: any) => {
      const facA = (sumA.ranking || []).find((f: any) => f.facility_id === facB.facility_id);
      const rankA = facA ? facA.rank : facB.rank;
      return {
        facility_id: facB.facility_id,
        name: facB.name,
        rank_a: rankA,
        rank_b: facB.rank,
        rank_delta: rankA - facB.rank,
        p_isolation_a: facA ? facA.p_isolation : 0.05,
        p_isolation_b: facB.p_isolation,
        p_isolation_delta: facA ? Number((facB.p_isolation - facA.p_isolation).toFixed(4)) : 0,
      };
    });

    return HttpResponse.json({
      scenario_a: a,
      scenario_b: b,
      comparison_mode: 'differential',
      people_cut_off_delta: Math.round(cutOffB - cutOffA),
      people_degraded_delta: Math.round(degradedB - degradedA),
      facilities_isolated_expected_delta: Number((isoB - isoA).toFixed(1)),
      rank_changes: rankChanges,
      narrative: `Comparison between ${a} and ${b}: net change of ${(cutOffB - cutOffA > 0 ? '+' : '')}${Math.round(cutOffB - cutOffA).toLocaleString()} cut-off population and ${(isoB - isoA > 0 ? '+' : '')}${(isoB - isoA).toFixed(1)} isolated healthcare facilities.`,
    });
  }),
];
