from enum import Enum
from typing import Any, List, Optional
from pydantic import BaseModel, Field, model_validator


class HazardEnum(str, Enum):
    flood = 'flood'
    landslide = 'landslide'


class EvidenceLevelEnum(str, Enum):
    validated = 'validated'
    limited = 'limited'
    heuristic = 'heuristic'


class FailureModeEnum(str, Enum):
    independent = 'independent'
    correlated = 'correlated'


class SpatialTypeEnum(str, Enum):
    uniform = 'uniform'
    gradient = 'gradient'
    cell = 'cell'


class StormShapeEnum(str, Enum):
    even = 'even'
    front_loaded = 'front_loaded'
    mid_peak = 'mid_peak'
    back_loaded = 'back_loaded'


class WetnessEnum(str, Enum):
    dry = 'dry'
    normal = 'normal'
    wet = 'wet'


class JobStatusEnum(str, Enum):
    queued = 'queued'
    running = 'running'
    done = 'done'
    failed = 'failed'


class FacilityLevelEnum(str, Enum):
    hospital = 'hospital'
    health_center = 'health_center'
    clinic = 'clinic'


class RoadClassEnum(str, Enum):
    motorway = 'motorway'
    trunk = 'trunk'
    primary = 'primary'
    secondary = 'secondary'
    tertiary = 'tertiary'
    unclassified = 'unclassified'
    residential = 'residential'
    track = 'track'
    other = 'other'


class QualityFlagEnum(str, Enum):
    ok = 'ok'
    low_road_density = 'low_road_density'
    long_snap = 'long_snap'
    weak_source = 'weak_source'


class ErrorCodeEnum(str, Enum):
    VALIDATION_ERROR = 'VALIDATION_ERROR'
    NOT_FOUND = 'NOT_FOUND'
    JOB_FAILED = 'JOB_FAILED'
    JOB_TIMEOUT = 'JOB_TIMEOUT'
    RATE_LIMITED = 'RATE_LIMITED'
    VERSION_MISMATCH = 'VERSION_MISMATCH'
    INTERNAL_ERROR = 'INTERNAL_ERROR'


class SpatialConfig(BaseModel):
    type: SpatialTypeEnum
    direction_deg: Optional[float] = Field(default=None, ge=0.0, le=359.0)
    ratio: Optional[float] = Field(default=None, ge=0.2, le=1.0)
    center: Optional[List[float]] = None
    radius_km: Optional[float] = Field(default=None, ge=5.0, le=200.0)

    @model_validator(mode='after')
    def validate_spatial_params(self):
        if self.type == SpatialTypeEnum.gradient:
            if self.direction_deg is None or self.ratio is None:
                raise ValueError("Gradient spatial type requires direction_deg and ratio")
        elif self.type == SpatialTypeEnum.cell:
            if not self.center or len(self.center) != 2 or self.radius_km is None:
                raise ValueError("Cell spatial type requires center [lon, lat] and radius_km")
        return self


class Scenario(BaseModel):
    hazard: HazardEnum
    region_id: str
    start_date: str
    daily_rain_mm: List[float] = Field(min_length=1, max_length=10)
    antecedent_30d_mm: float = Field(ge=0.0, le=600.0)
    spatial: SpatialConfig
    closure_factor: float = Field(default=1.0, ge=0.0, le=1.0)
    failure_mode: FailureModeEnum = FailureModeEnum.independent
    n_samples: int = Field(default=200, ge=50, le=500)
    seed: int = 42
    forced_closed: List[int] = Field(default_factory=list)
    forced_open: List[int] = Field(default_factory=list)

    @model_validator(mode='after')
    def validate_scenario(self):
        # Validate rainfall values
        for val in self.daily_rain_mm:
            if val < 0.0 or val > 400.0:
                raise ValueError("daily_rain_mm values must be between 0 and 400 mm")

        # Overlap check
        overlap = set(self.forced_closed).intersection(set(self.forced_open))
        if overlap:
            raise ValueError(f"forced_closed and forced_open must not overlap: {overlap}")
        return self


class ErrorDetail(BaseModel):
    code: ErrorCodeEnum
    message: str
    field: Optional[str] = None
    request_id: Optional[str] = None


class Job(BaseModel):
    job_id: str
    status: JobStatusEnum
    cache_key: str
    submitted_at: str
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    result_url: Optional[str] = None
    error: Optional[ErrorDetail] = None


class PercentileStats(BaseModel):
    mean: float
    p10: float
    p90: float


class RegionTotals(BaseModel):
    people_cut_off: PercentileStats
    people_degraded: PercentileStats
    facilities_isolated_expected: float


class AltRoute(BaseModel):
    minutes: float
    segment_ids: List[int]
    geometry: Optional[dict] = None


class FacilityImpact(BaseModel):
    facility_id: str
    name: str
    level: FacilityLevelEnum
    p_isolation: float = Field(ge=0.0, le=1.0)
    p10: float
    p90: float
    people_affected_est: int
    baseline_minutes: Optional[float] = None
    poor_baseline_access: bool
    alt_route: Optional[AltRoute] = None
    rank: int
    rank_delta: Optional[int] = None
    snap_distance_m: int
    source: str
    quality_flag: QualityFlagEnum


class CommunityImpact(BaseModel):
    community_id: str
    name: Optional[str] = None
    people_est: int
    p_cut_off: float = Field(ge=0.0, le=1.0)
    p_degraded: float = Field(ge=0.0, le=1.0)
    expected_minutes: Optional[float] = None
    baseline_minutes: Optional[float] = None
    poor_baseline_access: bool
    snap_distance_m: int
    quality_flag: QualityFlagEnum


class ResultSummary(BaseModel):
    cache_key: str
    versions: dict[str, str]
    hazard: HazardEnum
    evidence_level: EvidenceLevelEnum
    scenario: Scenario
    base_cache_key: Optional[str] = None
    computed_at: str
    region_totals: RegionTotals
    ranking: List[FacilityImpact]
    top_communities: List[CommunityImpact]
    assumptions: dict[str, Any]


class SegmentsColumnar(BaseModel):
    cache_key: str
    n_total: int
    sparse_threshold: float = 0.005
    segment_ids: List[int]
    exposure_prob: List[float]
    closure_prob: List[float]


class WhatIfRequest(BaseModel):
    base_cache_key: str
    forced_closed: List[int] = Field(default_factory=list)
    forced_open: List[int] = Field(default_factory=list)


class RankChangeItem(BaseModel):
    facility_id: str
    rank_a: int
    rank_b: int


class CompareResponse(BaseModel):
    a: str
    b: str
    region_totals_a: RegionTotals
    region_totals_b: RegionTotals
    people_cut_off_delta: float
    rank_changes: List[RankChangeItem]

