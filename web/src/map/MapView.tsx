import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { Box, Compass, Sparkles, Layers } from 'lucide-react';
import { useAppStore } from '../state/useAppStore';
import { getConfig } from '../config';
import { paintSegmentsChunked } from './paintResults';
import { useSegmentsColumnarQuery, useResultSummaryQuery } from '../api/hooks';
import { useTranslation } from 'react-i18next';

// Register PMTiles protocol once per app lifecycle (Work Division A2.3)
const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

// Awash Basin Center & Bounding Box
const AWASH_CENTER: [number, number] = [40.16, 9.15];
const AWASH_BOUNDS: [number, number, number, number] = [39.5, 8.5, 41.2, 10.2];

export const MapView: React.FC = () => {
  const { t } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const previouslyPaintedIds = useRef<Set<number>>(new Set());
  const activeTooltip = useRef<maplibregl.Popup | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const config = getConfig();

  const {
    layerMode,
    setLayerMode,
    selectedFacilityId,
    selectedSegmentId,
    selectedCommunityId,
    setSelectedFacilityId,
    setSelectedSegmentId,
    setSelectedCommunityId,
    whatIf,
    currentCacheKey,
    is3DView,
    toggle3DView,
  } = useAppStore();

  const { data: resultSummary } = useResultSummaryQuery(currentCacheKey);
  const { data: segmentsData } = useSegmentsColumnarQuery(currentCacheKey);

  // Sync 3D Perspective & Terrain DEM with MapLibre GL
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    map.easeTo({
      pitch: is3DView ? 54 : 0,
      bearing: is3DView ? -18 : 0,
      duration: 1200,
    });

    try {
      if (is3DView) {
        map.setTerrain({ source: 'terrain-dem', exaggeration: 1.5 });
      } else {
        map.setTerrain(null);
      }
    } catch {
      // Graceful fallback
    }
  }, [is3DView, mapLoaded]);

  const toggle3DMode = () => {
    toggle3DView();
  };

  // 1. Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 14,
            attribution: '© Esri, HERE, Garmin, OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'basemap-raster',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: AWASH_CENTER,
      zoom: 8.5,
      pitch: 54,
      bearing: -18,
      maxPitch: 85,
      minZoom: 6,
      maxZoom: 16,
      maxBounds: [
        [38.0, 7.5],
        [43.0, 11.5],
      ],
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: '© OpenStreetMap contributors, Protomaps',
      }),
      'bottom-right'
    );

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    map.on('load', async () => {
      mapRef.current = map;

      // 2. Add Sources: Roads, Facilities, Communities, and Alt Route
      const facilitiesGeojsonUrl = `${config.data_base_url}/facilities.geojson`;
      const communitiesGeojsonUrl = `${config.data_base_url}/communities.geojson`;
      const segmentsGeojsonUrl = `${config.data_base_url}/segments.geojson`;

      // Try loading real GeoJSON layers; if backend has not generated them yet, fall back to demo/local samples
      map.addSource('facilities', {
        type: 'geojson',
        data: facilitiesGeojsonUrl,
        promoteId: 'facility_id',
      });

      map.addSource('communities', {
        type: 'geojson',
        data: communitiesGeojsonUrl,
        promoteId: 'community_id',
      });

      map.addSource('roads', {
        type: 'geojson',
        data: segmentsGeojsonUrl,
        promoteId: 'segment_id',
      });

      map.addSource('alt-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Extra 1: AWS Terrarium Raster DEM for 3D Awash Valley Topography
      map.addSource('terrain-dem', {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 15,
      });

      // 3. Add Layers
      // 3D Hillshade Layer for Awash Mountain Ridges (Realistic Neutral Topography, Not Neon Blue)
      map.addLayer({
        id: 'hills',
        type: 'hillshade',
        source: 'terrain-dem',
        layout: { visibility: 'visible' },
        paint: {
          'hillshade-shadow-color': '#020617',
          'hillshade-highlight-color': '#475569',
          'hillshade-accent-color': '#1e293b',
          'hillshade-illumination-direction': 315,
          'hillshade-exaggeration': 0.45,
        },
      });

      // Initial 3D terrain elevation mesh
      try {
        if (is3DView) {
          map.setTerrain({ source: 'terrain-dem', exaggeration: 1.5 });
        }
      } catch {
        // Fallback gracefully
      }

      // Road Risk Layer (Exact Work Division A3 Contract)
      map.addLayer({
        id: 'roads-risk',
        type: 'line',
        source: 'roads',
        paint: {
          'line-color': [
            'step',
            ['coalesce', ['feature-state', layerMode === 'closure' ? 'closure_prob' : 'exposure_prob'], 0],
            '#64748b', // Open / safe road (slate gray)
            0.05,
            '#fde047', // 5-20% caution (yellow)
            0.2,
            '#f97316', // 20-40% moderate flood (orange)
            0.4,
            '#ef4444', // 40-70% high flood risk (red)
            0.7,
            '#b91c1c', // >70% critical / submerged (dark red)
          ],
          'line-width': [
            'step',
            ['coalesce', ['feature-state', layerMode === 'closure' ? 'closure_prob' : 'exposure_prob'], 0],
            1.5,
            0.05,
            2.5,
            0.2,
            3.5,
            0.4,
            4.5,
            0.7,
            5.5,
          ],
          'line-opacity': 0.9,
        },
      });

      // Selected Road Segment Highlight Glow
      map.addLayer({
        id: 'roads-highlight',
        type: 'line',
        source: 'roads',
        paint: {
          'line-color': '#22d3ee',
          'line-width': 6,
          'line-opacity': 0.95,
          'line-blur': 1,
        },
        filter: ['==', ['get', 'segment_id'], selectedSegmentId ?? -1],
      });

      // What-If Protected Segments (Neon Emerald Glow)
      map.addLayer({
        id: 'roads-whatif-open',
        type: 'line',
        source: 'roads',
        paint: {
          'line-color': '#10b981',
          'line-width': 5.5,
          'line-opacity': 0.95,
          'line-blur': 0.5,
        },
        filter: ['match', ['get', 'segment_id'], [-9999], true, false],
      });

      // What-If Assumed Closed Segments (Crimson Red Dashed)
      map.addLayer({
        id: 'roads-whatif-closed',
        type: 'line',
        source: 'roads',
        paint: {
          'line-color': '#ef4444',
          'line-width': 5,
          'line-dasharray': [2, 1],
          'line-opacity': 0.95,
        },
        filter: ['match', ['get', 'segment_id'], [-9999], true, false],
      });

      // Alternative Surviving Route (Cyan Dashed Line)
      map.addLayer({
        id: 'alt-route-line',
        type: 'line',
        source: 'alt-route',
        paint: {
          'line-color': '#06b6d4',
          'line-width': 4.5,
          'line-dasharray': [2, 1.5],
          'line-opacity': 0.95,
        },
      });

      // Alternative Surviving Route Label
      map.addLayer({
        id: 'alt-route-label',
        type: 'symbol',
        source: 'alt-route',
        layout: {
          'symbol-placement': 'line-center',
          'text-field': '⚡ Surviving Emergency Detour Route',
          'text-size': 11,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-offset': [0, -1.2],
        },
        paint: {
          'text-color': '#22d3ee',
          'text-halo-color': '#020617',
          'text-halo-width': 2.5,
        },
      });

      // Communities Layer
      map.addLayer({
        id: 'communities-circle',
        type: 'circle',
        source: 'communities',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['sqrt', ['coalesce', ['get', 'people_est'], 100]],
            10,
            3,
            100,
            8,
          ],
          'circle-color': [
            'step',
            ['coalesce', ['feature-state', 'p_cut_off'], 0],
            '#94a3b8',
            0.05,
            '#fde68a',
            0.2,
            '#f59e0b',
            0.4,
            '#dc2626',
            0.7,
            '#7f1d1d',
          ],
          'circle-opacity': 0.55,
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            3,
            1,
          ],
          'circle-stroke-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#22d3ee',
            '#ffffff',
          ],
          'circle-stroke-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            1,
            0.35,
          ],
        },
      });

      // Healthcare Facilities Layer
      map.addLayer({
        id: 'facilities-circle',
        type: 'circle',
        source: 'facilities',
        paint: {
          'circle-radius': [
            'match',
            ['get', 'level'],
            'hospital',
            13,
            'health_center',
            9.5,
            'clinic',
            7,
            8,
          ],
          'circle-color': [
            'step',
            ['coalesce', ['feature-state', 'p_isolation'], 0],
            '#06b6d4', // Safe baseline (cyan)
            0.05,
            '#fde047', // Low isolation (yellow)
            0.2,
            '#f97316', // Moderate isolation (orange)
            0.4,
            '#ef4444', // High isolation risk (red)
            0.7,
            '#b91c1c', // Critical / isolated (crimson)
          ],
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            4,
            2,
          ],
          'circle-stroke-color': '#ffffff',
        },
      });

      // Facility Label Layer (Visible from regional zoom 7.5)
      map.addLayer({
        id: 'facilities-labels',
        type: 'symbol',
        source: 'facilities',
        minzoom: 7.5,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 12,
          'text-offset': [0, 1.3],
          'text-anchor': 'top',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#020617',
          'text-halo-width': 2.5,
        },
      });

      // 4. Click & Hover Handlers
      map.on('click', 'facilities-circle', (e) => {
        if (!e.features || !e.features[0]) return;
        const facId = e.features[0].properties?.facility_id;
        if (facId) {
          setSelectedFacilityId(facId);
        }
      });

      map.on('click', 'roads-risk', (e) => {
        if (!e.features || !e.features[0]) return;
        const segId = e.features[0].properties?.segment_id || e.features[0].id;
        if (segId !== undefined) {
          setSelectedSegmentId(Number(segId));
        }
      });

      // Hover Road Tooltip
      map.on('mousemove', 'roads-risk', (e) => {
        if (!e.features || !e.features[0]) return;
        map.getCanvas().style.cursor = 'pointer';
        const feat = e.features[0];
        const name = feat.properties?.name || 'Unnamed Segment';
        const roadClass = feat.properties?.road_class || 'road';

        if (!activeTooltip.current) {
          activeTooltip.current = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
          });
        }
        activeTooltip.current
          .setLngLat(e.lngLat)
          .setHTML(
            `<div class="text-xs font-sans">
              <div class="font-bold text-white">${name}</div>
              <div class="text-[10px] text-cyan-300 font-mono uppercase tracking-wider">${roadClass}</div>
            </div>`
          )
          .addTo(map);
      });

      map.on('mouseleave', 'roads-risk', () => {
        map.getCanvas().style.cursor = '';
        if (activeTooltip.current) {
          activeTooltip.current.remove();
          activeTooltip.current = null;
        }
      });

      map.on('mouseenter', 'facilities-circle', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'facilities-circle', () => {
        map.getCanvas().style.cursor = '';
      });

      // Communities Click & Hover Handlers (A4.8)
      map.on('click', 'communities-circle', (e) => {
        if (!e.features || !e.features[0]) return;
        const commId = e.features[0].properties?.community_id || e.features[0].id;
        if (commId) {
          setSelectedCommunityId(String(commId));
        }
      });
      map.on('mouseenter', 'communities-circle', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'communities-circle', () => {
        map.getCanvas().style.cursor = '';
      });

      setMapLoaded(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Road Layer Paint Properties on layerMode change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !map.getLayer('roads-risk')) return;

    const prop = layerMode === 'closure' ? 'closure_prob' : 'exposure_prob';

    map.setPaintProperty('roads-risk', 'line-color', [
      'step',
      ['coalesce', ['feature-state', prop], 0],
      '#64748b',
      0.05,
      '#fde047',
      0.2,
      '#f97316',
      0.4,
      '#ef4444',
      0.7,
      '#b91c1c',
    ]);

    map.setPaintProperty('roads-risk', 'line-width', [
      'step',
      ['coalesce', ['feature-state', prop], 0],
      1.5,
      0.05,
      2.5,
      0.2,
      3.5,
      0.4,
      4.5,
      0.7,
      5.5,
    ]);
  }, [layerMode, mapLoaded]);

  // Batch Paint Segments when segmentsData arrives
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (!segmentsData || !segmentsData.segment_ids) return;

    const n = segmentsData.segment_ids.length;
    const items = [];
    for (let i = 0; i < n; i++) {
      items.push({
        id: segmentsData.segment_ids[i],
        exposure_prob: segmentsData.exposure_prob[i],
        closure_prob: segmentsData.closure_prob[i],
      });
    }

    const cancel = paintSegmentsChunked(
      map,
      'roads',
      'roads',
      items,
      previouslyPaintedIds.current,
      2000
    );

    return () => {
      cancel();
    };
  }, [segmentsData, mapLoaded]);

  // Update Facility Feature States (p_isolation) when resultSummary changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !resultSummary || !resultSummary.ranking) return;

    resultSummary.ranking.forEach((fac: any) => {
      try {
        map.setFeatureState(
          { source: 'facilities', id: fac.facility_id },
          {
            p_isolation: fac.p_isolation,
            selected: fac.facility_id === selectedFacilityId,
          }
        );
      } catch {
        // Silently continue
      }
    });
  }, [resultSummary, selectedFacilityId, mapLoaded]);

  // Update Alternative Route geometry if selected facility has alt_route
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const altSource = map.getSource('alt-route') as maplibregl.GeoJSONSource;
    if (!altSource) return;

    if (!selectedFacilityId || !resultSummary?.ranking) {
      altSource.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const fac = resultSummary.ranking.find((f: any) => f.facility_id === selectedFacilityId);
    if (fac?.alt_route?.geometry) {
      altSource.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: fac.alt_route.geometry as any,
            properties: { minutes: fac.alt_route.minutes },
          },
        ],
      });
    } else {
      altSource.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [selectedFacilityId, resultSummary, mapLoaded]);

  // Fly to selected facility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !selectedFacilityId || !resultSummary?.ranking) return;

    // Search facility coordinates from ranking alt_route
    const fac = resultSummary.ranking.find((f: any) => f.facility_id === selectedFacilityId);
    if (fac?.alt_route?.geometry?.coordinates?.[0]) {
      const coord = fac.alt_route.geometry.coordinates[0];
      map.flyTo({
        center: [coord[0], coord[1]],
        zoom: 12.5,
        pitch: is3DView ? 54 : 0,
        bearing: is3DView ? -18 : 0,
        speed: 1.2,
      });
      return;
    }

    // Fallback: query rendered facility feature point
    const feats = map.queryRenderedFeatures({ layers: ['facilities-circle'] });
    const match = feats.find((f) => f.properties?.facility_id === selectedFacilityId);
    if (match && match.geometry.type === 'Point') {
      const coords = (match.geometry as any).coordinates;
      map.flyTo({
        center: [coords[0], coords[1]],
        zoom: 12.5,
        pitch: is3DView ? 54 : 0,
        bearing: is3DView ? -18 : 0,
        speed: 1.2,
      });
    }
  }, [selectedFacilityId, mapLoaded, resultSummary, is3DView]);

  // Update road highlight filter and fly to selected segment
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (map.getLayer('roads-highlight')) {
      map.setFilter('roads-highlight', ['==', ['get', 'segment_id'], selectedSegmentId ?? -1]);
    }

    if (selectedSegmentId !== null) {
      const feats = map.queryRenderedFeatures({ layers: ['roads-risk'] });
      const match = feats.find((f) => f.properties?.segment_id === selectedSegmentId);
      if (match && match.geometry.type === 'LineString') {
        const coords = (match.geometry as any).coordinates;
        if (coords && coords.length > 0) {
          const mid = coords[Math.floor(coords.length / 2)];
          map.flyTo({
            center: [mid[0], mid[1]],
            zoom: 13,
            pitch: is3DView ? 54 : 0,
            bearing: is3DView ? -18 : 0,
            speed: 1.2,
          });
        }
      }
    }
  }, [selectedSegmentId, mapLoaded, is3DView]);

  // Update What-If road layer filters when basket changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (map.getLayer('roads-whatif-open')) {
      map.setFilter('roads-whatif-open', [
        'match',
        ['get', 'segment_id'],
        whatIf.forced_open.length > 0 ? whatIf.forced_open : [-9999],
        true,
        false,
      ]);
    }

    if (map.getLayer('roads-whatif-closed')) {
      map.setFilter('roads-whatif-closed', [
        'match',
        ['get', 'segment_id'],
        whatIf.forced_closed.length > 0 ? whatIf.forced_closed : [-9999],
        true,
        false,
      ]);
    }
  }, [whatIf, mapLoaded]);

  // Handle map:fitBounds custom event for inspecting alternative routes
  useEffect(() => {
    const handleFitBounds = (e: any) => {
      const coords = e.detail?.coordinates;
      const map = mapRef.current;
      if (!map || !coords || coords.length === 0) return;

      if (coords.length === 1) {
        map.flyTo({ center: coords[0], zoom: 13, speed: 1.2 });
        return;
      }

      let minX = coords[0][0];
      let maxX = coords[0][0];
      let minY = coords[0][1];
      let maxY = coords[0][1];

      for (const [x, y] of coords) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }

      map.fitBounds(
        [
          [minX, minY],
          [maxX, maxY],
        ],
        { padding: 80, speed: 1.2, maxZoom: 14 }
      );
    };

    window.addEventListener('map:fitBounds', handleFitBounds);
    return () => window.removeEventListener('map:fitBounds', handleFitBounds);
  }, []);

  // Fly to and highlight selected community
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (selectedCommunityId) {
      const feats = map.queryRenderedFeatures({ layers: ['communities-circle'] });
      const match = feats.find(
        (f) =>
          f.properties?.community_id === selectedCommunityId ||
          f.id === selectedCommunityId
      );

      if (match && match.geometry.type === 'Point') {
        const coords = (match.geometry as any).coordinates;
        map.flyTo({
          center: [coords[0], coords[1]],
          zoom: 12.5,
          pitch: is3DView ? 54 : 0,
          bearing: is3DView ? -18 : 0,
          speed: 1.2,
        });

        try {
          map.setFeatureState(
            { source: 'communities', id: selectedCommunityId },
            { selected: true }
          );
        } catch {}
      }
    }
  }, [selectedCommunityId, mapLoaded, is3DView]);

  return (
    <div className="relative w-full h-full bg-[#07090e] overflow-hidden select-none">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating 3D Perspective & Layer Mode HUD (Top Right on Map) */}
      <div className="absolute top-4 right-14 z-20 flex items-center gap-2">
        {/* 3D Isometric View Mode Toggle */}
        <button
          onClick={toggle3DMode}
          className={`min-h-[44px] px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold backdrop-blur-xl shadow-lg transition-all active:scale-95 ${
            is3DView
              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
              : 'glass-panel border-white/15 text-slate-300 hover:text-white'
          }`}
          title={is3DView ? 'Switch to 2D Top-Down View' : 'Switch to 3D Isometric Perspective'}
        >
          <Box className={`w-4 h-4 ${is3DView ? 'text-cyan-300 animate-pulse' : 'text-slate-400'}`} />
          <span className="font-mono tracking-wider">{is3DView ? t('hud.view_3d') : t('hud.view_2d')}</span>
        </button>

        {/* Layer Mode Switcher: Flood Exposure vs Assumed Closure */}
        <div className="hidden sm:flex items-center glass-panel rounded-xl p-1 border border-white/10 shadow-lg">
          <button
            onClick={() => {
              setLayerMode('exposure');
            }}
            className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              layerMode === 'exposure'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Model Inundation Exposure Probability"
          >
            {t('hud.flood_exposure')}
          </button>
          <button
            onClick={() => {
              setLayerMode('closure');
            }}
            className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              layerMode === 'closure'
                ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Operational Assumed Road Closure"
          >
            {t('hud.assumed_closure')}
          </button>
        </div>
      </div>
    </div>
  );
};
