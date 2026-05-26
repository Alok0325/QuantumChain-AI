"""Crypto news fetcher backed by the shared distributed cache.

Free CryptoCompare news API. No key required. Per-symbol category lookup with
graceful fallback to general crypto news when the category is unavailable.
"""
from __future__ import annotations

import logging
from typing import Optional

import httpx

from . import distributed_cache as cache

log = logging.getLogger(__name__)

NEWS_URL = "https://min-api.cryptocompare.com/data/v2/news/"
CACHE_TTL_SEC = 15 * 60  # 15 minutes


def _normalise(raw: list[dict]) -> list[dict]:
    """Pick a stable shape and trim fields we don't surface."""
    out: list[dict] = []
    for d in raw:
        out.append(
            {
                "title": d.get("title") or "",
                "source": d.get("source_info", {}).get("name") or d.get("source") or "",
                "url": d.get("url") or "",
                "published_on": int(d.get("published_on") or 0),
                "categories": d.get("categories") or "",
                "sentiment": d.get("sentiment") or "neutral",
            }
        )
    return out


async def fetch_news(symbol: str, max_items: int = 5) -> list[dict]:
    """Recent headlines for `symbol`. 15-min cached (Redis if `REDIS_URL`, else memory)."""
    key = (symbol or "").upper().strip()
    if not key:
        return []
    cache_key = f"news:{key}"
    cached = await cache.get(cache_key)
    if cached is not None:
        return cached[:max_items]

    items: list[dict] = []
    async with httpx.AsyncClient(timeout=8) as client:
        try:
            r = await client.get(NEWS_URL, params={"lang": "EN", "categories": key})
            r.raise_for_status()
            items = _normalise(r.json().get("Data", []) or [])
        except Exception as e:  # noqa: BLE001
            log.warning("news: categorical fetch failed (%s) — falling back", e)

        if not items:
            try:
                r = await client.get(NEWS_URL, params={"lang": "EN"})
                r.raise_for_status()
                items = _normalise(r.json().get("Data", []) or [])
            except Exception as e:  # noqa: BLE001
                log.warning("news: fallback fetch failed (%s)", e)
                items = []

    if items:
        await cache.set(cache_key, items, ttl_sec=CACHE_TTL_SEC)
    return items[:max_items]


async def clear_cache() -> None:
    # Best-effort cache invalidation; for distributed deploys, prefer SCAN+DEL
    # via Redis CLI.
    from . import distributed_cache as _c
    _c.clear_memory()
