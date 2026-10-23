"""
ImpactMap AI - Terrain Feature Extraction Pipeline
Downloads Copernicus GLO-90 DEM tiles for the pilot region, mosaics them,
computes hydrological and geomorphological metrics:
- Elevation (m)
- Slope (degrees)
- Stream drainage network
- Distance to river / drainage stream (m)
- Height Above Nearest Drainage (HAND, m)
- Topographic Wetness Index (TWI)
- Log Flow Accumulation

Then samples each road segment in segments.geojson and extracts per-segment features.
"""

import json
import math
import os
import urllib.request
import numpy as np
from pathlib import Path
from scipy import ndimage
import tifffile

BASE_URL = "https://copernicus-dem-90m.s3.eu-central-1.amazonaws.com"

# Awash basin grid: Lats 8 to 10 N, Lons 39 to 41 E
LAT_TILES = [10, 9, 8]  # North to South
LON_TILES = [39, 40, 41] # West to East


def get_tile_key(lat: int, lon: int) -> str:
    lat_str = f"N{lat:02d}_00"
    lon_str = f"E{lon:03d}_00"
    folder = f"Copernicus_DSM_COG_30_{lat_str}_{lon_str}_DEM"
    filename = f"{folder}.tif"
    return f"{folder}/{filename}"


def download_dem_tiles(cache_dir: Path) -> dict:
    cache_dir.mkdir(parents=True, exist_ok=True)
    tiles = {}

    for lat in LAT_TILES:
        for lon in LON_TILES:
            key = get_tile_key(lat, lon)
            local_path = cache_dir / f"dem_N{lat:02d}_E{lon:03d}.tif"
            
            if not local_path.exists() or local_path.stat().st_size == 0:
                url = f"{BASE_URL}/{key}"
                print(f"Downloading DEM tile N{lat:02d}_E{lon:03d} from {url}...")
                req = urllib.request.Request(url, headers={"User-Agent": "ImpactMapAI-Pipeline/1.0"})
                with urllib.request.urlopen(req, timeout=60) as resp, open(local_path, "wb") as f:
                    f.write(resp.read())
                print(f"  Saved {local_path.name} ({local_path.stat().st_size / 1024 / 1024:.2f} MB)")
            else:
                print(f"Tile {local_path.name} already cached.")
            
            # Read tile
            with tifffile.TiffFile(str(local_path)) as tif:
                arr = tif.pages[0].asarray()
                tiles[(lat, lon)] = arr.astype(np.float32)

    return tiles


def mosaic_dem(tiles: dict) -> tuple[np.ndarray, float, float, float, float]:
    """
    Mosaics the 3x3 tiles into a single continuous 2D array.
    Returns (grid, min_lat, max_lat, min_lon, max_lon)
    """
    rows = []
    for lat in LAT_TILES:
        col_tiles = [tiles[(lat, lon)] for lon in LON_TILES]
        row_arr = np.concatenate(col_tiles, axis=1)
        rows.append(row_arr)
    
    mosaic = np.concatenate(rows, axis=0)
    # Coordinate extent
    max_lat = max(LAT_TILES) + 1.0  # 11.0
    min_lat = min(LAT_TILES)        # 8.0
    min_lon = min(LON_TILES)        # 39.0
    max_lon = max(LON_TILES) + 1.0  # 42.0

    print(f"Mosaic shape: {mosaic.shape}, Elevation range: {mosaic.min():.1f}m to {mosaic.max():.1f}m")
    return mosaic, min_lat, max_lat, min_lon, max_lon


def compute_terrain_layers(mosaic: np.ndarray, cell_size_m: float = 90.0) -> dict:
    """
    Computes slope, flow accumulation proxy, stream network, distance to stream, HAND, and TWI.
    """
    print("Computing terrain metrics (slope, streams, HAND, TWI)...")
    
    # 1. Slope in degrees
    dy, dx = np.gradient(mosaic, cell_size_m)
    slope_rad = np.arctan(np.sqrt(dx**2 + dy**2))
    slope_deg = np.degrees(slope_rad).astype(np.float32)

    # 2. Local Depression / Valley bottoms
    # Inverted gaussian smoothing to detect relative low points in landscape
    smooth_dem = ndimage.gaussian_filter(mosaic, sigma=15.0)
    relative_height = mosaic - smooth_dem  # Negative in valleys/channels

    # 3. Stream Channels
    # Stream network: low relative elevation + gentle slope (valley bottoms) or high convergence
    # Curvature / Laplacian
    laplacian = ndimage.laplace(smooth_dem)
    is_channel = (laplacian > 0.05) & (relative_height < -1.5) & (slope_deg < 5.0)

    # Clean channel raster with binary opening
    is_channel = ndimage.binary_opening(is_channel, structure=np.ones((2, 2)))
    
    print(f"Channel cells identified: {np.sum(is_channel)} / {is_channel.size} ({np.mean(is_channel)*100:.2f}%)")

    # 4. Distance to River / Channel (m)
    dist_to_stream_cells = ndimage.distance_transform_edt(~is_channel)
    dist_river_m = (dist_to_stream_cells * cell_size_m).astype(np.float32)

    # 5. Height Above Nearest Drainage (HAND, m)
    # Sample the elevation of nearest channel cell
    nearest_indices = ndimage.distance_transform_edt(~is_channel, return_distances=False, return_indices=True)
    nearest_stream_elev = mosaic[nearest_indices[0], nearest_indices[1]]
    hand_m = np.maximum(0.0, mosaic - nearest_stream_elev).astype(np.float32)

    # 6. Flow Accumulation Proxy (inverse distance weighted drainage basin convergence)
    inv_dist = np.clip(1.0 / (dist_river_m + 10.0), 0.0, 1.0)
    flow_acc_proxy = (ndimage.gaussian_filter(inv_dist * 5000.0, sigma=3.0) + 1.0).astype(np.float32)
    log_flow_acc = np.log10(flow_acc_proxy + 1.0).astype(np.float32)

    # 7. Topographic Wetness Index (TWI)
    # TWI = ln(a / tan(beta))
    tan_slope = np.maximum(0.01, np.tan(slope_rad))
    twi = np.log(np.maximum(1.0, flow_acc_proxy) / tan_slope).astype(np.float32)
    twi = np.clip(twi, 2.0, 18.0)

    return {
        "elevation": mosaic,
        "slope_deg": slope_deg,
        "dist_river_m": dist_river_m,
        "hand_m": hand_m,
        "log_flow_acc": log_flow_acc,
        "twi": twi
    }


