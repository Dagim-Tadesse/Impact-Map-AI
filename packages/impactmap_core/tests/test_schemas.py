import json
from pathlib import Path
import pytest
from pydantic import ValidationError

from impactmap_core.schemas import (
    HazardEnum,
    Job,
    ResultSummary,
    Scenario,
    SpatialConfig,
    SpatialTypeEnum,
)


def test_scenario_valid():
    scenario = Scenario(
        hazard=HazardEnum.flood,
        region_id='pilot_01',
        start_date='2026-10-25',
        daily_rain_mm=[20.0, 45.5, 10.0],
        antecedent_30d_mm=120.0,
        spatial=SpatialConfig(type=SpatialTypeEnum.uniform),
        forced_closed=[101],
        forced_open=[202]
    )
    assert scenario.closure_factor == 1.0
    assert scenario.n_samples == 200


def test_scenario_overlap_rejected():
    with pytest.raises(ValidationError, match="forced_closed and forced_open must not overlap"):
        Scenario(
            hazard=HazardEnum.flood,
            region_id='pilot_01',
            start_date='2026-10-25',
            daily_rain_mm=[20.0, 45.5],
            antecedent_30d_mm=120.0,
            spatial=SpatialConfig(type=SpatialTypeEnum.uniform),
            forced_closed=[101, 102],
            forced_open=[102, 103]
        )


def test_scenario_rain_limits():
    # Exceeding 10 days
    with pytest.raises(ValidationError):
        Scenario(
            hazard=HazardEnum.flood,
            region_id='pilot_01',
            start_date='2026-10-25',
            daily_rain_mm=[10.0] * 11,
            antecedent_30d_mm=120.0,
            spatial=SpatialConfig(type=SpatialTypeEnum.uniform)
        )

    # Negative rain
    with pytest.raises(ValidationError):
        Scenario(
            hazard=HazardEnum.flood,
            region_id='pilot_01',
            start_date='2026-10-25',
            daily_rain_mm=[-5.0],
            antecedent_30d_mm=120.0,
            spatial=SpatialConfig(type=SpatialTypeEnum.uniform)
        )


def test_schemas_parse_contract_examples():
    examples_dir = Path(__file__).resolve().parents[3] / 'contracts' / 'examples'

    # Test Scenario
    with open(examples_dir / 'scenario.json') as f:
        data = json.load(f)
        scenario = Scenario.model_validate(data)
        assert scenario.region_id == 'pilot_01'

    # Test Job
    with open(examples_dir / 'job_done.json') as f:
        data = json.load(f)
        job = Job.model_validate(data)
        assert job.status.value == 'done'

    # Test ResultSummary
    with open(examples_dir / 'result_summary.json', encoding='utf-8') as f:
        data = json.load(f)
        summary = ResultSummary.model_validate(data)
        assert len(summary.ranking) >= 8
        assert summary.region_totals.facilities_isolated_expected == 3.4

