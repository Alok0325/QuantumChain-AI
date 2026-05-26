"""Async cache layer used by the news feed (and anything else that needs to
live across multiple Python instances). Uses Redis when ``REDIS_URL`` is set,
otherwise an in-memory dict with TTL eviction.

Same minimal surface as the Node sibling: ``get``, ``set(ttl_sec)``, ``delete``.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from typing import Any, Optional

log = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL")

_client = None
_memory: dict[str, tuple[float, Any]] = {}


def _try_init_redis() -> None:
    """Best-effort Redis client init. Stays None on any failure."""
    global _client
    if not REDIS_URL:
        return
    try:
        import redis.asyncio as aioredis
        _client = aioredis.from_url(
            REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        log.info("Cache: REDIS_URL set; using Redis backend.")
    except Exception as e:  # noqa: BLE001
        log.warning("Cache: Redis client init failed (%s); falling back to memory.", e)
        _client = None


_try_init_redis()


def backend() -> str:
    return "redis" if _client else "memory"


async def get(key: str) -> Optional[Any]:
    if _client is not None:
        try:
            v = await _client.get(key)
            return json.loads(v) if v else None
        except Exception as e:  # noqa: BLE001
            log.debug("Cache redis.get failed: %s; falling through", e)

    entry = _memory.get(key)
    if not entry:
        return None
    exp, val = entry
    if exp and time.time() > exp:
        _memory.pop(key, None)
        return None
    return val


async def set(key: str, val: Any, ttl_sec: int = 60) -> None:  # noqa: A001 — match Redis API
    if _client is not None:
        try:
            await _client.set(key, json.dumps(val), ex=ttl_sec)
            return
        except Exception as e:  # noqa: BLE001
            log.debug("Cache redis.set failed: %s; falling through", e)

    _memory[key] = (time.time() + ttl_sec if ttl_sec else 0, val)


async def delete(key: str) -> None:
    if _client is not None:
        try:
            await _client.delete(key)
            return
        except Exception:
            pass
    _memory.pop(key, None)


def clear_memory() -> None:
    _memory.clear()
