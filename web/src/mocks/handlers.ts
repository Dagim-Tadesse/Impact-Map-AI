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
  http.post('*/scenarios', async () => {
    if (currentScenarioBehavior === 'offline') {
      return HttpResponse.error();
    }
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

    // Default cached 200
    const res = await fetch('/examples/result_summary.json');
    const summary = await res.json();
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
  http.get('*/facilities/:facility_id/explain', async () => {
    const res = await fetch('/examples/facility_explain.json');
    return HttpResponse.json(await res.json());
  }),

  // GET /segments/:segment_id/explain
  http.get('*/segments/:segment_id/explain', async () => {
    const res = await fetch('/examples/segment_explain.json');
    return HttpResponse.json(await res.json());
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
