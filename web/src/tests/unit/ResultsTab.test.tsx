import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ResultsTab } from '../../panels/ResultsTab';
import { useAppStore } from '../../state/useAppStore';

const mockResultSummary = {
  cache_key: 'test-cache-key-123',
  region_totals: {
    people_cut_off: { mean: 42500, p10: 31000, p90: 56000 },
    people_degraded: { mean: 89000, p10: 72000, p90: 108000 },
    facilities_isolated_expected: 4.8,
  },
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
      quality_flag: 'HIGH_UNCERTAINTY',
      poor_baseline_access: false,
    },
    {
      facility_id: 'ETH_FAC_002',
      name: 'Metehara Health Center',
      level: 'health_center',
      p_isolation: 0.64,
      p10: 0.51,
      p90: 0.78,
      people_affected_est: 18500,
      baseline_minutes: 38,
      rank: 2,
      rank_delta: 0,
      quality_flag: 'OK',
      poor_baseline_access: false,
    },
    {
      facility_id: 'ETH_FAC_003',
      name: 'Dulecha Rural Clinic',
      level: 'clinic',
      p_isolation: 0.42,
      p10: 0.28,
      p90: 0.58,
      people_affected_est: 8200,
      baseline_minutes: 95,
      rank: 3,
      rank_delta: -1,
      quality_flag: 'POOR_BASELINE',
      poor_baseline_access: true,
    },
  ],
  top_communities: [
    {
      community_id: 'COMM_01',
      name: 'Awash Sebat Kilo',
      people_est: 14200,
      baseline_minutes: 18,
      p_cut_off: 0.76,
      p_degraded: 0.22,
    },
  ],
};

function renderWithClient(ui: React.ReactElement, initialData?: any) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  if (initialData) {
    queryClient.setQueryData(['result', 'test-cache-key-123'], initialData);
  }

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('ResultsTab Component Tests', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentCacheKey: null,
      selectedFacilityId: null,
      activeTab: 'results',
    });
  });

  it('renders No Active Simulation when cache_key is null', () => {
    renderWithClient(<ResultsTab />);

    expect(screen.getByText(/No Active Simulation/i)).toBeInTheDocument();
    expect(screen.getByText(/Select a baseline from the Scenario tab/i)).toBeInTheDocument();
  });

  it('renders summary cards with mean and confidence intervals when simulation active', () => {
    useAppStore.setState({ currentCacheKey: 'test-cache-key-123' });
    renderWithClient(<ResultsTab />, mockResultSummary);

    expect(screen.getByText(/Cut Off Population/i)).toBeInTheDocument();
    expect(screen.getByText(/Degraded Access/i)).toBeInTheDocument();
    expect(screen.getByText(/Isolated Facilities/i)).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
  });

  it('renders facility ranking items with names and levels', () => {
    useAppStore.setState({ currentCacheKey: 'test-cache-key-123' });
    renderWithClient(<ResultsTab />, mockResultSummary);

    expect(screen.getByText('Awash Arba Primary Hospital')).toBeInTheDocument();
    expect(screen.getByText('Metehara Health Center')).toBeInTheDocument();
    expect(screen.getByText('Dulecha Rural Clinic')).toBeInTheDocument();
    expect(screen.getByText(/3 Facilities/i)).toBeInTheDocument();
  });

  it('filters facilities by search query', () => {
    useAppStore.setState({ currentCacheKey: 'test-cache-key-123' });
    renderWithClient(<ResultsTab />, mockResultSummary);

    const searchInput = screen.getByPlaceholderText(/Filter by facility name/i);
    fireEvent.change(searchInput, { target: { value: 'Metehara' } });

    expect(screen.getByText('Metehara Health Center')).toBeInTheDocument();
    expect(screen.queryByText('Awash Arba Primary Hospital')).not.toBeInTheDocument();
  });

  it('filters facilities by level dropdown', () => {
    useAppStore.setState({ currentCacheKey: 'test-cache-key-123' });
    renderWithClient(<ResultsTab />, mockResultSummary);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'clinic' } });

    expect(screen.getByText('Dulecha Rural Clinic')).toBeInTheDocument();
    expect(screen.queryByText('Awash Arba Primary Hospital')).not.toBeInTheDocument();
    expect(screen.queryByText('Metehara Health Center')).not.toBeInTheDocument();
  });

  it('updates selectedFacilityId in store when facility card is clicked', () => {
    useAppStore.setState({ currentCacheKey: 'test-cache-key-123' });
    renderWithClient(<ResultsTab />, mockResultSummary);

    const facCard = screen.getByText('Awash Arba Primary Hospital');
    fireEvent.click(facCard);

    expect(useAppStore.getState().selectedFacilityId).toBe('ETH_FAC_001');
  });
});
