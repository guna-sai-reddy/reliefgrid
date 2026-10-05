"""
ML service: loads the 4 demand models + quantile models + scaler,
and produces predictions with confidence intervals and vulnerability
adjustment.
"""
# ------------------------------------------------------------------
# numpy compatibility patch — allows loading models pickled with
# older numpy versions (BitGenerator class path changed).
# ------------------------------------------------------------------
import numpy.random._pickle as _numpy_pickle
try:
    from numpy.random._mt19937 import MT19937 as _MT19937
except ImportError:
    from numpy.random import MT19937 as _MT19937


def _patched_bit_generator_ctor(name):
    if "MT19937" in str(name):
        return _MT19937()
    raise ValueError(f"Unknown bit generator: {name}")


_numpy_pickle.__bit_generator_ctor = _patched_bit_generator_ctor

# Also patch the state setter to tolerate legacy state formats
try:
    _orig_state_set = _MT19937.state.__set__

    def _patched_state_set(self, value):
        try:
            _orig_state_set(self, value)
        except ValueError:
            # Legacy state format — reset to a fresh state.
            # Predictions don't depend on the RNG state.
            pass

    _MT19937.state = property(
        lambda self: _orig_state_set.__get__(self),
        _patched_state_set,
    )
except Exception:
    pass
# ------------------------------------------------------------------
import joblib
import numpy as np
from pathlib import Path
from functools import lru_cache
from app.core.config import settings


class MLService:
    def __init__(self, models_dir: Path):
        self.models_dir = Path(models_dir)
        self.scaler = joblib.load(self.models_dir / "scaler.pkl")
        with open(self.models_dir / "feature_names.txt") as f:
            self.features = [l.strip() for l in f]

        self.models, self.quantiles = {}, {}
        for t in ["food", "water", "medical", "shelter"]:
            self.models[t]    = joblib.load(self.models_dir / f"demand_{t}_model.pkl")
            self.quantiles[t] = joblib.load(self.models_dir / f"demand_{t}_quantiles.pkl")

    @staticmethod
    def _vuln_factors(features: dict) -> dict:
        c = features.get("children_pct", 25) / 100
        e = features.get("elder_pct", 10) / 100
        d = features.get("disability_pct", 2) / 100
        return {
            "food":    1.0 + 0.25 * c,
            "water":   1.0 + 0.20 * c + 0.20 * e,
            "medical": 1.0 + 1.80 * e + 2.20 * d,
            "shelter": 1.0 + 0.15 * e + 0.10 * d,
        }

    def predict(self, features: dict) -> dict:
        x = self.scaler.transform(
            np.array([[float(features[f]) for f in self.features]])
        )
        adj = self._vuln_factors(features)
        out = {}
        for t in self.models:
            point = float(self.models[t].predict(x)[0])
            p10   = float(self.quantiles[t][0.10].predict(x)[0])
            p50   = float(self.quantiles[t][0.50].predict(x)[0])
            p90   = float(self.quantiles[t][0.90].predict(x)[0])
            lo, _, hi = sorted([p10, p50, p90])
            point_adj = max(point, 0.0) * adj[t]
            lo_adj    = min(max(lo, 0.0) * adj[t], point_adj)
            hi_adj    = max(max(hi, 0.0) * adj[t], point_adj)
            out[t] = {
                "point":       round(point_adj, 2),
                "ci_lower":    round(lo_adj, 2),
                "ci_upper":    round(hi_adj, 2),
                "vuln_factor": round(adj[t], 4),
            }
        return out

    @staticmethod
    def priority_from_demand(pred: dict) -> str:
        score = (pred["food"]["point"] / 100_000
                 + pred["water"]["point"] / 250_000
                 + pred["medical"]["point"] / 500
                 + pred["shelter"]["point"] / 20_000)
        if score > 3.0: return "CRITICAL"
        if score > 2.0: return "HIGH"
        if score > 1.0: return "MEDIUM"
        return "LOW"


@lru_cache
def get_ml_service() -> MLService:
    return MLService(settings.ML_MODELS_DIR)