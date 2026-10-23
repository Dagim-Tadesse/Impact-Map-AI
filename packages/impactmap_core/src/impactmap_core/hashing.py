import hashlib
import json


def _normalise(value):
    if isinstance(value, float):
        return round(value, 4)
    if isinstance(value, dict):
        return {k: _normalise(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_normalise(v) for v in value]
    return value


def canonical_json(scenario: dict) -> str:
    cleaned = _normalise(scenario)
    cleaned['forced_closed'] = sorted(cleaned.get('forced_closed', []))
    cleaned['forced_open'] = sorted(cleaned.get('forced_open', []))
    return json.dumps(cleaned, sort_keys=True, separators=(',', ':'))


def make_cache_key(scenario: dict, model_version: str, data_version: str, engine_version: str) -> str:
    text = '|'.join([canonical_json(scenario), model_version, data_version, engine_version])
    return hashlib.sha256(text.encode('utf-8')).hexdigest()[:32]
