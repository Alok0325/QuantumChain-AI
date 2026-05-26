from __future__ import annotations

import logging
import os
from typing import Optional

from schemas import Candle, PredictionResponse

log = logging.getLogger(__name__)


class Predictor:
    """Pluggable forecaster backend.

    `MODEL_BACKEND=xgb` (default) — XGBoost on engineered TA features.
                                    Cheap to install (~5 MB), trains in seconds.
    `MODEL_BACKEND=lstm`          — legacy Keras LSTM. Requires the LSTM extra
                                    install (`pip install -r requirements-lstm.txt`).

    The trainer must expose `predict_next_candlestick(symbol)` returning a
    `[open, high, low, close]` list (or None) and a `train_and_save_model(symbol)`.
    A `backtest(symbol, lookback_days)` method is optional; when present, the
    Predictor delegates `.accuracy` to it.
    """

    def __init__(self) -> None:
        self.available = False
        self.error: Optional[str] = None
        self.trainer = None
        self.backend = os.getenv("MODEL_BACKEND", "xgb").lower()
        try:
            if self.backend == "lstm":
                from model_trainer import CryptoModelTrainer
                self.trainer = CryptoModelTrainer()
            elif self.backend == "ensemble":
                from .ensemble import EnsembleTrainer
                self.trainer = EnsembleTrainer()
            else:
                from model_trainer_xgb import XgbModelTrainer
                self.trainer = XgbModelTrainer()
                self.backend = "xgb"
            self.available = True
        except Exception as e:  # noqa: BLE001
            self.error = f"{type(e).__name__}: {e}"
            log.warning("Predictor disabled (backend=%s): %s", self.backend, self.error)

    def predict(self, symbol: str) -> Optional[PredictionResponse]:
        if not self.available:
            return None
        arr = self.trainer.predict_next_candlestick(symbol)
        if arr is None:
            return None
        return PredictionResponse(
            symbol=symbol,
            prediction=Candle(
                open=float(arr[0]),
                high=float(arr[1]),
                low=float(arr[2]),
                close=float(arr[3]),
            ),
            model_version=f"{self.backend}-1h-v1",
        )

    def train(self, symbol: str) -> None:
        if not self.available:
            raise RuntimeError(
                f"Predictor unavailable: {self.error or 'unknown reason'}"
            )
        self.trainer.train_and_save_model(symbol)

    def accuracy(self, symbol: str, lookback_days: int = 14) -> Optional[dict]:
        if not self.available:
            return None
        # Prefer the trainer's own backtest when available (XGBoost case).
        if hasattr(self.trainer, "backtest"):
            try:
                return self.trainer.backtest(symbol, lookback_days=lookback_days)
            except Exception as e:  # noqa: BLE001
                log.warning("trainer.backtest failed for %s: %s", symbol, e)
                return {"symbol": symbol, "accuracy_pct": None, "samples": 0, "error": str(e)}

        # LSTM legacy path
        from tensorflow.keras.models import load_model  # heavy import; lazy
        import os as _os
        import numpy as _np

        def model_for_symbol(sym):
            path = f"models/{sym.lower()}/model.h5"
            if not _os.path.exists(path):
                return None
            scaler_path = f"models/{sym.lower()}/scaler.npy"
            if _os.path.exists(scaler_path):
                self.trainer.scaler = _np.load(scaler_path, allow_pickle=True).item()
            return load_model(path)

        self.trainer.model_for_symbol = model_for_symbol
        if model_for_symbol(symbol) is None:
            return None
        from .backtester import directional_accuracy
        return directional_accuracy(self.trainer, symbol, lookback_days=lookback_days)
