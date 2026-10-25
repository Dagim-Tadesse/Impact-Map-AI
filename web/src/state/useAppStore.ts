import { create } from 'zustand';

export type LayerMode = 'exposure' | 'closure';
export type ActiveTab = 'scenario' | 'results' | 'compare' | 'evidence';
export type DrawerType = 'facility' | 'segment' | 'whatif' | null;
export type MockScenarioBehavior = 'cached_200' | 'async_202' | 'error_400' | 'rate_limit_429' | 'error_500' | 'offline';

export interface CascadeState {
  slug: string | null;
  step: number;
  n_steps: number;
  playing: boolean;
  speedMs: number; // 2000, 5000 or 8000
}

export interface WhatIfState {
  forced_closed: number[];
  forced_open: number[];
}

export interface ComparePair {
  a: string | null;
  b: string | null;
}

export interface AppStore {
  // Scenario & Results Keys
  currentCacheKey: string | null;
  baseCacheKey: string | null;
  activeTab: ActiveTab;

  // Map & Visualisation State
  layerMode: LayerMode;
  selectedFacilityId: string | null;
  selectedSegmentId: number | null;
  selectedCommunityId: string | null;
  drawerOpen: DrawerType;

  // What-If Interventions
  whatIf: WhatIfState;

  // Cascade Simulation Replay
  cascade: CascadeState;
  preCascadeCacheKey: string | null;

  // Compare Pair
  comparePair: ComparePair;

  // Telemetry & Stage Pitch Enhancements
  stageDemoActive: boolean;
  isOfflineMode: boolean;
  is3DView: boolean;
  mockBehavior: MockScenarioBehavior;

  // Actions
  setCurrentCacheKey: (key: string | null) => void;
  setBaseCacheKey: (key: string | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setLayerMode: (mode: LayerMode) => void;
  setSelectedFacilityId: (id: string | null) => void;
  setSelectedSegmentId: (id: number | null) => void;
  setSelectedCommunityId: (id: string | null) => void;
  setDrawerOpen: (drawer: DrawerType) => void;

  // What-If Actions
  addForcedClosed: (segmentId: number) => void;
  removeForcedClosed: (segmentId: number) => void;
  addForcedOpen: (segmentId: number) => void;
  removeForcedOpen: (segmentId: number) => void;
  clearWhatIf: () => void;

  // Cascade Actions
  setCascadeState: (partial: Partial<CascadeState>) => void;
  resetCascade: () => void;

  // Compare Actions
  setComparePair: (pair: Partial<ComparePair>) => void;

  // Mode Toggles
  setStageDemoActive: (active: boolean) => void;
  setIsOfflineMode: (offline: boolean) => void;
  setIs3DView: (is3D: boolean) => void;
  toggle3DView: () => void;
  setMockBehavior: (behavior: MockScenarioBehavior) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentCacheKey: null,
  baseCacheKey: null,
  activeTab: 'scenario',

  layerMode: 'exposure',
  selectedFacilityId: null,
  selectedSegmentId: null,
  selectedCommunityId: null,
  drawerOpen: null,

  whatIf: {
    forced_closed: [],
    forced_open: [],
  },

  cascade: {
    slug: null,
    step: 1,
    n_steps: 4,
    playing: false,
    speedMs: 5000,
  },
  preCascadeCacheKey: null,

  comparePair: {
    a: null,
    b: null,
  },

  stageDemoActive: false,
  isOfflineMode: false,
  is3DView: false,
  mockBehavior: 'cached_200',

  setIs3DView: (is3D) => set({ is3DView: is3D }),
  toggle3DView: () => set((state) => ({ is3DView: !state.is3DView })),
  setMockBehavior: (behavior) => {
    try {
      if (typeof window !== 'undefined') {
        (window as any).__setMockBehavior?.(behavior);
      }
    } catch {}
    set({
      mockBehavior: behavior,
      isOfflineMode: behavior === 'offline',
    });
  },

  setCurrentCacheKey: (key) => set({ currentCacheKey: key }),
  setBaseCacheKey: (key) => set({ baseCacheKey: key }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setLayerMode: (mode) => set({ layerMode: mode }),
  setSelectedFacilityId: (id) =>
    set({
      selectedFacilityId: id,
      drawerOpen: id ? 'facility' : null,
    }),
  setSelectedSegmentId: (id) =>
    set({
      selectedSegmentId: id,
      drawerOpen: id !== null ? 'segment' : null,
    }),
  setSelectedCommunityId: (id) => set({ selectedCommunityId: id }),
  setDrawerOpen: (drawer) => set({ drawerOpen: drawer }),

  addForcedClosed: (segmentId) =>
    set((state) => ({
      whatIf: {
        forced_closed: Array.from(new Set([...state.whatIf.forced_closed, segmentId])),
        forced_open: state.whatIf.forced_open.filter((id) => id !== segmentId),
      },
      drawerOpen: 'whatif',
    })),

  removeForcedClosed: (segmentId) =>
    set((state) => ({
      whatIf: {
        ...state.whatIf,
        forced_closed: state.whatIf.forced_closed.filter((id) => id !== segmentId),
      },
    })),

  addForcedOpen: (segmentId) =>
    set((state) => ({
      whatIf: {
        forced_open: Array.from(new Set([...state.whatIf.forced_open, segmentId])),
        forced_closed: state.whatIf.forced_closed.filter((id) => id !== segmentId),
      },
      drawerOpen: 'whatif',
    })),

  removeForcedOpen: (segmentId) =>
    set((state) => ({
      whatIf: {
        ...state.whatIf,
        forced_open: state.whatIf.forced_open.filter((id) => id !== segmentId),
      },
    })),

  clearWhatIf: () =>
    set({
      whatIf: { forced_closed: [], forced_open: [] },
    }),

  setCascadeState: (partial) =>
    set((state) => ({
      cascade: { ...state.cascade, ...partial },
      preCascadeCacheKey:
        partial.slug && state.preCascadeCacheKey === null
          ? state.currentCacheKey
          : state.preCascadeCacheKey,
    })),

  resetCascade: () =>
    set((state) => ({
      cascade: {
        slug: null,
        step: 1,
        n_steps: 4,
        playing: false,
        speedMs: 1500,
      },
      currentCacheKey: state.preCascadeCacheKey ?? state.currentCacheKey,
      preCascadeCacheKey: null,
    })),

  setComparePair: (pair) =>
    set((state) => ({
      comparePair: { ...state.comparePair, ...pair },
    })),

  setStageDemoActive: (active) => set({ stageDemoActive: active }),
  setIsOfflineMode: (offline) => set({ isOfflineMode: offline }),
}));
