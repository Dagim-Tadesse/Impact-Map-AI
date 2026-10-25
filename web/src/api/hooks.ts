import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "./client";
import { getConfig } from "../config";
import type { paths } from "./schema";

export type ScenarioInput = paths["/scenarios"]["post"]["requestBody"]["content"]["application/json"];
export type WhatIfInput = paths["/whatif"]["post"]["requestBody"]["content"]["application/json"];

export const queryKeys = {
  meta: ["meta"] as const,
  regions: ["regions"] as const,
  hazards: ["hazards"] as const,
  library: ["library"] as const,
  job: (jobId: string) => ["job", jobId] as const,
  result: (cacheKey: string) => ["result", cacheKey] as const,
  segments: (cacheKey: string) => ["segments", cacheKey] as const,
  facilityExplain: (facilityId: string, cacheKey: string) => ["facility-explain", facilityId, cacheKey] as const,
  segmentExplain: (segmentId: number, cacheKey: string) => ["segment-explain", segmentId, cacheKey] as const,
  compare: (a: string, b: string) => ["compare", a, b] as const,
  evidence: (dataVersion: string) => ["evidence", dataVersion] as const,
  demoIndex: ["demo-index"] as const,
  demoStep: (slug: string, step: number) => ["demo-step", slug, step] as const,
};

