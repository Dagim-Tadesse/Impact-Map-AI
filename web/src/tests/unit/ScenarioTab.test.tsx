import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ScenarioTab } from '../../panels/ScenarioTab';
import { useAppStore } from '../../state/useAppStore';

// Mock recharts ResponsiveContainer to avoid SVG dimension warnings in JSDOM
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div style={{ width: 300, height: 120 }}>{children}</div>,
  };
});

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

describe('ScenarioTab Component Tests', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentCacheKey: null,
      activeTab: 'scenario',
    });
  });

  it('renders library and custom scenario builder sections', () => {
    renderWithClient(<ScenarioTab />);

    expect(screen.getByText(/Scenario Library/i)).toBeInTheDocument();
    expect(screen.getByText(/Custom Scenario Builder/i)).toBeInTheDocument();
    expect(screen.getByText(/Storm Total Rainfall/i)).toBeInTheDocument();
    expect(screen.getByText(/Event Duration/i)).toBeInTheDocument();
  });

  it('allows adjusting storm total rainfall and updates input state', () => {
    renderWithClient(<ScenarioTab />);

    const sliders = screen.getAllByRole('slider');
    const totalRainSlider = sliders[0];
    expect(totalRainSlider).toHaveValue('120');

    fireEvent.change(totalRainSlider, { target: { value: '180' } });
    expect(totalRainSlider).toHaveValue('180');
    expect(screen.getByText('180 mm')).toBeInTheDocument();
  });

  it('allows changing storm hyetograph shape distribution', () => {
    renderWithClient(<ScenarioTab />);

    const frontLoadedBtn = screen.getByRole('button', { name: /Front/i });
    expect(frontLoadedBtn).toBeInTheDocument();

    fireEvent.click(frontLoadedBtn);
    expect(frontLoadedBtn.className).toContain('border-cyan-400');
  });

  it('displays Run Accessibility Simulation action button', () => {
    renderWithClient(<ScenarioTab />);

    const runBtn = screen.getByRole('button', { name: /Run Accessibility Simulation/i });
    expect(runBtn).toBeInTheDocument();
    expect(runBtn).not.toBeDisabled();
  });

  it('renders advanced spatial and monte carlo parameters when expanded', () => {
    renderWithClient(<ScenarioTab />);

    const advancedToggle = screen.getByText(/Advanced Spatial & Monte Carlo Parameters/i);
    expect(advancedToggle).toBeInTheDocument();

    fireEvent.click(advancedToggle);

    expect(screen.getByText(/Spatial Distribution Pattern/i)).toBeInTheDocument();
    expect(screen.getByText(/Monte Carlo Draws/i)).toBeInTheDocument();
    expect(screen.getByText(/Random Seed/i)).toBeInTheDocument();
  });

  it('displays calculated daily rainfall array in hyetograph preview', () => {
    renderWithClient(<ScenarioTab />);

    expect(screen.getByText(/Rainfall Hyetograph Preview/i)).toBeInTheDocument();
    expect(screen.getByText(/Total: 120 mm/i)).toBeInTheDocument();
  });
});
