import type maplibregl from 'maplibre-gl';

interface SegmentProbabilityItem {
  id: number;
  exposure_prob: number;
  closure_prob: number;
}

/**
 * Updates road feature-states in batches of ~2,000 per animation frame
 * to guarantee 60fps rendering without UI thread blocking.
 *
 * Anon Work Division A3 requirement.
 */
export function paintSegmentsChunked(
  map: maplibregl.Map,
  sourceId: string,
  sourceLayer: string,
  segments: SegmentProbabilityItem[],
  previouslyPaintedIds: Set<number>,
  chunkSize: number = 2000,
  onComplete?: () => void
): () => void {
  let isCancelled = false;
  const source = map.getSource ? (map.getSource(sourceId) as any) : null;
  const isVector = source?.type === 'vector';

  // 1. Clear previous feature-states
  if (previouslyPaintedIds.size > 0) {
    previouslyPaintedIds.forEach((id) => {
      try {
        if (isVector && sourceLayer) {
          map.removeFeatureState({ source: sourceId, sourceLayer, id });
        } else {
          map.removeFeatureState({ source: sourceId, id });
        }
      } catch {
        // Source may be reloaded
      }
    });
    previouslyPaintedIds.clear();
  }

  // 2. Batch paint new segments
  let currentIndex = 0;

  function paintNextChunk() {
    if (isCancelled || !map.getSource(sourceId)) return;

    const limit = Math.min(currentIndex + chunkSize, segments.length);
    for (let i = currentIndex; i < limit; i++) {
      const seg = segments[i];
      try {
        const featureRef = isVector && sourceLayer
          ? { source: sourceId, sourceLayer, id: seg.id }
          : { source: sourceId, id: seg.id };

        map.setFeatureState(featureRef, {
          exposure_prob: seg.exposure_prob,
          closure_prob: seg.closure_prob,
        });
        previouslyPaintedIds.add(seg.id);
      } catch {
        // Silently continue if layer is transitioning
      }
    }

    currentIndex = limit;

    if (currentIndex < segments.length) {
      requestAnimationFrame(paintNextChunk);
    } else {
      onComplete?.();
    }
  }

  requestAnimationFrame(paintNextChunk);

  return () => {
    isCancelled = true;
  };
}
