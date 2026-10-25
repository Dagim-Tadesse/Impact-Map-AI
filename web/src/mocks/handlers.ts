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
          daily_rain_mm: [0.0, 0.0, 0.0],
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

    if (currentScenarioBehavior === 'async_202') {
      activeJobStep = 0;
      return HttpResponse.json(
        {
          job_id: 'mock-job-async-1234',
          status: 'queued',
          cache_key: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
          submitted_at: new Date().toISOString(),
        },
        { status: 202 }
      );
    }

    // Default cached 200 with dynamic scaling
    const res = await fetch('/examples/result_summary.json');
    const summary = await res.json();
    const rain = Array.isArray(body?.daily_rain_mm)
      ? body.daily_rain_mm.reduce((a: number, b: number) => a + b, 0)
      : 120;
    const intensity = rain <= 0 ? 0.08 : Math.max(0.05, Math.min(4.0, rain / 120.0));
    if (summary.region_totals) {
      summary.region_totals.people_cut_off.mean = Math.round(14200 * intensity);
      summary.region_totals.people_degraded.mean = Math.round(28400 * intensity);
      summary.region_totals.facilities_isolated_expected = Math.max(0.1, Number((3.4 * (intensity ** 0.8)).toFixed(1)));
    }
    if (summary.ranking) {
      summary.ranking = summary.ranking.map((f: any) => ({
        ...f,
        p_isolation: Math.min(0.98, Math.max(0.01, Number((f.p_isolation * intensity).toFixed(4)))),
      }));
    }
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
  http.get('*/results/:cache_key', async () => {
    const res = await fetch('/examples/result_summary.json');
    return HttpResponse.json(await res.json());
  }),

  // GET /results/:cache_key/segments
  http.get('*/results/:cache_key/segments', async () => {
    const res = await fetch('/examples/segments_columnar.json');
    return HttpResponse.json(await res.json());
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
  http.post('*/whatif', async () => {
    const res = await fetch('/examples/result_summary.json');
    const data = await res.json();
    data.base_cache_key = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
    data.cache_key = 'b2c3d4e5f6a10718293a4b5c6d7e8f91';
    return HttpResponse.json(data);
  }),

  // GET /compare
  http.get('*/compare', async () => {
    const res = await fetch('/examples/compare_response.json');
    return HttpResponse.json(await res.json());
  }),
];
