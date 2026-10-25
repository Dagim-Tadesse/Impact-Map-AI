import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CommunityCard } from '../../components/CommunityCard';
import { useAppStore } from '../../state/useAppStore';

const mockResultSummary = {
  cache_key: 'test-cache-key-123',
  top_communities: [
    {
      community_id: 'com_00231',
      name: 'Sabure Settlement',
      people_est: 3200,
      p_cut_off: 0.82,
      p_degraded: 0.12,
      expected_minutes: 135.0,
      baseline_minutes: 38.0,
      poor_baseline_access: false,
      snap_distance_m: 120,
      quality_flag: 'ok',
    },
    {
      community_id: 'com_00108',
      name: 'Doho Kebele',
      people_est: 2400,
      p_cut_off: 0.74,
      p_degraded: 0.21,
      expected_minutes: 195.0,
      baseline_minutes: 145.0,
      poor_baseline_access: true,
      snap_distance_m: 850,
      quality_flag: 'long_snap',
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

  queryClient.setQueryData(['result', 'test-cache-key-123'], mockResultSummary);

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('CommunityCard Component Tests', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentCacheKey: 'test-cache-key-123',
      selectedCommunityId: null,
    });
  });

  it('renders nothing when selectedCommunityId is null', () => {
    const { container } = renderWithClient(<CommunityCard />);
    expect(container.firstChild).toBeNull();
  });

  it('renders community details, population, cut-off risk, and travel times', () => {
    useAppStore.setState({ selectedCommunityId: 'com_00231' });
    renderWithClient(<CommunityCard />);

    expect(screen.getByText('Sabure Settlement')).toBeInTheDocument();
    expect(screen.getByText('com_00231')).toBeInTheDocument();
    expect(screen.getByText(/3,200/)).toBeInTheDocument();
    expect(screen.getByText('82.0%')).toBeInTheDocument();
    expect(screen.getByText(/38\.0 min/i)).toBeInTheDocument();
    expect(screen.getByText(/135\.0 min/i)).toBeInTheDocument();
  });

  it('shows poor baseline access banner when poor_baseline_access is true', () => {
    useAppStore.setState({ selectedCommunityId: 'com_00108' });
    renderWithClient(<CommunityCard />);

    expect(screen.getByText('Doho Kebele')).toBeInTheDocument();
    expect(screen.getByText(/already has travel times over 120 min/i)).toBeInTheDocument();
  });

  it('clears selectedCommunityId when close button is clicked', () => {
    useAppStore.setState({ selectedCommunityId: 'com_00231' });
    renderWithClient(<CommunityCard />);

    const closeBtn = screen.getByTitle(/Close Settlement Card/i);
    fireEvent.click(closeBtn);

    expect(useAppStore.getState().selectedCommunityId).toBeNull();
  });
});
