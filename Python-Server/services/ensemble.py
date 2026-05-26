"""Ensemble of the XGBoost and LSTM forecasters.

Loads whichever backends are available. At predict time, blends predictions
weighted by each backend's recent rolling directional accuracy (XGBoost's
self-backtest; LSTM via the shared backtester). Falls back to equal weight
when either backend can't be measured, and to single-backend prediction
when one of them can't load.

Same public surface as the individual trainers (`predict_next_candlestick`,
`train_and_save_model`, `backtest`) so the engine doesn't care which backend
is loaded.
"""
from __future__ import annotations

import logging
import time
from typing import Optional

log = logging.getLogger(__name__)

WEIGHT_CACHE_TTL = 60 * 60  # 1h


class EnsembleTrainer:
    def __init__(self) -> None:
        self.xgb = None
        self.lstm = None
        self.errors: list[str] = []
        try:
            from model_trainer_xgb import XgbModelTrainer
            self.xgb = XgbModelTrainer()
        except Exception as e:  # noqa: BLE001
            self.errors.append(f"xgb: {e}")
            log.warning("Ensemble: XGBoost unavailable: %s", e)
        try:
            from model_trainer import CryptoModelTrainer
            self.lstm = CryptoModelTrainer()
        except Exception as e:  # noqa: BLE001
            self.errors.append(f"lstm: {e}")
            log.warning("Ensemble: LSTM unavailable: %s", e)

        if not self.xgb and not self.lstm:
            raise RuntimeError(
                "Ensemble: both backends unavailable. "
                "Install either xgboost (default) or requirements-lstm.txt + TF. "
                "Errors: " + "; ".join(self.errors)
            )

        # Mirror trainer interface bits the predictor / backtester touch.
        primary = self.xgb or self.lstm
        self.client = getattr(primary, "client", None)
        self.hours_range = getattr(self.lstm, "hours_range", None)

        # Per-symbol weight cache so we don't re-backtest on every predict.
        self._weight_cache: dict[str, tuple[float, dict[str, float]]] = {}

    # ----- prediction ------------------------------------------------------

    def predict_next_candlestick(self, symbol: str):
        preds: dict[str, list] = {}
        if self.xgb:
            try:
                p = self.xgb.predict_next_candlestick(symbol)
                if p is not None:
                    preds["xgb"] = list(p)
            except Exception as e:  # noqa: BLE001
                log.warning("Ensemble xgb predict failed for %s: %s", symbol, e)
        if self.lstm:
            try:
                p = self.lstm.predict_next_candlestick(symbol)
                if p is not None:
                    preds["lstm"] = list(p)
            except Exception as e:  # noqa: BLE001
                log.warning("Ensemble lstm predict failed for %s: %s", symbol, e)

        if not preds:
            return None
        if len(preds) == 1:
            return next(iter(preds.values()))

        weights = self._weights(symbol, list(preds.keys()))
        blended = [0.0, 0.0, 0.0, 0.0]
        for name, p in preds.items():
            w = weights[name]
            for i in range(4):
                blended[i] += w * p[i]
        return blended

    def _weights(self, symbol: str, names: list[str]) -> dict[str, float]:
        cached = self._weight_cache.get(symbol)
        if cached and time.time() - cached[0] < WEIGHT_CACHE_TTL:
            stored = cached[1]
            if all(n in stored for n in names):
                return {n: stored[n] for n in names}

        # Measure recent accuracy where possible.
        accs: dict[str, float] = {}
        if "xgb" in names and self.xgb:
            try:
                r = self.xgb.backtest(symbol, lookback_days=14)
                if r.get("accuracy_pct") is not None:
                    accs["xgb"] = float(r["accuracy_pct"])
            except Exception as e:  # noqa: BLE001
                log.warning("Ensemble xgb backtest failed for %s: %s", symbol, e)

        if "lstm" in names and self.lstm:
            try:
                from .backtester import directional_accuracy
                # backtester expects the LSTM `trainer` instance + a model loader.
                from tensorflow.keras.models import load_model
                import os, numpy as np

                def model_for_symbol(sym):
                    path = f"models/{sym.lower()}/model.h5"
                    if not os.path.exists(path):
                        return None
                    scaler_path = f"models/{sym.lower()}/scaler.npy"
                    if os.path.exists(scaler_path):
                        self.lstm.scaler = np.load(scaler_path, allow_pickle=True).item()
                    return load_model(path)

                self.lstm.model_for_symbol = model_for_symbol
                if model_for_symbol(symbol) is not None:
                    r = directional_accuracy(self.lstm, symbol, lookback_days=14)
                    if r.get("accuracy_pct") is not None:
                        accs["lstm"] = float(r["accuracy_pct"])
            except Exception as e:  # noqa: BLE001
                log.warning("Ensemble lstm backtest failed for %s: %s", symbol, e)

        # Translate accuracy into a weight: above 50% baseline gets credit.
        # Use a small floor (0.1) for any backend that produced a prediction
        # so we never wipe one side out entirely on a single bad backtest.
        if len(accs) < len(names):
            log.info("Ensemble: equal weights for %s (acc=%s)", symbol, accs)
            weights = {n: 1.0 / len(names) for n in names}
        else:
            raw = {n: max(0.1, (accs[n] - 50.0) / 50.0 + 0.1) for n in names}
            total = sum(raw.values())
            weights = {n: v / total for n, v in raw.items()}
            log.info("Ensemble: %s accuracy=%s → weights=%s", symbol, accs, weights)

        self._weight_cache[symbol] = (time.time(), weights)
        return weights

    # ----- training --------------------------------------------------------

    def train_and_save_model(self, symbol: str) -> None:
        trained_any = False
        last_error: Optional[Exception] = None
        for name, b in (("xgb", self.xgb), ("lstm", self.lstm)):
            if not b:
                continue
            try:
                b.train_and_save_model(symbol)
                trained_any = True
            except Exception as e:  # noqa: BLE001
                last_error = e
                log.warning("Ensemble: %s training failed for %s: %s", name, symbol, e)
        if not trained_any:
            raise RuntimeError(
                f"Ensemble: no backend could train {symbol}. Last error: {last_error}"
            )
        # Invalidate cached weights for this symbol since accuracy will change.
        self._weight_cache.pop(symbol, None)

    # ----- backtest --------------------------------------------------------

    def backtest(self, symbol: str, lookback_days: int = 14) -> dict:
        # Return XGBoost's vectorized backtest if it's available — it's faster.
        if self.xgb:
            try:
                return self.xgb.backtest(symbol, lookback_days=lookback_days)
            except Exception as e:  # noqa: BLE001
                log.warning("Ensemble.backtest xgb failed for %s: %s", symbol, e)
        # LSTM-only fallback
        return {"symbol": symbol, "accuracy_pct": None, "samples": 0}

    def get_historical_data(self, symbol: str, days: int = 360):
        # Some helpers (the LSTM backtester) reach for trainer.get_historical_data.
        primary = self.xgb or self.lstm
        return primary.get_historical_data(symbol, days=days)
