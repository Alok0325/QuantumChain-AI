"""
XGBoost forecaster for next-hour OHLC. Replaces the LSTM as the default backend.

Why XGBoost over a tiny LSTM:
  * Install footprint: xgboost wheel ~5 MB vs tensorflow ~500 MB compressed.
  * Training: seconds on a single CPU vs minutes for the LSTM.
  * Targets are fractional moves (returns) per OHLC field, so the scale is
    stable across symbols — same model architecture works for BTC and ATOM.

We train four `XGBRegressor`s (one per OHLC return). At predict time we
multiply by the last close to recover absolute prices.

The trainer keeps the same `predict_next_candlestick` + `train_and_save_model`
public surface as the legacy `CryptoModelTrainer`, so the engine doesn't care
which backend is loaded. A `backtest(symbol, lookback_days)` method returns
directional accuracy.
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timedelta
from typing import Optional

import numpy as np
import pandas as pd
import xgboost as xgb
from binance.client import Client
from dotenv import load_dotenv

load_dotenv()
log = logging.getLogger(__name__)

FEATURE_COLUMNS = [
    "ret_1", "ret_2", "ret_3", "ret_5", "ret_10",
    "ema_5_dev", "ema_20_dev", "ema_50_dev",
    "rsi_14", "macd", "macd_signal",
    "atr_14", "vol_z",
]
TARGET_COLUMNS = ["open_ret", "high_ret", "low_ret", "close_ret"]
MODEL_VERSION = "xgb-1h-v1"


def _add_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    c = df["Close"]

    for n in (1, 2, 3, 5, 10):
        df[f"ret_{n}"] = c.pct_change(n)

    # EMA deviation: how far close sits from its own EMA, as a fraction
    for n in (5, 20, 50):
        df[f"ema_{n}_dev"] = (c / c.ewm(span=n, adjust=False).mean()) - 1.0

    # RSI(14), normalised to 0..1
    delta = c.diff()
    up = delta.clip(lower=0.0)
    down = -delta.clip(upper=0.0)
    roll_up = up.ewm(alpha=1 / 14, adjust=False).mean()
    roll_down = down.ewm(alpha=1 / 14, adjust=False).mean()
    rs = roll_up / (roll_down.replace(0, np.nan))
    df["rsi_14"] = (100.0 - (100.0 / (1.0 + rs))).fillna(50.0) / 100.0

    # MACD (relative to close)
    ema12 = c.ewm(span=12, adjust=False).mean()
    ema26 = c.ewm(span=26, adjust=False).mean()
    df["macd"] = (ema12 - ema26) / c
    df["macd_signal"] = df["macd"].ewm(span=9, adjust=False).mean()

    # ATR(14) normalised by close
    prev_close = c.shift(1)
    tr = pd.concat(
        [
            df["High"] - df["Low"],
            (df["High"] - prev_close).abs(),
            (df["Low"] - prev_close).abs(),
        ],
        axis=1,
    ).max(axis=1)
    df["atr_14"] = tr.ewm(alpha=1 / 14, adjust=False).mean() / c

    # Volume z-score over 50 bars
    vol_mean = df["Volume"].rolling(50).mean()
    vol_std = df["Volume"].rolling(50).std()
    df["vol_z"] = (df["Volume"] - vol_mean) / (vol_std + 1e-9)

    return df


def _add_targets(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    last_close = df["Close"].shift(1)
    df["open_ret"] = (df["Open"] / last_close) - 1.0
    df["high_ret"] = (df["High"] / last_close) - 1.0
    df["low_ret"] = (df["Low"] / last_close) - 1.0
    df["close_ret"] = (df["Close"] / last_close) - 1.0
    return df


class XgbModelTrainer:
    def __init__(self) -> None:
        api_key = os.getenv("BINANCE_API_KEY")
        api_secret = os.getenv("BINANCE_API_SECRET")
        if not api_key or not api_secret:
            raise ValueError("Binance API credentials not found in environment variables")
        self.client = Client(api_key, api_secret)

    # --- data ---------------------------------------------------------------

    def get_historical_data(self, symbol: str, days: int = 360) -> pd.DataFrame:
        end = datetime.now()
        start = end - timedelta(days=days)
        candles = self.client.get_historical_klines(
            f"{symbol}USDT",
            Client.KLINE_INTERVAL_1HOUR,
            start.strftime("%Y-%m-%d %H:%M:%S"),
            end.strftime("%Y-%m-%d %H:%M:%S"),
        )
        cols = [
            "Open Time", "Open", "High", "Low", "Close", "Volume",
            "Close Time", "Quote Asset Volume", "Trades",
            "Taker Buy Base", "Taker Buy Quote", "Ignore",
        ]
        df = pd.DataFrame(candles, columns=cols)
        for c in ("Open", "High", "Low", "Close", "Volume"):
            df[c] = df[c].astype(float)
        # Drop the live (in-progress) candle.
        return df[["Open Time", "Open", "High", "Low", "Close", "Volume"]].iloc[:-1]

    # --- training -----------------------------------------------------------

    @staticmethod
    def _new_regressor() -> xgb.XGBRegressor:
        return xgb.XGBRegressor(
            n_estimators=400,
            max_depth=5,
            learning_rate=0.04,
            subsample=0.85,
            colsample_bytree=0.85,
            min_child_weight=5,
            reg_lambda=1.0,
            objective="reg:squarederror",
            tree_method="hist",
            n_jobs=2,
        )

    def train_and_save_model(self, symbol: str) -> None:
        model_dir = f"models/{symbol.lower()}"
        os.makedirs(model_dir, exist_ok=True)
        meta_path = f"{model_dir}/xgb_meta.json"

        df = self.get_historical_data(symbol)
        df = _add_features(df)
        df = _add_targets(df)
        df = df.dropna()
        if len(df) < 200:
            raise RuntimeError(f"Not enough rows ({len(df)}) to train {symbol}.")

        X = df[FEATURE_COLUMNS].values
        Y = df[TARGET_COLUMNS].values
        split = int(len(X) * 0.85)
        X_train, X_test = X[:split], X[split:]
        Y_train, Y_test = Y[:split], Y[split:]

        for i, target in enumerate(TARGET_COLUMNS):
            m = self._new_regressor()
            m.fit(
                X_train,
                Y_train[:, i],
                eval_set=[(X_test, Y_test[:, i])],
                verbose=False,
            )
            m.save_model(f"{model_dir}/xgb_{target}.json")

        with open(meta_path, "w") as f:
            json.dump(
                {
                    "version": MODEL_VERSION,
                    "features": FEATURE_COLUMNS,
                    "targets": TARGET_COLUMNS,
                    "trained_at": datetime.utcnow().isoformat() + "Z",
                    "rows": len(df),
                },
                f,
                indent=2,
            )
        log.info("XGBoost model for %s saved (rows=%d).", symbol, len(df))

    # --- prediction ---------------------------------------------------------

    def _load_models(self, symbol: str) -> Optional[dict]:
        meta_path = f"models/{symbol.lower()}/xgb_meta.json"
        if not os.path.exists(meta_path):
            return None
        with open(meta_path) as f:
            meta = json.load(f)
        models: dict[str, xgb.XGBRegressor] = {}
        for target in meta["targets"]:
            m = xgb.XGBRegressor()
            m.load_model(f"models/{symbol.lower()}/xgb_{target}.json")
            models[target] = m
        return {"meta": meta, "models": models}

    def predict_next_candlestick(self, symbol: str):
        try:
            bundle = self._load_models(symbol)
            if bundle is None:
                return None
            df = self.get_historical_data(symbol, days=10)
            df = _add_features(df).dropna()
            if df.empty:
                return None
            last = df.iloc[[-1]][bundle["meta"]["features"]].values
            preds = {
                target: float(m.predict(last)[0])
                for target, m in bundle["models"].items()
            }
            last_close = float(df.iloc[-1]["Close"])
            return [
                last_close * (1.0 + preds["open_ret"]),
                last_close * (1.0 + preds["high_ret"]),
                last_close * (1.0 + preds["low_ret"]),
                last_close * (1.0 + preds["close_ret"]),
            ]
        except Exception as e:  # noqa: BLE001
            log.exception("xgb predict failed for %s: %s", symbol, e)
            return None

    # --- backtest -----------------------------------------------------------

    def backtest(self, symbol: str, lookback_days: int = 14) -> dict:
        bundle = self._load_models(symbol)
        if bundle is None:
            return {"symbol": symbol, "accuracy_pct": None, "samples": 0}

        try:
            df = self.get_historical_data(symbol, days=lookback_days)
        except Exception as e:  # noqa: BLE001
            return {"symbol": symbol, "accuracy_pct": None, "samples": 0, "error": str(e)}

        df = _add_features(df)
        df = _add_targets(df)
        df = df.dropna()
        if df.empty:
            return {"symbol": symbol, "accuracy_pct": None, "samples": 0}

        X = df[bundle["meta"]["features"]].values
        actual_close_ret = df["close_ret"].values

        preds = bundle["models"]["close_ret"].predict(X)
        predicted_up = preds > 0
        actual_up = actual_close_ret > 0
        hits = int((predicted_up == actual_up).sum())
        total = int(len(preds))
        acc = (hits / total * 100.0) if total else None
        return {
            "symbol": symbol,
            "accuracy_pct": acc,
            "samples": total,
            "horizon_hours": 1,
            "lookback_days": lookback_days,
        }


if __name__ == "__main__":
    trainer = XgbModelTrainer()
    trainer.train_and_save_model("BTC")
