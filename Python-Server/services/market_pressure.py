"""Aggregated taker buy/sell ratio for a symbol — a cheap proxy for the
"flow side" the Rationale prompt would otherwise miss.

Pulls the last 24h of 1h klines from Binance's public REST endpoint and
computes:
  * buy_ratio_24h — taker buy volume / total volume across the window.
  * buy_ratio_4h  — same, restricted to the most recent 4 candles.
  * interpretation — short label combining magnitude + change vs the window.

> 0.55 = elevated buy pressure; < 0.45 = elevated sell pressure;
the 4h-vs-24h delta is used to flag "accelerating" regimes.

Cached in the shared distributed cache for 5 min per symbol.
"""
from __future__ import annotations

import logging
from typing import Optional

import httpx

from . import distributed_cache as cache

log = logging.getLogger(__name__)

CACHE_TTL_SEC = 5 * 60
WINDOW_HOURS = 24
RECENT_HOURS = 4
KLINES_URL = "https://api.binance.com/api/v3/klines"


def _interpret(r24: float, r4: float) -> str:
    delta = r4 - r24
    if r4 > 0.55 and delta > 0.02:
        return "strong buy pressure, accelerating"
    if r4 > 0.55:
        return "elevated buy pressure"
    if r4 < 0.45 and delta < -0.02:
        return "strong sell pressure, accelerating"
    if r4 < 0.45:
        return "elevated sell pressure"
    return "balanced flow"


async def fetch_taker_pressure(symbol: str) -> Optional[dict]:
    key = f"pressure:{symbol.upper()}"
    cached = await cache.get(key)
    if cached is not None:
        return cached

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(
                KLINES_URL,
                params={
                    "symbol": f"{symbol.upper()}USDT",
                    "interval": "1h",
                    "limit": WINDOW_HOURS,
                },
            )
            r.raise_for_status()
            data = r.json()
    except Exception as e:  # noqa: BLE001
        log.warning("taker pressure fetch failed for %s: %s", symbol, e)
        return None

    if not data or len(data) < RECENT_HOURS:
        return None

    # Kline schema: ..., volume[5], ..., takerBuyBaseAssetVolume[9], ...
    try:
        total_buy = sum(float(c[9]) for c in data)
        total_vol = sum(float(c[5]) for c in data)
        recent_buy = sum(float(c[9]) for c in data[-RECENT_HOURS:])
        recent_vol = sum(float(c[5]) for c in data[-RECENT_HOURS:])
    except (ValueError, TypeError, IndexError) as e:
        log.warning("taker pressure parse failed for %s: %s", symbol, e)
        return None

    if total_vol <= 0:
        return None

    r24 = total_buy / total_vol
    r4 = recent_buy / recent_vol if recent_vol > 0 else r24

    result = {
        "symbol": symbol.upper(),
        "buy_ratio_24h": round(r24, 4),
        "buy_ratio_4h": round(r4, 4),
        "interpretation": _interpret(r24, r4),
    }
    await cache.set(key, result, ttl_sec=CACHE_TTL_SEC)
    return result