def sample_segments(
    segments_path: Path,
    layers: dict,
    bounds: tuple[float, float, float, float],
    out_geojson_path: Path,
    out_npz_path: Path
):
    min_lat, max_lat, min_lon, max_lon = bounds
    n_rows, n_cols = layers["elevation"].shape
    
    print(f"Sampling terrain metrics for road segments from {segments_path}...")
    with open(segments_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    features = data["features"]
    n_segments = len(features)

    # Feature arrays for NPZ export
    elev_mean = np.zeros(n_segments, dtype=np.float32)
    slope_mean = np.zeros(n_segments, dtype=np.float32)
    hand_min = np.zeros(n_segments, dtype=np.float32)
    hand_mean = np.zeros(n_segments, dtype=np.float32)
    dist_river_min = np.zeros(n_segments, dtype=np.float32)
    twi_mean = np.zeros(n_segments, dtype=np.float32)
    log_flow_acc_max = np.zeros(n_segments, dtype=np.float32)

    elev_layer = layers["elevation"]
    slope_layer = layers["slope_deg"]
    hand_layer = layers["hand_m"]
    dist_layer = layers["dist_river_m"]
    twi_layer = layers["twi"]
    flow_layer = layers["log_flow_acc"]

    for idx, feat in enumerate(features):
        coords = feat["geometry"]["coordinates"]
        
        # Collect grid pixel indices for all coordinates along segment
        rows, cols = [], []
        for lon, lat in coords:
            r = int((max_lat - lat) / (max_lat - min_lat) * n_rows)
            c = int((lon - min_lon) / (max_lon - min_lon) * n_cols)
            r = min(max(0, r), n_rows - 1)
            c = min(max(0, c), n_cols - 1)
            rows.append(r)
            cols.append(c)

        r_idx = np.array(rows, dtype=np.intp)
        c_idx = np.array(cols, dtype=np.intp)

        # Sample values
        e_samples = elev_layer[r_idx, c_idx]
        s_samples = slope_layer[r_idx, c_idx]
        h_samples = hand_layer[r_idx, c_idx]
        d_samples = dist_layer[r_idx, c_idx]
        t_samples = twi_layer[r_idx, c_idx]
        f_samples = flow_layer[r_idx, c_idx]

        # Aggregate per segment
        em = float(np.mean(e_samples))
        sm = float(np.mean(s_samples))
        h_min = float(np.min(h_samples))
        h_mean = float(np.mean(h_samples))
        d_min = float(np.min(d_samples))
        tm = float(np.mean(t_samples))
        fm = float(np.max(f_samples))

        elev_mean[idx] = em
        slope_mean[idx] = sm
        hand_min[idx] = h_min
        hand_mean[idx] = h_mean
        dist_river_min[idx] = d_min
        twi_mean[idx] = tm
        log_flow_acc_max[idx] = fm

        # Store in GeoJSON feature properties
        props = feat["properties"]
        props["elev_mean"] = round(em, 1)
        props["slope_mean"] = round(sm, 2)
        props["hand_min"] = round(h_min, 1)
        props["hand_mean"] = round(h_mean, 1)
        props["dist_river_min"] = round(d_min, 1)
        props["twi_mean"] = round(tm, 2)
        props["log_flow_acc_max"] = round(fm, 2)

    # Save enriched GeoJSON
    print(f"Writing enriched GeoJSON to {out_geojson_path}...")
    with open(out_geojson_path, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))

    # Save NPZ for fast ML feature loading
    print(f"Writing terrain features NPZ to {out_npz_path}...")
    np.savez_compressed(
        out_npz_path,
        elev_mean=elev_mean,
        slope_mean=slope_mean,
        hand_min=hand_min,
        hand_mean=hand_mean,
        dist_river_min=dist_river_min,
        twi_mean=twi_mean,
        log_flow_acc_max=log_flow_acc_max
    )
    print("Terrain feature extraction completed successfully!")


def main():
    repo_root = Path(__file__).resolve().parent.parent.parent
    raw_dem_dir = repo_root / "data" / "raw" / "dem"
    segments_path = repo_root / "data" / "processed" / "segments.geojson"
    out_geojson = repo_root / "data" / "processed" / "segments.geojson"
    out_npz = repo_root / "data" / "processed" / "terrain_features.npz"

    tiles = download_dem_tiles(raw_dem_dir)
    mosaic, min_lat, max_lat, min_lon, max_lon = mosaic_dem(tiles)
    layers = compute_terrain_layers(mosaic)
    sample_segments(segments_path, layers, (min_lat, max_lat, min_lon, max_lon), out_geojson, out_npz)


if __name__ == "__main__":
    main()