// 1. Meta Query
export function useMetaQuery() {
  return useQuery({
    queryKey: queryKeys.meta,
    queryFn: async () => {
      const client = getApiClient();
      const { data, error } = await client.GET("/meta");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// 2. Library Scenarios Query
export function useLibraryQuery() {
  return useQuery({
    queryKey: queryKeys.library,
    queryFn: async () => {
      const client = getApiClient();
      const { data, error } = await client.GET("/scenarios/library");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// 3. Job Status Polling Query (Anon Work Division A4.4: 1s for first 10s, then 3s, up to 120s)
export function useJobQuery(jobId: string | null, enabled: boolean = true, startTimeMs?: number) {
  return useQuery({
    queryKey: jobId ? queryKeys.job(jobId) : ["job", "none"],
    queryFn: async () => {
      if (!jobId) throw new Error("No jobId provided");
      const client = getApiClient();
      const { data, error } = await client.GET("/jobs/{job_id}", {
        params: { path: { job_id: jobId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(jobId && enabled),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "done" || status === "failed") {
        return false;
      }
      const elapsedSec = startTimeMs ? (Date.now() - startTimeMs) / 1000 : 0;
      if (elapsedSec > 120) {
        return false;
      }
      return elapsedSec < 10 ? 1000 : 3000;
    },
  });
}

// 4. Result Summary Query (Immutable for given cache_key -> Infinity staleTime)
export function useResultSummaryQuery(cacheKey: string | null) {
  return useQuery({
    queryKey: cacheKey ? queryKeys.result(cacheKey) : ["result", "none"],
    queryFn: async () => {
      if (!cacheKey) throw new Error("No cacheKey provided");
      const client = getApiClient();
      const { data, error } = await client.GET("/results/{cache_key}", {
        params: { path: { cache_key: cacheKey } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(cacheKey),
    staleTime: Infinity,
  });
}

// 5. Segments Columnar Array Query for Map Painting (Immutable)
export function useSegmentsColumnarQuery(cacheKey: string | null) {
  return useQuery({
    queryKey: cacheKey ? queryKeys.segments(cacheKey) : ["segments", "none"],
    queryFn: async () => {
      if (!cacheKey) throw new Error("No cacheKey provided");
      const client = getApiClient();
      const { data, error } = await client.GET("/results/{cache_key}/segments", {
        params: { path: { cache_key: cacheKey } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(cacheKey),
    staleTime: Infinity,
  });
}

// 6. Facility Explain Query
export function useFacilityExplainQuery(facilityId: string | null, cacheKey: string | null) {
  return useQuery({
    queryKey: facilityId && cacheKey ? queryKeys.facilityExplain(facilityId, cacheKey) : ["facility-explain", "none"],
    queryFn: async () => {
      if (!facilityId || !cacheKey) throw new Error("facilityId and cacheKey required");
      const client = getApiClient();
      const { data, error } = await client.GET("/facilities/{facility_id}/explain", {
        params: {
          path: { facility_id: facilityId },
          query: { cache_key: cacheKey },
        },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(facilityId && cacheKey),
    staleTime: Infinity,
  });
}

// 7. Segment Explain Query
export function useSegmentExplainQuery(segmentId: number | null, cacheKey: string | null) {
  return useQuery({
    queryKey: segmentId !== null && cacheKey ? queryKeys.segmentExplain(segmentId, cacheKey) : ["segment-explain", "none"],
    queryFn: async () => {
      if (segmentId === null || !cacheKey) throw new Error("segmentId and cacheKey required");
      const client = getApiClient();
      const { data, error } = await client.GET("/segments/{segment_id}/explain", {
        params: {
          path: { segment_id: segmentId },
          query: { cache_key: cacheKey },
        },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(segmentId !== null && cacheKey),
    staleTime: Infinity,
  });
}

// 8. Scenario Compare Query
export function useCompareQuery(a: string | null, b: string | null) {
  return useQuery({
    queryKey: a && b ? queryKeys.compare(a, b) : ["compare", "none"],
    queryFn: async () => {
      if (!a || !b) throw new Error("Both scenario cache keys A and B are required");
      const client = getApiClient();
      const { data, error } = await client.GET("/compare", {
        params: { query: { a, b } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(a && b),
    staleTime: Infinity,
  });
}

// 9. Model Evidence Query
export function useEvidenceQuery() {
  const config = getConfig();
  return useQuery({
    queryKey: queryKeys.evidence(config.data_version),
    queryFn: async () => {
      // First try live endpoint, fallback to static evaluation JSON
      try {
        const client = getApiClient();
        const { data } = await client.GET("/model-card" as any, {});
        if (data) return data;
      } catch (e) {
        console.warn("Falling back to static evidence json");
      }
      const res = await fetch(`${config.data_base_url}/${config.data_version}/evidence/evaluation.json`);
      if (!res.ok) {
        throw new Error("Failed to load evidence evaluation data");
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 60,
  });
}

// 10. Demo Cascade Index Query
export function useDemoIndexQuery() {
  const config = getConfig();
  return useQuery({
    queryKey: queryKeys.demoIndex,
    queryFn: async () => {
      const res = await fetch(`${config.api_base_url}/demo/index.json`);
      if (!res.ok) {
        throw new Error("Failed to load demo cascade index");
      }
      return res.json();
    },
    staleTime: Infinity,
  });
}

// 11. Demo Cascade Step Query
export function useDemoStepQuery(slug: string | null, step: number) {
  const config = getConfig();
  return useQuery({
    queryKey: slug ? queryKeys.demoStep(slug, step) : ["demo-step", "none"],
    queryFn: async () => {
      if (!slug) throw new Error("No slug specified");
      const res = await fetch(`${config.api_base_url}/demo/${slug}/step_${step}.json`);
      if (!res.ok) {
        throw new Error(`Failed to load step ${step} for ${slug}`);
      }
      return res.json();
    },
    enabled: Boolean(slug),
    staleTime: Infinity,
  });
}

// 12. Run Scenario Mutation
export function useRunScenarioMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scenario: ScenarioInput) => {
      const client = getApiClient();
      const res = await client.POST("/scenarios", {
        body: scenario,
      });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: (data) => {
      if ('job_id' in data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.job(data.job_id) });
      }
      if ('cache_key' in data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.result(data.cache_key) });
      }
    },
  });
}

// 13. What-If Mutation
export function useWhatIfMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: WhatIfInput) => {
      const client = getApiClient();
      const res = await client.POST("/whatif", {
        body: payload,
      });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: (data) => {
      if ('job_id' in data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.job(data.job_id) });
      }
      if ('cache_key' in data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.result(data.cache_key) });
      }
    },
  });
}
