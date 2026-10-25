import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WhatIfBasket } from '../../panels/WhatIfBasket';
import { useAppStore } from '../../state/useAppStore';

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('WhatIfBasket Component Tests', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentCacheKey: 'test-cache-key-123',
      baseCacheKey: null,
      drawerOpen: null,
      whatIf: { forced_closed: [], forced_open: [] },
    });
  });

  it('renders nothing when there are no overrides and drawer is not whatif', () => {
    const { container } = renderWithClient(<WhatIfBasket />);
    expect(container.firstChild).toBeNull();
  });

  it('renders overrides list when items exist in whatIf', () => {
    useAppStore.setState({
      whatIf: { forced_closed: [101, 102], forced_open: [205] },
    });

    renderWithClient(<WhatIfBasket />);

    expect(screen.getByText(/What-If Interventions \(3\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Protected Roads \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Forced Closed \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText('#205')).toBeInTheDocument();
    expect(screen.getByText('#101')).toBeInTheDocument();
    expect(screen.getByText('#102')).toBeInTheDocument();
  });

  it('clears all overrides when clicking Clear button', () => {
    useAppStore.setState({
      whatIf: { forced_closed: [101], forced_open: [205] },
    });

    renderWithClient(<WhatIfBasket />);

    const clearBtn = screen.getByTitle(/Clear All Overrides/i);
    fireEvent.click(clearBtn);

    expect(useAppStore.getState().whatIf.forced_closed).toEqual([]);
    expect(useAppStore.getState().whatIf.forced_open).toEqual([]);
  });

  it('removes individual override when clicking X button', () => {
    useAppStore.setState({
      whatIf: { forced_closed: [101, 102], forced_open: [] },
    });

    renderWithClient(<WhatIfBasket />);

    // There are 2 items with X buttons
    const item101 = screen.getByText('#101').parentElement;
    const removeBtn = item101?.querySelector('button');
    if (removeBtn) {
      fireEvent.click(removeBtn);
    }

    expect(useAppStore.getState().whatIf.forced_closed).not.toContain(101);
  });
});
