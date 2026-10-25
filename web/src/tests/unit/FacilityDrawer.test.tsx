import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FacilityDrawer } from '../../panels/FacilityDrawer';
import { useAppStore } from '../../state/useAppStore';
import { queryKeys } from '../../api/hooks';

const mockResultSummary = {
  cache_key: 'test-cache-key-123',
  ranking: [
    {
      facility_id: 'ETH_FAC_001',
      name: 'Awash Arba Primary Hospital',
      level: 'hospital',
      p_isolation: 0.88,
      p10: 0.72,
      p90: 0.96,
      people_affected_est: 34200,
      baseline_minutes: 24,
      rank: 1,
      rank_delta: 3,
      quality_flag: 'ok',
      poor_baseline_access: false,
      alt_route: {
        minutes: 68.5,
        segment_ids: [101, 102],
        geometry: {
          type: 'LineString',
          coordinates: [
            [40.1, 9.1],
            [40.2, 9.2],
          ],
        },
      },
    },
  ],
};

const mockExplainData = {
  facility_id: 'ETH_FAC_001',
  p_isolation: 0.88,
  sentences: [
    'Bridge approach on primary corridor submerged under 1.2m flood water.',
  ],
  why: [
    {
      segment_id: 1042,
      lift: 0.45,
      name: 'Awash Bridge Link',
    },
  ],
};

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  queryClient.setQueryData(queryKeys.result('test-cache-key-123'), mockResultSummary);
  queryClient.setQueryData(
    queryKeys.facilityExplain('ETH_FAC_001', 'test-cache-key-123'),
    mockExplainData
  );

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('FacilityDrawer Component Tests', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentCacheKey: 'test-cache-key-123',
      selectedFacilityId: null,
      selectedSegmentId: null,
    });
  });

  it('renders nothing when selectedFacilityId is null', () => {
    const { container } = renderWithClient(<FacilityDrawer />);
    expect(container.firstChild).toBeNull();
  });

  it('renders facility header, metrics, explanation, and detour info when facility selected', () => {
    useAppStore.setState({ selectedFacilityId: 'ETH_FAC_001' });
    renderWithClient(<FacilityDrawer />);

    expect(screen.getByText('Awash Arba Primary Hospital')).toBeInTheDocument();
    expect(screen.getByText('hospital')).toBeInTheDocument();
    expect(screen.getByText(/34,200/)).toBeInTheDocument();
    expect(screen.getByText(/Surviving detour route available:/i)).toBeInTheDocument();
    expect(screen.getByText(/Bridge approach on primary corridor submerged/i)).toBeInTheDocument();
  });

  it('dispatches map:fitBounds event when clicking inspect detour button', () => {
    useAppStore.setState({ selectedFacilityId: 'ETH_FAC_001' });
    renderWithClient(<FacilityDrawer />);

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const inspectBtn = screen.getByText(/Inspect Detour Corridor on Map/i);
    fireEvent.click(inspectBtn);

    expect(dispatchSpy).toHaveBeenCalled();
    const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe('map:fitBounds');
    expect(event.detail.coordinates).toEqual([
      [40.1, 9.1],
      [40.2, 9.2],
    ]);
  });

  it('selects segment when clicking critical segment chip', () => {
    useAppStore.setState({ selectedFacilityId: 'ETH_FAC_001' });
    renderWithClient(<FacilityDrawer />);

    const segBtn = screen.getByText(/Seg #1042/i);
    fireEvent.click(segBtn);

    expect(useAppStore.getState().selectedSegmentId).toBe(1042);
  });

  it('closes drawer when clicking close button', () => {
    useAppStore.setState({ selectedFacilityId: 'ETH_FAC_001' });
    renderWithClient(<FacilityDrawer />);

    const closeBtn = screen.getByTitle(/Close Facility Drawer/i);
    fireEvent.click(closeBtn);

    expect(useAppStore.getState().selectedFacilityId).toBeNull();
  });
});
