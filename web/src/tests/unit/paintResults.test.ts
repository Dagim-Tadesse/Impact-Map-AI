import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { paintSegmentsChunked } from '../../map/paintResults';

describe('paintSegmentsChunked (Anon Work Division A3 & A7)', () => {
  let mockMap: any;
  let previouslyPaintedIds: Set<number>;

  beforeEach(() => {
    vi.useFakeTimers();
    previouslyPaintedIds = new Set([101, 102]);
    mockMap = {
      getSource: vi.fn().mockReturnValue({ type: 'geojson' }),
      removeFeatureState: vi.fn(),
      setFeatureState: vi.fn(),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears old feature states from previouslyPaintedIds before painting new segments', () => {
    const segments = [
      { id: 201, exposure_prob: 0.15, closure_prob: 0.15 },
      { id: 202, exposure_prob: 0.45, closure_prob: 0.45 },
    ];

    paintSegmentsChunked(
      mockMap,
      'roads',
      'roads',
      segments,
      previouslyPaintedIds,
      100
    );

    // Should have removed previous IDs: 101, 102
    expect(mockMap.removeFeatureState).toHaveBeenCalledWith({
      source: 'roads',
      id: 101,
    });
    expect(mockMap.removeFeatureState).toHaveBeenCalledWith({
      source: 'roads',
      id: 102,
    });

    // Advance RAF timer
    vi.advanceTimersByTime(50);

    // Should paint new segments
    expect(mockMap.setFeatureState).toHaveBeenCalledWith(
      { source: 'roads', id: 201 },
      { exposure_prob: 0.15, closure_prob: 0.15 }
    );
    expect(mockMap.setFeatureState).toHaveBeenCalledWith(
      { source: 'roads', id: 202 },
      { exposure_prob: 0.45, closure_prob: 0.45 }
    );

    // Previously painted IDs should now have the new IDs
    expect(previouslyPaintedIds.has(201)).toBe(true);
    expect(previouslyPaintedIds.has(202)).toBe(true);
    expect(previouslyPaintedIds.has(101)).toBe(false);
  });

  it('includes sourceLayer when painting to vector sources', () => {
    mockMap.getSource.mockReturnValue({ type: 'vector' });
    const segments = [
      { id: 301, exposure_prob: 0.8, closure_prob: 0.8 },
    ];

    paintSegmentsChunked(
      mockMap,
      'roads',
      'roads',
      segments,
      previouslyPaintedIds,
      100
    );

    expect(mockMap.removeFeatureState).toHaveBeenCalledWith({
      source: 'roads',
      sourceLayer: 'roads',
      id: 101,
    });

    vi.advanceTimersByTime(50);

    expect(mockMap.setFeatureState).toHaveBeenCalledWith(
      { source: 'roads', sourceLayer: 'roads', id: 301 },
      { exposure_prob: 0.8, closure_prob: 0.8 }
    );
  });

  it('can be cancelled cleanly via returned cancellation callback', () => {
    const segments = Array.from({ length: 5000 }, (_, i) => ({
      id: i + 1,
      exposure_prob: 0.2,
      closure_prob: 0.2,
    }));

    const cancel = paintSegmentsChunked(
      mockMap,
      'roads',
      'roads',
      segments,
      previouslyPaintedIds,
      1000
    );

    cancel();
    expect(typeof cancel).toBe('function');
  });
});
