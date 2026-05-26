"""Walk-forward retraining scheduler.

Loops in the background; every `RETRAIN_LOOP_SEC` (default 1h) it inspects
the `models/` directory, finds every symbol that already has a trained
model for the active backend, and retrains anything older than
`RETRAIN_INTERVAL_HOURS` (default 24h).

Walk-forward semantics: retraining always fetches a fresh rolling window
of recent candles (the trainer's `get_historical_data` pulls the last N
days), so each retrain slides the training window forward in time.

Failures are logged and the loop continues — one bad symbol doesn't stop
retrains for the others. Concurrent retrains for the same symbol are
guarded by an in-process `set` of symbols currently training.
"""
from __future__ import annotations

import asyncio
import logging
import os
import time
from typing import Optional

log = logging.getLogger(__name__)

RETRAIN_INTERVAL_HOURS = float(os.getenv("RETRAIN_INTERVAL_HOURS", "24"))
RETRAIN_LOOP_SEC = float(os.getenv("RETRAIN_LOOP_SEC", str(60 * 60)))  # 1 h
RETRAIN_INITIAL_DELAY_SEC = float(os.getenv("RETRAIN_INITIAL_DELAY_SEC", "60"))

_task: Optional[asyncio.Task] = None
_last_retrain: dict[str, float] = {}
_in_progress: set[str] = set()


def discover_trained_symbols(backend: str) -> list[str]:
    """List symbols with a trained model on disk for the given backend."""
    models_dir = "models"
    if not os.path.isdir(models_dir):
        return []
    out: list[str] = []
    for name in sorted(os.listdir(models_dir)):
        sym_dir = os.path.join(models_dir, name)
        if not os.path.isdir(sym_dir):
            continue
        has_lstm = os.path.exists(os.path.join(sym_dir, "model.h5"))
        has_xgb = os.path.exists(os.path.join(sym_dir, "xgb_meta.json"))
        if backend == "lstm" and has_lstm:
            out.append(name.upper())
        elif backend == "xgb" and has_xgb:
            out.append(name.upper())
        elif backend == "ensemble" and (has_lstm or has_xgb):
            out.append(name.upper())
    return out


async def _retrain_once(predictor, symbol: str) -> None:
    if symbol in _in_progress:
        return
    last = _last_retrain.get(symbol, 0.0)
    if time.time() - last < RETRAIN_INTERVAL_HOURS * 3600:
        return
    _in_progress.add(symbol)
    try:
        log.info("scheduler: retraining %s", symbol)
        await asyncio.to_thread(predictor.train, symbol)
        _last_retrain[symbol] = time.time()
        log.info("scheduler: %s retrained", symbol)
    except Exception as e:  # noqa: BLE001
        log.exception("scheduler: %s retrain failed: %s", symbol, e)
    finally:
        _in_progress.discard(symbol)


async def _loop(predictor) -> None:
    await asyncio.sleep(RETRAIN_INITIAL_DELAY_SEC)  # let lifespan settle
    while True:
        try:
            symbols = discover_trained_symbols(predictor.backend)
            for sym in symbols:
                await _retrain_once(predictor, sym)
        except asyncio.CancelledError:
            raise
        except Exception:  # noqa: BLE001
            log.exception("scheduler tick failed")
        try:
            await asyncio.sleep(RETRAIN_LOOP_SEC)
        except asyncio.CancelledError:
            raise


def start(predictor) -> None:
    global _task
    if _task is not None:
        return
    if os.getenv("RETRAIN_ENABLED", "true").lower() != "true":
        log.info("scheduler: disabled via RETRAIN_ENABLED")
        return
    if predictor is None or not predictor.available:
        log.info("scheduler: predictor unavailable, not starting")
        return
    _task = asyncio.create_task(_loop(predictor), name="retrain-loop")
    log.info(
        "scheduler: started (interval=%sh, loop=%ss)",
        RETRAIN_INTERVAL_HOURS,
        RETRAIN_LOOP_SEC,
    )


async def stop() -> None:
    global _task
    if _task is None:
        return
    _task.cancel()
    try:
        await _task
    except asyncio.CancelledError:
        pass
    finally:
        _task = None
    log.info("scheduler: stopped")


def status() -> dict:
    return {
        "enabled": _task is not None,
        "interval_hours": RETRAIN_INTERVAL_HOURS,
        "loop_seconds": RETRAIN_LOOP_SEC,
        "in_progress": sorted(_in_progress),
        "last_retrain": {k: int(v) for k, v in _last_retrain.items()},
    }
