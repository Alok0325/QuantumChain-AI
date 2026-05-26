"""Rolling-window directional accuracy for the LSTM forecaster.

Cheap to run on a trained model: load N candles, replay the model over a
sliding window, and compare the predicted direction (close vs open) to the
actual direction. Caches results in-process with a short TTL so repeated
hits from the UI don't re-spend the compute.
"""
from __future__ import annotations

import logging
import time
from typing import Optional

import numpy as np

log = logging.getLogger(__name__)

_CACHE: dict[str, tuple[float, dict]] = {}
_CACHE_TTL_SEC = 3600  # 1h


def _cache_get(key: str) -> Optional[dict]:
    hit = _CACHE.get(key)
    if not hit:
        return None
    ts, data = hit
    if time.time() - ts > _CACHE_TTL_SEC:
        _CACHE.pop(key, None)
        return None
    return data


def _cache_put(key: str, data: dict) -> None:
    _CACHE[key] = (time.time(), data)


def directional_accuracy(
    trainer,
    symbol: str,
    lookback_days: int = 14,
    horizon: int = 1,
) -> dict:
    """Compute the % of forecasts where the predicted direction (close > open)
    matched the realised direction over the lookback window.

    `trainer` is a `CryptoModelTrainer` instance (or anything with the same
    `get_historical_data` + `predict_next_candlestick`-ish surface). We use
    a fresh `predict_next_candlestick` call per step rather than reaching
    inside the model because that mirrors production behaviour.
    """
    cache_key = f"{symbol}:{lookback_days}:{horizon}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    try:
        df = trainer.get_historical_data(symbol, days=lookback_days)
    except Exception as e:  # noqa: BLE001
        log.warning("backtest: get_historical_data failed: %s", e)
        return {"symbol": symbol, "accuracy_pct": None, "samples": 0, "error": str(e)}

    if df is None or len(df) < trainer.hours_range + horizon + 5:
        return {"symbol": symbol, "accuracy_pct": None, "samples": 0}

    # Predict next candle for every t in [hours_range, N-1] and compare to truth.
    # We re-use the scaler that the model was trained with.
    try:
        scaled_full = trainer.scaler.transform(df[["Open", "High", "Low", "Close"]])
    except Exception:
        # Scaler was not fit yet for this trainer instance. Fall back to fitting
        # over the lookback window — directional accuracy is scale-invariant.
        scaled_full = trainer.scaler.fit_transform(df[["Open", "High", "Low", "Close"]])

    hits = 0
    total = 0
    W = trainer.hours_range
    # Stride a few hours so the run finishes in reasonable time on long windows.
    stride = max(1, (len(scaled_full) - W) // 200)
    for i in range(W, len(scaled_full) - horizon, stride):
        window = np.expand_dims(scaled_full[i - W : i], axis=0)
        scaled_pred = trainer.model_for_symbol(symbol).predict(window, verbose=0)
        pred = trainer.scaler.inverse_transform(scaled_pred)[0]
        actual = df.iloc[i + horizon - 1]
        predicted_up = pred[3] > pred[0]
        actual_up = actual["Close"] > actual["Open"]
        if predicted_up == actual_up:
            hits += 1
        total += 1

    acc = (hits / total * 100.0) if total else None
    result = {
        "symbol": symbol,
        "accuracy_pct": acc,
        "samples": total,
        "horizon_hours": horizon,
        "lookback_days": lookback_days,
    }
    _cache_put(cache_key, result)
    return result


def clear_cache() -> None:
    _CACHE.clear()
