from impactmap_core.hashing import canonical_json, make_cache_key


def test_hashing_key_order_invariance():
    scenario_a = {
        'hazard': 'flood',
        'region_id': 'pilot_01',
        'seed': 42,
        'daily_rain_mm': [20.0, 30.0],
        'forced_closed': [10, 5],
        'forced_open': [2, 1]
    }
    scenario_b = {
        'seed': 42,
        'forced_open': [1, 2],
        'forced_closed': [5, 10],
        'daily_rain_mm': [20.0, 30.0],
        'region_id': 'pilot_01',
        'hazard': 'flood'
    }
    key_a = make_cache_key(scenario_a, 'm1', 'd1', '0.1.0')
    key_b = make_cache_key(scenario_b, 'm1', 'd1', '0.1.0')
    assert key_a == key_b


def test_hashing_float_rounding():
    scenario_1 = {'rain': 40.0, 'hazard': 'flood'}
    scenario_2 = {'rain': 40.00001, 'hazard': 'flood'}
    scenario_3 = {'rain': 40.001, 'hazard': 'flood'}

    key_1 = make_cache_key(scenario_1, 'm1', 'd1', '0.1.0')
    key_2 = make_cache_key(scenario_2, 'm1', 'd1', '0.1.0')
    key_3 = make_cache_key(scenario_3, 'm1', 'd1', '0.1.0')

    # 40.0 and 40.00001 round to 4 decimals -> identical
    assert key_1 == key_2
    # 40.0 and 40.001 differ at 3 decimals -> different
    assert key_1 != key_3


def test_hashing_version_sensitivity():
    scenario = {'hazard': 'flood', 'region_id': 'pilot_01'}
    key_base = make_cache_key(scenario, 'm20261026a', 'd20261025a', '0.1.0')
    key_model_change = make_cache_key(scenario, 'm20261027a', 'd20261025a', '0.1.0')
    key_data_change = make_cache_key(scenario, 'm20261026a', 'd20261026a', '0.1.0')
    key_engine_change = make_cache_key(scenario, 'm20261026a', 'd20261025a', '0.2.0')

    assert key_base != key_model_change
    assert key_base != key_data_change
    assert key_base != key_engine_change
    assert len(key_base) == 32
