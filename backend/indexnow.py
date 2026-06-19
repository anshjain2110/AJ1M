"""IndexNow client — pings Bing/Yandex/others when content changes so AI search
indexes (esp. ChatGPT via Bing) pick up new/updated pages immediately.
https://www.indexnow.org/documentation
"""
from __future__ import annotations

import os
import asyncio
import logging
from typing import Iterable

import httpx

logger = logging.getLogger(__name__)

# A stable, opaque 32+ char key per project. Generated at first boot if missing.
INDEXNOW_KEY = os.environ.get("INDEXNOW_KEY", "")
# Public base URL of the site (must match the host of the URLs being submitted)
SITE_BASE_URL = os.environ.get("SITE_BASE_URL", "https://www.thelocaljewel.com").rstrip("/")

ENDPOINT = "https://api.indexnow.org/IndexNow"


async def submit_urls(urls: Iterable[str]) -> None:
    """Fire-and-forget IndexNow submission. Never raises — SEO ops shouldn't
    break user-facing flows."""
    if not INDEXNOW_KEY:
        logger.debug("IndexNow key not configured — skipping submission")
        return
    url_list = [u for u in urls if u]
    if not url_list:
        return
    host = SITE_BASE_URL.replace("https://", "").replace("http://", "").rstrip("/")
    payload = {
        "host": host,
        "key": INDEXNOW_KEY,
        "keyLocation": f"{SITE_BASE_URL}/{INDEXNOW_KEY}.txt",
        "urlList": url_list[:10000],
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(ENDPOINT, json=payload)
        if r.status_code >= 400:
            logger.warning(f"IndexNow non-2xx: {r.status_code} {r.text[:200]}")
        else:
            logger.info(f"IndexNow submitted {len(url_list)} URL(s) → {r.status_code}")
    except Exception as e:
        logger.warning(f"IndexNow submission failed: {e}")


def submit_urls_bg(urls: Iterable[str]) -> None:
    """Schedule IndexNow submission without awaiting (use from sync handlers)."""
    try:
        asyncio.create_task(submit_urls(list(urls)))
    except RuntimeError:
        # No running loop — fall back to noop (we're not in an async context)
        logger.debug("IndexNow: no running loop, skipping")
