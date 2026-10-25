import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SegmentDrawer } from '../../panels/SegmentDrawer';
import { useAppStore } from '../../state/useAppStore';
import { queryKeys } from '../../api/hooks';

const mockExplainData = {
  segment_id: 2045,
  name: 'Awash Express Link B',
  road_class: 'primary',
  length_m: 2350,
  exposure_prob: 0.74,
  closure_prob: 0.74,
  top_reasons: [
    { label: 'Extreme 3-day precipitation volume', contribution: 0.42 },
    { label: 'Low elevation relative to stream (HAND < 2m)', contribution: 0.35 },
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

  queryClient.setQueryData(
    queryKeys.segmentExplain(2045, 'test-cache-key-123'),
    mockExplainData
  );

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('SegmentDrawer Component Tests', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentCacheKey: 'test-cache-key-123',
      selectedSegmentId: null,
      whatIf: { forced_closed: [], forced_open: [] },
    });
  });

  it('renders nothing when selectedSegmentId is null', () => {
    const { container } = renderWithClient(<SegmentDrawer />);
    expect(container.firstChild).toBeNull();
  });

  it('renders segment attributes and SHAP driver contributions when selected', () => {
    useAppStore.setState({ selectedSegmentId: 2045 });
    renderWithClient(<SegmentDrawer />);

    expect(screen.getByText('Awash Express Link B')).toBeInTheDocument();
    expect(screen.getByText('#2045')).toBeInTheDocument();
    expect(screen.getByText(/2.4 km/i)).toBeInTheDocument();
    expect(screen.getAllByText('74.0%').length).toBeGreaterThan(0);
    expect(screen.getByText(/Extreme 3-day precipitation volume/i)).toBeInTheDocument();
  });

  it('toggles Assume Closed override in What-If state', () => {
    useAppStore.setState({ selectedSegmentId: 2045 });
    renderWithClient(<SegmentDrawer />);

    const assumeClosedBtn = screen.getByText('Assume Closed');
    fireEvent.click(assumeClosedBtn);

    expect(useAppStore.getState().whatIf.forced_closed).toContain(2045);
    expect(screen.getByText('Remove Closed')).toBeInTheDocument();

    // Toggle off
    fireEvent.click(screen.getByText('Remove Closed'));
    expect(useAppStore.getState().whatIf.forced_closed).not.toContain(2045);
  });

  it('toggles Protect Road override in What-If state', () => {
    useAppStore.setState({ selectedSegmentId: 2045 });
    renderWithClient(<SegmentDrawer />);

    const protectBtn = screen.getByText('Protect Road');
    fireEvent.click(protectBtn);

    expect(useAppStore.getState().whatIf.forced_open).toContain(2045);
    expect(screen.getByText('Remove Protected')).toBeInTheDocument();

    // Toggle off
    fireEvent.click(screen.getByText('Remove Protected'));
    expect(useAppStore.getState().whatIf.forced_open).not.toContain(2045);
  });

  it('clears selectedSegmentId when closing drawer', () => {
    useAppStore.setState({ selectedSegmentId: 2045 });
    renderWithClient(<SegmentDrawer />);

    const closeBtn = screen.getByTitle(/Close Segment Drawer/i);
    fireEvent.click(closeBtn);

    expect(useAppStore.getState().selectedSegmentId).toBeNull();
  });
});
